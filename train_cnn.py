import os
import matplotlib.pyplot as plt
import tensorflow as tf
from tensorflow.keras import layers, models

# 1. Configuración de parámetros
DATASET_DIR = r"c:\Users\USUARO\clon\Tu-Playa-Limpia-RN\dataset"
IMAGE_SIZE = (128, 128)  # Redimensionamiento de las imágenes para equilibrio de detalle y velocidad en móvil
BATCH_SIZE = 32
EPOCHS = 15
MODEL_NAME = "model_waste_classifier.keras"
TFLITE_MODEL_NAME = "model_waste_classifier.tflite"

def main():
    print("Iniciando preparación del dataset...")
    
    # 2. Carga y partición del dataset
    # Carga de imágenes de entrenamiento (80%)
    train_ds = tf.keras.utils.image_dataset_from_directory(
        DATASET_DIR,
        validation_split=0.2,
        subset="training",
        seed=123,
        image_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE
    )
    
    # Carga de imágenes de validación (20%)
    val_ds = tf.keras.utils.image_dataset_from_directory(
        DATASET_DIR,
        validation_split=0.2,
        subset="validation",
        seed=123,
        image_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE
    )
    
    # Obtener los nombres de las clases (debe ser: ['battery', 'cardboard', 'glass', 'metal', 'paper', 'plastic', 'plastic_bottle'])
    class_names = train_ds.class_names
    num_classes = len(class_names)
    print(f"Clases identificadas ({num_classes}): {class_names}")
    
    # Optimización del rendimiento de lectura en memoria
    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.cache().shuffle(1000).prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.cache().prefetch(buffer_size=AUTOTUNE)

    # 3. Definición de la Red Neuronal Convolucional (CNN)
    # Basada en el modelo del notebook pero adaptada para mayor resolución y menor sobreajuste
    model = models.Sequential([
        # Capa de reescalado: Normaliza los píxeles de [0, 255] a [0, 1] en el flujo
        layers.Rescaling(1./255, input_shape=(IMAGE_SIZE[0], IMAGE_SIZE[1], 3)),
        
        # Primera capa convolucional y pooling
        layers.Conv2D(32, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        
        # Segunda capa convolucional y pooling
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        
        # Tercera capa convolucional y pooling
        layers.Conv2D(128, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        
        # Cuarta capa convolucional (para capturar patrones más complejos en mayor resolución)
        layers.Conv2D(128, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        
        # Aplanamiento y capas densas
        layers.Flatten(),
        layers.Dense(128, activation='relu'),
        
        # Capa Dropout para prevenir sobreajuste (overfitting) en dispositivos móviles
        layers.Dropout(0.5),
        
        # Capa de salida con activación Softmax para clasificación multiclase (7 clases)
        layers.Dense(num_classes, activation='softmax')
    ])

    print("Estructura del modelo:")
    model.summary()

    # 4. Compilación del modelo
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

    # 5. Entrenamiento del modelo
    print(f"Iniciando el entrenamiento por {EPOCHS} épocas...")
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS
    )

    # 6. Guardar el modelo entrenado en Keras
    model.save(MODEL_NAME)
    print(f"Modelo guardado exitosamente como '{MODEL_NAME}'")

    # 7. Conversión a TensorFlow Lite (.tflite) para integración móvil
    print("Convirtiendo el modelo entrenado a formato TensorFlow Lite...")
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    tflite_model = converter.convert()
    
    # Guardar el archivo .tflite
    with open(TFLITE_MODEL_NAME, 'wb') as f:
        f.write(tflite_model)
    print(f"Modelo .tflite exportado exitosamente como '{TFLITE_MODEL_NAME}'")

    # 8. Graficar y guardar curvas de pérdida y precisión
    plt.figure(figsize=(12, 4))
    
    # Precisión
    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'], label='Precisión Entr.')
    plt.plot(history.history['val_accuracy'], label='Precisión Val.')
    plt.title('Precisión del Modelo')
    plt.xlabel('Época')
    plt.ylabel('Accuracy')
    plt.legend()
    
    # Pérdida
    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'], label='Pérdida Entr.')
    plt.plot(history.history['val_loss'], label='Pérdida Val.')
    plt.title('Pérdida del Modelo')
    plt.xlabel('Época')
    plt.ylabel('Loss')
    plt.legend()
    
    plt.tight_layout()
    plt.savefig('training_metrics.png')
    print("Métricas de entrenamiento guardadas como 'training_metrics.png'")

if __name__ == "__main__":
    main()
