-- Seed data for development

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password_hash, role, email) VALUES
('admin', '$2b$10$8qW.xN4y5DVFZ4P3/YBvJuGPXs1fK3R8YqTqH/9LVLZbz5vK9VQK2', 'ADMIN', 'admin@nomina.com'),
('nominas', '$2b$10$8qW.xN4y5DVFZ4P3/YBvJuGPXs1fK3R8YqTqH/9LVLZbz5vK9VQK2', 'NOMINAS', 'nominas@nomina.com');

-- Insert sample employee (password: emp123)
INSERT INTO employees (rfc, name, carpeta, password_hash) VALUES
('XAXX010101000', 'Juan Pérez García', 'juan_perez', '$2b$10$N1qJcNZj9H/r3WGwV6LxVOzKx7Y8wH1P.fK3R8YqTqH/9LVLZbz5v');

COMMENT ON TABLE users IS 'Default passwords: admin123 / emp123';
