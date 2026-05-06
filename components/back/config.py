import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB Configuration
MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://hola:hola123456@cluster0.uc0vvkm.mongodb.net/"
)
DATABASE_NAME = "TPLReportes"  # Existing reports database
REPORTS_COLLECTION = "datosreportes"

# Usuarios DB
USER_DATABASE_NAME = "TPLUsuarios"
USER_COLLECTION = "DatosUsuario"

# Playas DB
BEACHES_DB_NAME = "TPLPlayas"
BEACHES_COLLECTION = "DatosPlaya"

# Server Configuration
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

# API Keys
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "")
