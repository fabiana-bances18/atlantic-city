# Atlantic City - Sistema de Gestión de Clientes

## 1. Descripción del proyecto

El proyecto consiste en el desarrollo de un sistema web para la gestión de clientes de Atlantic City. Su finalidad es facilitar el registro, consulta, actualización y desactivación de los datos de los clientes mediante una interfaz sencilla.

El sistema cuenta con autenticación de usuarios y control de acceso según los roles asignados.

## 2. Tecnologías utilizadas

- HTML5
- CSS3
- JavaScript
- Bootstrap 5
- Node.js
- Express
- MySQL
- JSON Web Token (JWT)
- Jest y Supertest

## 3. Estructura del proyecto

```text
atlantic-city/
├── backend/
│   ├── middleware/
│   ├── routes/
│   ├── scripts/
│   ├── tests/
│   ├── app.js
│   ├── db.js
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
├── database/
│   ├── atlantic_city.mwb
│   ├── atlantic_city.sql
│   └── diagrama-base-de-datos.png
├── docs/
├── frontend/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── .gitignore
└── README.md
```

## 4. Roles del sistema

El sistema cuenta con cuatro roles:

- **Administrador:** puede consultar, registrar, actualizar y desactivar clientes.
- **Atención al Cliente:** puede realizar las operaciones de gestión de clientes.
- **Gerente de Marketing:** puede consultar la información de los clientes.
- **Cliente:** puede consultar únicamente sus propios datos.

## 5. Instalación y configuración

### Requisitos

- Node.js y npm.
- MySQL Server.
- Un navegador web.

### Base de datos

1. Abrir MySQL Workbench.
2. Ejecutar el archivo `database/atlantic_city.sql` para crear la base de datos y sus tablas.
3. Configurar las credenciales de conexión en el archivo `.env` dentro de `backend`.

### Backend

1. Abrir una terminal en la carpeta `backend`.
2. Instalar las dependencias:

```bash
npm install
```

3. Iniciar el servidor:

```bash
npm start
```

El servidor estará disponible en:

`http://localhost:3000`

### Frontend

Abrir el archivo `frontend/index.html` en un navegador web.

## 6. Pruebas automatizadas

Para ejecutar las pruebas del backend, ingresar a la carpeta `backend` y ejecutar:

```bash
npm test
```

El proyecto cuenta con 14 pruebas automatizadas aprobadas.

## 7. Evidencias y documentación

La carpeta `docs` contiene capturas de pantalla de las pruebas realizadas, diagramas y evidencias del funcionamiento del sistema.

## 8. Seguridad

El sistema implementa autenticación mediante JWT, contraseñas protegidas con bcryptjs, validación de datos y control de permisos según el rol del usuario.

Las credenciales de conexión y claves privadas se almacenan en el archivo `.env`, que no debe compartirse ni incluirse en la entrega.

---

**Proyecto académico - IDAT**