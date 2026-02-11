// ==========================================
// GESTIÓN DE USUARIOS
// ==========================================

// Proteger página
if (!protectPage()) {
    throw new Error('Acceso no autorizado');
}

let usuarios = [];

// ==========================================
// CARGAR USUARIOS
// ==========================================

async function cargarUsuarios() {
    try {
        const response = await fetchAPI(getApiUrl(API_CONFIG.endpoints.usuarios));
        
        if (!response || !response.ok) {
            showError('Error al cargar usuarios');
            return;
        }
        
        usuarios = await response.json();
        mostrarUsuarios();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar usuarios');
    }
}

// ==========================================
// MOSTRAR USUARIOS EN TABLA
// ==========================================

function mostrarUsuarios() {
    const tbody = document.querySelector('#tablaUsuarios tbody');
    
    if (usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px;">No hay usuarios registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = usuarios.map(usuario => `
        <tr>
            <td>${usuario.nombres}</td>
            <td>${usuario.apellidos}</td>
            <td><strong>${usuario.username}</strong></td>
            <td>${usuario.activo ? '<span style="color: green;">✅ Activo</span>' : '<span style="color: red;">❌ Inactivo</span>'}</td>
            <td>
                <button class="btn btn-small" onclick="editarUsuario('${usuario.id}')" style="margin-right: 5px;">✏️ Editar</button>
                <button class="btn btn-small" onclick="eliminarUsuario('${usuario.id}')" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">🗑️ Eliminar</button>
            </td>
        </tr>
    `).join('');
}

// ==========================================
// CREAR NUEVO USUARIO
// ==========================================

async function nuevoUsuario() {
    const { value: formValues } = await Swal.fire({
        title: 'Nuevo Usuario',
        html: `
            <div style="text-align: left;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Nombres:</label>
                    <input id="swal-nombres" class="swal2-input" placeholder="Nombres" style="width: 90%; margin: 0;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Apellidos:</label>
                    <input id="swal-apellidos" class="swal2-input" placeholder="Apellidos" style="width: 90%; margin: 0;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Username:</label>
                    <input id="swal-username" class="swal2-input" placeholder="Username" style="width: 90%; margin: 0;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Contraseña:</label>
                    <input id="swal-password" type="password" class="swal2-input" placeholder="Contraseña" style="width: 90%; margin: 0;">
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Crear Usuario',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const nombres = document.getElementById('swal-nombres').value;
            const apellidos = document.getElementById('swal-apellidos').value;
            const username = document.getElementById('swal-username').value;
            const password = document.getElementById('swal-password').value;
            
            if (!nombres || !apellidos || !username || !password) {
                Swal.showValidationMessage('Todos los campos son requeridos');
                return false;
            }
            
            return { nombres, apellidos, username, password };
        }
    });
    
    if (formValues) {
        try {
            const response = await fetchAPI(getApiUrl(API_CONFIG.endpoints.usuarios), {
                method: 'POST',
                body: JSON.stringify(formValues)
            });
            
            if (response && response.ok) {
                showSuccess('Usuario creado exitosamente');
                cargarUsuarios();
            } else {
                const error = await response.json();
                showError(error.message || 'Error al crear usuario');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error al crear usuario');
        }
    }
}

// ==========================================
// EDITAR USUARIO
// ==========================================

async function editarUsuario(id) {
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) return;
    
    const { value: formValues } = await Swal.fire({
        title: 'Editar Usuario',
        html: `
            <div style="text-align: left;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Nombres:</label>
                    <input id="swal-nombres" class="swal2-input" value="${usuario.nombres}" style="width: 90%; margin: 0;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Apellidos:</label>
                    <input id="swal-apellidos" class="swal2-input" value="${usuario.apellidos}" style="width: 90%; margin: 0;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Nueva Contraseña (dejar vacío para no cambiar):</label>
                    <input id="swal-password" type="password" class="swal2-input" placeholder="Nueva contraseña" style="width: 90%; margin: 0;">
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Guardar Cambios',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const nombres = document.getElementById('swal-nombres').value;
            const apellidos = document.getElementById('swal-apellidos').value;
            const password = document.getElementById('swal-password').value;
            
            if (!nombres || !apellidos) {
                Swal.showValidationMessage('Nombres y apellidos son requeridos');
                return false;
            }
            
            const data = { nombres, apellidos };
            if (password) {
                data.password = password;
            }
            
            return data;
        }
    });
    
    if (formValues) {
        try {
            const url = getApiUrl(API_CONFIG.endpoints.usuarios) + `/${id}`;
            const response = await fetchAPI(url, {
                method: 'PUT',
                body: JSON.stringify(formValues)
            });
            
            if (response && response.ok) {
                showSuccess('Usuario actualizado exitosamente');
                cargarUsuarios();
            } else {
                const error = await response.json();
                showError(error.message || 'Error al actualizar usuario');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error al actualizar usuario');
        }
    }
}

// ==========================================
// ELIMINAR USUARIO
// ==========================================

async function eliminarUsuario(id) {
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) return;
    
    const confirm = await showConfirm(`¿Estás seguro de eliminar al usuario "${usuario.nombreCompleto}"?`);
    
    if (confirm) {
        try {
            const url = getApiUrl(API_CONFIG.endpoints.usuarios) + `/${id}`;
            const response = await fetchAPI(url, {
                method: 'DELETE'
            });
            
            if (response && response.ok) {
                showSuccess('Usuario eliminado exitosamente');
                cargarUsuarios();
            } else {
                showError('Error al eliminar usuario');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error al eliminar usuario');
        }
    }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Cargar usuarios
    cargarUsuarios();
    
    // Botón nuevo usuario
    document.getElementById('btnNuevoUsuario').addEventListener('click', nuevoUsuario);
    
    // Botón logout
    document.getElementById('btnLogout').addEventListener('click', async () => {
        if (await showConfirm('¿Deseas cerrar sesión?')) {
            logout();
        }
    });
    
    // Mostrar nombre del usuario
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.nombreCompleto || user.username;
    }
});

console.log('✅ Usuarios.js cargado');
