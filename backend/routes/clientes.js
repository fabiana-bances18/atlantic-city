
const express = require('express');
const router = express.Router();
const pool = require('../db');
const verificarToken = require('../middleware/auth');

router.use(verificarToken);

const rolesGestion = ['Administrador', 'Atencion al Cliente'];
const rolesConsulta = [...rolesGestion, 'Gerente de Marketing', 'Cliente'];

// Listar clientes
router.get('/', async (req, res) => {
    if (!rolesConsulta.includes(req.usuario.rol)) {
        return res.status(403).json({ mensaje: 'Acceso denegado' });
    }

    try {
        const [filas] = req.usuario.rol === 'Cliente'
            ? await pool.query(
                'SELECT * FROM cliente WHERE activo = 1 AND id_usuario = ?',
                [req.usuario.id]
            )
            : await pool.query(
                'SELECT * FROM cliente WHERE activo = 1 ORDER BY id_cliente DESC'
            );

        res.json(filas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener clientes' });
    }
});

// Registrar cliente
router.post('/', async (req, res) => {
    if (!rolesGestion.includes(req.usuario.rol)) {
        return res.status(403).json({ mensaje: 'Acceso denegado' });
    }

    const {
        documento_identidad, nombres, apellidos,
        telefono, correo, direccion
    } = req.body;

    if (!documento_identidad || !nombres || !apellidos) {
        return res.status(400).json({
            mensaje: 'Documento, nombres y apellidos son obligatorios'
        });
    }

    try {
        const [resultado] = await pool.query(
            `INSERT INTO cliente
            (documento_identidad, nombres, apellidos, telefono, correo, direccion)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                documento_identidad, nombres, apellidos,
                telefono || null, correo || null, direccion || null
            ]
        );

        res.status(201).json({
            mensaje: 'Cliente registrado exitosamente',
            id_cliente: resultado.insertId
        });
    } catch (error) {
        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                mensaje: 'El documento de identidad ya está registrado'
            });
        }

        res.status(500).json({ mensaje: 'Error al registrar el cliente' });
    }
});

// Modificar cliente
router.put('/:id', async (req, res) => {
    if (!rolesGestion.includes(req.usuario.rol)) {
        return res.status(403).json({ mensaje: 'Acceso denegado' });
    }

    const { id } = req.params;
    const {
        documento_identidad, nombres, apellidos,
        telefono, correo, direccion
    } = req.body;

    if (!/^[1-9]\d*$/.test(id)) {
        return res.status(400).json({ mensaje: 'Identificador no válido' });
    }

    if (!documento_identidad || !nombres || !apellidos) {
        return res.status(400).json({
            mensaje: 'Documento, nombres y apellidos son obligatorios'
        });
    }

    try {
        const [resultado] = await pool.query(
            `UPDATE cliente
            SET documento_identidad = ?, nombres = ?, apellidos = ?,
                telefono = ?, correo = ?, direccion = ?
            WHERE id_cliente = ? AND activo = 1`,
            [
                documento_identidad, nombres, apellidos,
                telefono || null, correo || null, direccion || null, id
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }

        res.json({ mensaje: 'Cliente actualizado exitosamente' });
    } catch (error) {
        console.error(error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                mensaje: 'El documento de identidad ya está registrado'
            });
        }

        res.status(500).json({ mensaje: 'Error al actualizar el cliente' });
    }
});

// Eliminar cliente (desactivación lógica)
router.delete('/:id', async (req, res) => {
    if (!rolesGestion.includes(req.usuario.rol)) {
        return res.status(403).json({ mensaje: 'Acceso denegado' });
    }

    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
        return res.status(400).json({ mensaje: 'Identificador no válido' });
    }

    try {
        const [resultado] = await pool.query(
            'UPDATE cliente SET activo = 0 WHERE id_cliente = ? AND activo = 1',
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }

        res.json({ mensaje: 'Cliente eliminado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al eliminar el cliente' });
    }
});

module.exports = router;
