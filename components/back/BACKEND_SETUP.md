# 📚 Backend Tu Playa Limpia - Guía de Instalación y Uso

## 🚀 Configuración Rápida

### 1️⃣ Instalar Dependencias

```bash
cd components/back
pip install -r requirements.txt
```

### 2️⃣ Configurar Variables de Entorno

Crear un archivo `.env` en la carpeta `components/back/`:

```env
MONGODB_URI=mongodb+srv://USUARIO:PASSWORD@cluster.mongodb.net/DATABASE
DATABASE_NAME=tplreportes
API_PORT=8000
ROBOFLOW_API_KEY=tu_clave_api
ROBOFLOW_WORKSPACE=chakaloca000-gmail-com
ROBOFLOW_WORKFLOW=beach-debris-v1-logic
ROBOFLOW_MODEL=beach-debris-subok/1
```

### 3️⃣ Ejecutar el Servidor

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

El servidor estará disponible en: `http://localhost:8000`

---

## 📡 Endpoints Disponibles

### Health Check
```
GET /health
```
Verifica que el servidor está funcionando.

---

### Guardar Reporte (MongoDB)
```
POST /api/reports
Content-Type: application/json

{
  "report_type": "trash",  // varchar(20)
  "msg": "Se encontró mucha basura en la arena",  // varchar(200) - CAMBIADO de 'details'
  "beach_name": "Playa Miramar",  // varchar(100)
  "beach_id": "beach_001",  // varchar(50) - opcional
  "location": {
    "lat": 10.2345,
    "lng": -75.5432,
    "beach_name": "Playa Miramar",  // varchar(100)
    "sector": "Sector Norte"  // varchar(50) - opcional
  },
  "image_uri": "base64_encoded_image_or_url",  // opcional
  "user_id": "user_123",  // varchar(50) - opcional
  "user_name": "John Doe"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Reporte guardado exitosamente",
  "report_id": "507f1f77bcf86cd799439011",
  "timestamp": "2024-04-23T10:30:00.000Z",
  "beach": "Playa Miramar",
  "type": "trash"
}
```

---

### Obtener Reportes de una Playa
```
GET /api/reports/beach/{beach_name}?limit=50
```

**Ejemplo:**
```
GET /api/reports/beach/Playa%20Miramar?limit=50
```

**Respuesta:**
```json
{
  "success": true,
  "beach": "Playa Miramar",
  "count": 5,
  "reports": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "report_type": "trash",
      "details": "Se encontró mucha basura...",
      "beach_name": "Playa Miramar",
      "location": {...},
      "timestamp": "2024-04-23T10:30:00.000Z",
      "status": "pending"
    }
  ]
}
```

---

### Obtener Todos los Reportes
```
GET /api/reports?limit=100
```

---

### Estado de la Base de Datos
```
GET /api/reports/status
```

**Respuesta:**
```json
{
  "mongodb_available": true,
  "database": "tplreportes",
  "collection": "datosreportes",
  "timestamp": "2024-04-23T10:30:00.000Z"
}
```

---

## 🗄️ Estructura MongoDB

**Base de Datos:** `tplreportes`
**Colección:** `datosreportes`

### Campos de un Reporte:
```json
{
  "_id": ObjectId,
  "report_type": "trash|general|state|animal",
  "details": "Descripción del reporte",
  "beach_name": "Nombre de la playa",
  "beach_id": "ID de la playa (opcional)",
  "location": {
    "lat": 10.2345,
    "lng": -75.5432,
    "beach_name": "Playa Miramar",
    "sector": "Sector Norte"
  },
  "image_uri": "base64_string",
  "user_id": "user_123",
  "user_name": "John Doe",
  "timestamp": ISODate,
  "created_at": "2024-04-23T10:30:00.000Z",
  "status": "pending|validated|rejected"
}
```

---

## 🔧 Troubleshooting

### Error: "MongoDB connection failed"
- Verifica que la URL de MongoDB en `.env` sea correcta
- Comprueba que tienes conexión a internet
- Asegúrate de que el cluster en MongoDB Atlas está activo

### Error: "ROBOFLOW_API_KEY not found"
- Configura la variable en `.env` (es opcional para reportes básicos)

### Error: "Port 8000 already in use"
```bash
# Cambia el puerto:
python -m uvicorn main:app --reload --port 8001
```

---

## 📱 Integración con Frontend (React Native)

### En ReportModal.js, actualiza la URL del API:

```javascript
const API_URL = Platform.OS === 'web' 
    ? 'http://localhost:8000' 
    : 'http://192.168.1.100:8000'; // Cambia a tu IP local
```

El ReportModal automáticamente:
1. Recopila los datos del reporte
2. Obtiene la ubicación actual
3. Convierte la imagen a base64
4. Envía todo al servidor
5. Guarda en MongoDB

---

## 🚀 Deployment

### Opción 1: Render.com
1. Crear cuenta en render.com
2. Conectar repositorio de GitHub
3. Desplegar como "Web Service"
4. Configurar variables de entorno

### Opción 2: Railway.app
1. Conectar repositorio
2. Auto-detecta Dockerfile/requirements.txt
3. Desplegar automáticamente

### Opción 3: Heroku (Legacy)
```bash
git push heroku main
```

---

## 📊 Monitoring

Para ver los logs en tiempo real:
```bash
tail -f server.log
```

Para ver estado de MongoDB:
```bash
curl http://localhost:8000/api/reports/status
```

---

## 🛠️ Desarrollo

### Modo debug:
```bash
LOGLEVEL=DEBUG python -m uvicorn main:app --reload
```

### Con archivo de log:
```bash
python -m uvicorn main:app --reload > server.log 2>&1 &
```

---

**¿Problemas?** Revisa los logs del servidor para más detalles.
