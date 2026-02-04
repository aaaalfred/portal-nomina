# 🚀 Quick Start - Deploy en Dokploy

**Guía Express para Deploy Rápido**

---

## ⚡ En 5 Minutos

### 1️⃣ Pre-requisitos

```bash
✅ Dokploy instalado
✅ Dominio configurado (ej: nomina.autia.com.mx)
✅ Repo en GitHub actualizado
```

---

### 2️⃣ Crear Aplicación en Dokploy

**Dashboard → Create New → Compose**

```yaml
Name: portal-nomina
Type: Docker Compose
Repository: https://github.com/aaaalfred/portal-nomina
Branch: main
Compose File: docker-compose.yml
```

---

### 3️⃣ Variables de Entorno (IMPORTANTES)

En Dokploy → Environment Variables:

```bash
# 🔐 Seguridad (CRÍTICO)
DB_PASSWORD=genera_password_fuerte_aqui
JWT_SECRET=ejecuta_openssl_rand_base64_32

# 🗄️ Database
DATABASE_URL=postgresql://nomina_user:${DB_PASSWORD}@postgres:5432/nomina

# 📦 Redis
REDIS_URL=redis://redis:6379

# ⚙️ Backend
PORT=3002
NODE_ENV=production
STORAGE_PATH=/app/storage

# 🌐 Frontend
VITE_API_URL=https://nomina.autia.com.mx/api
```

**Generar JWT_SECRET:**
```bash
openssl rand -base64 32
```

---

### 4️⃣ Configurar Dominio

**En Dokploy → Domains:**

```
Domain: nomina.autia.com.mx
SSL: ✅ Enable (Let's Encrypt)
Force HTTPS: ✅ Enable
Container Port: 80
```

**En tu DNS provider:**
```
Type: A
Name: nomina
Value: [IP de tu servidor Dokploy]
TTL: 3600
```

---

### 5️⃣ Deploy!

```
Click "Deploy" en Dokploy
Ver logs para verificar progreso
Esperar 5-8 minutos
```

**Verificar:**
```bash
# Health check
curl https://nomina.autia.com.mx/api/health

# Abrir en navegador
https://nomina.autia.com.mx
```

---

## ✅ Credenciales de Prueba

**Admin:**
```
Usuario: admin
Password: admin123
```

**Nóminas:**
```
Usuario: nominas
Password: admin123
```

⚠️ **Cambiar en producción!**

---

## 🔧 Troubleshooting Rápido

### ❌ Build Failed
```bash
# Ver logs específicos en Dokploy → Logs
# Buscar errores de npm install o build
```

### ❌ Containers no inician
```bash
# Verificar Environment Variables
# Especialmente DB_PASSWORD y JWT_SECRET
```

### ❌ Frontend no conecta al backend
```bash
# Verificar VITE_API_URL
# Debe apuntar al dominio correcto
```

### ❌ Database connection failed
```bash
# Esperar que Postgres termine de inicializar
# Ver logs de postgres container
# Verificar DATABASE_URL
```

---

## 📊 Arquitectura del Deploy

```
┌─────────────────────────────────────────────┐
│           Dokploy Server                     │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────────┐      ┌─────────────┐     │
│  │   Frontend   │◄────►│   Backend   │     │
│  │   (Nginx)    │      │   (NestJS)  │     │
│  │   Port 80    │      │   Port 3002 │     │
│  └──────────────┘      └─────────────┘     │
│         │                      │            │
│         │                      ▼            │
│         │              ┌─────────────┐     │
│         │              │   Worker    │     │
│         │              │  (BullMQ)   │     │
│         │              └─────────────┘     │
│         │                      │            │
│         ▼                      ▼            │
│  ┌──────────────┐      ┌─────────────┐     │
│  │  Postgres    │      │    Redis    │     │
│  │  (Database)  │      │   (Queue)   │     │
│  └──────────────┘      └─────────────┘     │
│         │                                    │
│         ▼                                    │
│  ┌──────────────┐                           │
│  │   Storage    │                           │
│  │  (Volumes)   │                           │
│  └──────────────┘                           │
└─────────────────────────────────────────────┘
         │
         ▼
  ┌──────────────┐
  │ Let's Encrypt│
  │   SSL/TLS    │
  └──────────────┘
         │
         ▼
  nomina.autia.com.mx
```

---

## 🔄 Update/Redeploy

**Opción 1: Auto-deploy**
```bash
# Habilitar en Dokploy → Settings → Auto Deploy
git push origin main
# Dokploy detecta y redeploy automático
```

**Opción 2: Manual**
```bash
git push origin main
# En Dokploy → Click "Deploy"
```

---

## 📱 Próximos Pasos

Después de deploy exitoso:

1. ✅ Cambiar passwords por defecto
2. ✅ Crear primer lote de prueba
3. ✅ Invitar usuarios beta
4. ✅ Configurar backups automáticos
5. ✅ Monitorear logs y métricas

---

## 📚 Documentación Completa

Para guía detallada y troubleshooting avanzado:
👉 Ver `DOKPLOY_DEPLOY.md`

---

## 🆘 Ayuda Rápida

**Logs:**
```bash
Dokploy → portal-nomina → Logs
# Ver logs de cada container
```

**Metrics:**
```bash
Dokploy → portal-nomina → Metrics
# CPU, RAM, Network
```

**Restart:**
```bash
Dokploy → portal-nomina → Actions → Restart
```

---

## ✨ Features Desplegadas

✅ **Frontend:** Portal web responsive  
✅ **Backend:** API REST con autenticación JWT  
✅ **Worker:** Procesamiento async de lotes ZIP  
✅ **Database:** PostgreSQL con datos persistentes  
✅ **Queue:** Redis + BullMQ para jobs  
✅ **Storage:** Volumen persistente para PDFs/XMLs  
✅ **SSL:** Certificado automático Let's Encrypt  
✅ **Health Checks:** Monitoreo automático  

---

**Tiempo total:** 5-10 minutos ⚡  
**Dificultad:** Fácil 🟢

🎉 **Happy Deploying!**
