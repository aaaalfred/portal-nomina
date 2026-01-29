# Portal de Nómina

Sistema completo para gestión de recibos de nómina: carga masiva, procesamiento y consulta.

## 🏗️ Arquitectura

```
portal-nomina/
├── backend/          # API REST (NestJS + TypeScript)
├── worker/           # Procesamiento asíncrono (BullMQ + Redis)
├── frontend/         # UI Web (React + Vite)
├── db/              # Migraciones y seeds PostgreSQL
├── docker-compose.yml
└── docs/            # Documentación
```

## 🛠️ Stack Tecnológico

### Backend
- **Framework:** NestJS (TypeScript)
- **Base de datos:** PostgreSQL 15
- **Autenticación:** JWT + bcrypt
- **Validación:** class-validator
- **Storage:** Local / S3 (configurable)

### Worker
- **Queue:** BullMQ + Redis
- **Parsing XML:** xml2js
- **PDF Processing:** pdf-parse
- **ZIP:** adm-zip

### Frontend
- **Framework:** React 18 + Vite
- **UI:** TailwindCSS + shadcn/ui
- **State:** React Query + Zustand
- **Routing:** React Router

### DevOps
- **Containers:** Docker + Docker Compose
- **Deploy:** Dokploy
- **CI/CD:** GitHub Actions

## 🚀 Quick Start

### Desarrollo

```bash
# Levantar servicios (DB + Redis)
docker-compose up -d postgres redis

# Backend
cd backend
npm install
npm run start:dev

# Worker
cd worker
npm install
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

### Producción (Docker)

```bash
docker-compose up -d
```

## 📊 Módulos

1. **Autenticación** - Login empleados/nóminas/admin
2. **Gestión de Lotes** - Carga masiva de ZIPs
3. **Worker de Procesamiento** - Background jobs
4. **Gestión de Recibos** - CRUD y consultas
5. **Portal Empleado** - Consulta y descarga
6. **Dashboard Admin** - Estadísticas y gestión

## 🔐 Roles

- **Empleado** - Solo consulta sus recibos
- **Nóminas** - Carga lotes y consulta estatus
- **Administrador** - Acceso total

## 📖 Documentación

Ver `/docs` para:
- Modelo de datos
- API endpoints
- Flujos de procesamiento
- Guía de migración MySQL → PostgreSQL

## 🎯 Status

- [ ] Backend API
- [ ] Worker procesamiento
- [ ] Frontend base
- [ ] Migración DB
- [ ] Docker setup
- [ ] Deploy Dokploy
