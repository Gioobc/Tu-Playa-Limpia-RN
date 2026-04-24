"""
Script de prueba para verificar la conexión a MongoDB y los endpoints del API
Ejecución: python test_api.py
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_health():
    """Probar endpoint de health"""
    print("\n🔍 Probando /health...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_database_status():
    """Probar estado de la base de datos"""
    print("\n🔍 Probando /api/reports/status...")
    try:
        response = requests.get(f"{BASE_URL}/api/reports/status")
        print(f"✅ Status: {response.status_code}")
        data = response.json()
        print(f"   MongoDB Available: {data.get('mongodb_available')}")
        print(f"   Database: {data.get('database')}")
        print(f"   Collection: {data.get('collection')}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_save_report():
    """Probar guardado de un reporte"""
    print("\n🔍 Probando POST /api/reports...")
    
    report_data = {
        "report_type": "trash",
        "msg": "Reporte de prueba - Se encontró basura en la playa",  # Cambiado de 'details' a 'msg'
        "beach_name": "Playa Miramar",
        "beach_id": "beach_miramar_001",
        "location": {
            "lat": 10.2345678,
            "lng": -75.5432109,
            "beach_name": "Playa Miramar",
            "sector": "Sector de Prueba"
        },
        "image_uri": None,
        "user_id": "test_user_001",
        "user_name": "Usuario Prueba"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/reports",
            json=report_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"✅ Status: {response.status_code}")
        data = response.json()
        print(f"   Success: {data.get('success')}")
        print(f"   Message: {data.get('message')}")
        print(f"   Report ID: {data.get('report_id')}")
        print(f"   Beach: {data.get('beach')}")
        return response.status_code == 200, data.get('report_id')
    except Exception as e:
        print(f"❌ Error: {e}")
        return False, None

def test_get_beach_reports(beach_name="Playa Miramar"):
    """Probar obtención de reportes por playa"""
    print(f"\n🔍 Probando GET /api/reports/beach/{beach_name}...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/reports/beach/{beach_name}",
            params={"limit": 10}
        )
        print(f"✅ Status: {response.status_code}")
        data = response.json()
        print(f"   Beach: {data.get('beach')}")
        print(f"   Count: {data.get('count')}")
        
        if data.get('reports'):
            print(f"   Primeros reportes:")
            for report in data.get('reports')[:3]:
                print(f"     - ID: {report.get('_id')}")
                print(f"       Type: {report.get('report_type')}")
                print(f"       User: {report.get('user_name')}")
        
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_get_all_reports():
    """Probar obtención de todos los reportes"""
    print("\n🔍 Probando GET /api/reports...")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/reports",
            params={"limit": 10}
        )
        print(f"✅ Status: {response.status_code}")
        data = response.json()
        print(f"   Total Reports: {data.get('count')}")
        
        if data.get('reports'):
            print(f"   Primeros 3 reportes:")
            for report in data.get('reports')[:3]:
                print(f"     - Beach: {report.get('beach_name')}")
                print(f"       Type: {report.get('report_type')}")
                print(f"       Status: {report.get('status')}")
        
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("=" * 60)
    print("🧪 PRUEBAS DEL API - Tu Playa Limpia Backend")
    print("=" * 60)
    print(f"⏰ Timestamp: {datetime.now().isoformat()}")
    print(f"🌐 Base URL: {BASE_URL}")
    
    results = {
        "health": test_health(),
        "database_status": test_database_status(),
        "save_report": test_save_report()[0],
        "get_beach_reports": test_get_beach_reports(),
        "get_all_reports": test_get_all_reports(),
    }
    
    print("\n" + "=" * 60)
    print("📊 RESULTADOS")
    print("=" * 60)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:<25} {status}")
    
    total_tests = len(results)
    passed_tests = sum(1 for r in results.values() if r)
    
    print("\n" + "=" * 60)
    print(f"Total: {passed_tests}/{total_tests} pruebas pasadas")
    print("=" * 60)
    
    if passed_tests == total_tests:
        print("✅ ¡Todas las pruebas pasaron!")
    else:
        print(f"⚠️  {total_tests - passed_tests} pruebas fallaron")
        print("\nVerifica:")
        print("1. El servidor está ejecutándose (python -m uvicorn main:app --reload)")
        print("2. MongoDB está configurado correctamente en .env")
        print("3. La conexión a internet es estable")

if __name__ == "__main__":
    main()
