/**
 * WasteScanner.web.js  — Versión WEB
 *
 * El modelo TF.js exportado con Keras 3 es incompatible con TF.js 4.x
 * (capas TrueDivide / Subtract no soportadas + formato nodeData distinto).
 *
 * Solución: capturar frame del video con canvas y enviarlo al backend
 * FastAPI (/classify) que corre TFLite localmente. Esto es más rápido,
 * más preciso y no requiere cargar 9 MB de modelo en el browser.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { CameraView } from 'expo-camera';
import ENV from '../constants/env';

const SCAN_INTERVAL_MS = 1500;   // cada 1.5s para no saturar el backend
const IMG_SIZE = 224;

// URL del endpoint de clasificación — usa la misma base que el resto de la app
const CLASSIFY_URL = `${ENV.API_BASE_URL}/classify`;

export default function WasteScanner({ onPrediction, isActive, style }) {
    const [status, setStatus] = useState('ready'); // 'ready' | 'scanning' | 'error'
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const intervalRef = useRef(null);
    const isScanningRef = useRef(false);

    // ── Captura frame y envía al backend ──────────────────────────────────
    const runInference = useCallback(async () => {
        if (!isActive || isScanningRef.current) return;

        // Buscar el elemento <video> de la cámara en el DOM
        const video = containerRef.current?.querySelector('video')
            || document.querySelector('video');

        if (!video || video.readyState < 2 || video.videoWidth === 0) return;

        isScanningRef.current = true;
        setStatus('scanning');

        try {
            // 1. Capturar frame en canvas 224x224
            if (!canvasRef.current) {
                canvasRef.current = document.createElement('canvas');
            }
            const canvas = canvasRef.current;
            canvas.width = IMG_SIZE;
            canvas.height = IMG_SIZE;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, IMG_SIZE, IMG_SIZE);

            // 2. Convertir a JPEG base64 (calidad 0.7 para reducir payload)
            const b64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];

            // 3. Enviar al backend
            const resp = await fetch(CLASSIFY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: b64 }),
                signal: AbortSignal.timeout(5000),  // timeout 5s
            });

            if (!resp.ok) {
                try {
                    const errData = await resp.json();
                    console.warn(`[WasteScanner Web] Backend error ${resp.status}:`, errData.error || errData);
                } catch (e) {
                    console.warn('[WasteScanner Web] Backend error:', resp.status);
                }
                onPrediction(null);
                return;
            }

            const data = await resp.json();
            const preds = data.predictions || [];

            if (preds.length > 0 && preds[0].confidence >= 0.45) {
                onPrediction({
                    class: preds[0].class,
                    confidence: preds[0].confidence,
                });
            } else {
                onPrediction(null);
            }

            setStatus('ready');
        } catch (err) {
            // Timeout o red caída → no mostrar error, solo null
            if (err.name !== 'TimeoutError') {
                console.warn('[WasteScanner Web] Inference error:', err.message || err);
            }
            onPrediction(null);
            setStatus('ready');
        } finally {
            isScanningRef.current = false;
        }
    }, [isActive, onPrediction]);

    // ── Intervalo de escaneo ──────────────────────────────────────────────
    useEffect(() => {
        if (isActive) {
            intervalRef.current = setInterval(runInference, SCAN_INTERVAL_MS);
        } else {
            clearInterval(intervalRef.current);
            isScanningRef.current = false;
        }
        return () => {
            clearInterval(intervalRef.current);
            isScanningRef.current = false;
        };
    }, [isActive, runInference]);

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <View ref={containerRef} style={style || styles.container}>
            <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
            />

            {/* Indicador sutil de escaneo (no bloquea la vista) */}
            {isActive && status === 'scanning' && (
                <View style={styles.scanBadge}>
                    <ActivityIndicator size="small" color="#00E5FF" />
                    <Text style={styles.scanText}>Analizando...</Text>
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
    scanBadge: {
        position: 'absolute',
        bottom: 16,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 8,
        zIndex: 10,
    },
    scanText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '500',
    },
});
