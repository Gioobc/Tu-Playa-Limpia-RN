from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")

client = MongoClient(MONGODB_URI)

print("--- USERS ---")
db = client["TPLUsuarios"]
collection = db["DatosUsuario"]
print(f"Count: {collection.count_documents({})}")
for user in collection.find().limit(2):
    print(user)

print("\n--- REPORTS ---")
db_reportes = client["TPLReportes"]
col_reportes = db_reportes["datosreportes"]
print(f"Count: {col_reportes.count_documents({})}")
for report in col_reportes.find().limit(2):
    print(report)

print("\n--- BEACHES ---")
db_playas = client["TPLPlayas"]
col_playas = db_playas["DatosPlaya"]
print(f"Count: {col_playas.count_documents({})}")
for beach in col_playas.find().limit(2):
    print(beach)

client.close()
