import os, hashlib, requests
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import logging
from datetime import datetime

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configurar CORS para permitir peticiones desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite todos los orígenes (para desarrollo)
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos (GET, POST, etc.)
    allow_headers=["*"],  # Permite todos los headers
)

API_KEY = os.environ.get("ROBOFLOW_API_KEY", "")

MODEL_ID = "ocean-waste/2"
CONF = int(os.getenv("CONF", "40"))   # 0-100 (bajamos a 40 para más detecciones)
OVER = int(os.getenv("OVER", "50"))   # 0-100

# Importar conexión a MongoDB
try:
    from database import db_connection
    MONGODB_AVAILABLE = True
    logger.info("✅ MongoDB connection module loaded")
except ImportError:
    MONGODB_AVAILABLE = False
    logger.warning("⚠️ MongoDB module not available - reports won't be saved to database")

# Modelos Pydantic
class LocationModel(BaseModel):
    lat: float
    lng: float
    beach_name: str = Field(..., max_length=100)
    sector: Optional[str] = Field(None, max_length=50)

class ReportData(BaseModel):
    report_type: str = Field(..., max_length=20)  # 'general', 'state', 'trash', 'animal'
    msg: str = Field(..., max_length=200)  # Mensaje del reporte - cambiado de 'details' a 'msg'
    beach_name: str = Field(..., max_length=100)
    beach_id: Optional[str] = Field(None, max_length=50)
    location: LocationModel
    image_uri: Optional[str] = None  # URI de la imagen (base64 o URL)
    user_id: Optional[str] = Field(None, max_length=50)
    user_name: Optional[str] = Field("Anonymous", max_length=100)

@app.get("/health")
async def health():
    return {"status": "ok", "model": MODEL_ID}

@app.post("/scan")
async def scan(request: Request):
    # Leer el cuerpo raw (tal cual lo manda el frontend)
    body_bytes = await request.body()
    
    if not body_bytes:
        logger.error("Empty image received")
        raise HTTPException(400, "Imagen vacía")
    
    logger.info(f"Received request body size: {len(body_bytes)} bytes")
    
    # El frontend manda datos base64 crudos. 
    # Roboflow acepta eso tal cual.
    img = body_bytes
    
    # Determinar mime type (default jpeg si no se puede adivinar fácil)
    # En este caso, lo tratamos como bytes crudos para reenviar a Roboflow.
    # Roboflow infiere el tipo o acepta base64 puro.
    
    # Header del request original
    content_type = request.headers.get("content-type", "")
    logger.info(f"Incoming Content-Type: {content_type}")
    
    logger.info(f"Sending to Roboflow...")
    
    # Log de envío
    logger.info(f"Sending to Roboflow directly (proxy pass-through)")
    
    try:
        url = f"https://serverless.roboflow.com/{MODEL_ID}"
        
        # Enviamos el body tal cual arrivó (base64 string)
        r = requests.post(
            url,
            params={"api_key": API_KEY, "confidence": CONF, "overlap": OVER},
            data=img,  # Usamos 'data' para enviar el body raw, no 'files'
            headers={"Content-Type": "application/x-www-form-urlencoded"}, # Replicamos header
            timeout=30,
        )
        
        logger.info(f"Roboflow response status: {r.status_code}")
        logger.info(f"Roboflow response: {r.text[:500] if r.text else 'empty'}")
        
        if r.status_code != 200:
            raise HTTPException(502, f"Roboflow {r.status_code}: {r.text}")
        
        data = r.json()
        preds = data.get("predictions", []) or []
        
        logger.info(f"Found {len(preds)} predictions")
        
        counts = {}
        for p in preds:
            cls = p.get("class")
            if cls:
                counts[cls] = counts.get(cls, 0) + 1
        
        return {
            "image_sha256": hashlib.sha256(img).hexdigest(),
            "counts": counts,
            "predictions": preds,
        }
    except requests.exceptions.Timeout:
        logger.error("Roboflow request timed out")
        raise HTTPException(504, "Timeout al conectar con Roboflow")
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(500, f"Error interno: {str(e)}")


# ========== ENDPOINTS DE REPORTES ==========

@app.post("/api/reports")
async def save_report(report: ReportData):
    """
    Guardar un nuevo reporte de usuario en MongoDB
    
    Endpoint para guardar reportes de playas con detalles de ubicación,
    tipo de reporte e imagen opcional.
    
    La base de datos es: tplreportes
    La colección es: datosreportes
    """
    try:
        if not MONGODB_AVAILABLE:
            raise HTTPException(503, "Base de datos no disponible")
        
        # Convertir el modelo Pydantic a dict
        report_dict = report.dict()
        
        # Convertir LocationModel a dict y crear coordinates para index geoespacial
        location_dict = report.location.dict()
        report_dict["location"] = location_dict
        report_dict["coordinates"] = [report.location.lng, report.location.lat]  # [lng, lat] para index 2d
        
        # Agregar metadata
        report_dict["saved_at"] = datetime.utcnow().isoformat()
        report_dict["status"] = "pending"  # pending, validated, rejected
        
        # Guardar en MongoDB
        report_id = db_connection.insert_report(report_dict)
        
        logger.info(f"✅ Reporte guardado exitosamente - ID: {report_id}")
        
        return {
            "success": True,
            "message": "Reporte guardado exitosamente",
            "report_id": report_id,
            "timestamp": datetime.utcnow().isoformat(),
            "beach": report.beach_name,
            "type": report.report_type
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error guardando reporte: {str(e)}")
        raise HTTPException(500, f"Error al guardar reporte: {str(e)}")


@app.get("/api/reports/beach/{beach_name}")
async def get_beach_reports(beach_name: str, limit: int = 50):
    """
    Obtener todos los reportes de una playa específica
    
    Query params:
    - limit: cantidad máxima de reportes a retornar (default: 50)
    """
    try:
        if not MONGODB_AVAILABLE:
            raise HTTPException(503, "Base de datos no disponible")
        
        reports = db_connection.get_reports_by_beach(beach_name, limit)
        
        # Convertir ObjectId a string para JSON
        for report in reports:
            report["_id"] = str(report["_id"])
        
        logger.info(f"📊 Se obtuvieron {len(reports)} reportes de {beach_name}")
        
        return {
            "success": True,
            "beach": beach_name,
            "count": len(reports),
            "reports": reports
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error obteniendo reportes: {str(e)}")
        raise HTTPException(500, f"Error al obtener reportes: {str(e)}")


@app.get("/api/reports")
async def get_all_reports(limit: int = 100):
    """
    Obtener todos los reportes del sistema
    
    Query params:
    - limit: cantidad máxima de reportes a retornar (default: 100)
    """
    try:
        if not MONGODB_AVAILABLE:
            raise HTTPException(503, "Base de datos no disponible")
        
        reports = db_connection.get_all_reports(limit)
        
        # Convertir ObjectId a string para JSON
        for report in reports:
            report["_id"] = str(report["_id"])
        
        logger.info(f"📊 Se obtuvieron {len(reports)} reportes totales")
        
        return {
            "success": True,
            "count": len(reports),
            "reports": reports
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error obteniendo reportes: {str(e)}")
        raise HTTPException(500, f"Error al obtener reportes: {str(e)}")


@app.get("/api/beaches")
async def get_beaches():
    """
    Obtener todas las playas de TPLPlayas > DatosPlaya
    """
    try:
        if not MONGODB_AVAILABLE:
            raise HTTPException(503, "Base de datos no disponible")
        
        beaches = db_connection.get_all_beaches()
        
        # Convertir ObjectId a string para JSON
        for beach in beaches:
            beach["_id"] = str(beach["_id"])
        
        logger.info(f"🏖️ Se obtuvieron {len(beaches)} playas")
        
        return {
            "success": True,
            "count": len(beaches),
            "beaches": beaches
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error obteniendo playas: {str(e)}")
        raise HTTPException(500, f"Error al obtener playas: {str(e)}")

@app.get("/api/reports/status")
async def get_database_status():
    """
    Obtener estado de la conexión a la base de datos
    """
    return {
        "mongodb_available": MONGODB_AVAILABLE,
        "database": "tplreportes",
        "collection": "datosreportes",
        "timestamp": datetime.utcnow().isoformat()
    }
