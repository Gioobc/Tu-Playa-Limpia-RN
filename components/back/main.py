import os, hashlib, requests, uuid
import bcrypt
from fastapi import FastAPI, UploadFile, File, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import logging
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configurar CORS con mayor flexibilidad para Vercel
# Nota: allow_origins=["*"] no funciona con allow_credentials=True
# Por lo tanto, usamos una lista más amplia o permitimos dinámicamente
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app|https://tuplayalimpia-tpl\.vercel\.app|http://localhost:.*|http://127\.0\.0\.1:.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from dotenv import load_dotenv
# Cargar .env desde la raíz del proyecto (2 niveles arriba)
# override=True: los valores del .env sobreescriben variables de entorno ya seteadas en el OS
import os
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
load_dotenv(os.path.join(project_root, '.env'), override=True)

API_KEY = os.environ.get("ROBOFLOW_API_KEY", "")
BREVO_API_KEY = os.environ.get("BREVO_API_KEY", "")

# Configuración de Roboflow
# Formato modelo directo: project/version (sin workspace)
MODEL_ID  = os.environ.get("ROBOFLOW_MODEL", "beach-debris-ozfdf/1")
WORKSPACE = os.environ.get("ROBOFLOW_WORKSPACE", "")
WORKFLOW  = os.environ.get("ROBOFLOW_WORKFLOW", "")
CONF = int(os.getenv("CONF", "90"))
OVER = int(os.getenv("OVER", "50"))

logger.info(f"[config] MODEL_ID={MODEL_ID} | WORKSPACE='{WORKSPACE}' | WORKFLOW='{WORKFLOW}'")

# Importar conexión a MongoDB
try:
    from database import db_connection
    MONGODB_AVAILABLE = getattr(db_connection, "is_available", False)
    if MONGODB_AVAILABLE:
        logger.info("✅ MongoDB connection module loaded")
    else:
        logger.warning("⚠️ MongoDB module loaded but database is unavailable")
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


class ReportStatusUpdate(BaseModel):
    status: str = Field(..., max_length=20)

class UserBase(BaseModel):
    username: str = Field(..., max_length=60)
    email: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=100)
    initials: Optional[str] = Field(None, max_length=10)
    avatar_url: Optional[str] = None
    tpl_title: Optional[str] = Field(None, max_length=100)
    points: Optional[int] = 0
    level: Optional[int] = 1
    total_scans: Optional[int] = 0
    bottle_scans: Optional[int] = 0
    can_scans: Optional[int] = 0
    plastic_scans: Optional[int] = 0
    has_changed_username: Optional[bool] = False
    has_awarded_profile_visit: Optional[bool] = False
    NFTs: Optional[list] = []

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username: str = Field(..., max_length=60)
    password: str = Field(..., min_length=6)


class AdminLogin(BaseModel):
    username: str = Field(..., max_length=60)
    email: str = Field(..., max_length=100)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


def get_ngrok_url() -> str:
    """Detect dynamic ngrok public URL using local agent API"""
    try:
        response = requests.get("http://127.0.0.1:4040/api/tunnels", timeout=2)
        if response.status_code == 200:
            data = response.json()
            tunnels = data.get("tunnels", [])
            for tunnel in tunnels:
                if tunnel.get("proto") == "https":
                    logger.info(f"✨ Detected active HTTPS ngrok tunnel: {tunnel.get('public_url')}")
                    return tunnel.get("public_url")
            if tunnels:
                logger.info(f"✨ Detected active ngrok tunnel: {tunnels[0].get('public_url')}")
                return tunnels[0].get("public_url")
    except Exception as e:
        logger.warning(f"⚠️ Could not fetch dynamic ngrok URL: {e}")
    # Fallback
    return os.environ.get("NGROK_URL", "http://localhost:8000")


def get_success_html(email: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cuenta Eliminada - Tu Playa Limpia</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
            body {{
                font-family: 'Outfit', sans-serif;
                background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
                color: #f8fafc;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
                box-sizing: border-box;
            }}
            .card {{
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 24px;
                padding: 40px;
                max-width: 500px;
                width: 100%;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0,0,0,0.25);
                animation: fadeInUp 0.6s ease-out;
            }}
            .icon {{
                font-size: 60px;
                margin-bottom: 20px;
                animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s both;
            }}
            h1 {{
                font-size: 28px;
                font-weight: 800;
                margin: 0 0 10px 0;
                color: #ffffff;
            }}
            p {{
                font-size: 16px;
                line-height: 1.6;
                color: #cbd5e1;
                margin: 0 0 24px 0;
            }}
            .email {{
                font-weight: 600;
                color: #2dd4bf;
                background: rgba(45, 212, 191, 0.1);
                padding: 4px 10px;
                border-radius: 8px;
                word-break: break-all;
            }}
            .badge {{
                display: inline-block;
                background: rgba(244, 63, 94, 0.2);
                border: 1px solid rgba(244, 63, 94, 0.3);
                color: #fda4af;
                padding: 6px 16px;
                border-radius: 30px;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 20px;
            }}
            @keyframes fadeInUp {{
                from {{ opacity: 0; transform: translateY(20px); }}
                to {{ opacity: 1; transform: translateY(0); }}
            }}
            @keyframes scaleIn {{
                from {{ transform: scale(0); }}
                to {{ transform: scale(1); }}
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="icon">🗑️</div>
            <div class="badge">Acción Confirmada</div>
            <h1>Cuenta Eliminada</h1>
            <p>La cuenta asociada al correo <span class="email">{email}</span> ha sido eliminada de nuestra base de datos de manera definitiva.</p>
            <p>Las sesiones activas en cualquier dispositivo se cerrarán automáticamente en los próximos segundos.</p>
        </div>
    </body>
    </html>
    """


def get_error_html(message: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error - Tu Playa Limpia</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
            body {{
                font-family: 'Outfit', sans-serif;
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                color: #f8fafc;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
                box-sizing: border-box;
            }}
            .card {{
                background: rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                padding: 40px;
                max-width: 500px;
                width: 100%;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                animation: fadeInUp 0.6s ease-out;
            }}
            .icon {{
                font-size: 60px;
                margin-bottom: 20px;
            }}
            h1 {{
                font-size: 28px;
                font-weight: 800;
                margin: 0 0 10px 0;
                color: #f1f5f9;
            }}
            p {{
                font-size: 16px;
                line-height: 1.6;
                color: #94a3b8;
                margin: 0 0 24px 0;
            }}
            .badge {{
                display: inline-block;
                background: rgba(239, 68, 68, 0.15);
                border: 1px solid rgba(239, 68, 68, 0.3);
                color: #fca5a5;
                padding: 6px 16px;
                border-radius: 30px;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 20px;
            }}
            @keyframes fadeInUp {{
                from {{ opacity: 0; transform: translateY(20px); }}
                to {{ opacity: 1; transform: translateY(0); }}
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="icon">⚠️</div>
            <div class="badge">Error de Solicitud</div>
            <h1>No se pudo procesar</h1>
            <p>{message}</p>
        </div>
    </body>
    </html>
    """


@app.get("/")
async def root():
    return {
        "message": "Tu Playa Limpia API is running",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "ok", "model": MODEL_ID}

def send_welcome_email(email: str, username: str):
    if not email:
        logger.warning("⚠️ No email address provided for welcome notification")
        return
    
    # Detect public ngrok tunnel URL and generate deletion token
    ngrok_url = get_ngrok_url()
    token = hashlib.sha256(f"{email}-tpl-delete-secret-key-2026".encode()).hexdigest()
    delete_url = f"{ngrok_url}/api/users/delete-by-email?email={email}&token={token}"
    
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
        "accept": "application/json"
    }
    payload = {
        "sender": {
            "name": "Tu Playa Limpia",
            "email": "bmmvf29s6k@privaterelay.appleid.com"
        },
        "to": [
            {
                "email": email,
                "name": username
            }
        ],
        "subject": "¡Bienvenido a Tu Playa Limpia!",
        "htmlContent": f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f6;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7f6; padding: 20px;">
                    <tr>
                        <td>
                            <table align="center" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                                <tr>
                                    <td align="center" style="padding-bottom: 20px;">
                                        <h1 style="color: #0d9488; margin: 0; font-size: 26px; font-weight: 800;">Tu Playa Limpia</h1>
                                        <p style="color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; margin: 5px 0 0 0; font-weight: 600;">Cuidando nuestras costas</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="font-size: 16px; color: #334155; line-height: 1.8;">
                                        <p style="margin-top: 0;">¡Hola <strong>{username}</strong>!</p>
                                        <p>¡Felicidades! Tu cuenta ha sido creada exitosamente en <strong>Tu Playa Limpia</strong>.</p>
                                        <p>Estamos muy entusiasmados de tenerte en nuestro equipo. Cada acción cuenta, y juntos lograremos preservar y limpiar nuestros hermosos ecosistemas costeros.</p>
                                        <p>Con tu nueva cuenta, ya puedes empezar a:</p>
                                        <ul style="padding-left: 20px; color: #475569;">
                                            <li>Escanear y clasificar residuos plásticos y latas con nuestra cámara inteligente.</li>
                                            <li>Ganar puntos <strong>TPL</strong> e intercambiarlos.</li>
                                            <li>Coleccionar <strong>NFTs ecológicos</strong> que demuestran tu impacto positivo directo.</li>
                                            <li>Consultar el estado ecológico de las playas y participar en actividades locales.</li>
                                        </ul>
                                        <p>¡Gracias por dar el primer paso hoy para un océano y playas más limpias!</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-top: 20px; padding-bottom: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; line-height: 1.6;">
                                        <p style="margin: 0; font-weight: 600; color: #dc2626;">¿No has creado esta cuenta?</p>
                                        <p style="margin: 5px 0 15px 0;">Si otra persona usó tu dirección de correo electrónico por error o sin tu consentimiento, puedes eliminar la cuenta inmediatamente y cerrar cualquier sesión activa haciendo clic en el botón de abajo:</p>
                                        <div align="center">
                                            <a href="{delete_url}" style="background-color: #dc2626; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 14px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.15);">No he sido yo - Eliminar Cuenta</a>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 30px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
                                        <p style="margin: 0;">Este correo electrónico se envió automáticamente desde Tu Playa Limpia.</p>
                                        <p style="margin: 5px 0 0 0;">Por favor, no respondas directamente a este mensaje.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
        </html>
        """
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        if response.status_code in [200, 201, 202]:
            logger.info(f"✅ Welcome email sent successfully to {email} (Status: {response.status_code})")
        else:
            logger.error(f"❌ Failed to send welcome email to {email}. Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        logger.error(f"❌ Exception occurred while sending welcome email: {str(e)}")


@app.post("/api/users/register")
async def register_user(user: UserCreate, background_tasks: BackgroundTasks):
    """Registrar un usuario nuevo en MongoDB con contraseña hasheada."""
    try:
        if not MONGODB_AVAILABLE:
            raise HTTPException(503, "Base de datos no disponible")

        existing = db_connection.find_user_by_username(user.username)
        if existing:
            raise HTTPException(409, "El nombre de usuario ya está en uso")

        # Excluir password y campos nulos para evitar conflictos con índices únicos sparse (como 'address')
        user_data = user.dict(exclude={"password"}, exclude_none=True)
        user_data["_id"] = str(uuid.uuid4())
        user_data["password_hash"] = hash_password(user.password)
        user_data["join_date"] = datetime.utcnow().isoformat()
        user_data["created_at"] = datetime.utcnow().isoformat()

        user_id = db_connection.insert_user(user_data)

        # Enviar correo de bienvenida si se proporcionó un email
        if user.email:
            background_tasks.add_task(send_welcome_email, user.email, user.username)

        return {
            "success": True,
            "message": "Usuario registrado correctamente",
            "user_id": user_id,
            "username": user.username
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error registrando usuario: {str(e)}")
        raise HTTPException(500, f"Error al registrar usuario: {str(e)}")

@app.post("/api/users/login")
async def login_user(credentials: UserLogin):
    """Verificar credenciales de usuario y devolver datos básicos sin contraseña."""
    try:
        if not MONGODB_AVAILABLE:
            raise HTTPException(503, "Base de datos no disponible")

        user_doc = db_connection.find_user_by_username(credentials.username)
        if not user_doc or not verify_password(credentials.password, user_doc.get("password_hash", "")):
            raise HTTPException(401, "Credenciales inválidas")

        user_doc.pop("password_hash", None)
        if "_id" in user_doc:
            user_doc["_id"] = str(user_doc["_id"])

        return {
            "success": True,
            "message": "Inicio de sesión exitoso",
            "user": user_doc
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error en login de usuario: {str(e)}")
        raise HTTPException(500, f"Error al iniciar sesión: {str(e)}")


@app.post("/api/users/admin-login")
async def admin_login(credentials: AdminLogin):
    """Verificar nombre de usuario de administrador y devolver datos básicos sin contraseña."""
    try:
        if not MONGODB_AVAILABLE:
            raise HTTPException(503, "Base de datos no disponible")

        # Buscamos al usuario por username
        user_doc = db_connection.find_user_by_username(credentials.username)
        if not user_doc or user_doc.get("email") != "admintpl@tpl.mainadmin" or credentials.email.strip().lower() != "admintpl@tpl.mainadmin":
            raise HTTPException(401, "Acceso denegado: Credenciales de administrador incorrectas")

        user_doc.pop("password_hash", None)
        if "_id" in user_doc:
            user_doc["_id"] = str(user_doc["_id"])

        return {
            "success": True,
            "message": "Inicio de sesión de administrador exitoso",
            "user": user_doc
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error en login de administrador: {str(e)}")
        raise HTTPException(500, f"Error al iniciar sesión de administrador: {str(e)}")


@app.put("/api/users/{user_id}")
async def update_user(user_id: str, updates: dict):
    """Actualizar campos del usuario (avatar_url, nombre, puntos, etc.)"""
    try:
        if not MONGODB_AVAILABLE:
            raise HTTPException(503, "Base de datos no disponible")

        # Campos permitidos para actualizar
        allowed_fields = {
            "avatar_url", "username", "email", "tpl_title", "points", "level",
            "total_scans", "bottle_scans", "can_scans", "plastic_scans", "has_changed_username",
            "has_awarded_profile_visit", "initials", "address", "NFTs",
            # Campos de playa asociada al escaneo
            "last_scanned_beach_id", "last_scanned_beach_name",
        }
        
        # Filtrar solo campos permitidos
        filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
        
        if not filtered_updates:
            raise HTTPException(400, "No valid fields to update")

        if "address" in filtered_updates and filtered_updates["address"]:
            existing_address_user = db_connection.find_user_by_address(filtered_updates["address"])
            if existing_address_user and existing_address_user.get("_id") != user_id:
                raise HTTPException(409, "La address ya está asociada a otra cuenta")

        filtered_updates["updated_at"] = datetime.utcnow().isoformat()
        
        db_connection.update_user(user_id, filtered_updates)
        
        # Obtener el usuario actualizado
        updated_user = db_connection.find_user_by_id(user_id)
        if updated_user:
            updated_user.pop("password_hash", None)
            if "_id" in updated_user:
                updated_user["_id"] = str(updated_user["_id"])
        
        return {
            "success": True,
            "message": "Usuario actualizado correctamente",
            "user": updated_user
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error actualizando usuario: {str(e)}")
        raise HTTPException(500, f"Error al actualizar usuario: {str(e)}")


@app.get("/api/users/address/{address}")
async def get_user_by_address(address: str):
    """Obtener un usuario por address de wallet."""
    try:
        if not MONGODB_AVAILABLE:
            raise HTTPException(503, "Base de datos no disponible")

        user_doc = db_connection.find_user_by_address(address)
        if not user_doc:
            raise HTTPException(404, "Usuario no encontrado")

        user_doc.pop("password_hash", None)
        if "_id" in user_doc:
            user_doc["_id"] = str(user_doc["_id"])

        return {
            "success": True,
            "user": user_doc
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error consultando usuario por address: {str(e)}")
        raise HTTPException(500, f"Error al consultar usuario por address: {str(e)}")


@app.delete("/api/users/{user_id}")
async def delete_user_by_id(user_id: str):
    """Eliminar definitivamente una cuenta por id."""
    try:
        if not MONGODB_AVAILABLE:
            raise HTTPException(503, "Base de datos no disponible")

        deleted = db_connection.delete_user_by_id(user_id)
        if not deleted:
            raise HTTPException(404, "Usuario no encontrado")

        return {
            "success": True,
            "message": "Usuario eliminado correctamente"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error eliminando usuario por id: {str(e)}")
        raise HTTPException(500, f"Error al eliminar usuario: {str(e)}")

@app.get("/api/users/status/{user_id}")
async def get_user_status(user_id: str):
    """Verificar si un usuario existe y su estado. Retorna 404 si fue eliminado."""
    try:
        if not MONGODB_AVAILABLE:
            raise HTTPException(503, "Base de datos no disponible")
            
        user_doc = db_connection.find_user_by_id(user_id)
        if not user_doc:
            raise HTTPException(404, "Usuario no encontrado")
            
        return {
            "success": True,
            "exists": True,
            "username": user_doc.get("username")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error consultando estado de usuario: {str(e)}")
        raise HTTPException(500, f"Error interno: {str(e)}")


@app.get("/api/users/delete-by-email", response_class=HTMLResponse)
async def delete_user_by_email_endpoint(email: str, token: str):
    """Endpoint para eliminar cuenta desde el correo de confirmación."""
    try:
        if not MONGODB_AVAILABLE:
            return HTMLResponse(
                content=get_error_html("Base de datos no disponible temporalmente. Inténtalo de nuevo más tarde."),
                status_code=503
            )
            
        # Validar token
        expected_token = hashlib.sha256(f"{email}-tpl-delete-secret-key-2026".encode()).hexdigest()
        if token != expected_token:
            return HTMLResponse(
                content=get_error_html("El enlace de eliminación no es válido o ha expirado."),
                status_code=400
            )
            
        # Buscar y eliminar usuario
        user_doc = db_connection.find_user_by_email(email)
        if not user_doc:
            return HTMLResponse(
                content=get_error_html("No se encontró ninguna cuenta asociada a este correo electrónico."),
                status_code=404
            )
            
        # Eliminar
        deleted = db_connection.delete_user_by_email(email)
        if deleted:
            return HTMLResponse(
                content=get_success_html(email),
                status_code=200
            )
        else:
            return HTMLResponse(
                content=get_error_html("No se pudo eliminar la cuenta. Por favor contáctanos."),
                status_code=500
            )
    except Exception as e:
        logger.error(f"❌ Error en eliminación de usuario: {str(e)}")
        return HTMLResponse(
            content=get_error_html(f"Error interno del servidor: {str(e)}"),
            status_code=500
        )


@app.get("/api/users")
async def get_users(limit: int = 50):
    """Obtener todos los usuarios con actividad de escaneo."""
    try:
        if not MONGODB_AVAILABLE:
            raise HTTPException(503, "Base de datos no disponible")

        users = db_connection.get_all_users(limit)
        
        # Filtrar campos sensibles y convertir ObjectIds
        for user in users:
            user.pop("password_hash", None)
            if "_id" in user:
                user["_id"] = str(user["_id"])
        
        return {
            "success": True,
            "count": len(users),
            "users": users
        }
    except Exception as e:
        logger.error(f"❌ Error obteniendo usuarios: {str(e)}")
        raise HTTPException(500, f"Error al obtener usuarios: {str(e)}")


@app.get("/api/admin/stats")
async def get_admin_stats():
    """Obtener estadísticas globales para el panel de administración."""
    try:
        if not MONGODB_AVAILABLE:
            raise HTTPException(503, "Base de datos no disponible")
        
        stats = db_connection.get_admin_stats()
        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        logger.error(f"❌ Error en endpoint de estadísticas de administración: {str(e)}")
        raise HTTPException(500, f"Error al obtener estadísticas: {str(e)}")


@app.post("/api/users/{user_id}/scan-beach")
async def register_scanned_beach(user_id: str, request: Request):
    """
    Registra una playa escaneada en el historial del usuario usando $addToSet
    para que cada playa ID aparezca solo una vez aunque el usuario escanee varias veces.

    Body JSON esperado:
        { "beach_id": "...", "beach_name": "..." }
    """
    try:
        if not MONGODB_AVAILABLE:
            raise HTTPException(503, "Base de datos no disponible")

        body = await request.json()
        beach_id   = body.get("beach_id")
        beach_name = body.get("beach_name")

        if not beach_id:
            raise HTTPException(400, "Se requiere beach_id")

        collection = db_connection.get_user_collection()
        collection.update_one(
            {"_id": user_id},
            {
                "$addToSet": {
                    "scanned_beaches": {
                        "id":   beach_id,
                        "name": beach_name or beach_id,
                    }
                },
                "$set": {
                    "last_scanned_beach_id":   beach_id,
                    "last_scanned_beach_name": beach_name or beach_id,
                    "updated_at": datetime.utcnow().isoformat(),
                }
            }
        )

        logger.info(f"[scan-beach] Usuario {user_id} registró escaneo en playa '{beach_name}' ({beach_id})")
        return {"success": True, "beach_id": beach_id, "beach_name": beach_name}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error registrando playa escaneada: {str(e)}")
        raise HTTPException(500, f"Error al registrar playa: {str(e)}")


@app.post("/scan")
async def scan(request: Request):
    """
    Proxy endpoint para Roboflow - soporta modelos directos y workflows.
    Resuelve problemas de CORS al hacer el request desde el backend.
    """
    # Leer el cuerpo raw (tal cual lo manda el frontend)
    body_bytes = await request.body()
    
    if not body_bytes:
        logger.error("Empty image received")
        raise HTTPException(400, "Imagen vacía")
    
    logger.info(f"Received request body size: {len(body_bytes)} bytes")
    
    # Header del request original
    content_type = request.headers.get("content-type", "")
    logger.info(f"Incoming Content-Type: {content_type}")
    
    # Determinar si usar workflow o modelo directo
    use_workflow = WORKSPACE and WORKFLOW
    
    try:
        if use_workflow:
            # Workflow endpoint: JSON con inputs
            url = f"https://serverless.roboflow.com/{WORKSPACE}/workflows/{WORKFLOW}"
            
            # Decodificar base64 si viene como string
            try:
                body_str = body_bytes.decode('utf-8')
                # Limpiar prefijo data:image si existe
                if ',' in body_str:
                    body_str = body_str.split(',')[1]
                base64_data = body_str
            except:
                base64_data = body_bytes.decode('utf-8', errors='ignore')
            
            payload = {
                "api_key": API_KEY,
                "inputs": {
                    "image": {
                        "type": "base64",
                        "value": base64_data
                    }
                }
            }
            
            logger.info(f"Sending to Roboflow workflow: {url}")
            r = requests.post(
                url,
                json=payload,
                timeout=30,
            )
        else:
            # Modelo directo: form-urlencoded (legacy)
            url = f"https://serverless.roboflow.com/{MODEL_ID}"
            img = body_bytes
            
            logger.info(f"Sending to Roboflow model: {url}")
            r = requests.post(
                url,
                params={"api_key": API_KEY, "confidence": CONF, "overlap": OVER},
                data=img,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=30,
            )
        
        logger.info(f"Roboflow response status: {r.status_code}")
        logger.info(f"Roboflow response: {r.text[:500] if r.text else 'empty'}")
        
        if r.status_code != 200:
            raise HTTPException(502, f"Roboflow {r.status_code}: {r.text}")
        
        data = r.json()
        
        # Extraer predicciones según el formato de respuesta
        if use_workflow:
            # Workflows retornan array de resultados
            if isinstance(data, list) and len(data) > 0:
                first_result = data[0]
                if isinstance(first_result, dict):
                    preds = first_result.get("predictions", []) or first_result.get("detections", [])
                else:
                    preds = []
            else:
                preds = []
        else:
            # Modelo directo legacy
            preds = data.get("predictions", []) or []
        
        logger.info(f"Found {len(preds)} predictions")
        
        counts = {}
        for p in preds:
            cls = p.get("class")
            if cls:
                counts[cls] = counts.get(cls, 0) + 1
        
        return {
            "image_sha256": hashlib.sha256(body_bytes).hexdigest(),
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
        report_dict["status"] = "PENDING"
        
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
async def get_all_reports(limit: Optional[int] = None):
    """
    Obtener todos los reportes del sistema
    
    Query params:
    - limit: cantidad máxima de reportes a retornar. Si no se envía, retorna todos.
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


@app.patch("/api/reports/{report_id}/status")
async def update_report_status(report_id: str, payload: ReportStatusUpdate):
    """
    Actualizar el estado de un reporte.
    Estados válidos: PENDING, CONFIRMED, DENIED.
    """
    try:
        if not MONGODB_AVAILABLE:
            raise HTTPException(503, "Base de datos no disponible")

        normalized_status = payload.status.strip().upper()
        if normalized_status not in {"PENDING", "CONFIRMED", "DENIED"}:
            raise HTTPException(400, "Estado de reporte inválido")

        collection = db_connection.get_collection()
        try:
            object_id = ObjectId(report_id)
        except InvalidId:
            raise HTTPException(400, "ID de reporte inválido")

        result = collection.update_one(
            {"_id": object_id},
            {"$set": {"status": normalized_status, "reviewed_at": datetime.utcnow().isoformat()}}
        )

        if result.matched_count == 0:
            raise HTTPException(404, "Reporte no encontrado")

        logger.info(f"✅ Reporte {report_id} actualizado a {normalized_status}")
        return {
            "success": True,
            "report_id": report_id,
            "status": normalized_status,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error actualizando estado del reporte: {str(e)}")
        raise HTTPException(500, f"Error actualizando reporte: {str(e)}")


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


# ──────────────────────────────────────────────────────────────────────────────
# Proxy Roboflow — evita el bloqueo de CORS en modo web
# El navegador no puede llamar directamente a serverless.roboflow.com,
# así que este endpoint actúa de intermediario.
# ──────────────────────────────────────────────────────────────────────────────
class RoboflowScanRequest(BaseModel):
    image: str  # base64 puro, sin prefijo data:image/...


@app.post("/roboflow/scan")
async def roboflow_scan_proxy(payload: RoboflowScanRequest):
    """
    Proxy para Roboflow — evita CORS en modo web.
    - Si WORKSPACE+WORKFLOW están configurados: usa el endpoint de workflow.
    - Si solo MODEL está configurado: usa inferencia directa (modelo).
    Devuelve { predictions: [...] } normalizado para ScanScreen.
    """
    if not API_KEY:
        raise HTTPException(status_code=503, detail="ROBOFLOW_API_KEY no configurada en el servidor.")

    try:
        if WORKSPACE and WORKFLOW:
            # ── Modo Workflow ──────────────────────────────────────────────
            rf_url = f"https://serverless.roboflow.com/{WORKSPACE}/workflows/{WORKFLOW}"
            rf_response = requests.post(
                rf_url,
                json={
                    "api_key": API_KEY,
                    "inputs": {"image": {"type": "base64", "value": payload.image}}
                },
                timeout=20,
            )
        else:
            # ── Modo Modelo Directo (beach-debris-ozfdf/1) ─────────────────
            # La API de inferencia directa de Roboflow recibe:
            # POST /model_id?api_key=KEY  con body = base64 plano
            rf_url = f"https://serverless.roboflow.com/{MODEL_ID}"
            rf_response = requests.post(
                rf_url,
                params={"api_key": API_KEY},
                data=payload.image,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=20,
            )
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Timeout al conectar con Roboflow.")
    except requests.exceptions.RequestException as e:
        logger.error(f"[Roboflow proxy] Error de red: {e}")
        raise HTTPException(status_code=502, detail=f"Error de red al contactar Roboflow: {str(e)}")

    if not rf_response.ok:
        detail = rf_response.text[:300]
        logger.error(f"[Roboflow proxy] HTTP {rf_response.status_code}: {detail}")
        raise HTTPException(
            status_code=502,
            detail=f"Roboflow devolvió {rf_response.status_code}: {detail}"
        )

    rf_data = rf_response.json()

    # Normalizar predicciones según el tipo de respuesta
    predictions = []
    if WORKSPACE and WORKFLOW:
        # Workflow: { outputs: [{ <key>: { predictions: [...] } }] }
        first = None
        if isinstance(rf_data.get("outputs"), list) and rf_data["outputs"]:
            first = rf_data["outputs"][0]
        elif isinstance(rf_data, list) and rf_data:
            first = rf_data[0]
        elif isinstance(rf_data, dict):
            first = rf_data

        if first:
            for val in first.values():
                if isinstance(val, dict) and isinstance(val.get("predictions"), list):
                    predictions = val["predictions"]
                    break
                if isinstance(val, list) and val and isinstance(val[0], dict) and "class" in val[0]:
                    predictions = val
                    break
    else:
        # Inferencia directa: { predictions: [...] }
        predictions = rf_data.get("predictions", [])

    return {"predictions": predictions}


# reload: 17:44:35
