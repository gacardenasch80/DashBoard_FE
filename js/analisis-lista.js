// ==========================================
// LISTA DE ANÁLISIS
// ==========================================

// Proteger página
if (!protectPage()) {
    throw new Error('Acceso no autorizado');
}

let analisis = [];

// ==========================================
// CARGAR ANÁLISIS
// ==========================================

async function cargarAnalisis() {
    try {
        const loader = document.getElementById('loader');
        const mensaje = document.getElementById('mensaje');
        
        loader.style.display = 'block';
        mensaje.textContent = 'Cargando análisis...';
        
        // Cargar solo los análisis del usuario actual
        const response = await fetchAPI(getApiUrl(API_CONFIG.endpoints.analisisSoloMios));
        
        if (!response) {
            mostrarMensaje('Error de conexión con el servidor');
            return;
        }
        
        if (!response.ok) {
            mostrarMensaje('Error al cargar análisis');
            return;
        }
        
        analisis = await response.json();
        mostrarAnalisis();
        
    } catch (error) {
        console.error('Error cargando análisis:', error);
        mostrarMensaje('Error al cargar análisis');
    }
}

// ==========================================
// MOSTRAR ANÁLISIS EN TABLA
// ==========================================

function mostrarAnalisis() {
    const tbody = document.querySelector('#tablaAnalisis tbody');
    
    if (analisis.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 60px;">
                    <div style="font-size: 3em; margin-bottom: 20px;">📊</div>
                    <h3 style="color: #666; margin-bottom: 10px;">No tienes análisis guardados</h3>
                    <p style="color: #999;">Crea tu primer análisis cargando un archivo Excel</p>
                    <a href="analisis-nuevo.html" class="btn" style="margin-top: 20px; display: inline-block; text-decoration: none;">
                        ➕ Crear Primer Análisis
                    </a>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = analisis.map(a => `
        <tr>
            <td><strong>${a.nombreAnalisis}</strong></td>
            <td>${formatDateTime(a.fechaCreacion)}</td>
            <td style="text-align: center;">${a.totalFacturas.toLocaleString()}</td>
            <td style="text-align: right;"><strong>${formatCurrency(a.valorTotal)}</strong></td>
            <td>
                <button class="btn btn-small" onclick="verAnalisis('${a.id}')" style="margin-right: 5px;">
                    👁️ Ver
                </button>
                <button class="btn btn-small" onclick="editarAnalisis('${a.id}')" style="margin-right: 5px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    ✏️ Editar
                </button>
                <button class="btn btn-small" onclick="eliminarAnalisis('${a.id}')" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                    🗑️ Eliminar
                </button>
            </td>
        </tr>
    `).join('');
}

// ==========================================
// MOSTRAR MENSAJE EN TABLA
// ==========================================

function mostrarMensaje(texto) {
    const tbody = document.querySelector('#tablaAnalisis tbody');
    const loader = document.getElementById('loader');
    
    loader.style.display = 'none';
    
    tbody.innerHTML = `
        <tr>
            <td colspan="5" style="text-align: center; padding: 40px;">
                <p style="color: #666;">${texto}</p>
            </td>
        </tr>
    `;
}

// ==========================================
// VER DETALLES DEL ANÁLISIS
// ==========================================

async function verAnalisis(id) {
    try {
        console.log('👁️ Abriendo análisis:', id);
        
        // Mostrar loading simple
        Swal.fire({
            title: 'Cargando...',
            text: 'Preparando análisis',
            allowOutsideClick: false,
            showConfirmButton: false,
            timer: 500,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Redirigir directamente con el ID en la URL
        // analisis-cargar.js se encargará de cargar los datos desde la API
        setTimeout(() => {
            window.location.href = `analisis-nuevo.html?id=${id}`;
        }, 500);
        
    } catch (error) {
        console.error('Error:', error);
        Swal.close();
        showError('Error al abrir el análisis');
    }
}

// ==========================================
// EDITAR ANÁLISIS
// ==========================================

async function editarAnalisis(id) {
    try {
        console.log('✏️ Abriendo análisis para editar:', id);
        
        // Mostrar loading
        Swal.fire({
            title: 'Cargando...',
            text: 'Preparando análisis para edición',
            allowOutsideClick: false,
            showConfirmButton: false,
            timer: 500,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Redirigir con parámetro edit
        setTimeout(() => {
            window.location.href = `analisis-nuevo.html?edit=${id}`;
        }, 500);
        
    } catch (error) {
        console.error('Error:', error);
        Swal.close();
        showError('Error al abrir el análisis para edición');
    }
}

// ==========================================
// ELIMINAR ANÁLISIS
// ==========================================

async function eliminarAnalisis(id) {
    const analisisItem = analisis.find(a => a.id === id);
    if (!analisisItem) return;
    
    const confirm = await showConfirm(`¿Estás seguro de eliminar el análisis "${analisisItem.nombreAnalisis}"?`);
    
    if (confirm) {
        try {
            const url = getApiUrl(API_CONFIG.endpoints.analisis) + `/${id}`;
            const response = await fetchAPI(url, {
                method: 'DELETE'
            });
            
            if (response && response.ok) {
                showSuccess('Análisis eliminado exitosamente');
                cargarAnalisis(); // Recargar lista
            } else {
                showError('Error al eliminar análisis');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Error al eliminar análisis');
        }
    }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Cargar análisis
    cargarAnalisis();
    
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

console.log('✅ Analisis-lista.js cargado');
