// ==========================================
// CONFIGURACIÓN GLOBAL DE LA APLICACIÓN
// ==========================================

const API_CONFIG = {
    // URL base de la API - CAMBIAR SEGÚN TU ENTORNO
    baseURL: 'https://localhost:59427/api',
    
    // Endpoints de la API
    endpoints: {
        // Auth
        login: '/auth/login',
        me: '/auth/me',
        verify: '/auth/verify',
        
        // Usuarios
        usuarios: '/usuarios',
        usuarioById: (id) => `/usuarios/${id}`,
        
        // Análisis
        analisis: '/analisis',
        analisisById: (id) => `/analisis/${id}`,
        analisisSoloMios: '/analisis?soloMios=true'
    },
    
    // Claves de localStorage
    storage: {
        token: 'dashboard_token',
        user: 'dashboard_user',
        tokenExpiration: 'dashboard_token_exp'
    }
};

// ==========================================
// FUNCIONES HELPER
// ==========================================

/**
 * Obtener URL completa de un endpoint
 */
function getApiUrl(endpoint) {
    if (endpoint.startsWith('http')) {
        return endpoint; // Ya es una URL completa
    }
    return API_CONFIG.baseURL + endpoint;
}

/**
 * Realizar petición autenticada a la API
 */
async function fetchAPI(url, options = {}) {
    const token = localStorage.getItem(API_CONFIG.storage.token);
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        // Si el token expiró o es inválido
        if (response.status === 401) {
            logout();
            return null;
        }
        
        return response;
    } catch (error) {
        console.error('Error en fetchAPI:', error);
        throw error;
    }
}

/**
 * Cerrar sesión
 */
function logout() {
    localStorage.removeItem(API_CONFIG.storage.token);
    localStorage.removeItem(API_CONFIG.storage.user);
    localStorage.removeItem(API_CONFIG.storage.tokenExpiration);
    window.location.href = '/index.html';
}

/**
 * Formatear moneda colombiana
 */
function formatCurrency(value) {
    if (value === null || value === undefined) return '$0';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

/**
 * Formatear fecha
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * Formatear fecha y hora
 */
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    return date.toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Mostrar mensaje de error
 */
function showError(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message
        });
    } else {
        alert(message);
    }
}

/**
 * Mostrar mensaje de éxito
 */
function showSuccess(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: message,
            timer: 2000,
            showConfirmButton: false
        });
    } else {
        alert(message);
    }
}

/**
 * Mostrar confirmación
 */
async function showConfirm(message) {
    if (typeof Swal !== 'undefined') {
        const result = await Swal.fire({
            icon: 'question',
            title: '¿Estás seguro?',
            text: message,
            showCancelButton: true,
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar'
        });
        return result.isConfirmed;
    } else {
        return confirm(message);
    }
}

console.log('✅ Config.js cargado - API URL:', API_CONFIG.baseURL);
