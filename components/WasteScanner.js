import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { CameraView } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { useTensorflowModel } from 'react-native-fast-tflite';
import jpeg from 'jpeg-js';

// Base64 decoding helper (works faster and is environment independent)
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const lookup = new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
}

function decodeBase64(base64) {
    let bufferLength = base64.length * 0.75;
    let len = base64.length;
    let i = 0;
    let p = 0;
    if (base64[base64.length - 1] === '=') {
        bufferLength--;
        if (base64[base64.length - 2] === '=') {
            bufferLength--;
        }
    }
    const bytes = new Uint8Array(bufferLength);
    for (i = 0; i < len; i += 4) {
        const encoded1 = lookup[base64.charCodeAt(i)];
        const encoded2 = lookup[base64.charCodeAt(i + 1)];
        const encoded3 = lookup[base64.charCodeAt(i + 2)];
        const encoded4 = lookup[base64.charCodeAt(i + 3)];
        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
    return bytes;
}

// Bilinear/Nearest Neighbor resizing to 224x224
function resizeRGBA(data, width, height, targetWidth, targetHeight) {
    const resized = new Uint8Array(targetWidth * targetHeight * 4);
    const xRatio = width / targetWidth;
    const yRatio = height / targetHeight;
    for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
            const px = Math.floor(x * xRatio);
            const py = Math.floor(y * yRatio);
            const srcIdx = (py * width + px) * 4;
            const dstIdx = (y * targetWidth + x) * 4;
            resized[dstIdx] = data[srcIdx];
            resized[dstIdx + 1] = data[srcIdx + 1];
            resized[dstIdx + 2] = data[srcIdx + 2];
            resized[dstIdx + 3] = data[srcIdx + 3];
        }
    }
    return resized;
}

const MODEL_PATH = require('../assets/model/modelo_residuos.tflite');
const LABELS = ["battery", "cardboard", "glass", "metal", "paper", "plastic", "plastic_bottle"];

const IMG_SIZE = 224;
const SCAN_INTERVAL_MS = 1000;
const CONFIDENCE_THRESHOLD = 0.55;

export default function WasteScanner({ onPrediction, isActive, style }) {
    const cameraRef = useRef(null);
    const model = useTensorflowModel(MODEL_PATH);
    const isScanningRef = useRef(false);
    const intervalRef = useRef(null);

    const runInference = useCallback(async () => {
        if (!model.model || !cameraRef.current || !isActive || isScanningRef.current) return;

        isScanningRef.current = true;
        let photoUri = null;

        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.2,
                base64: true,
                skipProcessing: true,
                width: 224,
                height: 224,
            });

            if (!photo || !photo.base64) {
                isScanningRef.current = false;
                return;
            }

            photoUri = photo.uri;
            const base64Data = photo.base64.replace(/^data:image\/\w+;base64,/, "");
            const jpegBytes = decodeBase64(base64Data);

            // Decode JPEG bytes to RGBA
            const rawImg = jpeg.decode(jpegBytes, { useTArray: true });
            const resized = resizeRGBA(rawImg.data, rawImg.width, rawImg.height, IMG_SIZE, IMG_SIZE);

            // Convert to Float32 normalized [-1, 1] for MobileNetV2
            const float32 = new Float32Array(IMG_SIZE * IMG_SIZE * 3);
            for (let i = 0; i < IMG_SIZE * IMG_SIZE; i++) {
                const r = resized[i * 4];
                const g = resized[i * 4 + 1];
                const b = resized[i * 4 + 2];
                float32[i * 3] = (r / 127.5) - 1.0;
                float32[i * 3 + 1] = (g / 127.5) - 1.0;
                float32[i * 3 + 2] = (b / 127.5) - 1.0;
            }

            // Run TFLite inference
            const output = await model.model.run([float32]);
            const scores = Array.from(output[0]);

            const maxIdx = scores.indexOf(Math.max(...scores));
            const maxScore = scores[maxIdx];

            if (maxScore >= CONFIDENCE_THRESHOLD) {
                const predictedClass = LABELS[maxIdx];
                onPrediction({
                    class: predictedClass,
                    confidence: maxScore,
                });
            } else {
                onPrediction(null);
            }
        } catch (err) {
            console.warn("[WasteScanner Native] Inference error:", err);
            onPrediction(null);
        } finally {
            if (photoUri) {
                FileSystem.deleteAsync(photoUri, { idempotent: true }).catch(() => {});
            }
            isScanningRef.current = false;
        }
    }, [model.model, isActive, onPrediction]);

    useEffect(() => {
        if (isActive && model.state === 'loaded') {
            intervalRef.current = setInterval(runInference, SCAN_INTERVAL_MS);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isActive, model.state, runInference]);

    return (
        <View style={style || styles.container}>
            <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing="back"
            />
            {model.state === 'loading' && (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#00E5FF" />
                    <Text style={styles.loaderText}>Cargando modelo de IA...</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    loader: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    loaderText: {
        color: '#fff',
        marginTop: 10,
        fontWeight: '600',
    },
});
