// ==========================================
// EDITAR ANÁLISIS GUARDADO
// ==========================================

// Variable global para saber si estamos en modo edición
let modoEdicion = false;
let analisisEditandoId = null;
let nombreAnalisisOriginal = '';

// ==========================================
// DETECTAR SI ESTAMOS EN MODO EDICIÓN
// ==========================================

function detectarModoEdicion() {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    
    if (editId) {
        modoEdicion = true;
        analisisEditandoId = editId;
        console.log('📝 Modo edición activado para análisis:', editId);
        return true;
    }
    
    return false;
}

// ==========================================
// HABILITAR CONTROLES DE EDICIÓN
// ==========================================

function habilitarEdicion() {
    console.log('📝 Habilitando modo edición');
    
    // Cambiar texto del botón de guardar
    const btnGuardar = document.getElementById('btnGuardarAnalisis');
    if (btnGuardar) {
        btnGuardar.innerHTML = '💾 Actualizar Análisis';
        btnGuardar.onclick = actualizarAnalisisEditado;
        console.log('✅ Botón actualizar configurado');
    }
    
    // Ocultar botón de nuevo archivo en modo edición
    const btnNuevo = document.getElementById('btnNuevoArchivo');
    if (btnNuevo) {
        btnNuevo.style.display = 'none';
    }
    
    // Mostrar mensaje informativo
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
        const mensajeEdicion = document.createElement('div');
        mensajeEdicion.id = 'mensajeEdicion';
        mensajeEdicion.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 10px;
            text-align: center;
            font-weight: 600;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        mensajeEdicion.innerHTML = `
            📝 Modo Edición - Modifica los filtros y haz click en "Actualizar Análisis"
        `;
        
        dashboard.insertBefore(mensajeEdicion, dashboard.firstChild);
        console.log('✅ Mensaje de edición mostrado');
    }
}

// ==========================================
// ACTUALIZAR ANÁLISIS EDITADO
// ==========================================

async function actualizarAnalisisEditado() {
    if (!analisisEditandoId) {
        showError('No hay análisis para actualizar');
        return;
    }
    
    // Verificar que hay datos
    if (!window.facturasProcesadas || window.facturasProcesadas.length === 0) {
        showError('No hay datos para actualizar');
        return;
    }
    
    try {
        // Obtener filtros actuales
        const filtrosActuales = {
            regimen: document.getElementById('filtroRegimen')?.value || 'TODOS',
            administradora: document.getElementById('filtroAdministradora')?.value || 'TODOS',
            contrato: document.getElementById('filtroContrato')?.value || 'TODOS',
            fechaInicio: document.getElementById('fechaInicio')?.value || '',
            fechaFin: document.getElementById('fechaFin')?.value || ''
        };
        
        console.log('📊 Filtros a actualizar:', filtrosActuales);
        
        // Preguntar si quiere cambiar el nombre
        const { value: nuevoNombre } = await Swal.fire({
            title: 'Actualizar Análisis',
            html: `
                <div style="text-align: left;">
                    <p style="margin-bottom: 15px;">¿Deseas cambiar el nombre del análisis?</p>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Nombre del Análisis:</label>
                        <input id="swal-nombre" class="swal2-input" value="${nombreAnalisisOriginal}" style="width: 90%; margin: 0;">
                    </div>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 15px;">
                        <p style="font-size: 0.9em; margin: 5px 0;"><strong>Filtros actuales:</strong></p>
                        <p style="font-size: 0.85em; margin: 3px 0;">• Régimen: ${filtrosActuales.regimen}</p>
                        <p style="font-size: 0.85em; margin: 3px 0;">• Administradora: ${filtrosActuales.administradora}</p>
                        <p style="font-size: 0.85em; margin: 3px 0;">• Contrato: ${filtrosActuales.contrato}</p>
                        ${filtrosActuales.fechaInicio ? `<p style="font-size: 0.85em; margin: 3px 0;">• Desde: ${filtrosActuales.fechaInicio}</p>` : ''}
                        ${filtrosActuales.fechaFin ? `<p style="font-size: 0.85em; margin: 3px 0;">• Hasta: ${filtrosActuales.fechaFin}</p>` : ''}
                    </div>
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin-top: 15px;">
                        <p style="font-size: 0.9em; margin: 5px 0;"><strong>Datos filtrados actuales:</strong></p>
                        <p style="font-size: 0.85em; margin: 3px 0;">• Total facturas: ${window.datosFiltrados?.length || 0}</p>
                        <p style="font-size: 0.85em; margin: 3px 0;">• Valor total: ${formatCurrency(window.datosFiltrados?.reduce((s, f) => s + f.valorTotal, 0) || 0)}</p>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: '✅ Actualizar',
            cancelButtonText: 'Cancelar',
            focusConfirm: false,
            preConfirm: () => {
                const nombre = document.getElementById('swal-nombre').value.trim();
                if (!nombre) {
                    Swal.showValidationMessage('El nombre no puede estar vacío');
                    return false;
                }
                return nombre;
            }
        });
        
        if (!nuevoNombre) return; // Usuario canceló
        
        // Mostrar loading
        Swal.fire({
            title: 'Actualizando Análisis',
            html: '<div class="loader" style="margin: 20px auto;"></div><p style="margin-top: 20px;">Guardando cambios...</p>',
            allowOutsideClick: false,
            showConfirmButton: false
        });
        
        // Preparar datos para actualización
        const datosActualizados = {
            nombreAnalisis: nuevoNombre,
            filtrosAplicados: filtrosActuales,
            totalFacturas: window.datosFiltrados?.length || 0,
            valorTotal: window.datosFiltrados?.reduce((sum, f) => sum + f.valorTotal, 0) || 0
        };
        
        console.log('📤 Enviando actualización:', datosActualizados);
        
        // Actualizar en la API
        const url = getApiUrl(API_CONFIG.endpoints.analisis) + `/${analisisEditandoId}`;
        const response = await fetchAPI(url, {
            method: 'PUT',
            body: JSON.stringify(datosActualizados)
        });
        
        Swal.close();
        
        if (!response) {
            showError('Error de conexión con el servidor');
            return;
        }
        
        if (response.ok) {
            nombreAnalisisOriginal = nuevoNombre; // Actualizar nombre original
            
            await Swal.fire({
                icon: 'success',
                title: '¡Análisis Actualizado!',
                html: `
                    <p>Los cambios se han guardado exitosamente</p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 15px;">
                        <p style="font-size: 0.9em; margin: 5px 0;"><strong>${nuevoNombre}</strong></p>
                        <p style="font-size: 0.85em; margin: 3px 0; color: #666;">Facturas: ${datosActualizados.totalFacturas.toLocaleString()}</p>
                        <p style="font-size: 0.85em; margin: 3px 0; color: #666;">Total: ${formatCurrency(datosActualizados.valorTotal)}</p>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Ver Mis Análisis',
                cancelButtonText: 'Continuar Editando'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = 'analisis-lista.html';
                }
            });
        } else {
            const error = await response.json();
            showError(error.message || 'Error al actualizar el análisis');
        }
    } catch (error) {
        console.error('Error al actualizar análisis:', error);
        Swal.close();
        showError('Error al actualizar el análisis');
    }
}

// ==========================================
// GUARDAR NOMBRE ORIGINAL AL CARGAR
// ==========================================

// Interceptar cuando se carga el análisis para guardar el nombre original
const originalCargarAnalisis = window.cargarAnalisisGuardado;
if (typeof originalCargarAnalisis === 'function') {
    window.cargarAnalisisGuardado = async function() {
        const result = await originalCargarAnalisis.call(this);
        
        // Si estamos en modo edición, guardar el nombre
        if (modoEdicion && result) {
            setTimeout(async () => {
                try {
                    const url = getApiUrl(API_CONFIG.endpoints.analisis) + `/${analisisEditandoId}`;
                    const response = await fetchAPI(url);
                    if (response && response.ok) {
                        const data = await response.json();
                        nombreAnalisisOriginal = data.nombreAnalisis;
                        console.log('✅ Nombre original guardado:', nombreAnalisisOriginal);
                    }
                } catch (e) {
                    console.error('Error obteniendo nombre:', e);
                }
            }, 1000);
        }
        
        return result;
    };
}

// ==========================================
// INICIALIZAR MODO EDICIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar si estamos en modo edición
    if (detectarModoEdicion()) {
        console.log('📝 Modo edición detectado, esperando carga del análisis...');
        
        // Esperar a que el análisis se cargue completamente
        setTimeout(() => {
            if (document.getElementById('dashboard')?.style.display !== 'none') {
                habilitarEdicion();
            } else {
                // Esperar más tiempo si aún no se muestra
                setTimeout(() => {
                    habilitarEdicion();
                }, 2000);
            }
        }, 1500);
    }
});

console.log('✅ Analisis-editar.js cargado');
