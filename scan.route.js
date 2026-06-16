// routes/scan.js
// Endpoint que recibe el resultado del escaneo desde React Native
// y lo guarda en la base de datos
//
// Agregar a tu app principal:
//   const scanRouter = require('./routes/scan')
//   app.use('/api/scan', scanRouter)

const express = require('express')
const router = express.Router()

// ⚠️ Ajusta esto a tu cliente de DB actual (pg, mysql2, mongodb, etc.)
// Ejemplo con pg (PostgreSQL):
// const { Pool } = require('pg')
// const db = new Pool({ connectionString: process.env.DATABASE_URL })

// Mapa de clases → información de reciclaje
const WASTE_INFO = {
    battery: { categoria: 'Peligroso', puntos: 15, instruccion: 'Deposita en punto limpio especial para pilas' },
    cardboard: { categoria: 'Reciclable', puntos: 5, instruccion: 'Aplana y deposita en contenedor azul' },
    glass: { categoria: 'Reciclable', puntos: 8, instruccion: 'Deposita en contenedor verde' },
    metal: { categoria: 'Reciclable', puntos: 8, instruccion: 'Deposita en contenedor amarillo' },
    paper: { categoria: 'Reciclable', puntos: 5, instruccion: 'Deposita en contenedor azul' },
    plastic: { categoria: 'Reciclable', puntos: 6, instruccion: 'Deposita en contenedor amarillo' },
    plastic_bottle: { categoria: 'Reciclable', puntos: 6, instruccion: 'Vacía, aplana y deposita en contenedor amarillo' },
}

// POST /api/scan
router.post('/', async (req, res) => {
    const { waste_class, confidence, scanned_at } = req.body

    // Validar campos requeridos
    if (!waste_class || confidence === undefined) {
        return res.status(400).json({ error: 'Faltan campos: waste_class, confidence' })
    }

    // Validar clase conocida
    if (!WASTE_INFO[waste_class]) {
        return res.status(400).json({ error: `Clase desconocida: ${waste_class}` })
    }

    const info = WASTE_INFO[waste_class]

    try {
        // ── Guardar en DB ──────────────────────────────────────────────────────
        // Adapta esta query a tu ORM o driver nativo
        //
        // Ejemplo con pg:
        // const result = await db.query(
        //   `INSERT INTO scans (waste_class, confidence, categoria, puntos, scanned_at)
        //    VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        //   [waste_class, confidence, info.categoria, info.puntos, scanned_at || new Date()]
        // )
        // const scan_id = result.rows[0].id
        //
        // Ejemplo con mysql2:
        // const [result] = await db.execute(
        //   `INSERT INTO scans (waste_class, confidence, categoria, puntos, scanned_at)
        //    VALUES (?, ?, ?, ?, ?)`,
        //   [waste_class, confidence, info.categoria, info.puntos, scanned_at || new Date()]
        // )
        // const scan_id = result.insertId

        const scan_id = Date.now() // ← reemplaza con el ID real de tu DB

        // ── Respuesta al cliente ───────────────────────────────────────────────
        return res.status(201).json({
            success: true,
            scan_id,
            waste_class,
            confidence: parseFloat(confidence.toFixed(4)),
            categoria: info.categoria,
            puntos: info.puntos,
            instruccion: info.instruccion,
            scanned_at: scanned_at || new Date().toISOString(),
        })

    } catch (err) {
        console.error('Error al guardar scan:', err)
        return res.status(500).json({ error: 'Error interno al guardar el escaneo' })
    }
})

// GET /api/scan/stats  — estadísticas globales (opcional)
router.get('/stats', async (req, res) => {
    try {
        // Ejemplo con pg:
        // const result = await db.query(
        //   `SELECT waste_class, COUNT(*) as total, AVG(confidence) as avg_confidence
        //    FROM scans GROUP BY waste_class ORDER BY total DESC`
        // )
        // return res.json(result.rows)

        return res.json({ message: 'Conecta tu DB aquí' })
    } catch (err) {
        return res.status(500).json({ error: 'Error al obtener estadísticas' })
    }
})

module.exports = router