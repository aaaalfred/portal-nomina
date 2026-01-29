# MySQL → PostgreSQL Migration Guide

## Overview

This guide helps you migrate from your existing MySQL database to PostgreSQL.

## Prerequisites

- Access to MySQL database
- PostgreSQL 15+ installed
- Node.js 20+ (for migration script)

## Migration Steps

### 1. Backup MySQL Data

```bash
mysqldump -u root -p nomina_db > backup-mysql.sql
```

### 2. Prepare PostgreSQL

```bash
# Create database
createdb nomina

# Run schema
psql -U nomina_user -d nomina -f db/init/01-schema.sql
```

### 3. Install Migration Dependencies

```bash
cd db
npm install mysql2 pg bcrypt
```

### 4. Configure Environment

```bash
export MYSQL_HOST=localhost
export MYSQL_USER=root
export MYSQL_PASSWORD=your_password
export MYSQL_DATABASE=nomina_db

export PG_URL=postgresql://nomina_user:password@localhost:5432/nomina
```

### 5. Run Migration

```bash
node migrate-from-mysql.js
```

The script will:
1. Connect to both databases
2. Migrate `empleados` → `employees`
3. Migrate `nominas` → `payroll_receipts`
4. Hash passwords with bcrypt
5. Validate record counts

### 6. Verify Migration

```bash
psql -U nomina_user -d nomina

-- Check counts
SELECT COUNT(*) FROM employees;
SELECT COUNT(*) FROM payroll_receipts;

-- Sample data
SELECT * FROM employees LIMIT 5;
SELECT * FROM payroll_receipts LIMIT 5;
```

## Data Mapping

### empleados → employees

| MySQL            | PostgreSQL       |
|------------------|------------------|
| id               | legacy_id        |
| rfc              | rfc              |
| nombre           | name             |
| carpeta          | carpeta          |
| password         | password_hash    |

### nominas → payroll_receipts

| MySQL        | PostgreSQL       |
|--------------|------------------|
| codigo       | rfc              |
| fecha        | fecha_periodo    |
| rfc_fecha    | rfc_fecha        |
| pdf          | pdf1_filename    |
| detalle      | pdf2_filename    |
| xml          | xml_filename     |

## File Migration

If you have physical PDF/XML files stored:

```bash
# Copy files to new storage location
rsync -av /old/storage/path/ ./storage/receipts/

# Update paths in database if needed
UPDATE payroll_receipts 
SET pdf1_filename = REPLACE(pdf1_filename, '/old/path/', '')
WHERE pdf1_filename IS NOT NULL;
```

## Rollback

If something goes wrong:

```bash
# Drop PostgreSQL database
dropdb nomina

# Recreate from backup
createdb nomina
psql -U nomina_user -d nomina -f backup-mysql.sql
```

## Common Issues

### Password Hash Errors
- Old passwords stored in plain text will be hashed during migration
- Users will need to reset if issues occur

### Missing Employees
- Check that `codigo` (RFC) in `nominas` matches `rfc` in `empleados`
- Orphaned receipts will be skipped with error messages

### Duplicate rfc_fecha
- Script handles conflicts with UPSERT
- Later records update earlier ones

## Post-Migration

1. Test login with migrated users
2. Verify receipts are accessible
3. Check file downloads work
4. Run queries to validate data integrity

```sql
-- Find receipts without employees
SELECT * FROM payroll_receipts pr
LEFT JOIN employees e ON pr.employee_id = e.id
WHERE e.id IS NULL;

-- Find employees without receipts
SELECT e.rfc, e.name, COUNT(pr.id) as receipt_count
FROM employees e
LEFT JOIN payroll_receipts pr ON e.id = pr.employee_id
GROUP BY e.id
HAVING COUNT(pr.id) = 0;
```
