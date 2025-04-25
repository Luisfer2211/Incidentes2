process.on('uncaughtException', (err) => {
    console.error('Critical Error:', err);
    process.exit(1);
});

const express = require('express');
const { Pool, Client } = require('pg'); 
const app = express();
const port = process.env.PORT || 6000;
const cors = require('cors');

const DB_HOST = process.env.DB_HOST || 'db'; 
const DB_USER = process.env.DB_USER || 'postgres'; 
const DB_PASSWORD = process.env.DB_PASSWORD || 'lol'; 
const DB_NAME = process.env.DB_NAME || 'Incidentes_bat'; 
const DB_PORT = 5432; 

const iniatDatabase = async () => {
    const client = new Client({
        user: DB_USER,
        host: DB_HOST, // ← Nombre del servicio Docker
        database: 'postgres',
        password: DB_PASSWORD,
        port: DB_PORT,
    });

    let retries = 5;
    while(retries > 0) {
        try {
            await client.connect();
            const dbExists = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'`);
            
            if (dbExists.rowCount === 0) {
                await client.query(`CREATE DATABASE "${DB_NAME}";`);
                console.log(`Base de datos "${DB_NAME}" creada exitosamente.`);
            } else {
                console.log(`La base de datos "${DB_NAME}" ya existe.`);
            }
            break;
        } catch (err) {
            retries--;
            console.log(`Reintentos restantes: ${retries}`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};


const initDatabase = async () => {
    const client = new Client({
        user: DB_USER,
        host: DB_HOST,
        database: 'postgres',
        password: DB_PASSWORD,
        port: DB_PORT,
    });

    let retries = 5;
    while(retries > 0) {
        try {
            await client.connect();
            const dbExists = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'`);
        
            if (dbExists.rowCount === 0) {
                await client.query(`CREATE DATABASE "${DB_NAME}";`);
                console.log(`Base de datos "${DB_NAME}" creada exitosamente.`);
            } else {
                console.log(`La base de datos "${DB_NAME}" ya existe.`);
            }
            break;
        } catch (err) {
            retries--;
            console.log(`Reintentos restantes: ${retries}`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        } finally {
            if (client) await client.end();
        }
    }
    if (retries === 0) throw new Error("No se pudo conectar a PostgreSQL");
};

const pool = new Pool({
    user: DB_USER,
    host: DB_HOST, 
    database: DB_NAME,
    password: DB_PASSWORD,
    port: DB_PORT,
});

const createTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS incidents (
            id SERIAL PRIMARY KEY,
            reporter VARCHAR(255) NOT NULL,
            description TEXT NOT NULL CHECK (LENGTH(description) >= 10),
            status VARCHAR(50) NOT NULL DEFAULT 'pendiente',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    try {
        await pool.query(query);
        console.log('Tabla "incidents" creada o ya existe');
    } catch (err) {
        console.error('Error al crear la tabla:', err);
    }
};

// Modifica el bloque initialize()
const initialize = async () => {
    try {
        await initDatabase();
        await createTable();
        console.log("✅ Base de datos lista");
    } catch (err) {
        console.error("🔥 Error crítico:", err);
        process.exit(1);  // Detener el servidor si falla
    }
};

// Iniciar servidor solo después de la inicialización
initialize().then(() => {
    app.listen(port, "0.0.0.0", () => {
        console.log(`🔥 Server running on http://0.0.0.0:${port}`);
    });
});

app.use(express.json());
app.use(cors({
    origin: "http://localhost:1122", 
    methods: ["GET", "POST", "PUT", "DELETE"]
  }));

  app.post('/api/incidents', async (req, res) => {
    const { reporter, description } = req.body;

    // Validación mejorada para el reportero
    if (!reporter || reporter.trim().length === 0) {
        return res.status(400).json({ error: 'El reportero no puede estar vacío o contener solo espacios' });
    }

    if (!description || description.length < 10) {
        return res.status(400).json({ error: 'La descripción debe tener al menos 10 caracteres' });
    }

    const created_at = new Date().toISOString();
    const query = `
        INSERT INTO incidents (reporter, description, status, created_at)
        VALUES ($1, $2, 'pendiente', $3)
        RETURNING *;
    `;
    try {
        const result = await pool.query(query, [reporter.trim(), description, created_at]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al crear incidente:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/api/incidents', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM incidents');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener incidentes:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/api/incidents/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM incidents WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: '404 Not Found - Incidente no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al obtener incidente:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.put('/api/incidents/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pendiente', 'en proceso', 'resuelto'].includes(status)) {
        return res.status(400).json({ error: 'El estado debe ser "pendiente", "en proceso" o "resuelto".' });
    }

    try {
        const result = await pool.query('UPDATE incidents SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: '404 Not Found - Incidente no encontrado' });
        }
        res.json({ message: 'Estado actualizado correctamente', incident: result.rows[0] });
    } catch (err) {
        console.error('Error al actualizar estado:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.delete('/api/incidents/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM incidents WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: '404 Not Found - Incidente no encontrado' });
        }
        res.json({ message: 'Incidente eliminado correctamente' });
    } catch (err) {
        console.error('Error al eliminar incidente:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});