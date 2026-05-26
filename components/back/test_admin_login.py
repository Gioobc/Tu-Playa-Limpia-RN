import requests

url = "http://127.0.0.1:8000/api/users/admin-login"

try:
    # Test invalid admin login
    res = requests.post(url, json={"username": "not_an_admin"})
    print("Test invalid admin login:")
    print("Status:", res.status_code)
    print("Response:", res.json())
    print("-" * 50)
    
    # Test valid admin login
    res2 = requests.post(url, json={"username": "administrador"})
    print("Test valid admin login:")
    print("Status:", res2.status_code)
    print("Response:", res2.json())
    
except Exception as e:
    print("Error connecting to API:", e)
