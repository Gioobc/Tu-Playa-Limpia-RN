from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")

client = MongoClient(MONGODB_URI)
dbs = client.list_database_names()
print(f"Databases: {dbs}")

for db_name in dbs:
    if db_name in ["admin", "local", "config"]: continue
    db = client[db_name]
    collections = db.list_collection_names()
    print(f"DB: {db_name} -> Collections: {collections}")

client.close()
