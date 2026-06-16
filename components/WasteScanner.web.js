import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { CameraView } from 'expo-camera';

const LABELS = ["battery", "cardboard", "glass", "metal", "paper", "plastic", "plastic_bottle"];
const IMG_SIZE = 224;
const SCAN_INTERVAL_MS = 1000;
const CONFIDENCE_THRESHOLD = 0.55;

export default function WasteScanner({ onPrediction, isActive, style }) {
    const [tfReady, setTfReady] = useState(false);
    const [modelLoading, setModelLoading] = useState(true);
    const modelRef = useRef(null);
    const intervalRef = useRef(null);
    const containerRef = useRef(null);
    const isScanningRef = useRef(false);

    // Dynamically load TensorFlow.js from CDN
    useEffect(() => {
        if (window.tf) {
            setTfReady(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js';
        script.onload = () => {
            setTfReady(true);
        };
        script.onerror = (e) => {
            console.error("Failed to load TensorFlow.js from CDN:", e);
        };
        document.head.appendChild(script);
    }, []);

    // Load TFJS layers model
    useEffect(() => {
        if (!tfReady) return;

        async function loadModel() {
            try {
                setModelLoading(true);
                // Load model from public directory
                const model = await window.tf.loadLayersModel('/model/tfjs/model.json');
                modelRef.current = model;
                setModelLoading(false);
                console.log("[WasteScanner Web] Model loaded successfully");
            } catch (err) {
                console.error("[WasteScanner Web] Error loading model:", err);
            }
        }
        loadModel();
    }, [tfReady]);

    const runInference = useCallback(() => {
        if (!modelRef.current || !isActive || isScanningRef.current) return;

        // Find the video element inside our container or DOM
        const video = containerRef.current?.querySelector('video') || document.querySelector('video');
        if (!video || video.readyState < 2) return; // HAVE_CURRENT_DATA

        isScanningRef.current = true;

        try {
            window.tf.tidy(() => {
                const tensor = window.tf.browser.fromPixels(video)
                    .resizeNearestNeighbor([IMG_SIZE, IMG_SIZE])
                    .toFloat()
                    .div(127.5)
                    .sub(1.0)
                    .expandDims(0);

                const predictions = modelRef.current.predict(tensor);
                const scores = predictions.dataSync();

                const maxIdx = scores.indexOf(Math.max(...scores));
                const maxScore = scores[maxIdx];

                if (maxScore >= CONFIDENCE_THRESHOLD) {
                    onPrediction({
                        class: LABELS[maxIdx],
                        confidence: maxScore,
                    });
                } else {
                    onPrediction(null);
                }
            });
        } catch (err) {
            console.warn("[WasteScanner Web] Inference error:", err);
            onPrediction(null);
        } finally {
            isScanningRef.current = false;
        }
    }, [isActive, onPrediction]);

    useEffect(() => {
        if (isActive && !modelLoading && tfReady) {
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
    }, [isActive, modelLoading, tfReady, runInference]);

    return (
        <View ref={containerRef} style={style || styles.container}>
            <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
            />
            {modelLoading && (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#00E5FF" />
                    <Text style={styles.loaderText}>Cargando modelo de IA para Web...</Text>
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
