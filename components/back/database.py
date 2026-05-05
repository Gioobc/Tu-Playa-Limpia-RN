import logging
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from config import MONGODB_URI, DATABASE_NAME, REPORTS_COLLECTION, BEACHES_DB_NAME, BEACHES_COLLECTION
from datetime import datetime

logger = logging.getLogger(__name__)

class MongoDBConnection:
    _instance = None
    _client = None
    _db = None

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
            logger.info(f"✅ Conectado a MongoDB - DB: {DATABASE_NAME}")
            self._create_indexes()
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.error(f"❌ Error conexión MongoDB: {e}")
            raise

    def _create_indexes(self):
        """Crear índices para optimizar queries"""
        try:
            collection = self._db[REPORTS_COLLECTION]
            
            # Limpiar índices existentes que puedan causar conflictos
            try:
                collection.drop_index([("location.lat", "2dsphere"), ("location.lng", "2dsphere")])
                logger.info("🗑️ Índice geoespacial antiguo eliminado")
            except:
                pass  # Index might not exist
            
            collection.create_index("timestamp")
            collection.create_index("beach_name")
            collection.create_index("report_type")
            collection.create_index([("coordinates", "2d")])
            logger.info("📊 Índices de MongoDB creados exitosamente")
        except Exception as e:
            logger.warning(f"⚠️ Error creando índices: {e}")

    def get_database(self):
        """Obtener instancia de la base de datos"""
        if self._db is None:
            self.connect()
        return self._db

    def get_collection(self, collection_name=REPORTS_COLLECTION):
        """Obtener colección específica"""
        db = self.get_database()
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

    def get_all_reports(self, limit: int = 100):
        """Obtener todos los reportes"""
        try:
            collection = self.get_collection()
            reports = list(collection.find(
                {},
                sort=[("timestamp", -1)],
                limit=limit
            ))
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
            return beaches
        except Exception as e:
            logger.error(f"❌ Error obteniendo playas: {e}")
            return []

    def close(self):
        """Cerrar conexión"""
        if self._client:
            self._client.close()
            logger.info("Conexión a MongoDB cerrada")

# Singleton instance
db_connection = MongoDBConnection()
