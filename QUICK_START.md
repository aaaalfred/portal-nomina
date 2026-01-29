# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Option 1: Docker (Recommended)

```bash
cd portal-nomina

# Setup environment
cp .env.example .env

# Start everything
docker-compose up -d

# Check logs
docker-compose logs -f
```

**Access:**
- Frontend: http://localhost (port 80)
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api/docs

**Default Credentials:**
- Admin: `admin` / `admin123`
- Nóminas: `nominas` / `admin123`
- Employee: `XAXX010101000` / `emp123`

---

### Option 2: Local Development

```bash
# 1. Setup
./setup.sh

# 2. Start services
make dev

# Or manually:
# Terminal 1
cd backend && npm run start:dev

# Terminal 2
cd worker && npm run start:dev

# Terminal 3
cd frontend && npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

---

## 📦 Test the Full Flow

### 1. Login as Nóminas
- Go to http://localhost:5173
- Select "Nóminas/Admin"
- Username: `nominas`
- Password: `admin123`

### 2. Create a Batch
- Click "Nuevo Lote"
- Fill in:
  - Period Type: `quincenal`
  - Period ID: `2024-01`
  - Date: `2024-01-15`

### 3. Upload ZIP
- Prepare a ZIP with PDFs/XMLs
- File naming: `RFC_date.pdf` or rely on XML parsing
- Upload the ZIP
- Watch the batch process in real-time

### 4. Login as Employee
- Logout
- Select "Empleado"
- RFC: Your employee RFC
- View and download your receipts

---

## 🔧 Common Commands

```bash
# Start all services
make up

# Stop all services
make down

# View logs
make logs

# Clean build artifacts
make clean

# Run migrations
make migrate

# Migrate from MySQL
make migrate-from-mysql
```

---

## 📚 Next Steps

1. **Customize**: Update `.env` with real credentials
2. **Migrate Data**: See `docs/MIGRATION.md`
3. **Deploy**: See `docs/DEPLOYMENT.md`
4. **API Docs**: Visit http://localhost:3000/api/docs

---

## 🆘 Troubleshooting

**Port already in use:**
```bash
# Change ports in docker-compose.yml or .env
```

**Database connection failed:**
```bash
# Wait for PostgreSQL to be ready
docker-compose logs postgres
```

**Worker not processing:**
```bash
# Check Redis
docker exec nomina-redis redis-cli ping

# Restart worker
docker-compose restart worker
```

---

## 📖 Documentation

- `README.md` - Project overview
- `docs/API.md` - API endpoints
- `docs/ARCHITECTURE.md` - System design
- `docs/DEPLOYMENT.md` - Production deployment
- `docs/MIGRATION.md` - MySQL migration guide
- `TODO.md` - Roadmap

---

**Need help?** Check the logs first:
```bash
docker-compose logs -f backend
docker-compose logs -f worker
```
