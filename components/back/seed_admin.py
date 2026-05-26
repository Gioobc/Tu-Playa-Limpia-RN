from pymongo import MongoClient
import os
import uuid
import bcrypt
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
if "TPLUsuarios" not in MONGODB_URI and "localhost" in MONGODB_URI:
    # Append default database to URI if not present
    pass

client = MongoClient(MONGODB_URI)
db = client["TPLUsuarios"]
collection = db["DatosUsuario"]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def seed_admin():
    admin_username = "administrador"
    admin_email = "admintpl@tpl.mainadmin"
    
    # Check if admin already exists
    existing = collection.find_one({"username": admin_username})
    if existing:
        print(f"Admin user already exists with ID: {existing['_id']}")
        # Update email just in case
        collection.update_one(
            {"_id": existing["_id"]},
            {"$set": {"email": admin_email}}
        )
        print("Updated existing admin user email to admintpl@tpl.mainadmin")
        return
        
    admin_doc = {
        "_id": str(uuid.uuid4()),
        "username": admin_username,
        "email": admin_email,
        "initials": "AD",
        "avatar_url": None,
        "tpl_title": "Administrador Principal",
        "points": 0,
        "level": 10,  # High level for administrator
        "total_scans": 0,
        "bottle_scans": 0,
        "can_scans": 0,
        "plastic_scans": 0,
        "has_changed_username": False,
        "has_awarded_profile_visit": False,
        "password_hash": hash_password("admin123"),
        "join_date": datetime.utcnow().isoformat(),
        "created_at": datetime.utcnow().isoformat()
    }
    
    result = collection.insert_one(admin_doc)
    print(f"Successfully seeded admin user with ID: {result.inserted_id}")

if __name__ == "__main__":
    try:
        seed_admin()
    except Exception as e:
        print(f"Error seeding admin user: {e}")
    finally:
        client.close()
