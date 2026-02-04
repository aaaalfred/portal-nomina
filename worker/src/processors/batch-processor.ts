import * as fs from 'fs/promises';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { parseXML } from '../utils/xml-parser';
import { extractRfcFromFilename } from '../utils/rfc-extractor';
import { getDatabase } from '../database';

interface BatchJob {
  batchId: number;
  zipPath: string;
}

interface ManifestFile {
  name: string;
  type: 'pdf' | 'xml';
}

interface Manifest {
  period_type: string;
  period_id: string;
  fecha_periodo: string;
  counts: {
    pdf: number;
    xml: number;
    total: number;
  };
  files: ManifestFile[];
}

interface FileInfo {
  filename: string;
  filePath: string;
  type: 'PDF' | 'XML';
  rfc: string | null;
}

export async function processBatch(data: BatchJob) {
  const { batchId, zipPath } = data;
  
  console.log(`📦 Processing batch ${batchId} from ${zipPath}`);

  const db = await getDatabase();
  
  try {
    // Update batch status to PROCESSING
    await db.query(
      'UPDATE batches SET status = $1, updated_at = NOW() WHERE id = $2',
      ['PROCESSING', batchId]
    );

    // Extract ZIP to temp folder
    const zip = new AdmZip(zipPath);
    const extractPath = path.join(
      process.env.STORAGE_PATH || './storage', 
      'temp', 
      `batch-${batchId}`
    );
    
    await fs.mkdir(extractPath, { recursive: true });
    zip.extractAllTo(extractPath, true);

    console.log(`📂 Extracted to ${extractPath}`);

    // Read manifest.json
    let manifest: Manifest | null = null;
    try {
      const manifestPath = path.join(extractPath, 'manifest.json');
      const manifestData = await fs.readFile(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestData);
      console.log(`📋 Manifest loaded: ${manifest.counts.total} files`);
    } catch (error) {
      console.log('⚠️  No manifest.json found, will scan directories');
    }

    // Get batch info from DB
    const batchResult = await db.query('SELECT * FROM batches WHERE id = $1', [batchId]);
    const batch = batchResult.rows[0];
    const fechaPeriodo = batch.fecha_periodo;

    // Collect all files (from manifest or by scanning)
    const filesToProcess: FileInfo[] = [];

    if (manifest && manifest.files) {
      // Use manifest to process files
      for (const manifestFile of manifest.files) {
        const subdir = manifestFile.type === 'pdf' ? 'pdf' : 'xml';
        const filePath = path.join(extractPath, subdir, manifestFile.name);
        
        try {
          await fs.access(filePath);
          filesToProcess.push({
            filename: manifestFile.name,
            filePath,
            type: manifestFile.type.toUpperCase() as 'PDF' | 'XML',
            rfc: null // Will extract later
          });
        } catch {
          console.error(`⚠️  File listed in manifest not found: ${manifestFile.name}`);
        }
      }
    } else {
      // Scan pdf/ and xml/ directories
      const pdfDir = path.join(extractPath, 'pdf');
      const xmlDir = path.join(extractPath, 'xml');

      try {
        const pdfFiles = await fs.readdir(pdfDir);
        for (const filename of pdfFiles) {
          if (filename.toLowerCase().endsWith('.pdf')) {
            filesToProcess.push({
              filename,
              filePath: path.join(pdfDir, filename),
              type: 'PDF',
              rfc: null
            });
          }
        }
      } catch {
        console.log('No pdf/ directory found');
      }

      try {
        const xmlFiles = await fs.readdir(xmlDir);
        for (const filename of xmlFiles) {
          if (filename.toLowerCase().endsWith('.xml')) {
            filesToProcess.push({
              filename,
              filePath: path.join(xmlDir, filename),
              type: 'XML',
              rfc: null
            });
          }
        }
      } catch {
        console.log('No xml/ directory found');
      }
    }

    console.log(`📝 Found ${filesToProcess.length} files to process`);

    // Phase 1: Extract RFCs from all files
    interface XMLInfo {
      rfc: string;
      nombre?: string;
      numEmpleado?: string;
      filename: string;
    }
    
    const xmlInfoMap = new Map<string, XMLInfo>(); // rfc -> XMLInfo

    for (const file of filesToProcess) {
      try {
        if (file.type === 'XML') {
          const xmlContent = await fs.readFile(file.filePath, 'utf-8');
          const xmlData = await parseXML(xmlContent);
          file.rfc = xmlData.rfc;
          
          xmlInfoMap.set(xmlData.rfc, {
            rfc: xmlData.rfc,
            nombre: xmlData.nombre,
            numEmpleado: xmlData.numEmpleado,
            filename: file.filename
          });
          
          console.log(`📄 XML ${file.filename} → RFC: ${file.rfc}${xmlData.numEmpleado ? `, NumEmpleado: ${xmlData.numEmpleado}` : ''}`);
        } else if (file.type === 'PDF') {
          file.rfc = extractRfcFromFilename(file.filename);
          if (!file.rfc) {
            console.warn(`⚠️  Could not extract RFC from PDF filename: ${file.filename}`);
          } else {
            console.log(`📄 PDF ${file.filename} → RFC: ${file.rfc}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error extracting RFC from ${file.filename}:`, error.message);
      }
    }

    // Phase 1.5: Try to link orphan PDFs to XMLs by NumEmpleado or name
    const orphanPdfs = filesToProcess.filter(f => f.type === 'PDF' && !f.rfc);
    
    for (const orphanPdf of orphanPdfs) {
      // Try to match with XML by NumEmpleado or name
      for (const [rfc, xmlInfo] of xmlInfoMap.entries()) {
        let matched = false;
        
        // Match by NumEmpleado
        if (xmlInfo.numEmpleado && orphanPdf.filename.includes(xmlInfo.numEmpleado)) {
          orphanPdf.rfc = rfc;
          matched = true;
          console.log(`🔗 Linked PDF ${orphanPdf.filename} to RFC ${rfc} via NumEmpleado: ${xmlInfo.numEmpleado}`);
          break;
        }
        
        // Match by name parts (at least 2 significant words)
        if (!matched && xmlInfo.nombre) {
          const nameWords = xmlInfo.nombre.split(' ').filter(w => w.length > 3);
          const matchCount = nameWords.filter(word => 
            orphanPdf.filename.toUpperCase().includes(word.toUpperCase())
          ).length;
          
          if (matchCount >= 2) {
            orphanPdf.rfc = rfc;
            matched = true;
            console.log(`🔗 Linked PDF ${orphanPdf.filename} to RFC ${rfc} via name match`);
            break;
          }
        }
      }
    }

    // Phase 2: Process files and create/update receipts
    let successCount = 0;
    let errorCount = 0;

    // Group files by RFC
    const filesByRfc = new Map<string, FileInfo[]>();
    
    for (const file of filesToProcess) {
      if (file.rfc) {
        if (!filesByRfc.has(file.rfc)) {
          filesByRfc.set(file.rfc, []);
        }
        filesByRfc.get(file.rfc)!.push(file);
      }
    }

    // Process each RFC group
    for (const [rfc, files] of filesByRfc.entries()) {
      try {
        // Check if employee exists
        let employeeResult = await db.query(
          'SELECT id FROM employees WHERE rfc = $1',
          [rfc]
        );

        let employeeId: number;

        if (employeeResult.rows.length === 0) {
          // Employee doesn't exist - create it automatically
          console.log(`👤 Creating new employee with RFC: ${rfc}`);
          
          // Try to extract name from XML if available
          let employeeName = `Empleado ${rfc}`;
          const xmlFile = files.find(f => f.type === 'XML');
          
          if (xmlFile) {
            try {
              const xmlContent = await fs.readFile(xmlFile.filePath, 'utf-8');
              const { parseStringPromise } = await import('xml2js');
              const result = await parseStringPromise(xmlContent);
              const comprobante = result['cfdi:Comprobante'] || result.Comprobante;
              const receptor = comprobante['cfdi:Receptor']?.[0] || comprobante.Receptor?.[0];
              const nombre = receptor?.$?.Nombre || receptor?.$?.nombre;
              
              if (nombre) {
                employeeName = nombre;
                console.log(`📝 Extracted name from XML: ${employeeName}`);
              }
            } catch (error) {
              console.log(`⚠️  Could not extract name from XML: ${error.message}`);
            }
          }

          // Generate carpeta from RFC (lowercase)
          const carpeta = rfc.toLowerCase();
          
          // Default password hash for "nomina123" (bcrypt)
          const defaultPasswordHash = '$2b$10$Nsh9jAxSpCrv7eyPoWycx.tBGrvGt.DjBaIVqktOZCVG.tXQByr3O';

          const insertResult = await db.query(
            `INSERT INTO employees (rfc, name, carpeta, password_hash, active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, true, NOW(), NOW())
             RETURNING id`,
            [rfc, employeeName, carpeta, defaultPasswordHash]
          );

          employeeId = insertResult.rows[0].id;
          console.log(`✅ Employee created: ${employeeName} (${rfc}) - ID: ${employeeId}`);
        } else {
          employeeId = employeeResult.rows[0].id;
          
          // Check if employee is inactive
          const employee = employeeResult.rows[0];
          if (employee.active === false) {
            console.log(`⚠️  Employee ${rfc} is inactive, activating...`);
            await db.query('UPDATE employees SET active = true WHERE id = $1', [employeeId]);
          }
        }
        
        // Format fecha_periodo as YYYY-MM-DD
        const fechaStr = typeof fechaPeriodo === 'string' 
          ? fechaPeriodo 
          : fechaPeriodo.toISOString().split('T')[0];
        
        const rfcFecha = `${rfc}_${fechaStr}`;

        // Prepare receipt data
        const pdfFiles = files.filter(f => f.type === 'PDF');
        const xmlFiles = files.filter(f => f.type === 'XML');

        const pdf1 = pdfFiles[0]?.filename || null;
        const pdf2 = pdfFiles[1]?.filename || null;
        const xml = xmlFiles[0]?.filename || null;

        // Move files to final location
        const receiptsDir = path.join(
          process.env.STORAGE_PATH || './storage',
          'receipts',
          rfc
        );
        await fs.mkdir(receiptsDir, { recursive: true });

        for (const file of files) {
          // Keep original filename for database reference
          const finalPath = path.join(receiptsDir, file.filename);
          await fs.copyFile(file.filePath, finalPath);
          console.log(`💾 Moved: ${file.filename} → ${receiptsDir}/`);
        }

        // Check if receipt exists
        const receiptResult = await db.query(
          'SELECT * FROM payroll_receipts WHERE rfc_fecha = $1',
          [rfcFecha]
        );

        if (receiptResult.rows.length > 0) {
          // UPDATE existing receipt - only update missing files
          const existing = receiptResult.rows[0];
          const updates: string[] = [];
          const values: any[] = [];
          let paramIndex = 1;

          if (pdf1 && !existing.pdf1_filename) {
            updates.push(`pdf1_filename = $${paramIndex++}`);
            values.push(pdf1);
          }
          if (pdf2 && !existing.pdf2_filename) {
            updates.push(`pdf2_filename = $${paramIndex++}`);
            values.push(pdf2);
          }
          if (xml && !existing.xml_filename) {
            updates.push(`xml_filename = $${paramIndex++}`);
            values.push(xml);
          }

          if (updates.length > 0) {
            updates.push(`updated_at = NOW()`);
            values.push(rfcFecha);
            await db.query(
              `UPDATE payroll_receipts SET ${updates.join(', ')} WHERE rfc_fecha = $${paramIndex}`,
              values
            );
            console.log(`🔄 Updated receipt for ${rfcFecha}`);
          } else {
            console.log(`✓ Receipt ${rfcFecha} already complete`);
          }
        } else {
          // INSERT new receipt
          await db.query(
            `INSERT INTO payroll_receipts 
             (employee_id, rfc, fecha_periodo, rfc_fecha, period_type, period_id, 
              pdf1_filename, pdf2_filename, xml_filename, batch_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
            [
              employeeId,
              rfc,
              fechaPeriodo,
              rfcFecha,
              batch.period_type,
              batch.period_id,
              pdf1,
              pdf2,
              xml,
              batchId
            ]
          );
          console.log(`✅ Created receipt for ${rfcFecha}`);
        }

        // Record file processing success
        for (const file of files) {
          await db.query(
            `INSERT INTO batch_files 
             (batch_id, filename, file_type, status, rfc_extracted, created_at, processed_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
            [batchId, file.filename, file.type, 'SUCCESS', rfc]
          );
        }

        successCount += files.length;

      } catch (error) {
        console.error(`❌ Error processing RFC ${rfc}:`, error.message);
        
        // Record file errors
        for (const file of files) {
          await db.query(
            `INSERT INTO batch_files 
             (batch_id, filename, file_type, status, error_message, rfc_extracted, created_at, processed_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
            [batchId, file.filename, file.type, 'ERROR', error.message, rfc]
          );
        }

        errorCount += files.length;
      }
    }

    // Handle files without RFC
    const filesWithoutRfc = filesToProcess.filter(f => !f.rfc);
    for (const file of filesWithoutRfc) {
      await db.query(
        `INSERT INTO batch_files 
         (batch_id, filename, file_type, status, error_message, created_at, processed_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [batchId, file.filename, file.type, 'ERROR', 'Could not extract RFC']
      );
      errorCount++;
    }

    // Update batch final status
    const totalFiles = filesToProcess.length;
    const finalStatus = errorCount === 0 ? 'DONE' : 
                       successCount > 0 ? 'PARTIAL_SUCCESS' : 
                       'FAILED';
    
    await db.query(
      `UPDATE batches 
       SET status = $1, 
           total_files = $2, 
           processed_files = $3, 
           success_files = $4, 
           error_files = $5, 
           completed_at = NOW(),
           updated_at = NOW()
       WHERE id = $6`,
      [finalStatus, totalFiles, totalFiles, successCount, errorCount, batchId]
    );

    // Cleanup temp files
    await fs.rm(extractPath, { recursive: true, force: true });

    console.log(`✅ Batch ${batchId} completed: ${successCount} success, ${errorCount} errors (${finalStatus})`);

  } catch (error) {
    console.error(`❌ Critical error processing batch ${batchId}:`, error);
    
    await db.query(
      'UPDATE batches SET status = $1, updated_at = NOW() WHERE id = $2',
      ['FAILED', batchId]
    );
    
    throw error;
  }
}
