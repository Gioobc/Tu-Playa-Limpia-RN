# Tu Playa Limpia

Tu Playa Limpia es una app pensada para que cualquier persona pueda participar en el cuidado de las playas en Perú. La experiencia está centrada en cuatro acciones simples: descubrir playas, escanear residuos, reportar problemas y ganar recompensas por contribuir.

---

## Características

- 🌊 **Exploración de playas** — Consulta playas disponibles, su información general y el contexto de cada zona.
- 📍 **Mapa interactivo** — Ubica playas y revisa reportes o puntos relevantes desde una vista geográfica.
- 📷 **Escaneo con cámara** — Usa la cámara para detectar residuos y sumar progreso dentro de la app.
- 📝 **Reportes de incidencias** — Registra situaciones como basura, estado de la playa o hallazgos importantes con ubicación e imagen.
- 🏆 **Progreso y recompensas** — Gana puntos TPL, avanza de nivel y desbloquea contenido según tu participación.
- 👛 **Wallet Web3** — Conecta una wallet para experiencias vinculadas a recompensas y activos digitales, basadas en la red zkSYS Testnet de Syscoin.
- 🎨 **Experiencia unificada** — La misma base de código funciona para web, Android e iOS.

---

## Cómo funciona para el usuario

La app guía al usuario desde el inicio hasta la participación activa. Primero puede crear su cuenta o entrar con su perfil. Después accede al mapa de playas, donde ve puntos de interés, detalles de cada lugar y el estado general de la zona.

Desde la pantalla de escaneo, la persona puede usar la cámara para detectar residuos y sumar progreso. Si encuentra basura, animales muertos u otra situación relevante, puede crear un reporte con ubicación y una foto. Ese reporte ayuda a dejar constancia de lo que ocurre en la playa y a priorizar acciones.

El sistema también contempla una parte de motivación: el usuario gana puntos TPL, avanza de nivel y desbloquea contenidos o promociones según su progreso. Si conecta su wallet, puede ver una integración más completa con recompensas y activos digitales.

## Lo que puede hacer

- Explorar playas y ver su información principal.
- Revisar el estado o historial de reportes de una playa.
- Escanear residuos con la cámara para registrar avances.
- Enviar reportes con texto, ubicación e imagen.
- Consultar premios, puntos y nivel TPL.
- Acceder a promociones o contenido desbloqueable según su progreso.
- Conectar una wallet para la parte Web3 del sistema.

---

## Partes del sistema

- [App.js](App.js) y [index.js](index.js): punto de entrada de la aplicación.
- [navigation/AppNavigator.js](navigation/AppNavigator.js): define el recorrido entre autenticación, wallet y pestañas principales.
- [screens/](screens): contiene las pantallas que ve el usuario.
- [components/](components): agrupa modales, tarjetas y elementos reutilizables.
- [context/](context): maneja autenticación, idioma, tema, wallet y progreso del juego.
- [constants/](constants): concentra temas, textos, entorno y ajustes compartidos.
- [components/back/](components/back): backend para recibir y guardar reportes.
- [utils/blockchain/](utils/blockchain): lógica relacionada con TPL, NFTs y wallet.
- [deploy-zksync/](deploy-zksync) y [hardhat-zksys/](hardhat-zksys): soporte para despliegues y contratos.

---

## Ejecución

### Frontend

```bash
npm run start
```

Opciones disponibles:

- Android: `npm run android`
- iOS: `npm run ios`
- Web: `npm run web`
- Web con caché limpia: `npm run web:dev`
- Build web: `npm run build:web`

### Backend

```bash
cd components/back
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> Si ejecutas la app en local, el frontend normalmente apunta a `http://localhost:8000` como base del API.

---

## Notas

- El backend de reportes usa MongoDB y expone endpoints para salud, guardado y consulta de reportes.
- Si la app se usa en desarrollo local, normalmente el frontend apunta a `http://localhost:8000` como API.
- La integración de wallet y recompensas forma parte de la experiencia de usuario, no de una demo aislada.
