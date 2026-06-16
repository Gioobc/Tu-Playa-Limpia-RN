const ENV = {
  APP_NAME: process.env.APP_NAME || "Tu Playa Limpia",
  APP_VERSION: process.env.APP_VERSION || "1.0.1",
  APP_URL: process.env.EXPO_PUBLIC_APP_URL || process.env.APP_URL || "https://tuplayalimpia-tpl.vercel.app",
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 
                (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') 
                 ? "https://tuplayalimpia-backend.onrender.com" 
                 : "http://localhost:8000"),
  // Usar modelo local TFLite (MobileNetV2 entrenado) en el dispositivo
  USE_TFLITE: true,
};

export default ENV;
