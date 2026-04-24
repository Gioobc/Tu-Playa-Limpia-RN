# 🌊 Tu Playa Limpia - Integración MongoDB y Backend

## ✅ ¿Qué se implementó?

### 1. **Backend Python con FastAPI** (`components/back/`)
   - ✅ Conexión a MongoDB con cluster: `mongodb+srv://hola:hola123456@cluster0.uc0vvkm.mongodb.net/`
   - ✅ Database: `tplreportes`
   - ✅ Collection: `datosreportes`
   - ✅ 4 endpoints principales para manejar reportes

### 2. **Módulos Backend**
   
   **config.py**: Configuración centralizada de MongoDB, servidor y APIs
   ```python
   - MONGODB_URI
   - DATABASE_NAME = "tplreportes"
   - REPORTS_COLLECTION = "datosreportes"
   ```
   
   **database.py**: Clase MongoDBConnection con métodos para:
   ```python
   - insert_report() - Guardar reportes
   - get_reports_by_beach() - Obtener por playa
   - get_all_reports() - Obtener todos
   - _create_indexes() - Optimización de queries
   ```

   **main.py**: Endpoints FastAPI
   - `POST /api/reports` - Guardar reporte
   - `GET /api/reports/beach/{beach_name}` - Obtener por playa
   - `GET /api/reports` - Obtener todos
   - `GET /api/reports/status` - Estado de BD

### 3. **Frontend React Native** (ReportModal.js)
   - ✅ Formulario de reportes actualizado
   - ✅ Envío de datos al backend (JSON)
   - ✅ Conversión de imagen a base64
   - ✅ Obtención de ubicación GPS
   - ✅ Estados de carga y errores
   - ✅ Mensajes de éxito/error

---

## 🚀 Pasos de Instalación

### Paso 1: Instalar Dependencias del Backend

```bash
cd components/back
pip install -r requirements.txt
```

**Dependencias instaladas:**
- fastapi
- uvicorn
- requests
- python-multipart
- pymongo (MongoDB)
- python-dotenv
- python-jose
- pydantic

### Paso 2: Verificar/Actualizar .env

Archivo: `components/back/.env`

```env
MONGODB_URI=mongodb+srv://hola:hola123456@cluster0.uc0vvkm.mongodb.net/
API_HOST=0.0.0.0
API_PORT=8000
ROBOFLOW_API_KEY=your_api_key_here
```

✅ Ya está creado con los datos de MongoDB

### Paso 3: Iniciar el Servidor Backend

```bash
cd components/back
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Salida esperada:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
✅ Conectado a MongoDB - DB: tplreportes
📊 Índices de MongoDB creados exitosamente
```

---

## 📱 Configuración en Frontend

### En `components/ReportModal.js`, línea 15:

```javascript
// Cambiar según tu ambiente:
const API_URL = Platform.OS === 'web' 
    ? 'http://localhost:8000'           // Para web/emulador
    : 'http://192.168.1.100:8000';      // Para físico - CAMBIAR A TU IP
```

**Cómo obtener tu IP:**
```bash
# Windows
ipconfig

# macOS/Linux
ifconfig | grep inet
```

---

## 🧪 Prueba los Endpoints

### Opción 1: Script Python (Recomendado)

```bash
cd components/back
python test_api.py
```

Esto probará:
- ✅ Health check
- ✅ Conexión a MongoDB
- ✅ Guardar reporte de prueba
- ✅ Obtener reportes por playa
- ✅ Obtener todos los reportes

### Opción 2: cURL

```bash
# Health check
curl http://localhost:8000/health

# Estado de BD
curl http://localhost:8000/api/reports/status

# Guardar reporte
curl -X POST http://localhost:8000/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "report_type": "trash",
    "details": "Prueba de reporte",
    "beach_name": "Playa Miramar",
    "location": {"lat": 10.23, "lng": -75.54, "beach_name": "Playa Miramar", "sector": "General"},
    "user_name": "Test User"
  }'

# Obtener reportes
curl http://localhost:8000/api/reports?limit=10
```

### Opción 3: Postman

1. Descargar Postman (https://www.postman.com/downloads/)
2. Importar colección (crear manualmente o usar SAMPLE_REQUESTS.json)
3. Hacer requests a los endpoints

---

## 📊 Estructura de Datos en MongoDB

### Documento Guardado:
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "report_type": "trash",
  "details": "Se encontró mucha basura plástica...",
  "beach_name": "Playa Miramar",
  "beach_id": "beach_001",
  "location": {
    "lat": 10.2345678,
    "lng": -75.5432109,
    "beach_name": "Playa Miramar",
    "sector": "Sector Norte"
  },
  "image_uri": "base64_encoded_image_string",
  "user_id": "user_123",
  "user_name": "Carlos García",
  "timestamp": ISODate("2024-04-23T10:30:45.123Z"),
  "created_at": "2024-04-23T10:30:45.123Z",
  "status": "pending|validated|rejected",
  "saved_at": "2024-04-23T10:30:45.678Z"
}
```

Ver ejemplo: `components/back/SAMPLE_REPORTS.json`

---

## 🔄 Flujo Completo de un Reporte

```
Usuario en App
    ↓
Abre ReportModal
    ↓
Selecciona tipo, detalles, imagen
    ↓
Presiona "Enviar Reporte"
    ↓
ReportModal recopila datos:
  - Tipo de reporte
  - Detalles
  - Ubicación GPS actual
  - Imagen → Base64
    ↓
POST http://localhost:8000/api/reports
    ↓
FastAPI Backend recibe JSON
    ↓
database.py valida y procesa
    ↓
MongoDB guarda en:
  Database: tplreportes
  Collection: datosreportes
    ↓
Respuesta exitosa con ID del reporte
    ↓
App muestra "✅ Reporte enviado exitosamente"
```

---

## 📁 Archivos Creados/Modificados

### Creados:
- ✅ `components/back/config.py` - Configuración
- ✅ `components/back/database.py` - Conexión MongoDB
- ✅ `components/back/.env` - Variables de entorno
- ✅ `components/back/BACKEND_SETUP.md` - Guía detallada
- ✅ `components/back/SAMPLE_REPORTS.json` - Ejemplos de datos
- ✅ `components/back/test_api.py` - Script de pruebas
- ✅ `MONGODB_SETUP.md` - Este documento

### Modificados:
- ✅ `components/back/requirements.txt` - Agregadas dependencias
- ✅ `components/back/main.py` - 4 nuevos endpoints + imports
- ✅ `components/ReportModal.js` - Lógica de envío al backend

---

## 🛠️ Troubleshooting

### Error: "ModuleNotFoundError: No module named 'pymongo'"
```bash
pip install pymongo
```

### Error: "MongoDB connection failed"
**Verificar:**
1. Conexión a internet ✅
2. URL correcta en `.env` ✅
3. Cluster activo en MongoDB Atlas ✅
4. IP/Firewall permite conexiones

### Error: "Connection refused" en Frontend
**Verificar:**
1. Backend está ejecutándose ✅
2. IP correcta en ReportModal.js ✅
3. Puerto 8000 está libre ✅
4. CORS habilitado (ya está en main.py) ✅

### Error: "Port 8000 already in use"
```bash
# Cambiar puerto en .env o comando:
python -m uvicorn main:app --reload --port 8001
```

---

## 📈 Próximos Pasos (Opcional)

1. **Autenticación de Usuarios**
   - Implementar JWT tokens
   - Validar usuario antes de guardar

2. **Validación de Reportes**
   - Status: pending → validated/rejected
   - Sistema de votación comunitaria

3. **Dashboard Admin**
   - Ver todos los reportes
   - Filtrar por estado, playa, fecha
   - Exportar a CSV/Excel

4. **Notificaciones**
   - Alertar cuando hay reportes nuevos
   - Notificar cambios de estado

5. **Estadísticas**
   - Gráficos de reportes por playa
   - Análisis de tipos de residuos
   - Heatmaps de contaminación

6. **Integración Roboflow**
   - Analizar imágenes automáticamente
   - Detectar tipo de residuo
   - Validar reporte automáticamente

---

## 📚 Referencias

- **MongoDB**: https://www.mongodb.com/docs/
- **FastAPI**: https://fastapi.tiangolo.com/
- **Pydantic**: https://docs.pydantic.dev/
- **Python requests**: https://docs.python-requests.org/

---

## ✨ Resumen

| Componente | Estado | Ubicación |
|-----------|--------|-----------|
| MongoDB Connection | ✅ | database.py |
| FastAPI Server | ✅ | main.py |
| Config Files | ✅ | config.py, .env |
| React Native Frontend | ✅ | ReportModal.js |
| Testing | ✅ | test_api.py |
| Documentation | ✅ | BACKEND_SETUP.md |
| Sample Data | ✅ | SAMPLE_REPORTS.json |

---

**¡Tu backend está listo para recibir y guardar reportes! 🚀**

Para iniciar:
```bash
cd components/back && python -m uvicorn main:app --reload
```
