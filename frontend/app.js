
const API = 'http://localhost:3000/api';

// ELEMENTOS DEL LOGIN
const formLogin = document.getElementById('formLogin');
const seccionLogin = document.getElementById('seccionLogin');
const seccionClientes = document.getElementById('seccionClientes');
const mensajeLogin = document.getElementById('mensajeLogin');

// ELEMENTOS DE CLIENTES
const formCliente = document.getElementById('formCliente');
const tablaClientes = document.getElementById('tablaClientes');
const mensajeCliente = document.getElementById('mensajeCliente');
const tituloFormulario = document.getElementById('tituloFormulario');
const btnGuardar = document.getElementById('btnGuardar');
const btnCancelar = document.getElementById('btnCancelar');
const btnCerrarSesion = document.getElementById('btnCerrarSesion');

// SESIÓN
let token = sessionStorage.getItem('token');
let rolUsuario = sessionStorage.getItem('rol');

const rolesGestion = ['Administrador', 'Atencion al Cliente'];

// CERRAR SESIÓN
function cerrarSesion(mensaje = '') {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('rol');

    token = null;
    rolUsuario = null;

    seccionClientes.classList.add('d-none');
    seccionLogin.classList.remove('d-none');

    formLogin.reset();
    limpiarFormulario();

    mensajeLogin.textContent = mensaje;
    mensajeLogin.className = 'mensaje error mt-3';
    mensajeCliente.textContent = '';
}

// VERIFICAR SESIÓN
function verificarSesion(respuesta) {
    if (respuesta.status === 401) {
        cerrarSesion('Tu sesión ha expirado. Inicia sesión nuevamente.');
        return false;
    }

    return true;
}

// MOSTRAR FUNCIONES SEGÚN EL ROL
function aplicarPermisos() {
    const puedeGestionar = rolesGestion.includes(rolUsuario);

    const tarjetaFormulario = formCliente.closest('.card');

    tarjetaFormulario.classList.toggle('d-none', !puedeGestionar);

    const encabezado = tablaClientes.closest('table')
        .querySelector('thead th:last-child');

    if (encabezado) {
        encabezado.classList.toggle('d-none', !puedeGestionar);
    }
}


// INICIAR SESIÓN
formLogin.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const nombre_usuario = document.getElementById('usuario').value;
    const contrasena = document.getElementById('contrasena').value;

    try {
        const respuesta = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre_usuario, contrasena })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.mensaje || 'Error al iniciar sesión');
        }

        token = datos.token;
        rolUsuario = datos.usuario.rol;

        sessionStorage.setItem('token', token);
        sessionStorage.setItem('rol', rolUsuario);

        mensajeLogin.textContent = '';
        seccionLogin.classList.add('d-none');
        seccionClientes.classList.remove('d-none');

        aplicarPermisos();
        cargarClientes();
    } catch (error) {
        mensajeLogin.textContent = error.message;
        mensajeLogin.className = 'mensaje error mt-3';
    }
});

// CARGAR CLIENTES
async function cargarClientes() {
    try {
        const respuesta = await fetch(`${API}/clientes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!verificarSesion(respuesta)) return;

        const clientes = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(clientes.mensaje || 'Error al cargar clientes');
        }

        tablaClientes.innerHTML = '';

        if (clientes.length === 0) {
            tablaClientes.innerHTML = `
                <tr><td colspan="7" class="text-center">
                    No hay clientes registrados.
                </td></tr>`;
            return;
        }

        clientes.forEach((cliente) => {
            const fila = document.createElement('tr');

            [
                cliente.documento_identidad,
                cliente.nombres,
                cliente.apellidos,
                cliente.telefono || '-',
                cliente.correo || '-',
                cliente.direccion || '-'
            ].forEach(valor => {
                const celda = document.createElement('td');
                celda.textContent = valor;
                fila.appendChild(celda);
            });

            if (rolesGestion.includes(rolUsuario)) {
                const acciones = document.createElement('td');

                const btnEditar = document.createElement('button');
                btnEditar.textContent = 'Editar';
                btnEditar.className = 'btn btn-sm btn-warning me-1';
                btnEditar.addEventListener('click', () => editarCliente(cliente.id_cliente));

                const btnEliminar = document.createElement('button');
                btnEliminar.textContent = 'Eliminar';
                btnEliminar.className = 'btn btn-sm btn-danger';
                btnEliminar.addEventListener('click', () => eliminarCliente(cliente.id_cliente));

                acciones.append(btnEditar, btnEliminar);
                fila.appendChild(acciones);
            }

            tablaClientes.appendChild(fila);
        });
    } catch (error) {
        mensajeCliente.textContent = error.message;
        mensajeCliente.className = 'mensaje error mt-3';
    }
}

// REGISTRAR O MODIFICAR CLIENTE
formCliente.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const id = document.getElementById('idCliente').value;

    const cliente = {
        documento_identidad: document.getElementById('documento').value,
        nombres: document.getElementById('nombres').value,
        apellidos: document.getElementById('apellidos').value,
        telefono: document.getElementById('telefono').value,
        correo: document.getElementById('correo').value,
        direccion: document.getElementById('direccion').value
    };

    try {
        const respuesta = await fetch(
            id ? `${API}/clientes/${id}` : `${API}/clientes`,
            {
                method: id ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(cliente)
            }
        );

        if (!verificarSesion(respuesta)) return;

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.mensaje || 'Error al guardar cliente');
        }

        mensajeCliente.textContent = datos.mensaje;
        mensajeCliente.className = 'mensaje exito mt-3';

        limpiarFormulario();
        cargarClientes();
    } catch (error) {
        mensajeCliente.textContent = error.message;
        mensajeCliente.className = 'mensaje error mt-3';
    }
});

// EDITAR CLIENTE
async function editarCliente(id) {
    try {
        const respuesta = await fetch(`${API}/clientes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!verificarSesion(respuesta)) return;

        const clientes = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error('No se pudieron obtener los clientes');
        }

        const cliente = clientes.find(c => c.id_cliente === id);

        if (!cliente) throw new Error('Cliente no encontrado');

        document.getElementById('idCliente').value = cliente.id_cliente;
        document.getElementById('documento').value = cliente.documento_identidad;
        document.getElementById('nombres').value = cliente.nombres;
        document.getElementById('apellidos').value = cliente.apellidos;
        document.getElementById('telefono').value = cliente.telefono || '';
        document.getElementById('correo').value = cliente.correo || '';
        document.getElementById('direccion').value = cliente.direccion || '';

        tituloFormulario.textContent = 'Modificar cliente';
        btnGuardar.textContent = 'Guardar cambios';
        btnCancelar.classList.remove('d-none');

        formCliente.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        mensajeCliente.textContent = error.message;
        mensajeCliente.className = 'mensaje error mt-3';
    }
}

// ELIMINAR CLIENTE
async function eliminarCliente(id) {
    if (!confirm('¿Deseas eliminar este cliente?')) return;

    try {
        const respuesta = await fetch(`${API}/clientes/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!verificarSesion(respuesta)) return;

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.mensaje || 'Error al eliminar cliente');
        }

        mensajeCliente.textContent = datos.mensaje;
        mensajeCliente.className = 'mensaje exito mt-3';

        cargarClientes();
    } catch (error) {
        mensajeCliente.textContent = error.message;
        mensajeCliente.className = 'mensaje error mt-3';
    }
}

// LIMPIAR FORMULARIO
function limpiarFormulario() {
    formCliente.reset();
    document.getElementById('idCliente').value = '';

    tituloFormulario.textContent = 'Registrar cliente';
    btnGuardar.textContent = 'Registrar cliente';
    btnCancelar.classList.add('d-none');
}

btnCancelar.addEventListener('click', limpiarFormulario);

// CERRAR SESIÓN
btnCerrarSesion.addEventListener('click', () => cerrarSesion());

// RECUPERAR SESIÓN
if (token && rolUsuario) {
    seccionLogin.classList.add('d-none');
    seccionClientes.classList.remove('d-none');
    aplicarPermisos();
    cargarClientes();
} else {
    cerrarSesion();
}
