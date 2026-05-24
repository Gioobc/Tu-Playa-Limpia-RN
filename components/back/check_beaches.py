from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")

client = MongoClient(MONGODB_URI)
db_playas = client["TPLPlayas"]
col_playas = db_playas["DatosPlaya"]

beaches = list(col_playas.find().sort("id", 1))
print(f"Total beaches in database: {len(beaches)}")
for beach in beaches:
    # Print clean representation
    print(f"ID: {beach.get('id')} | Name: {beach.get('name')} | Zone: {beach.get('zone')} | District: {beach.get('district')} | Lat: {beach.get('lat')} | Lng: {beach.get('lng')} | Country: {beach.get('country_code')}")

client.close()
