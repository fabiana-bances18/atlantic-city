require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../db');

async function main() {
    const [nombreUsuario, nombreCompleto, rol, contrasena] = process.argv.slice(2);
    if (!nombreUsuario || !nombreCompleto || !rol || !contrasena) {
    console.log('Uso: node scripts/crear-usuario.js <usuario> "<nombre completo>" "<rol>" <contrasena>');
    process.exit(1);
    }

    const [roles] = await pool.query('SELECT id_rol FROM rol WHERE nombre = ?', [rol]);
    if (roles.length === 0) {
    console.log('El rol no existe');
    process.exit(1);
    }

    const hash = await bcrypt.hash(contrasena, 10);
    await pool.query(
    'INSERT INTO usuario (id_rol, nombre_usuario, contrasena_hash, nombre_completo) VALUES (?, ?, ?, ?)',
    [roles[0].id_rol, nombreUsuario, hash, nombreCompleto]
    );
    console.log('Usuario creado:', nombreUsuario);
    process.exit(0);
}

main().catch((e) => {
    console.error(e.message);
    process.exit(1);
});