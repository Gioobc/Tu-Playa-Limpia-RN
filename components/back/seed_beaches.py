from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

# Database URIs
LOCAL_URI = "mongodb://localhost:27017"
ATLAS_URI = os.getenv("MONGODB_URI")

BEACHES = [
    # 1 - 5: Lima Norte
    {"id": 1, "name": "Playa Miramar", "zone": "Lima Norte", "district": "Ancón", "lat": -11.76274, "lng": -77.17165, "country_code": "pe", "orderIndex": 1, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Miramar,+Anc%C3%B3n,+Lima,+Per%C3%BA"},
    {"id": 2, "name": "Playa Las Conchitas", "zone": "Lima Norte", "district": "Ancón", "lat": -11.75537, "lng": -77.16919, "country_code": "pe", "orderIndex": 2, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Las+Conchitas,+Anc%C3%B3n,+Lima,+Per%C3%BA"},
    {"id": 3, "name": "Playa Hermosa", "zone": "Lima Norte", "district": "Ancón", "lat": -11.77424, "lng": -77.18581, "country_code": "pe", "orderIndex": 3, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Hermosa,+Anc%C3%B3n,+Lima,+Per%C3%BA"},
    {"id": 4, "name": "Playa Chica", "zone": "Lima Norte", "district": "Santa Rosa", "lat": -11.80100, "lng": -77.17897, "country_code": "pe", "orderIndex": 4, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Chica,+Ventanilla,+Callao,+Per%C3%BA"},
    {"id": 5, "name": "Playa Grande", "zone": "Lima Norte", "district": "Santa Rosa", "lat": -11.79279, "lng": -77.18370, "country_code": "pe", "orderIndex": 5, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Grande,+Santa+Rosa,+Lima,+Per%C3%BA"},

    # 6 - 20: Lima Centro
    {"id": 6, "name": "Punta Roquitas", "zone": "Lima Centro", "district": "Miraflores", "lat": -12.12235, "lng": -77.04440, "country_code": "pe", "orderIndex": 6, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Punta+Roquitas,+Miraflores,+Lima,+Per%C3%BA"},
    {"id": 7, "name": "La Pampilla", "zone": "Lima Centro", "district": "Miraflores", "lat": -12.11864, "lng": -77.04335, "country_code": "pe", "orderIndex": 7, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+La+Pampilla,+Miraflores,+Lima,+Per%C3%BA"},
    {"id": 8, "name": "Waikiki", "zone": "Lima Centro", "district": "Miraflores", "lat": -12.12900, "lng": -77.03810, "country_code": "pe", "orderIndex": 8, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Waikiki,+Miraflores,+Lima,+Per%C3%BA"},
    {"id": 9, "name": "Makaha", "zone": "Lima Centro", "district": "Miraflores", "lat": -12.12908, "lng": -77.03645, "country_code": "pe", "orderIndex": 9, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Makaha,+Miraflores,+Lima,+Per%C3%BA"},
    {"id": 10, "name": "Redondo", "zone": "Lima Centro", "district": "Miraflores", "lat": -12.13190, "lng": -77.03284, "country_code": "pe", "orderIndex": 10, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Redondo,+Miraflores,+Lima,+Per%C3%BA"},
    {"id": 11, "name": "La Estrella", "zone": "Lima Centro", "district": "Miraflores", "lat": -12.13394, "lng": -77.03050, "country_code": "pe", "orderIndex": 11, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+La+Estrella,+Miraflores,+Lima,+Per%C3%BA"},
    {"id": 12, "name": "Las Cascadas", "zone": "Lima Centro", "district": "Barranco", "lat": -12.13885, "lng": -77.02552, "country_code": "pe", "orderIndex": 12, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Las+Cascadas,+Barranco,+Lima,+Per%C3%BA"},
    {"id": 13, "name": "Barranquito", "zone": "Lima Centro", "district": "Barranco", "lat": -12.14360, "lng": -77.02685, "country_code": "pe", "orderIndex": 13, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Barranquito,+Barranco,+Lima,+Per%C3%BA"},
    {"id": 14, "name": "Los Pavos", "zone": "Lima Centro", "district": "Barranco", "lat": -12.14679, "lng": -77.02578, "country_code": "pe", "orderIndex": 14, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Los+Pavos,+Barranco,+Lima,+Per%C3%BA"},
    {"id": 15, "name": "Los Yuyos", "zone": "Lima Centro", "district": "Barranco", "lat": -12.14902, "lng": -77.02305, "country_code": "pe", "orderIndex": 15, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Los+Yuyos,+Barranco,+Lima,+Per%C3%BA"},
    {"id": 16, "name": "Las Sombrillas", "zone": "Lima Centro", "district": "Barranco", "lat": -12.15330, "lng": -77.02412, "country_code": "pe", "orderIndex": 16, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Las+Sombrillas,+Barranco,+Lima,+Per%C3%BA"},
    {"id": 17, "name": "Agua Dulce", "zone": "Lima Centro", "district": "Chorrillos", "lat": -12.16231, "lng": -77.02698, "country_code": "pe", "orderIndex": 17, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Agua+Dulce,+Chorrillos,+Lima,+Per%C3%BA"},
    {"id": 18, "name": "Pescadores", "zone": "Lima Centro", "district": "Chorrillos", "lat": -12.16562, "lng": -77.03044, "country_code": "pe", "orderIndex": 18, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Pescadores,+Chorrillos,+Lima,+Per%C3%BA"},
    {"id": 19, "name": "La Herradura", "zone": "Lima Centro", "district": "Chorrillos", "lat": -12.17460, "lng": -77.03380, "country_code": "pe", "orderIndex": 19, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+La+Herradura,+Chorrillos,+Lima,+Per%C3%BA"},
    {"id": 20, "name": "La Chira", "zone": "Lima Centro", "district": "Chorrillos", "lat": -12.20859, "lng": -77.02712, "country_code": "pe", "orderIndex": 20, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+La+Chira,+Chorrillos,+Lima,+Per%C3%BA"},

    # 21 - 25: Lima Sur
    {"id": 21, "name": "Playa Venecia", "zone": "Lima Sur", "district": "Villa El Salvador", "lat": -12.23104, "lng": -76.97488, "country_code": "pe", "orderIndex": 21, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Venecia,+Villa+El+Salvador,+Lima,+Per%C3%BA"},
    {"id": 22, "name": "Barlovento", "zone": "Lima Sur", "district": "Villa El Salvador", "lat": -12.23418, "lng": -76.96807, "country_code": "pe", "orderIndex": 22, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Barlovento,+Villa+El+Salvador,+Lima,+Per%C3%BA"},
    {"id": 23, "name": "San Pedro", "zone": "Lima Sur", "district": "Lurín", "lat": -12.28806, "lng": -76.88022, "country_code": "pe", "orderIndex": 23, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+San+Pedro,+Lur%C3%ADn,+Lima,+Per%C3%BA"},
    {"id": 24, "name": "Arica", "zone": "Lima Sur", "district": "Lurín", "lat": -12.29552, "lng": -76.86484, "country_code": "pe", "orderIndex": 24, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Arica,+Lur%C3%ADn,+Lima,+Per%C3%BA"},
    {"id": 25, "name": "Los Pulpos", "zone": "Lima Sur", "district": "Lurín", "lat": -12.30898, "lng": -76.84598, "country_code": "pe", "orderIndex": 25, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Los+Pulpos,+Punta+Hermosa,+Lima,+Per%C3%BA"},

    # 26 - 32: Sur Chico
    {"id": 26, "name": "El Silencio", "zone": "Sur Chico", "district": "Punta Hermosa", "lat": -12.31680, "lng": -76.83768, "country_code": "pe", "orderIndex": 26, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+El+Silencio,+Punta+Hermosa,+Lima,+Per%C3%BA"},
    {"id": 27, "name": "Caballeros", "zone": "Sur Chico", "district": "Punta Hermosa", "lat": -12.32998, "lng": -76.83190, "country_code": "pe", "orderIndex": 27, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Caballeros,+Punta+Hermosa,+Lima,+Per%C3%BA"},
    {"id": 28, "name": "Señoritas", "zone": "Sur Chico", "district": "Punta Hermosa", "lat": -12.32526, "lng": -76.83537, "country_code": "pe", "orderIndex": 28, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Se%C3%B1oritas,+Punta+Hermosa,+Lima,+Per%C3%BA"},
    {"id": 92, "name": "Los Pulpos", "zone": "Sur Chico", "district": "Lurín", "lat": -12.30898, "lng": -76.84598, "country_code": "pe", "orderIndex": 29, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Los+Pulpos,+Punta+Hermosa,+Lima,+Per%C3%BA"},
    {"id": 83, "name": "Punta Negra", "zone": "Sur Chico", "district": "Punta Negra", "lat": -12.35960, "lng": -76.77060, "country_code": "pe", "orderIndex": 30, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Punta+Negra,+Punta+Negra,+Lima,+Per%C3%BA"},
    {"id": 84, "name": "San Bartolo", "zone": "Sur Chico", "district": "San Bartolo", "lat": -12.38707, "lng": -76.77795, "country_code": "pe", "orderIndex": 31, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+San+Bartolo,+San+Bartolo,+Lima,+Per%C3%BA"},
    {"id": 85, "name": "Santa María", "zone": "Sur Chico", "district": "Santa María", "lat": -12.40223, "lng": -76.77696, "country_code": "pe", "orderIndex": 32, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Santa+Mar%C3%ADa+del+Mar,+Lima,+Per%C3%BA"},

    # 33 - 38: Sur Grande
    {"id": 86, "name": "Naplo", "zone": "Sur Grande", "district": "Pucusana", "lat": -12.47887, "lng": -76.79308, "country_code": "pe", "orderIndex": 33, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Naplo,+Pucusana,+Lima,+Per%C3%BA"},
    {"id": 87, "name": "Pucusana", "zone": "Sur Grande", "district": "Pucusana", "lat": -12.48090, "lng": -76.79903, "country_code": "pe", "orderIndex": 34, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Pucusana,+Pucusana,+Lima,+Per%C3%BA"},
    {"id": 88, "name": "Asia", "zone": "Sur Grande", "district": "Asia", "lat": -12.79673, "lng": -76.51124, "country_code": "pe", "orderIndex": 35, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Asia,+Asia,+Ca%C3%B1ete,+Lima,+Per%C3%BA"},
    {"id": 89, "name": "Cerro Azul", "zone": "Sur Grande", "district": "Cerro Azul", "lat": -13.02332, "lng": -76.48199, "country_code": "pe", "orderIndex": 36, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Cerro+Azul,+Ca%C3%B1ete,+Lima,+Per%C3%BA"},
    {"id": 90, "name": "Puerto Viejo", "zone": "Sur Grande", "district": "Cerro Azul", "lat": -13.02789, "lng": -76.48501, "country_code": "pe", "orderIndex": 37, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Puerto+Viejo,+Ca%C3%B1ete,+Lima,+Per%C3%BA"},
    {"id": 91, "name": "Tuquillo", "zone": "Sur Grande", "district": "Cerro Azul", "lat": -10.01773, "lng": -78.19351, "country_code": "pe", "orderIndex": 38, "mapUrl": "https://www.google.com/maps/search/?api=1&query=Playa+Tuquillo,+Huarmey,+%C3%81ncash,+Per%C3%BA"},

    # 29 - 82: International beaches
    {"id": 29, "name": "Venice Beach", "zone": "Norteamérica", "district": "Los Angeles", "lat": 33.9850, "lng": -118.4695, "country_code": "us"},
    {"id": 30, "name": "Santa Monica Beach", "zone": "Norteamérica", "district": "Los Angeles", "lat": 34.0116, "lng": -118.4962, "country_code": "us"},
    {"id": 31, "name": "Malibu Beach", "zone": "Norteamérica", "district": "Malibu", "lat": 34.0259, "lng": -118.7798, "country_code": "us"},
    {"id": 32, "name": "South Beach", "zone": "Norteamérica", "district": "Miami Beach", "lat": 25.7826, "lng": -80.1284, "country_code": "us"},
    {"id": 33, "name": "Waikiki Beach", "zone": "Norteamérica", "district": "Honolulu", "lat": 21.2765, "lng": -157.8271, "country_code": "us"},
    {"id": 34, "name": "Laguna Beach", "zone": "Norteamérica", "district": "Orange County", "lat": 33.5422, "lng": -117.7831, "country_code": "us"},
    {"id": 35, "name": "Coronado Beach", "zone": "Norteamérica", "district": "San Diego", "lat": 32.6859, "lng": -117.1785, "country_code": "us"},
    {"id": 36, "name": "Clearwater Beach", "zone": "Norteamérica", "district": "Clearwater", "lat": 27.9785, "lng": -82.8285, "country_code": "us"},
    {"id": 37, "name": "Playa del Carmen", "zone": "Norteamérica", "district": "Solidaridad", "lat": 20.6274, "lng": -87.0799, "country_code": "mx"},
    {"id": 38, "name": "Cancún Beach", "zone": "Norteamérica", "district": "Cancún", "lat": 21.1619, "lng": -86.8515, "country_code": "mx"},
    {"id": 39, "name": "Tulum Beach", "zone": "Norteamérica", "district": "Tulum", "lat": 20.2114, "lng": -87.4654, "country_code": "mx"},
    {"id": 40, "name": "Playa Norte", "zone": "Norteamérica", "district": "Isla Mujeres", "lat": 21.2580, "lng": -86.7512, "country_code": "mx"},
    {"id": 41, "name": "Cabo San Lucas Beach", "zone": "Norteamérica", "district": "Los Cabos", "lat": 22.8905, "lng": -109.9167, "country_code": "mx"},
    {"id": 42, "name": "Puerto Vallarta Beach", "zone": "Norteamérica", "district": "Puerto Vallarta", "lat": 20.6534, "lng": -105.2253, "country_code": "mx"},
    {"id": 43, "name": "Copacabana", "zone": "Sudamérica", "district": "Rio de Janeiro", "lat": -22.9711, "lng": -43.1822, "country_code": "br"},
    {"id": 44, "name": "Ipanema", "zone": "Sudamérica", "district": "Rio de Janeiro", "lat": -22.9836, "lng": -43.2045, "country_code": "br"},
    {"id": 45, "name": "Praia de Jericoacoara", "zone": "Sudamérica", "district": "Ceará", "lat": -2.7933, "lng": -40.5144, "country_code": "br"},
    {"id": 46, "name": "Praia do Sancho", "zone": "Sudamérica", "district": "Fernando de Noronha", "lat": -3.8548, "lng": -32.4431, "country_code": "br"},
    {"id": 47, "name": "Baia do Sancho", "zone": "Sudamérica", "district": "Fernando de Noronha", "lat": -3.8548, "lng": -32.4431, "country_code": "br"},
    {"id": 48, "name": "Playa Blanca", "zone": "Sudamérica", "district": "Cartagena", "lat": 10.2222, "lng": -75.5802, "country_code": "co"},
    {"id": 49, "name": "Playa de Palomino", "zone": "Sudamérica", "district": "La Guajira", "lat": 11.2514, "lng": -73.5658, "country_code": "co"},
    {"id": 50, "name": "San Andrés Beach", "zone": "Caribe", "district": "San Andrés", "lat": 12.5847, "lng": -81.7006, "country_code": "co"},
    {"id": 51, "name": "Punta Cana Beach", "zone": "Caribe", "district": "Punta Cana", "lat": 18.5601, "lng": -68.3725, "country_code": "do"},
    {"id": 52, "name": "Bavaro Beach", "zone": "Caribe", "district": "Punta Cana", "lat": 18.6796, "lng": -68.4239, "country_code": "do"},
    {"id": 53, "name": "Flamenco Beach", "zone": "Caribe", "district": "Culebra", "lat": 18.3283, "lng": -65.3188, "country_code": "pr"},
    {"id": 54, "name": "Mar del Plata", "zone": "Sudamérica", "district": "Buenos Aires", "lat": -38.0055, "lng": -57.5426, "country_code": "ar"},
    {"id": 55, "name": "Playa Bristol", "zone": "Sudamérica", "district": "Mar del Plata", "lat": -38.0081, "lng": -57.5414, "country_code": "ar"},
    {"id": 56, "name": "Punta del Este", "zone": "Sudamérica", "district": "Maldonado", "lat": -34.9667, "lng": -54.9500, "country_code": "uy"},
    {"id": 57, "name": "Playa Brava", "zone": "Sudamérica", "district": "Punta del Este", "lat": -34.9592, "lng": -54.9338, "country_code": "uy"},
    {"id": 58, "name": "Playa Anakena", "zone": "Sudamérica", "district": "Isla de Pascua", "lat": -27.0734, "lng": -109.3236, "country_code": "cl"},
    {"id": 59, "name": "Viña del Mar", "zone": "Sudamérica", "district": "Valparaíso", "lat": -33.0245, "lng": -71.5518, "country_code": "cl"},
    {"id": 60, "name": "Playa de la Concha", "zone": "Europa", "district": "San Sebastián", "lat": 43.3145, "lng": -1.9884, "country_code": "es"},
    {"id": 61, "name": "Playa de las Catedrales", "zone": "Europa", "district": "Galicia", "lat": 43.5539, "lng": -7.1594, "country_code": "es"},
    {"id": 62, "name": "Barceloneta Beach", "zone": "Europa", "district": "Barcelona", "lat": 41.3784, "lng": 2.1925, "country_code": "es"},
    {"id": 63, "name": "Playa de Ses Illetes", "zone": "Europa", "district": "Formentera", "lat": 38.7562, "lng": 1.4332, "country_code": "es"},
    {"id": 64, "name": "Praia da Marinha", "zone": "Europa", "district": "Algarve", "lat": 37.0898, "lng": -8.4129, "country_code": "pt"},
    {"id": 65, "name": "Praia de Benagil", "zone": "Europa", "district": "Algarve", "lat": 37.0872, "lng": -8.4165, "country_code": "pt"},
    {"id": 66, "name": "Plage de Palombaggia", "zone": "Europa", "district": "Corsica", "lat": 41.5647, "lng": 9.3243, "country_code": "fr"},
    {"id": 67, "name": "Plage de Pampelonne", "zone": "Europa", "district": "Saint-Tropez", "lat": 43.2269, "lng": 6.6617, "country_code": "fr"},
    {"id": 68, "name": "Spiaggia dei Conigli", "zone": "Europa", "district": "Lampedusa", "lat": 35.5113, "lng": 12.5597, "country_code": "it"},
    {"id": 69, "name": "Navagio Beach", "zone": "Europa", "district": "Zakynthos", "lat": 37.8594, "lng": 20.6247, "country_code": "gr"},
    {"id": 70, "name": "Elafonissi Beach", "zone": "Europa", "district": "Crete", "lat": 35.2714, "lng": 23.5414, "country_code": "gr"},
    {"id": 71, "name": "Jumeirah Beach", "zone": "Medio Oriente", "district": "Dubai", "lat": 25.1878, "lng": 55.2185, "country_code": "ae"},
    {"id": 72, "name": "Sharm El Sheikh Beach", "zone": "Medio Oriente", "district": "Sharm El Sheikh", "lat": 27.9158, "lng": 34.3299, "country_code": "eg"},
    {"id": 73, "name": "Agadir Beach", "zone": "Medio Oriente", "district": "Agadir", "lat": 30.4132, "lng": -9.6019, "country_code": "ma"},
    {"id": 74, "name": "Qurum Beach", "zone": "Medio Oriente", "district": "Muscat", "lat": 23.6190, "lng": 58.4878, "country_code": "om"},
    {"id": 75, "name": "Palolem Beach", "zone": "Asia", "district": "Goa", "lat": 15.0100, "lng": 74.0232, "country_code": "in"},
    {"id": 76, "name": "Anjuna Beach", "zone": "Asia", "district": "Goa", "lat": 15.5782, "lng": 73.7408, "country_code": "in"},
    {"id": 77, "name": "Varkala Beach", "zone": "Asia", "district": "Kerala", "lat": 8.7338, "lng": 76.7059, "country_code": "in"},
    {"id": 78, "name": "Radhanagar Beach", "zone": "Asia", "district": "Andaman Islands", "lat": 11.9839, "lng": 92.9567, "country_code": "in"},
    {"id": 79, "name": "Yalong Bay", "zone": "Asia", "district": "Hainan", "lat": 18.2323, "lng": 109.6468, "country_code": "cn"},
    {"id": 80, "name": "Dadonghai Beach", "zone": "Asia", "district": "Sanya", "lat": 18.2234, "lng": 109.5222, "country_code": "cn"},
    {"id": 81, "name": "Repulse Bay", "zone": "Asia", "district": "Hong Kong", "lat": 22.2369, "lng": 114.1969, "country_code": "hk"},
    {"id": 82, "name": "Kenting Beach", "zone": "Asia", "district": "Taiwan", "lat": 21.9443, "lng": 120.7972, "country_code": "tw"},
]

# Add default values
for b in BEACHES:
    b["is_clean"] = True
    b["people_cleaning"] = 0
    if "orderIndex" not in b:
        b["orderIndex"] = 100 + b["id"]

def seed_db(uri_str, name):
    print(f"\n--- Seeding DB: {name} ({uri_str}) ---")
    try:
        client = MongoClient(uri_str, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        db = client["TPLPlayas"]
        col = db["DatosPlaya"]
        
        # Clear existing
        deleted = col.delete_many({})
        print(f"Cleared {deleted.deleted_count} beaches.")
        
        # Insert all
        inserted = col.insert_many(BEACHES)
        print(f"Successfully inserted {len(inserted.inserted_ids)} beaches.")
        client.close()
    except Exception as e:
        print(f"Failed to seed {name}: {e}")

if __name__ == "__main__":
    # 1. Seed Local
    seed_db(LOCAL_URI, "Local MongoDB")
    
    # 2. Seed Atlas
    seed_db(ATLAS_URI, "MongoDB Atlas")
