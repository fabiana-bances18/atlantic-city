
const request = require('supertest');

jest.mock('../db', () => ({ query: jest.fn() }));

const poolFalso = require('../db');
const app = require('../app');
const jwt = require('jsonwebtoken');

function token(id, rol) {
    return jwt.sign({ id, rol }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

const admin = token(1, 'Administrador');
const marketing = token(3, 'Gerente de Marketing');
const cliente = token(4, 'Cliente');

const datos = {
    documento_identidad: '99999999',
    nombres: 'Andrea',
    apellidos: 'Torres'
};

describe('API Atlantic City', () => {
    beforeEach(() => jest.clearAllMocks());

    test('GET / muestra que la API funciona', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
    });

    test('GET clientes sin token devuelve 401', async () => {
        const res = await request(app).get('/api/clientes');
        expect(res.statusCode).toBe(401);
    });

    test('GET clientes con token inválido devuelve 401', async () => {
        const res = await request(app).get('/api/clientes')
            .set('Authorization', 'Bearer invalido');
        expect(res.statusCode).toBe(401);
    });

    test('Administrador puede listar clientes', async () => {
        poolFalso.query.mockResolvedValueOnce([[{ nombres: 'Carlos' }], []]);

        const res = await request(app).get('/api/clientes')
            .set('Authorization', `Bearer ${admin}`);

        expect(res.statusCode).toBe(200);
        expect(res.body[0].nombres).toBe('Carlos');
    });

    test('Cliente consulta solo sus datos', async () => {
        poolFalso.query.mockResolvedValueOnce([[{ nombres: 'Andrea' }], []]);

        const res = await request(app).get('/api/clientes')
            .set('Authorization', `Bearer ${cliente}`);

        expect(res.statusCode).toBe(200);
        expect(poolFalso.query).toHaveBeenCalledWith(
            expect.stringContaining('id_usuario = ?'), [4]
        );
    });

    test('POST registra un cliente', async () => {
        poolFalso.query.mockResolvedValueOnce([{ insertId: 99 }, []]);

        const res = await request(app).post('/api/clientes')
            .set('Authorization', `Bearer ${admin}`).send(datos);

        expect(res.statusCode).toBe(201);
    });

    test('POST sin datos obligatorios devuelve 400', async () => {
        const res = await request(app).post('/api/clientes')
            .set('Authorization', `Bearer ${admin}`).send({ nombres: 'Andrea' });
        expect(res.statusCode).toBe(400);
    });

    test('POST con documento duplicado devuelve 409', async () => {
        const error = new Error('Duplicado');
        error.code = 'ER_DUP_ENTRY';
        poolFalso.query.mockRejectedValueOnce(error);
        const original = console.error;
        console.error = jest.fn();

        try {
            const res = await request(app).post('/api/clientes')
                .set('Authorization', `Bearer ${admin}`).send(datos);
            expect(res.statusCode).toBe(409);
        } finally {
            console.error = original;
        }
    });

    test('Marketing no puede registrar clientes', async () => {
        const res = await request(app).post('/api/clientes')
            .set('Authorization', `Bearer ${marketing}`).send(datos);
        expect(res.statusCode).toBe(403);
    });

    test('PUT actualiza un cliente', async () => {
        poolFalso.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);

        const res = await request(app).put('/api/clientes/99')
            .set('Authorization', `Bearer ${admin}`).send(datos);
        expect(res.statusCode).toBe(200);
    });

    test('PUT sin datos obligatorios devuelve 400', async () => {
        const res = await request(app).put('/api/clientes/99')
            .set('Authorization', `Bearer ${admin}`).send({ nombres: 'Andrea' });
        expect(res.statusCode).toBe(400);
    });

    test('DELETE desactiva un cliente', async () => {
        poolFalso.query.mockResolvedValueOnce([{ affectedRows: 1 }, []]);

        const res = await request(app).delete('/api/clientes/99')
            .set('Authorization', `Bearer ${admin}`);
        expect(res.statusCode).toBe(200);
    });

    test('Marketing no puede eliminar clientes', async () => {
        const res = await request(app).delete('/api/clientes/99')
            .set('Authorization', `Bearer ${marketing}`);
        expect(res.statusCode).toBe(403);
    });

    test('DELETE de cliente inexistente devuelve 404', async () => {
        poolFalso.query.mockResolvedValueOnce([{ affectedRows: 0 }, []]);

        const res = await request(app).delete('/api/clientes/999')
            .set('Authorization', `Bearer ${admin}`);
        expect(res.statusCode).toBe(404);
    });
});
