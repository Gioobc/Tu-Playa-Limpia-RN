import os
from ultralytics import YOLO

# 1. Configuración de parámetros
# El dataset no tiene etiquetas (bounding boxes) y está estructurado en carpetas por categoría.
# Por lo tanto, entrenamos un modelo de clasificación YOLOv8 (yolov8s-cls.pt) en lugar de detección.
# Pasamos la ruta directa a la carpeta del dataset.
DATASET_PATH = r"c:\Users\USUARO\clon\Tu-Playa-Limpia-RN\dataset"
EPOCHS = 2  # Cambiado a 2 para una ejecución de prueba rápida local; cámbialo a 100 en GPU/Colab.
IMAGE_SIZE = 224 # Tamaño estándar para clasificación de YOLOv8

def main():
    # Explicitly set CUDA_VISIBLE_DEVICES to '-1' to ensure CPU usage for this local run
    os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
    print("Iniciando preparación del modelo de Clasificación de Basura (YOLOv8)...")

    # 2. Cargar el modelo base de Clasificación (Transfer Learning)
    # YOLOv8s-cls es el modelo de clasificación "Small", ideal para móviles.
    model = YOLO("yolov8s-cls.pt") 

    # 3. Entrenamiento del modelo
    print(f"Iniciando el entrenamiento por {EPOCHS} épocas...")
    results = model.train(
        data=DATASET_PATH,
        epochs=EPOCHS,
        imgsz=IMAGE_SIZE,
        batch=16,          # Fotos por lote
        device='cpu',      # Cambiar a 0 o 'cuda' si tienes GPU dedicada localmente
        project="tu_playa_limpia", # Carpeta donde guardará los resultados
        name="modelo_basura_cls"   # Nombre del experimento
    )

    print("¡Entrenamiento finalizado!")

    # El mejor modelo se guarda automáticamente en:
    # tu_playa_limpia/modelo_basura_cls/weights/best.pt
    best_model_path = r"runs\classify\tu_playa_limpia\modelo_basura_cls\weights\best.pt"

    # 4. Exportar a formato móvil (TensorFlow Lite)
    # Cargamos el modelo recién entrenado
    trained_model = YOLO(best_model_path)

    print("Convirtiendo el modelo entrenado a formato TensorFlow Lite (.tflite)...")
    # Al usar format="tflite", Ultralytics hace la conversión por ti automáticamente
    trained_model.export(format="tflite", imgsz=IMAGE_SIZE)

    print(f"✅ ¡Modelo exportado exitosamente!")
    print(f"Busca tu archivo .tflite en la carpeta: tu_playa_limpia/modelo_basura_cls/weights/")

if __name__ == "__main__":
    main()
