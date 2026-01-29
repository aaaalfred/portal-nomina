-- Database: nomina
-- PostgreSQL Schema

-- Employees table
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    rfc VARCHAR(13) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    carpeta VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    legacy_id INTEGER,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employees_rfc ON employees(rfc);

-- Users table (nominas/admin)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'NOMINAS')),
    email VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payroll receipts table
CREATE TABLE payroll_receipts (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    rfc VARCHAR(13) NOT NULL,
    fecha_periodo DATE NOT NULL,
    rfc_fecha VARCHAR(50) UNIQUE NOT NULL,
    period_type VARCHAR(20) NOT NULL,
    period_id VARCHAR(50),
    pdf1_filename VARCHAR(255),
    pdf2_filename VARCHAR(255),
    xml_filename VARCHAR(255),
    batch_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_receipts_rfc ON payroll_receipts(rfc);
CREATE INDEX idx_receipts_fecha ON payroll_receipts(fecha_periodo);
CREATE INDEX idx_receipts_rfc_fecha ON payroll_receipts(rfc_fecha);

-- Batches table
CREATE TABLE batches (
    id SERIAL PRIMARY KEY,
    period_type VARCHAR(20) NOT NULL,
    period_id VARCHAR(50) NOT NULL,
    fecha_periodo DATE NOT NULL,
    zip_filename VARCHAR(255),
    zip_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'CREATED' 
        CHECK (status IN ('CREATED', 'UPLOADED', 'PROCESSING', 'DONE', 'PARTIAL_SUCCESS', 'FAILED')),
    total_files INTEGER DEFAULT 0,
    processed_files INTEGER DEFAULT 0,
    success_files INTEGER DEFAULT 0,
    error_files INTEGER DEFAULT 0,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_batches_status ON batches(status);
CREATE INDEX idx_batches_fecha ON batches(fecha_periodo);

-- Batch files table
CREATE TABLE batch_files (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('PDF', 'XML', 'UNKNOWN')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'ERROR')),
    error_message TEXT,
    rfc_extracted VARCHAR(13),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

CREATE INDEX idx_batch_files_batch ON batch_files(batch_id);
CREATE INDEX idx_batch_files_status ON batch_files(status);
