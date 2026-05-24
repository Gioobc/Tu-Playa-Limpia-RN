# ⚡ Quick Start - Empezar en 5 minutos

## 1️⃣ Instalar dependencias (1 min)

```bash
cd components/back
pip install -r requirements.txt
```

## 2️⃣ Iniciar el servidor (1 min)

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Esperado:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
✅ Conectado a MongoDB - DB: tplreportes
```

## 3️⃣ Probar (1 min)

```bash
# En otra terminal
python test_api.py
```

## 4️⃣ Configurar Frontend (1 min)

**En `components/ReportModal.js` línea 15:**

```javascript
const API_URL = 'http://localhost:8000'; // Para desarrollo local
```

## 5️⃣ ¡Listo! (1 min)

En tu app, cuando hagas un reporte, se guardará en:
- **Database:** tplreportes
- **Collection:** datosreportes
- **Ubicación:** https://cloud.mongodb.com/

---

## 📋 Verificación Rápida

```bash
# ✅ Backend ejecutándose?
curl http://localhost:8000/health

# ✅ MongoDB conectado?
curl http://localhost:8000/api/reports/status

# ✅ Puedo guardar?
curl -X POST http://localhost:8000/api/reports \
  -H "Content-Type: application/json" \
  -d '{"report_type":"trash","details":"Test","beach_name":"Test Beach","location":{"lat":0,"lng":0,"beach_name":"Test","sector":"Test"},"user_name":"Test"}'
```

---

## 🎯 URL de MongoDB Atlas

Accede a tus reportes aquí:
**https://cloud.mongodb.com/**

- Usuario: Tu email
- Cluster: Cluster0
- DB: tplreportes
- Collection: datosreportes

---

## ⚙️ Configuración Actual

```
✅ MongoDB: mongodb+srv://<username>:<password>@cluster0.uc0vvkm.mongodb.net/
✅ Database: tplreportes
✅ Collection: datosreportes
✅ API Port: 8000
✅ CORS: Habilitado
```

---

## 🐛 Si algo falla

1. **"ModuleNotFoundError"** → `pip install -r requirements.txt`
2. **"MongoDB connection failed"** → Verifica conexión a internet
3. **"Port 8000 in use"** → Cambia puerto: `--port 8001`
4. **"Connection refused"** → Backend no está ejecutándose

---

## 📁 Archivos Importantes

- **Backend:** `components/back/main.py`
- **Config:** `components/back/config.py`
- **Database:** `components/back/database.py`
- **Frontend:** `components/ReportModal.js`
- **Tests:** `components/back/test_api.py`
- **Datos:** `components/back/SAMPLE_REPORTS.json`

---

**¡Eso es todo! Tu backend está listo 🚀**

Para más detalles, ver:
- `MONGODB_SETUP.md` - Guía completa
- `BACKEND_SETUP.md` - Endpoints y configuración
- `MONGODB_VIEW_DATA.md` - Cómo ver los datos
