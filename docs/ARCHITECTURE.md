# Architecture Overview

## System Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTP/REST
       ▼
┌─────────────┐     ┌──────────┐
│   Nginx     │────▶│ Frontend │
│  (Reverse   │     │  (React) │
│   Proxy)    │     └──────────┘
└──────┬──────┘
       │
       ▼
┌─────────────────┐    ┌─────────┐
│   Backend API   │───▶│  Redis  │
│   (NestJS)      │    │ (Queue) │
└────────┬────────┘    └────┬────┘
         │                  │
         │                  ▼
         │            ┌──────────┐
         │            │  Worker  │
         │            │(Processor)│
         │            └─────┬────┘
         ▼                  │
    ┌─────────┐            │
    │PostgreSQL│◀───────────┘
    └─────────┘

         ▼
    ┌─────────┐
    │ Storage │
    │(Files)  │
    └─────────┘
```

## Components

### Frontend (React + Vite)
- **Purpose:** User interface for all roles
- **Tech:** React 18, TailwindCSS, React Router, React Query
- **Responsibilities:**
  - Login/authentication
  - Employee receipt viewing
  - Nóminas batch management
  - Admin dashboard

### Backend API (NestJS)
- **Purpose:** REST API + business logic
- **Tech:** NestJS, TypeORM, PostgreSQL, JWT
- **Responsibilities:**
  - Authentication & authorization
  - CRUD operations
  - File upload handling
  - Job queue management
  - Access control by role

### Worker (BullMQ)
- **Purpose:** Asynchronous batch processing
- **Tech:** BullMQ, Redis, TypeScript
- **Responsibilities:**
  - Unzip uploaded files
  - Parse XML (CFDI)
  - Extract RFC from filenames
  - Upsert receipts
  - Error tracking

### Database (PostgreSQL)
- **Purpose:** Persistent data storage
- **Schema:**
  - employees
  - users
  - payroll_receipts
  - batches
  - batch_files

### Queue (Redis)
- **Purpose:** Job queue for async processing
- **Jobs:**
  - process-batch

### Storage (Filesystem / S3)
- **Purpose:** File storage for PDFs and XMLs
- **Structure:**
  ```
  storage/
  ├── uploads/    # Temporary ZIP uploads
  ├── receipts/   # Processed PDFs and XMLs
  └── temp/       # Extraction workspace
  ```

## Data Flow

### Upload Flow
1. User uploads ZIP via Frontend
2. Backend saves ZIP to `/storage/uploads`
3. Backend creates Batch record (status: UPLOADED)
4. Backend adds job to Redis queue
5. Worker picks up job
6. Worker processes files:
   - Unzip
   - Extract RFC
   - Validate employee exists
   - Move files to `/storage/receipts`
   - Upsert receipt records
7. Worker updates Batch status (DONE/PARTIAL/FAILED)

### Download Flow
1. Employee requests receipt file
2. Backend validates ownership
3. Backend streams file from storage
4. Browser downloads file

## Security

### Authentication
- JWT tokens (7-day expiry)
- Bcrypt password hashing (10 rounds)
- Separate endpoints for employee vs user login

### Authorization
- **Employee:** Can only view own receipts
- **Nóminas:** Can upload batches and view all receipts
- **Admin:** Full access

### File Access
- Receipts validated by RFC ownership
- Direct file URLs not exposed
- Streaming through authenticated endpoint

## Scalability

### Horizontal Scaling
- Backend: Stateless, can run multiple instances
- Worker: Can run multiple workers (concurrency: 2)
- Frontend: Static files, CDN-ready

### Database
- Indexed on rfc, fecha_periodo, rfc_fecha
- Connection pooling
- Can add read replicas

### Storage
- Can migrate to S3/MinIO for distributed storage
- CDN for static file serving

## Monitoring

### Health Checks
- Backend: `/health`
- Database: Connection pool monitoring
- Worker: Job success/failure rates

### Logs
- Structured logging
- Error tracking per batch
- Audit trail for uploads

## Performance

### Optimizations
- React Query for client-side caching
- Database query optimization with indexes
- Batch processing parallelization
- File streaming (not loading full files into memory)

### Bottlenecks
- Large ZIP extraction (mitigated by worker parallelization)
- PDF parsing (optional, skipped if filename has RFC)
- Database writes (batched where possible)
