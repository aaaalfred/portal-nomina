#!/usr/bin/env node
/**
 * Migration script from MySQL to PostgreSQL
 * 
 * Usage:
 *   node migrate-from-mysql.js
 * 
 * Environment variables:
 *   MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
 *   PG_URL (PostgreSQL connection string)
 */

const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'nomina_db',
};

const pgPool = new Pool({
  connectionString: process.env.PG_URL || 'postgresql://nomina_user:nomina_dev_pass@localhost:5432/nomina',
});

async function migrateEmployees(mysqlConn, pgConn) {
  console.log('📋 Migrating employees...');
  
  const [employees] = await mysqlConn.query('SELECT * FROM empleados');
  
  let migrated = 0;
  let errors = 0;

  for (const emp of employees) {
    try {
      // Hash password if it exists and isn't already hashed
      let passwordHash = emp.password;
      if (passwordHash && !passwordHash.startsWith('$2b$')) {
        passwordHash = await bcrypt.hash(passwordHash, 10);
      }

      await pgConn.query(
        `INSERT INTO employees (rfc, name, carpeta, password_hash, legacy_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (rfc) DO UPDATE SET
           name = EXCLUDED.name,
           carpeta = EXCLUDED.carpeta`,
        [emp.rfc, emp.nombre, emp.carpeta, passwordHash, emp.id, emp.created_at || new Date()]
      );
      
      migrated++;
    } catch (error) {
      console.error(`Error migrating employee ${emp.rfc}:`, error.message);
      errors++;
    }
  }

  console.log(`✅ Employees: ${migrated} migrated, ${errors} errors`);
}

async function migrateReceipts(mysqlConn, pgConn) {
  console.log('📋 Migrating receipts...');
  
  const [receipts] = await mysqlConn.query('SELECT * FROM nominas');
  
  let migrated = 0;
  let errors = 0;

  for (const receipt of receipts) {
    try {
      // Get employee_id from PostgreSQL
      const empResult = await pgConn.query(
        'SELECT id FROM employees WHERE rfc = $1',
        [receipt.codigo]
      );

      if (empResult.rows.length === 0) {
        throw new Error(`Employee not found: ${receipt.codigo}`);
      }

      const employeeId = empResult.rows[0].id;
      const rfcFecha = receipt.rfc_fecha || `${receipt.codigo}_${receipt.fecha}`;

      await pgConn.query(
        `INSERT INTO payroll_receipts 
         (employee_id, rfc, fecha_periodo, rfc_fecha, period_type, period_id, pdf1_filename, pdf2_filename, xml_filename, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (rfc_fecha) DO UPDATE SET
           pdf1_filename = COALESCE(EXCLUDED.pdf1_filename, payroll_receipts.pdf1_filename),
           pdf2_filename = COALESCE(EXCLUDED.pdf2_filename, payroll_receipts.pdf2_filename),
           xml_filename = COALESCE(EXCLUDED.xml_filename, payroll_receipts.xml_filename)`,
        [
          employeeId,
          receipt.codigo,
          receipt.fecha,
          rfcFecha,
          receipt.tipo_periodo || 'quincenal',
          receipt.periodo_id || '',
          receipt.pdf,
          receipt.detalle,
          receipt.xml,
          receipt.created_at || new Date(),
        ]
      );

      migrated++;
    } catch (error) {
      console.error(`Error migrating receipt ${receipt.rfc_fecha}:`, error.message);
      errors++;
    }
  }

  console.log(`✅ Receipts: ${migrated} migrated, ${errors} errors`);
}

async function main() {
  console.log('🚀 Starting MySQL → PostgreSQL migration\n');

  let mysqlConn;
  
  try {
    // Connect to MySQL
    console.log('Connecting to MySQL...');
    mysqlConn = await mysql.createConnection(mysqlConfig);
    console.log('✅ MySQL connected\n');

    // Migrate
    await migrateEmployees(mysqlConn, pgPool);
    await migrateReceipts(mysqlConn, pgPool);

    // Verify counts
    const [mysqlEmpCount] = await mysqlConn.query('SELECT COUNT(*) as count FROM empleados');
    const [mysqlRecCount] = await mysqlConn.query('SELECT COUNT(*) as count FROM nominas');
    
    const pgEmpCount = await pgPool.query('SELECT COUNT(*) as count FROM employees');
    const pgRecCount = await pgPool.query('SELECT COUNT(*) as count FROM payroll_receipts');

    console.log('\n📊 Verification:');
    console.log(`Employees: MySQL ${mysqlEmpCount[0].count} → PostgreSQL ${pgEmpCount.rows[0].count}`);
    console.log(`Receipts:  MySQL ${mysqlRecCount[0].count} → PostgreSQL ${pgRecCount.rows[0].count}`);

    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (mysqlConn) await mysqlConn.end();
    await pgPool.end();
  }
}

main();
