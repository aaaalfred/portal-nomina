# API Documentation

Base URL: `http://localhost:3000`

## Authentication

### Login Employee
```http
POST /auth/login/employee
Content-Type: application/json

{
  "username": "XAXX010101000",
  "password": "password123"
}
```

### Login User (Nóminas/Admin)
```http
POST /auth/login/user
Content-Type: application/json

{
  "username": "nominas",
  "password": "admin123"
}
```

Response:
```json
{
  "access_token": "jwt_token_here",
  "user": {
    "id": 1,
    "type": "employee",
    "rfc": "XAXX010101000",
    "name": "Juan Pérez"
  }
}
```

## Employees

### List Employees
```http
GET /employees
Authorization: Bearer <token>
```

## Receipts

### List My Receipts (Employee)
```http
GET /receipts
Authorization: Bearer <token>
```

### List All Receipts (Admin)
```http
GET /receipts?rfc=XAXX010101000
Authorization: Bearer <token>
```

### Download File
```http
GET /receipts/:id/download/:fileType
Authorization: Bearer <token>

fileType: pdf1 | pdf2 | xml
```

## Batches

### Create Batch
```http
POST /batches
Authorization: Bearer <token>
Content-Type: application/json

{
  "periodType": "quincenal",
  "periodId": "2024-01",
  "fechaPeriodo": "2024-01-15"
}
```

### Upload ZIP
```http
POST /batches/:id/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <zip file>
```

### List Batches
```http
GET /batches
Authorization: Bearer <token>
```

### Get Batch Detail
```http
GET /batches/:id
Authorization: Bearer <token>
```

### Get Batch Files
```http
GET /batches/:id/files
Authorization: Bearer <token>
```

## Swagger Documentation

Full interactive API docs available at:
```
http://localhost:3000/api/docs
```
