// ==========================================
// CARGAR ANÁLISIS GUARDADO COMPLETO
// ==========================================

// Esta función se ejecuta si hay un ID de análisis en la URL
async function cargarAnalisisGuardado() {
    const urlParams = new URLSearchParams(window.location.search);
    const analisisId = urlParams.get('id') || urlParams.get('edit'); // Soportar tanto ver como editar
    const esEdicion = urlParams.get('edit') !== null;
    
    if (!analisisId) {
        return false; // No hay análisis para cargar
    }
    
    if (esEdicion) {
        console.log('✏️ Cargando análisis en modo EDICIÓN');
    } else {
        console.log('👁️ Cargando análisis en modo LECTURA');
    }
    
    try {
        console.log('📥 Cargando análisis guardado:', analisisId);
        
        // Mostrar loading con progreso
        Swal.fire({
            title: 'Cargando Análisis Completo',
            html: `
                <div style="text-align: center;">
                    <div class="loader" style="margin: 20px auto;"></div>
                    <p style="margin-top: 20px;">Descargando datos del servidor...</p>
                    <p id="loadProgress" style="font-size: 0.9em; color: #666;">Esto puede tomar unos segundos</p>
                </div>
            `,
            allowOutsideClick: false,
            showConfirmButton: false
        });
        
        // Obtener el análisis del backend
        const url = getApiUrl(API_CONFIG.endpoints.analisis) + `/${analisisId}`;
        const response = await fetchAPI(url);
        
        if (!response || !response.ok) {
            Swal.close();
            showError('Error al cargar el análisis');
            return false;
        }
        
        const analisisData = await response.json();
        console.log('✅ Análisis recibido:', analisisData.nombreAnalisis);
        
        // Actualizar progreso
        document.getElementById('loadProgress').textContent = 'Procesando datos...';
        
        // Parsear los datos JSON guardados
        let datosCompletos;
        try {
            console.log('✅ Análisis recibido jsonData:', typeof analisisData.jsonData);
            datosCompletos = typeof analisisData.jsonData === 'string' 
                ? JSON.parse(analisisData.jsonData) 
                : analisisData.jsonData;
            console.log('✅ Análisis recibido datosCompletos:', datosCompletos);
        } catch (e) {
            console.error('Error parseando JSON:', e);
            Swal.close();
            showError('Error al parsear los datos del análisis');
            return false;
        }
        
        console.log('📊 Datos completos recuperados');
        console.log('  - Registros originales:', datosCompletos.datosOriginales?.length || 0);
        console.log('  - Facturas procesadas:', datosCompletos.facturasProcesadas?.length || 0);
        
        // Restaurar las variables globales del análisis
        if (datosCompletos.datosOriginales) {
            window.datosOriginales = datosCompletos.datosOriginales;
            datosOriginales = datosCompletos.datosOriginales;
            console.log('✅ datosOriginales:', window.datosOriginales.length);
        }
        
        if (datosCompletos.facturasProcesadas) {
            window.facturasProcesadas = datosCompletos.facturasProcesadas;
            facturasProcesadas = datosCompletos.facturasProcesadas;
            console.log('✅ facturasProcesadas:', window.facturasProcesadas.length);
        }
        
        // CRÍTICO: Inicializar datosFiltrados con facturasProcesadas
        if (window.facturasProcesadas) {
            window.datosFiltrados = [...window.facturasProcesadas];
            datosFiltrados = [...window.facturasProcesadas];
            console.log('✅ datosFiltrados inicializado:', window.datosFiltrados.length);
        }
        
        if (datosCompletos.metadatos) {
            window.fechaMinima = datosCompletos.metadatos.fechaMinima;
            window.fechaMaxima = datosCompletos.metadatos.fechaMaxima;
            console.log('✅ Fechas:', window.fechaMinima, 'a', window.fechaMaxima);
        }
        
        // Actualizar progreso
        document.getElementById('loadProgress').textContent = 'Preparando visualización...';
        
        // Esperar un momento para que las variables se estabilicen
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Ocultar sección de upload
        const uploadSection = document.getElementById('uploadSection');
        const dashboardContent = document.getElementById('dashboard_content');
        const dashboard = document.getElementById('dashboard');
        
        if (uploadSection) {
            uploadSection.style.display = 'none';
            console.log('✅ Upload section oculta');
        }
        
        if (dashboardContent) {
            dashboardContent.style.display = 'block';
            console.log('✅ dashboard_content visible');
        }
        
        if (dashboard) {
            dashboard.style.display = 'block';
            dashboard.offsetHeight; // Forzar reflow
            console.log('✅ dashboard visible');
        }
        
        console.log('📊 Dashboard mostrado');
        
        // Regenerar filtros
        if (typeof inicializarFiltros === 'function') {
            console.log('🔧 Inicializando filtros...');
            inicializarFiltros();
        }
        
        // Aplicar filtros guardados si existen
        if (analisisData.filtrosAplicados) {
            const filtros = typeof analisisData.filtrosAplicados === 'string' 
                ? JSON.parse(analisisData.filtrosAplicados)
                : analisisData.filtrosAplicados;
                
            setTimeout(() => {
                console.log('🔍 Aplicando filtros guardados:', filtros);
                
                if (filtros.regimen && filtros.regimen !== 'TODOS') {
                    const selectRegimen = document.getElementById('filtroRegimen');
                    if (selectRegimen) selectRegimen.value = filtros.regimen;
                }
                if (filtros.administradora && filtros.administradora !== 'TODOS') {
                    const selectAdmin = document.getElementById('filtroAdministradora');
                    if (selectAdmin) selectAdmin.value = filtros.administradora;
                }
                if (filtros.fechaInicio) {
                    const inputInicio = document.getElementById('fechaInicio');
                    if (inputInicio) inputInicio.value = filtros.fechaInicio;
                }
                if (filtros.fechaFin) {
                    const inputFin = document.getElementById('fechaFin');
                    if (inputFin) inputFin.value = filtros.fechaFin;
                }
            }, 100);
        }
        
        // Aplicar filtros y actualizar visualización
        if (typeof actualizarDashboard === 'function') {
            console.log('📈 Actualizando dashboard...');
            setTimeout(() => {
                try {
                    actualizarDashboard();
                    console.log('✅ Dashboard actualizado');
                    
                    // Verificar que funcionó
                    setTimeout(() => {
                        const vt = document.getElementById('valorTotal')?.textContent;
                        console.log('📊 Verificación - valorTotal:', vt);
                        
                        if (vt === '$0' && window.facturasProcesadas?.length > 0) {
                            console.warn('⚠️ KPIs en $0, intentando de nuevo...');
                            if (typeof window.forzarActualizacionKPIs === 'function') {
                                window.forzarActualizacionKPIs();
                            }
                        }
                    }, 1000);
                } catch (error) {
                    console.error('❌ Error actualizando dashboard:', error);
                }
            }, 300);
        }
        
        Swal.close();
        
        // Mostrar mensaje de éxito
        await Swal.fire({
            icon: 'success',
            title: 'Análisis Cargado',
            html: `
                <div style="text-align: center;">
                    <p><strong>${analisisData.nombreAnalisis}</strong></p>
                    <p style="margin: 10px 0; color: #666;">
                        <strong>${analisisData.totalFacturas.toLocaleString()}</strong> facturas<br>
                        Creado: ${formatDateTime(analisisData.fechaCreacion)}
                    </p>
                    <p style="font-size: 0.9em; color: #28a745; margin-top: 10px;">
                        ✅ Análisis completo restaurado
                    </p>
                </div>
            `,
            timer: 3000,
            showConfirmButton: false
        });
        
        return true;
        
    } catch (error) {
        console.error('❌ Error cargando análisis:', error);
        Swal.close();
        
        await Swal.fire({
            icon: 'error',
            title: 'Error al cargar',
            html: `
                <p>No se pudo cargar el análisis</p>
                <p style="font-size: 0.9em; color: #666; margin-top: 10px;">
                    ${error.message}
                </p>
                <p style="font-size: 0.85em; color: #999; margin-top: 10px;">
                    Verifica tu conexión con el servidor
                </p>
            `
        });
        
        return false;
    }
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si hay un ID en la URL para cargar
    cargarAnalisisGuardado();
});

console.log('✅ Analisis-cargar.js cargado');
