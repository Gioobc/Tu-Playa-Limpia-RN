# -*- coding: utf-8 -*-
"""
detection.py -- Entrenamiento de clasificacion de residuos (Tu Playa Limpia)

Clases objetivo: battery, cardboard, glass, metal, paper, plastic, plastic_bottle

Uso:
    python detection.py

Notas:
    - Extrae automaticamente el dataset.zip desde Downloads si no existe en el proyecto.
    - Aplica data augmentation y oversampling para corregir el desbalance de clases.
    - Usa YOLOv8m-cls (Medium) para mayor capacidad de discriminacion.
    - Guarda el mejor modelo en: tu_playa_limpia/modelo_basura_cls/weights/best.pt
    - Copia el modelo a: runs/classify/tu_playa_limpia/modelo_basura_cls/weights/best.pt
      para que api_ia.py lo encuentre sin ningun cambio adicional.
"""

import os
import shutil
import zipfile
import random
from pathlib import Path

# ──────────────────────────────────────────────
# 1. Configuracion
# ──────────────────────────────────────────────
# Ruta al dataset.zip (ajusta si lo tienes en otro lugar)
DATASET_ZIP   = Path(r"C:\Users\yasse\Downloads\dataset.zip")

# Carpeta donde se extrae el dataset original
DATASET_RAW   = Path("dataset_raw")

# Carpeta de trabajo con dataset balanceado (la que usa YOLO para entrenar)
DATASET_TRAIN = Path("dataset_balanced")

# Parametros de entrenamiento
EPOCHS        = 100       # Epocas completas (early stopping corta antes si no mejora)
IMAGE_SIZE    = 224       # Estandar para clasificacion YOLOv8
BATCH_SIZE    = 16        # Reduce a 8 si se queda sin RAM

# Cuantas imagenes queremos por clase MINIMO tras el oversampling.
# Las clases con mas imagenes que este numero NO se recortan (se usan todas).
TARGET_IMAGES_PER_CLASS = 500

# Clases que esperamos encontrar en el dataset
EXPECTED_CLASSES = {"battery", "cardboard", "glass", "metal", "paper", "plastic", "plastic_bottle"}


# ──────────────────────────────────────────────
# 2. Extraer dataset.zip si hace falta
# ──────────────────────────────────────────────
def extract_dataset():
    """Extrae dataset.zip en DATASET_RAW si no esta ya extraido."""
    raw_marker = DATASET_RAW / "battery"   # Si esta carpeta existe, ya se extrajo
    if raw_marker.exists():
        print(f"[setup] Dataset ya extraido en '{DATASET_RAW}'. Saltando extraccion.")
        return

    if not DATASET_ZIP.exists():
        raise FileNotFoundError(
            f"No se encontro el archivo ZIP en: {DATASET_ZIP}\n"
            "Asegurate de que 'dataset.zip' este en esa ruta y vuelve a intentarlo."
        )

    print(f"[setup] Extrayendo {DATASET_ZIP} -> '{DATASET_RAW}' ...")
    DATASET_RAW.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(DATASET_ZIP, "r") as zf:
        for member in zf.namelist():
            # Quitar el prefijo 'dataset/' del zip para que quede flat en DATASET_RAW
            rel   = Path(member)
            parts = rel.parts
            if len(parts) < 2:
                continue   # Es la carpeta raiz del zip, saltar
            # parts[0] = "dataset", parts[1..] = clase/imagen.jpg
            dest = DATASET_RAW / Path(*parts[1:])
            if member.endswith("/"):
                dest.mkdir(parents=True, exist_ok=True)
            else:
                dest.parent.mkdir(parents=True, exist_ok=True)
                with zf.open(member) as src, open(dest, "wb") as out:
                    out.write(src.read())

    print("[setup] Extraccion completa.")


# ──────────────────────────────────────────────
# 3. Balancear el dataset con oversampling simple
# ──────────────────────────────────────────────
def balance_dataset():
    """
    Crea DATASET_TRAIN con imagenes balanceadas:
    - Clases con < TARGET_IMAGES_PER_CLASS: se duplican imagenes al azar (oversampling).
    - Clases con >= TARGET_IMAGES_PER_CLASS: se usan todas sus imagenes.

    No modifica el dataset original (DATASET_RAW).
    """
    if DATASET_TRAIN.exists():
        shutil.rmtree(DATASET_TRAIN)
    DATASET_TRAIN.mkdir(parents=True)

    # Verificar clases presentes
    classes_found = {p.name for p in DATASET_RAW.iterdir() if p.is_dir()}
    missing = EXPECTED_CLASSES - classes_found
    if missing:
        print(f"[balance] ADVERTENCIA - Clases no encontradas en el dataset: {missing}")

    class_counts_before = {}
    class_counts_after  = {}

    for cls_dir in sorted(DATASET_RAW.iterdir()):
        if not cls_dir.is_dir():
            continue
        cls_name = cls_dir.name
        images   = (list(cls_dir.glob("*.jpg"))
                    + list(cls_dir.glob("*.png"))
                    + list(cls_dir.glob("*.jpeg")))

        if not images:
            print(f"[balance] Clase '{cls_name}' sin imagenes. Saltando.")
            continue

        class_counts_before[cls_name] = len(images)

        # Carpeta destino
        dest_dir = DATASET_TRAIN / cls_name
        dest_dir.mkdir(parents=True, exist_ok=True)

        # 1. Copiar imagenes originales
        for img in images:
            shutil.copy2(img, dest_dir / img.name)

        # 2. Si la clase tiene menos de TARGET, oversamplear
        n_needed = max(0, TARGET_IMAGES_PER_CLASS - len(images))
        if n_needed > 0:
            extra = random.choices(images, k=n_needed)   # con reemplazo
            for i, img in enumerate(extra):
                new_name = f"aug_{i:04d}_{img.name}"
                shutil.copy2(img, dest_dir / new_name)

        final_count = len(list(dest_dir.iterdir()))
        class_counts_after[cls_name] = final_count

    # Reporte de balanceo
    print("\n[balance] Distribucion del dataset:")
    print(f"  {'Clase':<20} {'Original':>10} {'Balanceado':>12}")
    print(f"  {'-'*44}")
    for cls in sorted(class_counts_before):
        print(f"  {cls:<20} {class_counts_before[cls]:>10} {class_counts_after.get(cls, 0):>12}")
    total_after = sum(class_counts_after.values())
    print(f"  {'TOTAL':<20} {sum(class_counts_before.values()):>10} {total_after:>12}")
    print()


# ──────────────────────────────────────────────
# 4. Entrenamiento YOLOv8
# ──────────────────────────────────────────────
def train():
    from ultralytics import YOLO

    print("[train] Cargando modelo base YOLOv8m-cls (Medium)...")
    # yolov8m-cls = mayor capacidad que 's', mejor para diferenciar 7 clases similares.
    # Si quieres velocidad maxima, cambia a yolov8s-cls.pt
    model = YOLO("yolov8m-cls.pt")

    print(f"[train] Iniciando entrenamiento - {EPOCHS} epocas max, imgsz={IMAGE_SIZE} ...")
    results = model.train(
        data=str(DATASET_TRAIN),     # Carpeta con subcarpetas por clase (formato ImageFolder)
        epochs=EPOCHS,
        imgsz=IMAGE_SIZE,
        batch=BATCH_SIZE,
        patience=20,                  # Early stopping: para si no mejora en 20 epocas
        # Data augmentation (reduce sobreajuste y mejora generalizacion)
        fliplr=0.5,                   # Flip horizontal aleatorio
        flipud=0.1,                   # Flip vertical aleatorio
        hsv_h=0.015,                  # Variacion de tono (color)
        hsv_s=0.7,                    # Variacion de saturacion
        hsv_v=0.4,                    # Variacion de brillo
        degrees=15,                   # Rotacion aleatoria +-15 grados
        translate=0.1,                # Traslacion aleatoria 10%
        scale=0.5,                    # Zoom aleatorio +-50%
        # Regularizacion
        dropout=0.3,                  # Dropout para evitar memorizar
        weight_decay=0.0005,
        # Hardware y guardado
        device="cpu",                 # Cambia a 0 si tienes GPU NVIDIA con CUDA
        project="tu_playa_limpia",
        name="modelo_basura_cls",
        exist_ok=True,                # Sobrescribe runs previos del mismo nombre
        verbose=True,
    )

    print("\n[train] Entrenamiento finalizado!")
    return results


# ──────────────────────────────────────────────
# 5. Exportar el modelo a TFLite (opcional, para uso en movil)
# ──────────────────────────────────────────────
def export_tflite():
    from ultralytics import YOLO

    # YOLOv8 guarda el mejor modelo aqui cuando se usa project+name:
    best_pt = Path("tu_playa_limpia/modelo_basura_cls/weights/best.pt")

    if not best_pt.exists():
        print(f"[export] ADVERTENCIA - No se encontro {best_pt}. Saltando exportacion .tflite.")
        return

    print(f"[export] Convirtiendo '{best_pt}' -> .tflite ...")
    trained_model = YOLO(str(best_pt))
    trained_model.export(format="tflite", imgsz=IMAGE_SIZE)
    print("[export] Archivo .tflite guardado junto a best.pt")


# ──────────────────────────────────────────────
# 6. Verificar que api_ia.py encontrara el modelo
# ──────────────────────────────────────────────
def verify_api_path():
    """
    api_ia.py busca el modelo en:
        runs/classify/tu_playa_limpia/modelo_basura_cls/weights/best.pt

    YOLOv8 guarda en:
        tu_playa_limpia/modelo_basura_cls/weights/best.pt

    Copiamos el modelo a la ruta que espera api_ia.py.
    """
    src  = Path("tu_playa_limpia/modelo_basura_cls/weights/best.pt")
    dest = Path("runs/classify/tu_playa_limpia/modelo_basura_cls/weights/best.pt")

    if not src.exists():
        print("[verify] ADVERTENCIA - El modelo entrenado no existe aun.")
        return

    dest.parent.mkdir(parents=True, exist_ok=True)

    if dest.exists():
        dest.unlink()

    shutil.copy2(src, dest)
    print(f"[verify] Modelo copiado a la ruta que usa api_ia.py: {dest}")
    print("[verify] Listo! Ejecuta:  python api_ia.py")


# ──────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────
def main():
    print("=" * 60)
    print("  Tu Playa Limpia - Entrenamiento Multi-clase")
    print("  Clases: battery | cardboard | glass | metal |")
    print("          paper | plastic | plastic_bottle")
    print("=" * 60)

    # Paso 1: Extraer dataset
    extract_dataset()

    # Paso 2: Balancear clases
    balance_dataset()

    # Paso 3: Entrenar
    train()

    # Paso 4: Exportar a TFLite (opcional)
    export_tflite()

    # Paso 5: Copiar modelo a la ruta que espera api_ia.py
    verify_api_path()

    print("\n" + "=" * 60)
    print("  Pipeline completo.")
    print("  Siguiente paso: python api_ia.py")
    print("=" * 60)


if __name__ == "__main__":
    main()
