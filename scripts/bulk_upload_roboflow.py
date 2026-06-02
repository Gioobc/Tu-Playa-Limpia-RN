import os
from roboflow import Roboflow
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# CONFIGURACIÓN
API_KEY = os.getenv("EXPO_PUBLIC_ROBOFLOW_API_KEY")
WORKSPACE_ID = "yeong-sjiiq"
PROJECT_ID = "tpl-waste-detection-model"
BASE_PATH = r"c:\Users\start\Downloads\Tu-Playa-Limpia-RN\temp_datasets\Garbage_Classification_YOLO\classify\train"

if not API_KEY:
    print("Error: No se encontró EXPO_PUBLIC_ROBOFLOW_API_KEY en el archivo .env")
    exit(1)

rf = Roboflow(api_key=API_KEY)
project = rf.workspace(WORKSPACE_ID).project(PROJECT_ID)

# Mapeo de carpetas a clases de Roboflow
# Puedes ajustar estos nombres según prefieras
class_mapping = {
    "plastic": "plastic",
    "metal": "can",
    "glass": "glass",
    "paper": "paper",
    "cardboard": "cardboard",
    "battery": "battery",
    "trash": "other_litter"
}

def upload_images():
    for folder_name, class_name in class_mapping.items():
        folder_path = os.path.join(BASE_PATH, folder_name)
        if not os.path.exists(folder_path):
            print(f"Saltando {folder_name}, no existe la ruta.")
            continue
            
        print(f"\n--- Subiendo carpeta: {folder_name} como clase: {class_name} ---")
        
        # Listar archivos de imagen
        files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        
        # Subir un lote (por ejemplo, los primeros 100 para probar)
        # Quita el [:100] para subir todo el dataset
        for img_name in files[:100]:
            img_path = os.path.join(folder_path, img_name)
            try:
                # Subir imagen y asignar clasificación (image-level classification)
                project.upload(
                    image_path=img_path,
                    tags=[class_name],
                    batch_name=f"python_bulk_{folder_name}"
                )
                print(f"Subido: {img_name}")
            except Exception as e:
                print(f"Error subiendo {img_name}: {e}")

if __name__ == "__main__":
    if API_KEY == "TU_API_KEY_AQUI":
        print("POR FAVOR: Cambia la API_KEY en el script por tu clave real de env.js")
    else:
        upload_images()
