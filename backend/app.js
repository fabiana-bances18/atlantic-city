
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/clientes', require('./routes/clientes'));

app.get('/', (req, res) => {
    res.json({ mensaje: 'API de Atlantic City funcionando' });
});

// Comprueba la conexión con la base de datos
app.get('/api/salud', async (req, res) => {
    try {
        const [filas] = await pool.query(
            'SELECT COUNT(*) AS roles FROM rol'
        );

        res.json({
            estado: 'ok',
            roles: filas[0].roles
        });
    } catch (error) {
        res.status(500).json({
            estado: 'error',
            mensaje: error.message
        });
    }
});

module.exports = app;
