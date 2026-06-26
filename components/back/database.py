import logging
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from config import (
    MONGODB_URI,
    DATABASE_NAME,
    REPORTS_COLLECTION,
    USER_DATABASE_NAME,
    USER_COLLECTION,
    BEACHES_DB_NAME,
    BEACHES_COLLECTION,
)
from datetime import datetime

logger = logging.getLogger(__name__)

class MongoDBConnection:
    _instance = None
    _client = None
    _db = None
    _available = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MongoDBConnection, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if self._client is None:
            self.connect()

    def connect(self):
        """Conectar a MongoDB"""
        try:
            self._client = MongoClient(
                MONGODB_URI,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000,
                retryWrites=True,
                w="majority"
            )
            # Test connection
            self._client.admin.command('ping')
            self._db = self._client[DATABASE_NAME]
            self._available = True
            logger.info(f"✅ Conectado a MongoDB - DB: {DATABASE_NAME}")
            self._create_indexes()
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.error(f"❌ Error conexión MongoDB: {e}")
            self._available = False
            self._client = None
            self._db = None

    def _create_indexes(self):
        """Crear índices para optimizar queries"""
        try:
            reports_collection = self._db[REPORTS_COLLECTION]
            
            # Limpiar índices existentes que puedan causar conflictos
            try:
                reports_collection.drop_index([("location.lat", "2dsphere"), ("location.lng", "2dsphere")])
                logger.info("🗑️ Índice geoespacial antiguo eliminado")
            except:
                pass  # Index might not exist
            
            reports_collection.create_index("timestamp")
            reports_collection.create_index("beach_name")
            reports_collection.create_index("report_type")
            reports_collection.create_index([("coordinates", "2d")])
            logger.info("📊 Índices de MongoDB para reportes creados exitosamente")
        except Exception as e:
            logger.warning(f"⚠️ Error creando índices de reportes: {e}")

        try:
            user_collection = self._client[USER_DATABASE_NAME][USER_COLLECTION]
            user_collection.create_index("username", unique=True)
            user_collection.create_index("address", unique=True, sparse=True)
            user_collection.create_index("join_date")
            logger.info("📊 Índices de MongoDB para usuarios creados exitosamente")
        except Exception as e:
            logger.warning(f"⚠️ Error creando índices de usuarios: {e}")

    def get_database(self):
        """Obtener instancia de la base de datos"""
        if self._db is None:
            self.connect()
        if self._db is None:
            raise ConnectionFailure("MongoDB no disponible")
        return self._db

    @property
    def is_available(self):
        return self._available and self._db is not None and self._client is not None

    def get_collection(self, collection_name=REPORTS_COLLECTION):
        """Obtener colección de reportes u otra colección en la DB principal"""
        db = self.get_database()
        return db[collection_name]

    def get_user_collection(self, collection_name=USER_COLLECTION):
        """Obtener colección de usuarios en la base de datos de usuarios"""
        if self._client is None:
            self.connect()
        db = self._client[USER_DATABASE_NAME]
        return db[collection_name]

    def insert_report(self, report_data: dict) -> str:
        """Insertar un reporte en la colección"""
        try:
            collection = self.get_collection()
            
            # Agregar metadatos automáticos
            report_data["timestamp"] = datetime.utcnow()
            report_data["created_at"] = datetime.utcnow().isoformat()
            
            result = collection.insert_one(report_data)
            logger.info(f"✅ Reporte guardado con ID: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"❌ Error guardando reporte: {e}")
            raise

    def insert_user(self, user_data: dict) -> str:
        """Insertar un usuario en la colección de usuarios"""
        try:
            collection = self.get_user_collection()
            user_data.setdefault("created_at", datetime.utcnow().isoformat())
            user_data.setdefault("join_date", datetime.utcnow().isoformat())
            result = collection.insert_one(user_data)
            logger.info(f"✅ Usuario guardado con ID: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"❌ Error guardando usuario: {e}")
            raise

    def find_user_by_username(self, username: str):
        """Buscar usuario por nombre de usuario"""
        try:
            collection = self.get_user_collection()
            return collection.find_one({"username": username})
        except Exception as e:
            logger.error(f"❌ Error buscando usuario por username: {e}")
            return None

    def find_user_by_id(self, user_id: str):
        """Buscar usuario por id"""
        try:
            collection = self.get_user_collection()
            return collection.find_one({"_id": user_id})
        except Exception as e:
            logger.error(f"❌ Error buscando usuario por id: {e}")
            return None

    def find_user_by_email(self, email: str):
        """Buscar usuario por correo electrónico"""
        try:
            collection = self.get_user_collection()
            return collection.find_one({"email": email})
        except Exception as e:
            logger.error(f"❌ Error buscando usuario por email: {e}")
            return None

    def find_user_by_address(self, address: str):
        """Buscar usuario por address de wallet"""
        try:
            collection = self.get_user_collection()
            return collection.find_one({"address": {"$regex": f"^{address}$", "$options": "i"}})
        except Exception as e:
            logger.error(f"❌ Error buscando usuario por address: {e}")
            return None

    def delete_user_by_email(self, email: str) -> bool:
        """Eliminar usuario por correo electrónico"""
        try:
            collection = self.get_user_collection()
            result = collection.delete_one({"email": email})
            logger.info(f"🗑️ Usuario con email {email} eliminado: {result.deleted_count} documentos")
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"❌ Error eliminando usuario por email: {e}")
            raise

    def delete_user_by_id(self, user_id: str) -> bool:
        """Eliminar usuario por id"""
        try:
            collection = self.get_user_collection()
            result = collection.delete_one({"_id": user_id})
            logger.info(f"🗑️ Usuario con id {user_id} eliminado: {result.deleted_count} documentos")
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"❌ Error eliminando usuario por id: {e}")
            raise

    def update_user(self, user_id: str, update_data: dict):
        """Actualizar campos de usuario"""
        try:
            collection = self.get_user_collection()
            result = collection.update_one({"_id": user_id}, {"$set": update_data})
            return result.modified_count
        except Exception as e:
            logger.error(f"❌ Error actualizando usuario: {e}")
            raise

    def get_all_users(self, limit: int = 50):
        """Obtener todos los usuarios ordenados por scans totales"""
        try:
            collection = self.get_user_collection()
            users = list(collection.find(
                {"total_scans": {"$gt": 0}},
                sort=[("total_scans", -1)],
                limit=limit
            ))
            return users
        except Exception as e:
            logger.error(f"❌ Error obteniendo usuarios: {e}")
            return []

    def get_reports_by_beach(self, beach_name: str, limit: int = 50):
        """Obtener reportes de una playa específica"""
        try:
            collection = self.get_collection()
            reports = list(collection.find(
                {"beach_name": beach_name},
                sort=[("timestamp", -1)],
                limit=limit
            ))
            return reports
        except Exception as e:
            logger.error(f"❌ Error obteniendo reportes: {e}")
            return []

    def get_all_reports(self, limit: int | None = 100):
        """Obtener todos los reportes"""
        try:
            collection = self.get_collection()
            query = collection.find({}, sort=[("timestamp", -1)])
            if limit is not None:
                query = query.limit(limit)
            reports = list(query)
            return reports
        except Exception as e:
            logger.error(f"❌ Error obteniendo reportes: {e}")
            return []

    def get_all_beaches(self):
        """Obtener todas las playas de TPLPlayas"""
        try:
            db_beaches = self._client[BEACHES_DB_NAME]
            collection = db_beaches[BEACHES_COLLECTION]
            beaches = list(collection.find({}))
            # Ordenar por orderIndex para asegurar consistencia
            beaches.sort(key=lambda x: x.get("orderIndex", 999))
            return beaches
        except Exception as e:
            logger.error(f"❌ Error obteniendo playas: {e}")
            return []

    def get_admin_stats(self):
        """Obtener estadísticas globales de escaneos y conteos para administración"""
        try:
            user_collection = self.get_user_collection()

            # Sumar scans y contar NFTs otorgados (longitud del array NFTs de cada usuario)
            pipeline = [
                {
                    "$group": {
                        "_id": None,
                        "total_scans":   {"$sum": {"$ifNull": ["$total_scans", 0]}},
                        "bottle_scans":  {"$sum": {"$ifNull": ["$bottle_scans", 0]}},
                        "can_scans":     {"$sum": {"$ifNull": ["$can_scans", 0]}},
                        "plastic_scans": {"$sum": {"$ifNull": ["$plastic_scans", 0]}},
                        "total_nfts":    {"$sum": {"$size": {"$ifNull": ["$NFTs", []]}}}
                    }
                }
            ]

            results = list(user_collection.aggregate(pipeline))
            stats = {}
            if results:
                stats = results[0]
                stats.pop("_id", None)
            else:
                stats = {
                    "total_scans": 0,
                    "bottle_scans": 0,
                    "can_scans": 0,
                    "plastic_scans": 0,
                    "total_nfts": 0
                }

            # Obtener conteo de usuarios registrados
            stats["total_users"] = user_collection.count_documents({})

            # Obtener conteo de reportes
            report_collection = self.get_collection()
            stats["total_reports"] = report_collection.count_documents({})

            # Contar playas INTERVENIDAS: solo las que tienen al menos un escaneo asociado.
            # Cada vez que un usuario escanea, se guarda su beach_id en su array scanned_beaches
            # (via $addToSet desde el endpoint /api/users/{id}/scan-beach).
            # Aqui contamos cuantos IDs de playa distintos aparecen en TODOS los usuarios.
            beaches_pipeline = [
                # Solo usuarios que tienen al menos una playa escaneada
                {"$match": {"scanned_beaches": {"$exists": True, "$ne": []}}},
                # Desagregar el array de playas escaneadas
                {"$unwind": "$scanned_beaches"},
                # Agrupar por beach_id para obtener IDs únicos
                {"$group": {"_id": "$scanned_beaches.id"}},
                # Contar cuántos IDs únicos hay
                {"$count": "total"}
            ]
            beaches_result = list(user_collection.aggregate(beaches_pipeline))
            stats["total_beaches"] = beaches_result[0]["total"] if beaches_result else 0


            return stats
        except Exception as e:
            logger.error(f"❌ Error calculando estadísticas de administración: {e}")
            return {
                "total_scans": 0,
                "bottle_scans": 0,
                "can_scans": 0,
                "plastic_scans": 0,
                "total_nfts": 0,
                "total_users": 0,
                "total_reports": 0,
                "total_beaches": 0
            }

    def close(self):
        """Cerrar conexión"""
        if self._client:
            self._client.close()
            logger.info("Conexión a MongoDB cerrada")

# Singleton instance
db_connection = MongoDBConnection()
