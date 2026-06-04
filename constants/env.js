
const ENV = {
  APP_NAME: process.env.APP_NAME || "Tu Playa Limpia",
  APP_VERSION: process.env.APP_VERSION || "1.0.1",
  APP_URL: process.env.EXPO_PUBLIC_APP_URL || process.env.APP_URL || "https://tuplayalimpia-tpl.vercel.app",
  ROBOFLOW_API_KEY: process.env.EXPO_PUBLIC_ROBOFLOW_API_KEY || "",
  ROBOFLOW_MODEL: process.env.EXPO_PUBLIC_ROBOFLOW_MODEL || "ocean-waste/2",
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 
                (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') 
                 ? "https://tuplayalimpia-backend.onrender.com" 
                 : "http://localhost:8000"),
  // API de IA propia (modelo YOLOv8 entrenado con dataset de residuos)
  // Configura EXPO_PUBLIC_AI_API_URL en tu archivo .env con la URL de tu servidor
  // Ejemplo local:      http://192.168.x.x:5000
  // Ejemplo producción: https://api-ia.tuplayalimpia.com
  AI_API_URL: process.env.EXPO_PUBLIC_AI_API_URL || "",
  // true = usa modelo propio | false = usa Roboflow como fallback
  USE_OWN_AI: process.env.EXPO_PUBLIC_USE_OWN_AI !== "false",
};
// Validar variables críticas
const validateEnv = () => {
  const missingVars = [];
  if (!ENV.ROBOFLOW_API_KEY && !ENV.USE_OWN_AI) {
    console.warn("ROBOFLOW_API_KEY not configured. Scanner will not work.");
    missingVars.push("EXPO_PUBLIC_ROBOFLOW_API_KEY");
  }
  if (ENV.USE_OWN_AI && !ENV.AI_API_URL) {
    console.warn(
      "⚠️  AI_API_URL no configurado. El escáner de IA no funcionará.\n" +
      "   Copia .env.example como .env y completa EXPO_PUBLIC_AI_API_URL\n" +
      "   con la IP/URL donde corre api_ia.py (ej: http://192.168.x.x:5000)"
    );
    missingVars.push("EXPO_PUBLIC_AI_API_URL");
  }
  if (missingVars.length > 0) {
    console.warn(`Missing environment variables: ${missingVars.join(", ")}`);
  }
};
if (__DEV__) {
  validateEnv();
}
export default ENV;
