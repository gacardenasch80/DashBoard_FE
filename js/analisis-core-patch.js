// ==========================================
// PARCHE SIMPLE - Inicializa datosFiltrados
// ==========================================

console.log('🔧 Cargando parche simple...');

// Sobrescribir procesarDatos para inicializar datosFiltrados
const _procesarDatosOriginal = window.procesarDatos;

window.procesarDatos = async function(jsonData) {
    console.log('📥 [PARCHE] procesarDatos interceptado');
    
    // Llamar función original
    await _procesarDatosOriginal.call(this, jsonData);
    
    // CRÍTICO: Inicializar datosFiltrados
    if (window.facturasProcesadas && window.facturasProcesadas.length > 0) {
        window.datosFiltrados = [...window.facturasProcesadas];
        console.log('✅ [PARCHE] datosFiltrados inicializado:', window.datosFiltrados.length);
        console.log('📊 [PARCHE] Facturas:', window.facturasProcesadas.length);
        console.log('📊 [PARCHE] DatosFiltrados:', window.datosFiltrados.length);
    }
};

// Sobrescribir mostrarDashboard para asegurar datosFiltrados
const _mostrarDashboardOriginal = window.mostrarDashboard;

window.mostrarDashboard = function() {
    console.log('📊 [PARCHE] mostrarDashboard interceptado');
    
    // Asegurar datosFiltrados ANTES de mostrar
    if (window.facturasProcesadas && window.facturasProcesadas.length > 0) {
        if (!window.datosFiltrados || window.datosFiltrados.length === 0) {
            window.datosFiltrados = [...window.facturasProcesadas];
            console.log('✅ [PARCHE] datosFiltrados forzado:', window.datosFiltrados.length);
        } else {
            console.log('✅ [PARCHE] datosFiltrados ya existe:', window.datosFiltrados.length);
        }
    }
    
    // Mostrar dashboard_content Y dashboard
    const dashboardContent = document.getElementById('dashboard_content');
    const dashboard = document.getElementById('dashboard');
    
    if (dashboardContent) {
        dashboardContent.style.display = 'block';
        console.log('✅ [PARCHE] dashboard_content visible');
    }
    
    if (dashboard) {
        dashboard.style.display = 'block';
        console.log('✅ [PARCHE] dashboard visible');
    }
    
    // Llamar función original
    try {
        _mostrarDashboardOriginal.call(this);
        console.log('✅ [PARCHE] mostrarDashboard original ejecutado');
    } catch (error) {
        console.error('❌ [PARCHE] Error en mostrarDashboard:', error);
    }
    
    // Verificar después de 1 segundo
    setTimeout(() => {
        const vt = document.getElementById('valorTotal');
        const tf = document.getElementById('totalFacturas');
        
        console.log('📊 [PARCHE] Verificación después de 1s:');
        console.log('  - valorTotal:', vt ? vt.textContent : 'NO EXISTE');
        console.log('  - totalFacturas:', tf ? tf.textContent : 'NO EXISTE');
        
        if (vt && vt.textContent === '$0' && window.facturasProcesadas?.length > 0) {
            console.error('❌ [PARCHE] KPIs en $0 después de actualizar');
            console.log('💡 [PARCHE] Ejecuta en consola: forzarActualizacionKPIs()');
        } else if (vt && vt.textContent !== '$0') {
            console.log('✅ [PARCHE] KPIs actualizados correctamente!');
        }
    }, 1000);
};

// Función global para forzar actualización manual
window.forzarActualizacionKPIs = function() {
    console.log('🔨 Forzando actualización...');
    
    if (!window.facturasProcesadas?.length) {
        console.error('❌ No hay facturas');
        return;
    }
    
    // Forzar datosFiltrados
    window.datosFiltrados = [...window.facturasProcesadas];
    console.log('✅ datosFiltrados:', window.datosFiltrados.length);
    
    // Llamar actualizarDashboard
    if (typeof actualizarDashboard === 'function') {
        try {
            actualizarDashboard();
            console.log('✅ actualizarDashboard() ejecutado');
        } catch (error) {
            console.error('❌ Error en actualizarDashboard:', error);
        }
    } else {
        console.error('❌ actualizarDashboard no está definida');
    }
    
    // Verificar resultado
    setTimeout(() => {
        const vt = document.getElementById('valorTotal');
        const tf = document.getElementById('totalFacturas');
        console.log('📊 Resultado después de forzar:');
        console.log('  - valorTotal:', vt ? vt.textContent : 'NO EXISTE');
        console.log('  - totalFacturas:', tf ? tf.textContent : 'NO EXISTE');
    }, 500);
};

console.log('✅ Parche simple cargado');
console.log('💡 Comando disponible: forzarActualizacionKPIs()');
