"""
api_ia.py — Servidor de clasificación de residuos (Tu Playa Limpia)
Reemplaza la API de Roboflow con tu propio modelo entrenado localmente.

Uso:
    python api_ia.py

Endpoint:
    POST /classify
    Body: imagen en base64 (igual que Roboflow)
    Response: JSON con predictions compatible con ScanScreen.js
"""

import base64
import io
import os
from pathlib import Path

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
from ultralytics import YOLO

# ──────────────────────────────────────────────
# Configuración
# ──────────────────────────────────────────────
MODEL_PATH = Path("runs/classify/tu_playa_limpia/modelo_basura_cls/weights/best.pt")
CONFIDENCE_THRESHOLD = 0.30   # Mínimo de confianza (30%) — con 100 épocas subir a 0.60
IMAGE_SIZE = 224
PORT = 5000

# Mapeo de clases → puntos y colores (coincide con CLASS_MAPPING de ScanScreen.js)
CLASS_INFO = {
    "battery":        {"points": 5,  "color": "#ef4444"},
    "cardboard":      {"points": 1,  "color": "#f97316"},
    "glass":          {"points": 5,  "color": "#06b6d4"},
    "metal":          {"points": 3,  "color": "#64748b"},
    "paper":          {"points": 1,  "color": "#a855f7"},
    "plastic":        {"points": 1,  "color": "#3b82f6"},
    "plastic_bottle": {"points": 5,  "color": "#22c55e"},
}

# ──────────────────────────────────────────────
# Cargar modelo
# ──────────────────────────────────────────────
print(f"[API-IA] Cargando modelo desde: {MODEL_PATH}")
if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"No se encontró el modelo en {MODEL_PATH}.\n"
        "Asegúrate de haber ejecutado detection.py primero."
    )

model = YOLO(str(MODEL_PATH))
print("[API-IA] ✅ Modelo cargado correctamente.")

# ──────────────────────────────────────────────
# App Flask
# ──────────────────────────────────────────────
app = Flask(__name__)
CORS(app)   # Permite solicitudes desde la app Expo/RN


@app.route("/health", methods=["GET"])
def health():
    """Endpoint de estado del servidor."""
    return jsonify({"status": "ok", "model": str(MODEL_PATH)})


@app.route("/classify", methods=["POST"])
def classify():
    """
    Recibe una imagen en base64 y retorna el tipo de residuo detectado.

    Input (body): imagen en base64 puro (sin prefijo data:image/...)
                  O JSON con campo "image" en base64.

    Output (JSON):
    {
        "predictions": [
            {
                "class": "plastic_bottle",
                "confidence": 0.92,
                "points": 5,
                "color": "#22c55e",
                # Campos ficticios para compatibilidad con DetectionBox de ScanScreen:
                "x": 112, "y": 112, "width": 200, "height": 200
            }
        ],
        "image": { "width": 224, "height": 224 }
    }
    """
    try:
        # 1. Obtener imagen del request
        if request.content_type and "application/json" in request.content_type:
            data = request.get_json()
            b64_data = data.get("image", "")
        else:
            b64_data = request.data.decode("utf-8")

        if not b64_data:
            return jsonify({"error": "No image data received"}), 400

        # Limpiar prefijo data:image si existe
        if "," in b64_data:
            b64_data = b64_data.split(",")[1]

        # 2. Decodificar y convertir a PIL Image
        img_bytes = base64.b64decode(b64_data)
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        img_w, img_h = image.size

        # 3. Clasificar con el modelo
        results = model.predict(
            source=image,
            imgsz=IMAGE_SIZE,
            verbose=False,
            conf=CONFIDENCE_THRESHOLD,
        )

        # 4. Construir respuesta
        predictions = []
        if results and len(results) > 0:
            result = results[0]
            probs = result.probs   # ClassificationResults

            if probs is not None:
                top1_idx = int(probs.top1)
                top1_conf = float(probs.top1conf)
                class_name = model.names[top1_idx]

                if top1_conf >= CONFIDENCE_THRESHOLD:
                    info = CLASS_INFO.get(class_name, {"points": 1, "color": "#22c55e"})
                    predictions.append({
                        "class": class_name,
                        "confidence": round(top1_conf * 100, 1),  # Porcentaje
                        "points": info["points"],
                        "color": info["color"],
                        # Posición ficticia centrada (compatibilidad con ScanScreen DetectionBox)
                        "x": img_w // 2,
                        "y": img_h // 2,
                        "width": int(img_w * 0.6),
                        "height": int(img_h * 0.6),
                    })

        return jsonify({
            "predictions": predictions,
            "image": {"width": img_w, "height": img_h},
        })

    except Exception as e:
        print(f"[API-IA] Error: {e}")
        return jsonify({"error": str(e)}), 500


# ──────────────────────────────────────────────
# Punto de entrada
# ──────────────────────────────────────────────
if __name__ == "__main__":
    print(f"\n[API-IA] 🌊 Servidor Tu Playa Limpia corriendo en http://0.0.0.0:{PORT}")
    print(f"[API-IA] 📡 Endpoint principal: POST http://localhost:{PORT}/classify")
    print(f"[API-IA] 💚 Health check:       GET  http://localhost:{PORT}/health\n")
    app.run(host="0.0.0.0", port=PORT, debug=False)
