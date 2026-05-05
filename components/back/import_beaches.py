#!/usr/bin/env python3
"""
Script para importar playas de Tu Playa Limpia a MongoDB
Crea la colección 'playas' con todos los datos de BeachMapScreen.js

Uso: python import_beaches.py [--force]
     --force: Reemplaza datos existentes sin preguntar
"""

import logging
import sys
from pymongo import MongoClient, errors
from config import MONGODB_URI, DATABASE_NAME, BEACHES_COLLECTION

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Datos de playas extraídos de BeachMapScreen.js
BEACHES = [
    {
        "id": 1,
        "name": "Playa Miramar",
        "zone": "Lima Norte",
        "district": "Ancón",
        "lat": -11.7695,
        "lng": -77.1758,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 2,
        "name": "Playa Las Conchitas",
        "zone": "Lima Norte",
        "district": "Ancón",
        "lat": -11.7588,
        "lng": -77.1732,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 3,
        "name": "Playa Hermosa",
        "zone": "Lima Norte",
        "district": "Ancón",
        "lat": -11.7772,
        "lng": -77.1803,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 4,
        "name": "Playa Chica",
        "zone": "Lima Norte",
        "district": "Santa Rosa",
        "lat": -11.8015,
        "lng": -77.1688,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 5,
        "name": "Playa Grande",
        "zone": "Lima Norte",
        "district": "Santa Rosa",
        "lat": -11.8082,
        "lng": -77.1655,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 6,
        "name": "Punta Roquitas",
        "zone": "Lima Centro",
        "district": "Miraflores",
        "lat": -12.1215,
        "lng": -77.0418,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 7,
        "name": "La Pampilla",
        "zone": "Lima Centro",
        "district": "Miraflores",
        "lat": -12.1234,
        "lng": -77.0402,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 8,
        "name": "Waikiki",
        "zone": "Lima Centro",
        "district": "Miraflores",
        "lat": -12.1275,
        "lng": -77.0377,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 9,
        "name": "Makaha",
        "zone": "Lima Centro",
        "district": "Miraflores",
        "lat": -12.1287,
        "lng": -77.0369,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 10,
        "name": "Redondo",
        "zone": "Lima Centro",
        "district": "Miraflores",
        "lat": -12.1315,
        "lng": -77.0352,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 11,
        "name": "La Estrella",
        "zone": "Lima Centro",
        "district": "Miraflores",
        "lat": -12.1342,
        "lng": -77.0335,
        "is_clean": False,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 12,
        "name": "Las Cascadas",
        "zone": "Lima Centro",
        "district": "Barranco",
        "lat": -12.1438,
        "lng": -77.0289,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 13,
        "name": "Barranquito",
        "zone": "Lima Centro",
        "district": "Barranco",
        "lat": -12.1472,
        "lng": -77.0275,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 14,
        "name": "Los Pavos",
        "zone": "Lima Centro",
        "district": "Barranco",
        "lat": -12.1505,
        "lng": -77.0263,
        "is_clean": False,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 15,
        "name": "Los Yuyos",
        "zone": "Lima Centro",
        "district": "Barranco",
        "lat": -12.1528,
        "lng": -77.0255,
        "is_clean": False,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 16,
        "name": "Las Sombrillas",
        "zone": "Lima Centro",
        "district": "Barranco",
        "lat": -12.1569,
        "lng": -77.0258,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 17,
        "name": "Agua Dulce",
        "zone": "Lima Centro",
        "district": "Chorrillos",
        "lat": -12.1612,
        "lng": -77.0266,
        "is_clean": False,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 18,
        "name": "Pescadores",
        "zone": "Lima Centro",
        "district": "Chorrillos",
        "lat": -12.1645,
        "lng": -77.0278,
        "is_clean": False,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 19,
        "name": "La Herradura",
        "zone": "Lima Centro",
        "district": "Chorrillos",
        "lat": -12.1744,
        "lng": -77.0336,
        "is_clean": False,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 20,
        "name": "La Chira",
        "zone": "Lima Centro",
        "district": "Chorrillos",
        "lat": -12.1885,
        "lng": -77.0405,
        "is_clean": False,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 21,
        "name": "Playa Venecia",
        "zone": "Lima Sur",
        "district": "Villa El Salvador",
        "lat": -12.2355,
        "lng": -76.9758,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 22,
        "name": "Barlovento",
        "zone": "Lima Sur",
        "district": "Villa El Salvador",
        "lat": -12.2452,
        "lng": -76.9655,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 23,
        "name": "San Pedro",
        "zone": "Lima Sur",
        "district": "Lurín",
        "lat": -12.2685,
        "lng": -76.9248,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 24,
        "name": "Arica",
        "zone": "Lima Sur",
        "district": "Lurín",
        "lat": -12.2785,
        "lng": -76.9125,
        "is_clean": False,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 25,
        "name": "Los Pulpos",
        "zone": "Lima Sur",
        "district": "Lurín",
        "lat": -12.2882,
        "lng": -76.9015,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 26,
        "name": "El Silencio",
        "zone": "Sur Chico",
        "district": "Punta Hermosa",
        "lat": -12.3153,
        "lng": -76.8364,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 27,
        "name": "Caballeros",
        "zone": "Sur Chico",
        "district": "Punta Hermosa",
        "lat": -12.3297,
        "lng": -76.8319,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 28,
        "name": "Señoritas",
        "zone": "Sur Chico",
        "district": "Punta Hermosa",
        "lat": -12.3315,
        "lng": -76.8292,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 29,
        "name": "Los Pulpos",
        "zone": "Sur Chico",
        "district": "Punta Hermosa",
        "lat": -12.42,
        "lng": -76.75,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 30,
        "name": "Punta Negra",
        "zone": "Sur Chico",
        "district": "Punta Negra",
        "lat": -12.365,
        "lng": -76.795,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 31,
        "name": "San Bartolo",
        "zone": "Sur Chico",
        "district": "San Bartolo",
        "lat": -12.383,
        "lng": -76.782,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 32,
        "name": "Santa María",
        "zone": "Sur Chico",
        "district": "Santa María",
        "lat": -12.405,
        "lng": -76.767,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 33,
        "name": "Naplo",
        "zone": "Sur Grande",
        "district": "Pucusana",
        "lat": -12.45,
        "lng": -76.72,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 34,
        "name": "Pucusana",
        "zone": "Sur Grande",
        "district": "Pucusana",
        "lat": -12.48,
        "lng": -76.68,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 35,
        "name": "Asia",
        "zone": "Sur Grande",
        "district": "Pucusana",
        "lat": -12.52,
        "lng": -76.65,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 36,
        "name": "Cerro Azul",
        "zone": "Sur Grande",
        "district": "Cerro Azul",
        "lat": -12.55,
        "lng": -76.62,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 37,
        "name": "Puerto Viejo",
        "zone": "Sur Grande",
        "district": "Cerro Azul",
        "lat": -12.58,
        "lng": -76.59,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
    {
        "id": 38,
        "name": "Tuquillo",
        "zone": "Sur Grande",
        "district": "Cerro Azul",
        "lat": -12.61,
        "lng": -76.56,
        "is_clean": True,
        "people_cleaning": 0,
        "country_code": "pe",
    },
]


def import_beaches(force=False):
    """Importar todas las playas a la colección 'playas'
    
    Args:
        force: Si es True, reemplaza datos existentes sin preguntar
    """
    try:
        # Conectar a MongoDB
        client = MongoClient(
            MONGODB_URI,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000,
            retryWrites=True,
            w="majority"
        )
        
        # Test connection
        client.admin.command('ping')
        logger.info("✅ Conexión a MongoDB exitosa")
        
        # Obtener base de datos y colección
        db = client[DATABASE_NAME]
        beaches_collection = db[BEACHES_COLLECTION]
        
        # Verificar si ya existen playas
        existing_count = beaches_collection.count_documents({})
        if existing_count > 0:
            logger.warning(f"⚠️ Ya existen {existing_count} playas en la colección")
            if not force:
                response = input("¿Deseas reemplazar los datos existentes? (s/n): ")
                if response.lower() != 's':
                    logger.info("❌ Importación cancelada")
                    client.close()
                    return
            logger.info("🗑️ Eliminando documentos previos...")
            beaches_collection.delete_many({})
            logger.info("✅ Documentos previos eliminados")
        
        # Insertar playas
        result = beaches_collection.insert_many(BEACHES)
        logger.info(f"✅ {len(result.inserted_ids)} playas importadas exitosamente")
        
        # Crear índices para optimizar queries
        beaches_collection.create_index("id", unique=True)
        beaches_collection.create_index("name")
        beaches_collection.create_index("zone")
        beaches_collection.create_index("district")
        logger.info("📊 Índices creados exitosamente")
        
        # Mostrar estadísticas
        total = beaches_collection.count_documents({})
        clean_beaches = beaches_collection.count_documents({"is_clean": True})
        dirty_beaches = beaches_collection.count_documents({"is_clean": False})
        
        logger.info(f"\n📈 Estadísticas de playas:")
        logger.info(f"   Total: {total}")
        logger.info(f"   Limpias: {clean_beaches}")
        logger.info(f"   Sucias: {dirty_beaches}")
        
        client.close()
        logger.info("\n✅ Importación completada correctamente")
        
    except errors.DuplicateKeyError:
        logger.error("❌ Error: Playas duplicadas. Usa delete_many() para limpiar primero")
    except Exception as e:
        logger.error(f"❌ Error durante importación: {e}")
        raise


if __name__ == "__main__":
    force = "--force" in sys.argv
    import_beaches(force=force)
