# TODO - Portal de Nómina

## ✅ Completed (v1.0)

- [x] Backend API base structure
- [x] Authentication (JWT)
- [x] Database schema (PostgreSQL)
- [x] Worker for batch processing
- [x] Frontend base (React + Vite)
- [x] Docker setup
- [x] Migration script MySQL → PostgreSQL
- [x] Documentation

## 🚧 In Progress

- [ ] Batch upload functionality (backend)
- [ ] File upload UI (frontend)
- [ ] Worker integration with backend
- [ ] Testing

## 📋 Backlog

### Backend
- [ ] Add file validation (max size, allowed extensions)
- [ ] Implement pagination for receipts list
- [ ] Add search/filter by period
- [ ] Email notifications (optional)
- [ ] Audit logs
- [ ] Rate limiting
- [ ] API versioning

### Worker
- [ ] Retry logic for failed files
- [ ] Progress tracking (% complete)
- [ ] PDF text extraction (fallback for RFC)
- [ ] Parallel file processing
- [ ] ZIP validation before extraction

### Frontend
- [ ] Batch creation form
- [ ] File upload progress bar
- [ ] Real-time batch status updates (WebSocket)
- [ ] Receipt filters and search
- [ ] Admin user management
- [ ] Statistics dashboard
- [ ] Mobile responsive improvements
- [ ] Dark mode

### Database
- [ ] Add proper migrations (TypeORM)
- [ ] Backup automation
- [ ] Performance tuning
- [ ] Add more indexes

### DevOps
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Automated testing in CI
- [ ] Staging environment
- [ ] Monitoring (Prometheus/Grafana)
- [ ] Error tracking (Sentry)
- [ ] Log aggregation

### Security
- [ ] CSRF protection
- [ ] Rate limiting per IP
- [ ] File virus scanning
- [ ] 2FA (optional)
- [ ] Security headers (Helmet)
- [ ] Input sanitization

### Documentation
- [ ] User manual (Nóminas)
- [ ] User manual (Employees)
- [ ] API versioning guide
- [ ] Contribution guidelines
- [ ] Change log

## 🔮 Future Enhancements (v2.0)

- [ ] Mobile app (React Native)
- [ ] Email/SMS receipt delivery
- [ ] Signature validation (SAT)
- [ ] OCR for PDF parsing
- [ ] Bulk download (ZIP)
- [ ] Receipt comparison tool
- [ ] Analytics and reports
- [ ] Multi-company support
- [ ] S3 storage integration
- [ ] Internationalization (i18n)

## 🐛 Known Issues

- [ ] None yet (new project)

## 💡 Ideas

- Automatic period detection from XML
- Receipt preview (PDF viewer in browser)
- Duplicate detection
- Batch templates
- Scheduled batch processing
- Webhook notifications
