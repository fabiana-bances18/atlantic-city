const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();
const MAX_INTENTOS = 5;
const MINUTOS_BLOQUEO = 15;

router.post('/login', async (req, res) => {
    const { nombre_usuario, contrasena } = req.body;
    if (!nombre_usuario || !contrasena) {
    return res.status(400).json({ mensaje: 'Usuario y contraseña son obligatorios' });
    }

    try {
    const [filas] = await pool.query(
        `SELECT u.id_usuario, u.contrasena_hash, u.nombre_completo, u.activo,
                u.intentos_fallidos, u.bloqueado_hasta, r.nombre AS rol
        FROM usuario u
        JOIN rol r ON r.id_rol = u.id_rol
        WHERE u.nombre_usuario = ?`,
        [nombre_usuario]
    );
    const usuario = filas[0];

    if (!usuario || !usuario.activo) {
        return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
    }

    if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
        return res.status(423).json({ mensaje: 'Cuenta bloqueada temporalmente. Intente más tarde' });
    }

    const correcta = await bcrypt.compare(contrasena, usuario.contrasena_hash);

    if (!correcta) {
        const intentos = usuario.intentos_fallidos + 1;
        if (intentos >= MAX_INTENTOS) {
        await pool.query(
            `UPDATE usuario
            SET intentos_fallidos = 0, bloqueado_hasta = DATE_ADD(NOW(), INTERVAL ? MINUTE)
            WHERE id_usuario = ?`,
            [MINUTOS_BLOQUEO, usuario.id_usuario]
        );
        } else {
        await pool.query(
            'UPDATE usuario SET intentos_fallidos = ? WHERE id_usuario = ?',
            [intentos, usuario.id_usuario]
        );
        }
        return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
    }

    await pool.query(
        'UPDATE usuario SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id_usuario = ?',
        [usuario.id_usuario]
    );

    const token = jwt.sign(
        { id: usuario.id_usuario, rol: usuario.rol },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );

    res.json({
        token,
        usuario: { id: usuario.id_usuario, nombre_completo: usuario.nombre_completo, rol: usuario.rol }
    });
    } catch (error) {
    res.status(500).json({ mensaje: 'Error del servidor' });
    }
});

module.exports = router;