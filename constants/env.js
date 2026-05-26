
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
};
// Validar variables críticas
const validateEnv = () => {
  const missingVars = [];
  if (!ENV.ROBOFLOW_API_KEY) {
    console.warn("ROBOFLOW_API_KEY not configured. Scanner will not work.");
    missingVars.push("EXPO_PUBLIC_ROBOFLOW_API_KEY");
  }
  if (missingVars.length > 0) {
    console.warn(
      `Missing environment variables: ${missingVars.join(", ")}`,
    );
  }
};
if (__DEV__) {
  validateEnv();
}
export default ENV;
