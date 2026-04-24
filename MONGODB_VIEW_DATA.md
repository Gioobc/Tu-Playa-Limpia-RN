# 📋 Verificar Reportes en MongoDB Atlas

## 🔍 Ver Reportes en la Consola de MongoDB Atlas

### Paso 1: Acceder a MongoDB Atlas

1. Ve a: https://cloud.mongodb.com/
2. Inicia sesión con tus credenciales
3. Selecciona tu cluster "Cluster0"

### Paso 2: Ir a la Colección

1. Click en **"Browse Collections"** en el panel de control
2. Selecciona la base de datos: **tplreportes**
3. Selecciona la colección: **datosreportes**

Verás todos tus reportes guardados! 📊

---

## 🔌 Usar MongoDB Atlas Web UI

### Ver documento individual:
- Click en cualquier documento
- Se despliega todo el contenido en formato JSON

### Filtrar reportes:
```json
// Buscar por playa
{ "beach_name": "Playa Miramar" }

// Buscar por tipo
{ "report_type": "trash" }

// Buscar por estado
{ "status": "pending" }

// Buscar por usuario
{ "user_name": "Carlos García" }

// Buscar por rango de fechas (últimas 24 horas)
{ "timestamp": { "$gte": new Date(Date.now() - 24*60*60*1000) } }
```

### Ordenar resultados:
Click en el encabezado de cualquier columna para ordenar ascendente/descendente

---

## 💻 Usar MongoDB CLI (mongo shell)

### Paso 1: Instalar MongoDB Shell

**En Windows (PowerShell):**
```powershell
# Descargar e instalar
choco install mongosh
```

**En macOS:**
```bash
brew tap mongodb/brew
brew install mongosh
```

**En Linux:**
```bash
curl https://downloads.mongodb.com/compass/mongosh-linux-x64.tgz | tar -xvz
```

### Paso 2: Conectar a tu cluster

```bash
mongosh "mongodb+srv://hola:hola123456@cluster0.uc0vvkm.mongodb.net/tplreportes"
```

### Paso 3: Comandos útiles

```javascript
// Ver todas las bases de datos
show dbs

// Usar base de datos específica
use tplreportes

// Ver colecciones
show collections

// Contar documentos
db.datosreportes.countDocuments()

// Ver todos los reportes
db.datosreportes.find().pretty()

// Ver con límite
db.datosreportes.find().limit(5).pretty()

// Buscar por playa específica
db.datosreportes.find({ "beach_name": "Playa Miramar" }).pretty()

// Buscar por tipo
db.datosreportes.find({ "report_type": "trash" }).pretty()

// Ver solo campos específicos
db.datosreportes.find({}, { "beach_name": 1, "user_name": 1, "timestamp": 1 }).pretty()

// Contar por tipo
db.datosreportes.countDocuments({ "report_type": "trash" })

// Contar por playa
db.datosreportes.countDocuments({ "beach_name": "Playa Miramar" })

// Buscar el reporte más reciente
db.datosreportes.findOne({}, { sort: { "timestamp": -1 } })

// Eliminar un reporte (por ID)
db.datosreportes.deleteOne({ "_id": ObjectId("507f1f77bcf86cd799439011") })

// Actualizar estado de un reporte
db.datosreportes.updateOne(
  { "_id": ObjectId("507f1f77bcf86cd799439011") },
  { $set: { "status": "validated" } }
)

// Ver estadísticas
db.datosreportes.aggregate([
  {
    $group: {
      "_id": "$report_type",
      "count": { $sum: 1 }
    }
  }
])

// Salir
exit
```

---

## 📊 Visualizar Datos con MongoDB Charts (Premium)

Si tu plan lo permite:

1. Ve a **Charts** en MongoDB Atlas
2. Click **"Create a New Chart"**
3. Selecciona **tplreportes.datosreportes**
4. Elige tipo de visualización:
   - Pie Chart: Reportes por tipo
   - Bar Chart: Reportes por playa
   - Line Chart: Reportes en el tiempo
   - Map: Ubicación de reportes

---

## 🔗 Exportar Datos

### Opción 1: Desde MongoDB Atlas UI

1. Abre la colección
2. Click **"..." (tres puntos)**
3. **"Export Collection"**
4. Elige formato: JSON, CSV
5. Descarga el archivo

### Opción 2: Desde MongoDB Shell

```bash
# Exportar a JSON
mongoexport \
  --uri "mongodb+srv://hola:hola123456@cluster0.uc0vvkm.mongodb.net/tplreportes" \
  --collection datosreportes \
  --out reportes.json

# Exportar a CSV
mongoexport \
  --uri "mongodb+srv://hola:hola123456@cluster0.uc0vvkm.mongodb.net/tplreportes" \
  --collection datosreportes \
  --csv \
  --fields beach_name,report_type,user_name,timestamp \
  --out reportes.csv
```

### Opción 3: Con Python

```python
from pymongo import MongoClient
import json

uri = "mongodb+srv://hola:hola123456@cluster0.uc0vvkm.mongodb.net/"
client = MongoClient(uri)
db = client["tplreportes"]
collection = db["datosreportes"]

# Obtener todos los reportes
reportes = list(collection.find())

# Convertir ObjectId a string para JSON
for reporte in reportes:
    reporte["_id"] = str(reporte["_id"])

# Guardar a JSON
with open("reportes.json", "w") as f:
    json.dump(reportes, f, indent=2, default=str)

print("✅ Reportes exportados a reportes.json")
```

---

## 🔐 Backups Automáticos

MongoDB Atlas crea backups automáticos cada 6 horas.

Para restaurar:
1. Ve a **"Backup"** en MongoDB Atlas
2. Elige un punto de restauración
3. Click **"Restore"**

---

## 📈 Monitorear uso

**Comando para ver tamaño de la colección:**

```javascript
use tplreportes
db.datosreportes.stats()
```

**Verás:**
- Número de documentos
- Tamaño total en bytes
- Espacio de índices
- etc.

---

## ⚠️ Tips Importantes

1. **No guardes imágenes base64 si son muy grandes**
   - MongoDB tiene límite de 16MB por documento
   - Considera guardar URLs en lugar de base64

2. **Limpia datos de prueba periódicamente**
   ```javascript
   db.datosreportes.deleteMany({ "user_name": "Test User" })
   ```

3. **Crea backups regulares**
   - MongoDB Atlas lo hace automáticamente

4. **Monitorea el uso de la base de datos**
   - Ve a "Metrics" en MongoDB Atlas

---

## 🔗 Enlaces Útiles

- [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
- [MongoDB Query Language](https://docs.mongodb.com/manual/reference/method/db.collection.find/)
- [MongoDB Aggregation](https://docs.mongodb.com/manual/aggregation/)
- [mongoexport Documentation](https://docs.mongodb.com/database-tools/mongoexport/)

---

¡Listo! Ahora puedes visualizar y gestionar tus reportes en MongoDB 🎉
