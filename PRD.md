# PRD – Portal Web de Nómina
## Carga Masiva, Procesamiento y Consulta de Recibos

---

## 1. Resumen del producto

Portal web para la gestión centralizada de recibos de nómina, que permite:

* Cargar paquetes ZIP generados desde la app local.
* Procesar automáticamente archivos PDF y XML en background.
* Registrar y consolidar recibos por empleado + periodo.
* Permitir a empleados consultar y descargar sus recibos.
* Brindar visibilidad operativa y estadísticas básicas a administradores.

El portal sustituye el uso directo de la BD MySQL y opera sobre PostgreSQL.

---

## 2. Objetivos

* Centralizar la carga y consulta de recibos.
* Mantener compatibilidad total con la data histórica existente.
* Soportar cargas incompletas (PDF y/o XML).
* Garantizar trazabilidad por periodo y por lote.
* Escalar a miles de archivos por carga sin afectar la experiencia del usuario.

---

## 3. Roles y permisos

### 3.1 Nóminas

* Crear cargas (lotes) por periodo.
* Subir archivos ZIP.
* Consultar estatus de procesamiento.
* Ver errores por lote.

### 3.2 Empleado

* Iniciar sesión.
* Consultar recibos propios.
* Descargar PDF/XML disponibles.

### 3.3 Administrador

* Acceso total.
* Ver estadísticas globales.
* Gestión básica de usuarios y roles (v1).

---

## 4. Conceptos clave

### Periodo

Representa el corte del recibo, no la fecha de pago.

* Tipos:
  * Semanal
  * Quincenal
  * Mensual
* Se almacena como:
  * period_type
  * period_id
  * fecha_periodo (date)

### Recibo

Un recibo pertenece a:

* 1 empleado (RFC)
* 1 periodo (fecha_periodo)
* Puede tener hasta:
  * 2 PDF
  * 1 XML
* Identificador natural: `rfc_fecha = RFC + '_' + fecha_periodo`

---

## 5. Alcance funcional

---

## MÓDULO 1 – Autenticación

### Funcionalidad

* Login por:
  * RFC + contraseña (empleados)
  * Usuario/contraseña (nóminas/admin)
* Contraseñas almacenadas hasheadas (bcrypt/argon2).

### Reglas

* En migración, convertir empleados.password a hash.
* El empleado solo ve información asociada a su RFC.

---

## MÓDULO 2 – Gestión de Lotes (Carga Masiva)

### Funcionalidad

* Crear lote:
  * Tipo de periodo
  * Periodo específico
  * fecha_periodo (calculada o confirmada)
* Subir ZIP generado por la app local.
* Visualizar estatus del lote.

### Estados del lote

* CREATED
* UPLOADED
* PROCESSING
* DONE
* PARTIAL_SUCCESS
* FAILED

### Vista de lote

* Nombre del ZIP
* Periodo
* Conteo de archivos
* Estatus
* Fecha de carga
* Usuario que cargó

---

## MÓDULO 3 – Procesamiento en Background (Worker)

### Pipeline de procesamiento

1. Guardar ZIP en storage.
2. Descomprimir contenido.
3. Leer manifest.json.
4. Clasificar archivos:
   * PDF
   * XML
5. Por archivo:
   * Extraer RFC:
     * Prioridad 1: XML (CFDI)
     * Prioridad 2: nombre de archivo (regex)
6. Determinar fecha_periodo:
   * Desde manifest.json
   * O desde el lote
7. Construir rfc_fecha.
8. Upsert del recibo:
   * Si existe rfc_fecha: actualizar archivos faltantes.
   * Si no existe: crear nuevo recibo.
9. Registrar errores de procesamiento sin detener el lote.

### Reglas

* El XML tiene prioridad como fuente de datos.
* El sistema no rechaza recibos incompletos.
* Un recibo puede crearse con solo PDF o solo XML.

---

## MÓDULO 4 – Gestión de Recibos

### Funcionalidad

* Listado de recibos por:
  * Periodo
  * Empleado
* Vista detalle de recibo:
  * Periodo
  * Archivos disponibles
  * Fecha de creación

### Reglas

* El recibo se identifica de forma única por rfc_fecha.
* Se permite actualizar un recibo si llega un archivo nuevo (ej. XML después del PDF).

---

## MÓDULO 5 – Consulta por Empleado

### Funcionalidad

* Lista de recibos propios.
* Ordenados por periodo descendente.
* Descarga directa de:
  * PDF principal
  * PDF detalle (si existe)
  * XML (si existe)

### Restricciones

* El empleado no puede ver otros RFC.
* No puede editar ni eliminar información.

---

## MÓDULO 6 – Dashboard Administrativo (v1)

### Métricas básicas

* Recibos por periodo.
* Lotes procesados.
* Errores por lote.
* Cantidad de PDFs/XML procesados.

### Opcional

* Exportación CSV.

---

## 6. Modelo de datos (PostgreSQL – alto nivel)

### employees

* id (PK)
* rfc (UNIQUE)
* name
* carpeta
* password_hash
* legacy_id (opcional)

### payroll_receipts

* id (PK)
* employee_id (FK)
* rfc
* fecha_periodo (date)
* rfc_fecha (UNIQUE)
* pdf1_filename (nullable)
* pdf2_filename (nullable)
* xml_filename (nullable)
* created_at

### batches

* id (PK)
* period_type
* period_id
* fecha_periodo
* zip_url
* status
* created_by
* created_at

### batch_files (recomendado)

* batch_id
* filename
* file_type
* status
* error_message

---

## 7. Migración MySQL → PostgreSQL (requerimiento funcional)

### Reglas

* empleados.rfc es la llave natural.
* nominas.codigo → RFC.
* nominas.fecha → fecha_periodo.
* nominas.rfc_fecha se mantiene y se vuelve UNIQUE.
* nominas.pdf → pdf1_filename.
* nominas.detalle → pdf2_filename.
* nominas.xml → xml_filename.

### Criterios de éxito

* Conteo consistente de empleados y recibos.
* No pérdida de archivos.
* Detección y reporte de duplicados de rfc_fecha.

---

## 8. Reglas de negocio clave

* Un recibo pertenece a un solo periodo.
* Un empleado puede tener varios recibos (uno por periodo).
* El sistema debe soportar re-cargas del mismo periodo sin duplicar datos.
* El portal nunca bloquea una carga completa por errores parciales.

---

## 9. Requerimientos no funcionales

* Procesamiento asíncrono (colas/workers).
* UI no bloqueante durante cargas grandes.
* Logs de errores por lote.
* Escalable a miles de archivos por carga.
* Seguridad básica (roles, hashing, aislamiento por RFC).

---

## 10. Fuera de alcance (v1)

* Firma electrónica.
* Validación SAT en línea.
* OCR avanzado.
* App móvil.
* Notificaciones automáticas.

---

## 11. Entregables

1. Portal web funcional.
2. API backend.
3. Workers de procesamiento.
4. Base de datos PostgreSQL.
5. Scripts de migración MySQL → PostgreSQL.
6. Manual básico de usuario (Nóminas / Empleado).

---

## 12. Criterios de éxito

* Lotes con miles de archivos procesados sin errores críticos.
* Empleados consultan sus recibos sin intervención.
* Nóminas puede re-subir periodos sin duplicar registros.
* Migración completa sin pérdida de información.
