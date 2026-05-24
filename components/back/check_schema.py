from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")

client = MongoClient(MONGODB_URI)
db = client["TPLUsuarios"]
collection = db["DatosUsuario"]
sample = collection.find_one()
print(f"Sample User: {sample}")

db_reportes = client["TPLReportes"]
col_reportes = db_reportes["datosreportes"]
sample_report = col_reportes.find_one()
print(f"Sample Report: {sample_report}")

client.close()
