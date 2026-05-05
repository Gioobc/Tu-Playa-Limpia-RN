#!/usr/bin/env python3
"""
Script para verificar la colección de playas en MongoDB
"""

import logging
from pymongo import MongoClient
from config import MONGODB_URI, DATABASE_NAME, BEACHES_COLLECTION

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def verify_beaches():
    """Verificar que las playas estén correctamente guardadas"""
    try:
        # Conectar a MongoDB
        client = MongoClient(
            MONGODB_URI,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000,
        )
        
        # Test connection
        client.admin.command('ping')
        logger.info("✅ Conexión a MongoDB exitosa")
        
        # Obtener colección
        db = client[DATABASE_NAME]
        beaches_collection = db[BEACHES_COLLECTION]
        
        # Contar documentos
        total = beaches_collection.count_documents({})
        logger.info(f"📊 Total de playas: {total}")
        
        # Estadísticas por zona
        zones = beaches_collection.distinct("zone")
        logger.info(f"\n🗺️ Zonas disponibles:")
        for zone in sorted(zones):
            count = beaches_collection.count_documents({"zone": zone})
            logger.info(f"   {zone}: {count} playas")
        
        # Estadísticas de limpieza
        clean = beaches_collection.count_documents({"is_clean": True})
        dirty = beaches_collection.count_documents({"is_clean": False})
        logger.info(f"\n🧹 Estado de limpieza:")
        logger.info(f"   Limpias: {clean}")
        logger.info(f"   Sucias: {dirty}")
        
        # Mostrar 3 playas de ejemplo
        logger.info(f"\n📍 Playas de ejemplo:")
        examples = beaches_collection.find().limit(3)
        for beach in examples:
            logger.info(f"   - {beach['name']} ({beach['district']}) - Limpia: {beach['is_clean']}")
        
        # Verificar índices
        logger.info(f"\n📇 Índices en la colección:")
        indexes = beaches_collection.index_information()
        for index_name, index_info in indexes.items():
            logger.info(f"   {index_name}: {index_info['key']}")
        
        client.close()
        logger.info("\n✅ Verificación completada")
        
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        raise


if __name__ == "__main__":
    verify_beaches()
