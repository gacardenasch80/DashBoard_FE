// ==========================================
// GUARDAR ANÁLISIS EN LA API
// ==========================================

// Proteger página
if (!protectPage()) {
    throw new Error('Acceso no autorizado');
}

// Variable para controlar si ya se guardó
let analisisGuardado = false;
let analisisId = null;

// ==========================================
// MOSTRAR BOTONES CUANDO SE CARGA EL DASHBOARD
// ==========================================

// Observar cuando se muestra el dashboard
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        const dashboard = document.getElementById('dashboard');
        if (dashboard && dashboard.style.display !== 'none') {
            mostrarBotonesAccion();
            observer.disconnect(); // Dejar de observar
        }
    });
});

// Empezar a observar
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
        observer.observe(dashboard, {
            attributes: true,
            attributeFilter: ['style']
        });
    }
    
    // Si ya está visible al cargar
    if (dashboard && dashboard.style.display !== 'none') {
        mostrarBotonesAccion();
    }
});

// ==========================================
// MOSTRAR BOTONES DE ACCIÓN
// ==========================================

function mostrarBotonesAccion() {
    const botonesAccion = document.getElementById('botonesAccion');
    if (botonesAccion) {
        botonesAccion.style.display = 'block';
    }
}

// ==========================================
// GUARDAR ANÁLISIS
// ==========================================

async function guardarAnalisis() {
    // Verificar que hay datos para guardar
    if (!facturasProcesadas || facturasProcesadas.length === 0) {
        showError('No hay datos para guardar. Por favor carga un archivo Excel primero.');
        return;
    }
    
    // Si ya se guardó, preguntar si quiere actualizar
    if (analisisGuardado && analisisId) {
        const actualizar = await showConfirm('Este análisis ya fue guardado. ¿Deseas actualizarlo?');
        if (!actualizar) return;
    }
    
    // Solicitar nombre del análisis
    const { value: nombreAnalisis } = await Swal.fire({
        title: 'Nombre del Análisis',
        input: 'text',
        inputPlaceholder: 'Ej: Análisis Facturas Enero 2024',
        inputValue: analisisGuardado ? 'Análisis actualizado' : '',
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
            if (!value) {
                return 'Debes ingresar un nombre para el análisis';
            }
        }
    });
    
    if (!nombreAnalisis) return;
    
    try {
        // Preparar datos del análisis
        const datosAnalisis = {
            nombreAnalisis: nombreAnalisis,
            jsonData: {
                datosOriginales: datosOriginales,
                facturasProcesadas: facturasProcesadas,
                fechaMinima: fechaMinima,
                fechaMaxima: fechaMaxima
            },
            filtrosAplicados: {
                regimen: document.getElementById('filtroRegimen')?.value || 'TODOS',
                administradora: document.getElementById('filtroAdministradora')?.value || 'TODOS',
                contrato: document.getElementById('filtroContrato')?.value || 'TODOS',
                fechaInicio: document.getElementById('fechaInicio')?.value || '',
                fechaFin: document.getElementById('fechaFin')?.value || ''
            },
            totalFacturas: facturasProcesadas.length,
            valorTotal: facturasProcesadas.reduce((sum, f) => sum + f.valorTotal, 0)
        };
        
        // Guardar en la API
        const response = await fetchAPI(getApiUrl(API_CONFIG.endpoints.analisis), {
            method: 'POST',
            body: JSON.stringify(datosAnalisis)
        });
        
        if (!response) {
            showError('Error de conexión con el servidor');
            return;
        }
        
        if (response.ok) {
            const resultado = await response.json();
            analisisGuardado = true;
            analisisId = resultado.id;
            
            await Swal.fire({
                icon: 'success',
                title: '¡Análisis Guardado!',
                text: 'El análisis se guardó exitosamente',
                showCancelButton: true,
                confirmButtonText: 'Ver Mis Análisis',
                cancelButtonText: 'Continuar Aquí'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = 'analisis-lista.html';
                }
            });
        } else {
            const error = await response.json();
            showError(error.message || 'Error al guardar el análisis');
        }
    } catch (error) {
        console.error('Error al guardar análisis:', error);
        showError('Error al guardar el análisis');
    }
}

// ==========================================
// CARGAR OTRO ARCHIVO
// ==========================================

function cargarOtroArchivo() {
    if (confirm('¿Estás seguro? Se perderán los datos actuales si no los has guardado.')) {
        location.reload();
    }
}

// ==========================================
// VERIFICAR SI SE ESTÁ VIENDO UN ANÁLISIS EXISTENTE
// ==========================================

async function verificarAnalisisExistente() {
    const urlParams = new URLSearchParams(window.location.search);
    const analisisId = urlParams.get('ver');
    
    if (analisisId) {
        // Cargar análisis desde sessionStorage
        const analisisData = sessionStorage.getItem('analisis_actual');
        
        if (analisisData) {
            try {
                const analisis = JSON.parse(analisisData);
                
                // Aquí puedes cargar los datos en el sistema
                // Por ahora solo mostrar info
                await Swal.fire({
                    icon: 'info',
                    title: 'Análisis Cargado',
                    text: `Visualizando: ${analisis.nombreAnalisis}`,
                    timer: 2000,
                    showConfirmButton: false
                });
                
                // Limpiar sessionStorage
                sessionStorage.removeItem('analisis_actual');
                
            } catch (error) {
                console.error('Error parseando análisis:', error);
            }
        }
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Verificar si se está viendo un análisis existente
    verificarAnalisisExistente();
    
    // Botón guardar
    const btnGuardar = document.getElementById('btnGuardarAnalisis');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', guardarAnalisis);
    }
    
    // Botón nuevo archivo
    const btnNuevo = document.getElementById('btnNuevoArchivo');
    if (btnNuevo) {
        btnNuevo.addEventListener('click', cargarOtroArchivo);
    }
    
    // Botón logout
    document.getElementById('btnLogout')?.addEventListener('click', async () => {
        if (await showConfirm('¿Deseas cerrar sesión?')) {
            logout();
        }
    });
    
    // Mostrar nombre del usuario
    const user = getCurrentUser();
    if (user) {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = user.nombreCompleto || user.username;
        }
    }
});

console.log('✅ Analisis-guardar.js cargado');
