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

export async function processBatch(data: BatchJob) {
  const { batchId, zipPath } = data;
  
  console.log(`📦 Processing batch ${batchId} from ${zipPath}`);

  const db = await getDatabase();
  
  try {
    // Update batch status
    await db.query(
      'UPDATE batches SET status = $1 WHERE id = $2',
      ['PROCESSING', batchId]
    );

    // Extract ZIP
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();
    
    const extractPath = path.join(process.env.STORAGE_PATH || './storage', 'temp', `batch-${batchId}`);
    await fs.mkdir(extractPath, { recursive: true });
    
    zip.extractAllTo(extractPath, true);

    // Read manifest if exists
    let manifest: any = null;
    try {
      const manifestPath = path.join(extractPath, 'manifest.json');
      const manifestData = await fs.readFile(manifestPath, 'utf-8');
      manifest = JSON.parse(manifestData);
    } catch {
      console.log('No manifest.json found, will extract from files');
    }

    // Get batch info
    const batchResult = await db.query('SELECT * FROM batches WHERE id = $1', [batchId]);
    const batch = batchResult.rows[0];
    const fechaPeriodo = batch.fecha_periodo;

    // Process all files
    const files = await fs.readdir(extractPath);
    let successCount = 0;
    let errorCount = 0;

    for (const filename of files) {
      if (filename === 'manifest.json') continue;

      const filePath = path.join(extractPath, filename);
      const ext = path.extname(filename).toLowerCase();

      try {
        let rfc: string | null = null;
        let fileType: string;

        if (ext === '.xml') {
          // Extract RFC from XML
          const xmlContent = await fs.readFile(filePath, 'utf-8');
          const xmlData = await parseXML(xmlContent);
          rfc = xmlData.rfc;
          fileType = 'XML';
        } else if (ext === '.pdf') {
          // Extract RFC from filename
          rfc = extractRfcFromFilename(filename);
          fileType = 'PDF';
        } else {
          console.log(`⏭️  Skipping unknown file type: ${filename}`);
          continue;
        }

        if (!rfc) {
          throw new Error('Could not extract RFC');
        }

        // Check if employee exists
        const employeeResult = await db.query(
          'SELECT id FROM employees WHERE rfc = $1',
          [rfc]
        );

        if (employeeResult.rows.length === 0) {
          throw new Error(`Employee with RFC ${rfc} not found`);
        }

        const employeeId = employeeResult.rows[0].id;
        const rfcFecha = `${rfc}_${fechaPeriodo}`;

        // Move file to final location
        const finalPath = path.join(process.env.STORAGE_PATH || './storage', 'receipts', filename);
        await fs.mkdir(path.dirname(finalPath), { recursive: true });
        await fs.copyFile(filePath, finalPath);

        // Upsert receipt
        const receiptResult = await db.query(
          'SELECT * FROM payroll_receipts WHERE rfc_fecha = $1',
          [rfcFecha]
        );

        if (receiptResult.rows.length > 0) {
          // Update existing
          const updates: string[] = [];
          const values: any[] = [];
          let paramIndex = 1;

          if (ext === '.pdf') {
            // Determine if pdf1 or pdf2
            const existing = receiptResult.rows[0];
            if (!existing.pdf1_filename) {
              updates.push(`pdf1_filename = $${paramIndex++}`);
              values.push(filename);
            } else if (!existing.pdf2_filename) {
              updates.push(`pdf2_filename = $${paramIndex++}`);
              values.push(filename);
            }
          } else if (ext === '.xml') {
            updates.push(`xml_filename = $${paramIndex++}`);
            values.push(filename);
          }

          if (updates.length > 0) {
            values.push(rfcFecha);
            await db.query(
              `UPDATE payroll_receipts SET ${updates.join(', ')} WHERE rfc_fecha = $${paramIndex}`,
              values
            );
          }
        } else {
          // Insert new
          await db.query(
            `INSERT INTO payroll_receipts 
             (employee_id, rfc, fecha_periodo, rfc_fecha, period_type, period_id, ${ext === '.pdf' ? 'pdf1_filename' : 'xml_filename'}, batch_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
            [
              employeeId,
              rfc,
              fechaPeriodo,
              rfcFecha,
              batch.period_type,
              batch.period_id,
              filename,
              batchId,
            ]
          );
        }

        // Record file success
        await db.query(
          `INSERT INTO batch_files (batch_id, filename, file_type, status, rfc_extracted, created_at, processed_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [batchId, filename, fileType, 'SUCCESS', rfc]
        );

        successCount++;
      } catch (error) {
        console.error(`Error processing file ${filename}:`, error);
        
        // Record file error
        await db.query(
          `INSERT INTO batch_files (batch_id, filename, file_type, status, error_message, created_at, processed_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [batchId, filename, ext === '.xml' ? 'XML' : ext === '.pdf' ? 'PDF' : 'UNKNOWN', 'ERROR', error.message]
        );

        errorCount++;
      }
    }

    // Update batch final status
    const finalStatus = errorCount === 0 ? 'DONE' : errorCount < files.length - 1 ? 'PARTIAL_SUCCESS' : 'FAILED';
    
    await db.query(
      `UPDATE batches 
       SET status = $1, total_files = $2, processed_files = $3, success_files = $4, error_files = $5, completed_at = NOW()
       WHERE id = $6`,
      [finalStatus, files.length - 1, files.length - 1, successCount, errorCount, batchId]
    );

    // Cleanup temp files
    await fs.rm(extractPath, { recursive: true, force: true });

    console.log(`✅ Batch ${batchId} processed: ${successCount} success, ${errorCount} errors`);

  } catch (error) {
    console.error(`❌ Failed to process batch ${batchId}:`, error);
    
    await db.query(
      'UPDATE batches SET status = $1 WHERE id = $2',
      ['FAILED', batchId]
    );
    
    throw error;
  }
}
