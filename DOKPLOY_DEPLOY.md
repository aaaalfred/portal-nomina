# 🚀 Deploy Portal Nómina en Dokploy

**Última actualización:** 2026-02-03 18:50

**Cambios recientes:**
- ✅ Fix sistema de descargas: archivos organizados por RFC
- ✅ Backend y Worker sincronizados con estructura `/receipts/{RFC}/{filename}`
- ✅ Health checks agregados a todos los servicios

---

## 📋 Pre-requisitos

- Dokploy instalado y corriendo
- Acceso a DNS de autia.com.mx (o tu dominio)
- GitHub repo con acceso (privado o público)

---

## 🔧 Paso 1: Preparar Repositorio

```bash
cd /path/to/portal-nomina

# Verificar que estamos en main
git branch

# Verificar archivos importantes
ls -la | grep -E "docker|Dockerfile"
# Debe mostrar: docker-compose.yml

# Estado del repo
git status

# Si hay cambios, commit y push
git add .
git commit -m "Ready for Dokploy deploy"
git push origin main
```

**Repo GitHub:** https://github.com/aaaalfred/portal-nomina _(actualizar con tu URL)_

---

## 🐳 Paso 2: Configurar en Dokploy

### 2.1 Crear Nuevo Proyecto

1. Abrir Dokploy dashboard
2. Click **"Create New"** → **"Application"** o **"Compose"**

**Opción recomendada:** Usar **"Compose"** porque usa docker-compose.yml

---

### 2.2 Configuración General

```
Name: portal-nomina
Description: Sistema de gestión de recibos de nómina
```

---

### 2.3 Git Repository

```
Provider: GitHub
Repository URL: https://github.com/aaaalfred/portal-nomina
Branch: main
Auto Deploy: ✅ (opcional - redeploy automático en push)
```

**Si es repo privado:**
- Agregar SSH key de Dokploy a GitHub
- O usar Personal Access Token

---

### 2.4 Build Settings

**Tipo:** Docker Compose

```
Compose File: ./docker-compose.yml
Build Context: .
```

---

### 2.5 Environment Variables (IMPORTANTE)

Click "Add Environment Variable" y agrega cada una:

```bash
# Database
DB_PASSWORD=TU_PASSWORD_SEGURO_AQUI
DATABASE_URL=postgresql://nomina_user:TU_PASSWORD_SEGURO_AQUI@postgres:5432/nomina

# Redis
REDIS_URL=redis://redis:6379

# JWT (CRÍTICO - cambiar)
JWT_SECRET=TU_JWT_SECRET_SUPER_SEGURO_LARGO_ALEATORIO
JWT_EXPIRES_IN=7d

# Backend
PORT=3002
NODE_ENV=production
STORAGE_PATH=/app/storage

# Frontend (debe apuntar al dominio de producción)
VITE_API_URL=https://nomina.autia.com.mx/api
# O si tienes subdominio separado: https://api.nomina.autia.com.mx

# Opcional: Storage S3 (si usas S3 en lugar de local)
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
# AWS_REGION=...
# AWS_S3_BUCKET=...
```

**⚠️ IMPORTANTE:** Genera un JWT_SECRET fuerte:
```bash
# Genera uno random:
openssl rand -base64 32
```

---

### 2.6 Domains & SSL

En la sección "Domains":

**Frontend:**
```
Domain: nomina.autia.com.mx
SSL: ✅ Enable (Let's Encrypt)
Force HTTPS: ✅ Enable
Port: 80 (interno del container frontend)
```

**Backend API (opcional, si quieres acceso directo):**
```
Domain: api.nomina.autia.com.mx
SSL: ✅ Enable
Port: 3002 (interno del container backend)
```

**Nota:** El backend corre en puerto 3002 internamente. Si usas un proxy reverso en el frontend, no necesitas exponer este puerto públicamente.

---

### 2.7 Volumes (Persistencia de Datos)

Dokploy debería crear automáticamente los volúmenes definidos en docker-compose.yml:
- `postgres_data` - Base de datos
- `redis_data` - Cola de trabajos
- `storage_data` - Archivos subidos (PDFs/XMLs)

**Verificar** que estén marcados como persistentes.

---

### 2.8 Health Checks

```
Backend Health Check:
  Path: /health (o /api/health si existe)
  Port: 3000
  Interval: 30s
  Timeout: 10s
  Retries: 3
```

---

## 🚀 Paso 3: Deploy

1. Revisar toda la configuración
2. Click **"Deploy"**
3. Ir a la pestaña **"Logs"** para ver el progreso

**Progreso esperado:**
```
✓ Cloning repository
✓ Building services
  → postgres (pulling image)
  → redis (pulling image)
  → backend (building Dockerfile)
  → worker (building Dockerfile)
  → frontend (building Dockerfile)
✓ Starting containers
✓ Health checks passing
✓ Application ready
```

**Tiempo estimado:** 5-8 minutos (primera vez)

---

## 🌐 Paso 4: Configurar DNS

En tu proveedor DNS de **autia.com.mx**:

### Frontend (principal)
```
Type: A
Name: nomina
Value: [IP de tu servidor Dokploy]
TTL: 3600
```

### API (opcional)
```
Type: A
Name: api.nomina
Value: [IP de tu servidor Dokploy]
TTL: 3600
```

**Verificar propagación:**
```bash
dig nomina.autia.com.mx
# o
nslookup nomina.autia.com.mx
```

Esperar 5-15 minutos para propagación.

---

## ✅ Paso 5: Verificación

### 5.1 Health Checks

```bash
# Backend API
curl https://nomina.autia.com.mx/api/health
# o
curl https://api.nomina.autia.com.mx/health

# Respuesta esperada:
# {"status":"ok"}
```

### 5.2 Frontend

Abrir en navegador: **https://nomina.autia.com.mx**

**Verificar:**
- [ ] Página carga correctamente
- [ ] Login screen visible
- [ ] CSS/estilos funcionan
- [ ] No hay errores en consola del navegador

### 5.3 Test Login

**Credenciales por defecto:**

Admin:
```
Usuario: admin
Password: admin123
```

Nóminas:
```
Usuario: nominas
Password: admin123
```

**⚠️ IMPORTANTE:** Cambiar estas passwords en producción!

### 5.4 Test Completo de Flujo

1. **Login como Nóminas**
2. **Crear Lote:**
   - Tipo periodo: quincenal
   - ID periodo: 2026-01
   - Fecha: 2026-01-15
3. **Subir ZIP** (preparar un ZIP de prueba con PDFs)
4. **Verificar procesamiento:** Ver que aparezcan recibos
5. **Login como Empleado:** Buscar por RFC, ver recibo

---

## 📊 Paso 6: Monitoring

### Logs en Tiempo Real

En Dokploy → portal-nomina → Tab "Logs"

```bash
# Ver logs de cada servicio:
- backend
- worker
- frontend
- postgres
- redis
```

### Métricas

Dokploy Dashboard → portal-nomina → Tab "Metrics"
- CPU usage
- RAM usage
- Network
- Container status

### Alerts (Opcional)

Configurar en Dokploy:
- Health check failures
- High resource usage
- Container restarts

---

## 🐛 Troubleshooting

### Error: "Services failed to start"

**Solución:**
```bash
# Ver logs específicos en Dokploy
# Buscar errores de:
1. Database connection (verificar DATABASE_URL)
2. Redis connection (verificar REDIS_URL)
3. Missing JWT_SECRET
```

### Error: "Database connection failed"

**Verificar:**
```bash
# En Dokploy logs, buscar:
- "postgres" container status
- DB_PASSWORD correcto en env vars
- DATABASE_URL correcto
```

**Fix común:**
- Esperar a que Postgres termine de inicializar
- Verificar que health check de postgres pasó

### Error: "CORS / API not accessible"

**Causa:** Frontend no puede conectar a backend

**Solución:**
- Verificar VITE_API_URL en frontend env vars
- Debe apuntar a dominio backend correcto

### Error: "SSL certificate failed"

**Solución:**
```bash
1. Verificar DNS apunta correctamente
2. Regenerar certificado Let's Encrypt en Dokploy
3. Verificar puertos 80 y 443 abiertos
```

### Error: "Worker not processing batches"

**Verificar:**
```bash
# Redis corriendo
docker exec nomina-redis redis-cli ping
# Debe responder: PONG

# Logs del worker
# En Dokploy → logs → worker container
```

---

## 🔄 Updates Futuros

### Deploy Nueva Versión

**Si Auto Deploy está ON:**
```bash
# Solo haz push a main
git push origin main
# Dokploy detecta y redeploy automático
```

**Si Auto Deploy está OFF:**
```bash
# Push a GitHub
git push origin main

# En Dokploy
# Click "Deploy" manualmente
```

### Rollback

En Dokploy:
1. Tab "Deployments"
2. Ver historial
3. Click "Rollback" en versión anterior

---

## 🔐 Seguridad Post-Deploy

### CRÍTICO - Hacer Inmediatamente

- [ ] Cambiar password de admin (BD directamente o crear endpoint)
- [ ] Cambiar password de nominas
- [ ] Cambiar JWT_SECRET a uno fuerte
- [ ] Cambiar DB_PASSWORD a uno fuerte
- [ ] Configurar backups automáticos de Postgres
- [ ] Habilitar HTTPS only (sin HTTP)

### Backups

**Postgres:**
```bash
# En Dokploy o cron manual:
docker exec nomina-db pg_dump -U nomina_user nomina > backup.sql
```

**Storage (archivos):**
```bash
# Backup del volumen storage_data
# Configurar en Dokploy o script manual
```

---

## 📱 Acceso Móvil

La app es responsive. Probar en:
- iPhone Safari
- Android Chrome
- Tablet

**Agregar a Home Screen:** Funciona como PWA

---

## 📞 Soporte

**Si algo falla:**

1. **Logs primero:** Dokploy → Logs → Ver qué servicio falla
2. **Health checks:** Verificar cuál está failing
3. **Environment vars:** Verificar que todas estén configuradas
4. **DNS:** Verificar propagación con `dig`

---

## ✅ Checklist Final de Deploy

- [ ] Repo en GitHub (main branch actualizado)
- [ ] DNS configurado y propagado
- [ ] Dokploy application creada
- [ ] Environment variables configuradas
- [ ] Build exitoso (ver logs)
- [ ] Containers running (todos los 5)
- [ ] Health checks passing
- [ ] HTTPS funcionando (SSL OK)
- [ ] Frontend accessible
- [ ] API accessible
- [ ] Login funcional
- [ ] Upload de lote funcional
- [ ] Worker procesando
- [ ] Passwords de producción cambiadas

---

## 📊 URLs Finales

Después del deploy:

- **App:** https://nomina.autia.com.mx
- **API:** https://api.nomina.autia.com.mx (opcional)
- **Docs API:** https://api.nomina.autia.com.mx/api/docs

---

## 🎉 Success!

Si todos los checks pasan:
✅ **Portal Nómina está en producción!**

**Próximos pasos:**
1. Crear lote de prueba real
2. Invitar primer usuario beta
3. Conseguir primer cliente piloto
4. Iterar basado en feedback

---

**Tiempo total estimado:** 30-45 minutos
(primera vez, con configuración DNS incluida)

🚀 **¡Buena suerte con el deploy!**
