# Deployment Guide

## Development

### Prerequisites
- Node.js 20+
- PostgreSQL 15
- Redis 7
- Docker (optional)

### Local Setup

1. **Clone & Install**
```bash
git clone <repo>
cd portal-nomina

# Backend
cd backend
npm install

# Worker
cd ../worker
npm install

# Frontend
cd ../frontend
npm install
```

2. **Database**
```bash
# Start PostgreSQL + Redis
docker-compose up -d postgres redis

# Or manually:
psql -U postgres
CREATE DATABASE nomina;
\i db/init/01-schema.sql
\i db/init/02-seed.sql
```

3. **Environment**
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. **Run Services**
```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Worker
cd worker
npm run start:dev

# Terminal 3 - Frontend
cd frontend
npm run dev
```

Access:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api/docs

---

## Production (Docker)

### Quick Start
```bash
# Build & run everything
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Environment Variables
Create `.env` file:
```bash
DB_PASSWORD=secure_password_here
JWT_SECRET=your_jwt_secret_key
```

### Backup Database
```bash
docker exec nomina-db pg_dump -U nomina_user nomina > backup.sql
```

---

## Deploy to Dokploy

### 1. Prepare Repository
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

### 2. Dokploy Setup

1. Create new app in Dokploy
2. Connect GitHub repository
3. Select `docker-compose.yml`
4. Add environment variables:
   - `DB_PASSWORD`
   - `JWT_SECRET`
5. Deploy!

### 3. Post-Deployment

```bash
# SSH into server
ssh user@your-server

# Run migrations if needed
docker exec nomina-backend npm run migration:run

# Check logs
docker logs nomina-backend
docker logs nomina-worker
```

---

## Monitoring

### Health Checks
- Backend: `http://your-domain:3000/health`
- Frontend: `http://your-domain/`

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f worker
```

### Database Backups
Set up automated backups:
```bash
# Cron job (daily at 2 AM)
0 2 * * * docker exec nomina-db pg_dump -U nomina_user nomina | gzip > /backups/nomina-$(date +\%Y\%m\%d).sql.gz
```

---

## Troubleshooting

### Worker not processing jobs
```bash
# Check Redis connection
docker exec nomina-redis redis-cli ping

# Check worker logs
docker logs nomina-worker

# Restart worker
docker-compose restart worker
```

### Database connection issues
```bash
# Check PostgreSQL
docker exec nomina-db psql -U nomina_user -d nomina -c "SELECT 1"

# Restart database
docker-compose restart postgres
```

### Frontend not loading
```bash
# Check build
cd frontend
npm run build

# Check nginx config
docker exec nomina-frontend cat /etc/nginx/conf.d/default.conf
```
