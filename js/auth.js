// ==========================================
// SISTEMA DE AUTENTICACIÓN Y PROTECCIÓN DE RUTAS
// ==========================================

// Páginas que no requieren autenticación
const PUBLIC_PAGES = [
    '/index.html',
    '/',
    ''
];

/**
 * Verificar si la página actual es pública
 */
function isPublicPage() {
    const currentPath = window.location.pathname;
    
    return PUBLIC_PAGES.some(page => {
        if (page === '') {
            return currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('/');
        }
        return currentPath === page || currentPath.endsWith(page);
    });
}

/**
 * Verificar si el usuario está autenticado
 */
function isAuthenticated() {
    const token = localStorage.getItem(API_CONFIG.storage.token);
    const expiration = localStorage.getItem(API_CONFIG.storage.tokenExpiration);
    
    if (!token) {
        return false;
    }
    
    // Verificar si el token expiró
    if (expiration) {
        const now = new Date().getTime();
        const exp = parseInt(expiration);
        
        if (now > exp) {
            console.log('⚠️ Token expirado');
            logout();
            return false;
        }
    }
    
    return true;
}

/**
 * Obtener usuario actual del localStorage
 */
function getCurrentUser() {
    const userJson = localStorage.getItem(API_CONFIG.storage.user);
    if (!userJson) return null;
    
    try {
        return JSON.parse(userJson);
    } catch (error) {
        console.error('Error parseando usuario:', error);
        return null;
    }
}

/**
 * Proteger página - llamar al inicio de cada página protegida
 */
function protectPage() {
    if (!isAuthenticated()) {
        console.log('⚠️ Usuario no autenticado, redirigiendo al login...');
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

/**
 * Verificar token con el servidor
 */
async function verifyTokenWithServer() {
    try {
        const response = await fetchAPI(getApiUrl(API_CONFIG.endpoints.verify));
        
        if (!response || !response.ok) {
            logout();
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error verificando token:', error);
        return false;
    }
}

/**
 * Obtener información del usuario actual desde el servidor
 */
async function fetchCurrentUser() {
    try {
        const response = await fetchAPI(getApiUrl(API_CONFIG.endpoints.me));
        
        if (!response || !response.ok) {
            return null;
        }
        
        const user = await response.json();
        
        // Actualizar localStorage
        localStorage.setItem(API_CONFIG.storage.user, JSON.stringify(user));
        
        return user;
    } catch (error) {
        console.error('Error obteniendo usuario actual:', error);
        return null;
    }
}

// ==========================================
// INICIALIZACIÓN AUTOMÁTICA
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    
    console.log('🔐 Auth.js - Verificando autenticación...');
    console.log('📍 Ruta actual:', currentPath);
    console.log('🔓 Es página pública:', isPublicPage());
    console.log('✅ Está autenticado:', isAuthenticated());
    
    // Si es página pública y el usuario está autenticado → Redirigir al dashboard
    if (isPublicPage() && isAuthenticated()) {
        console.log('✅ Usuario autenticado en página pública, redirigiendo al dashboard...');
        window.location.href = '/pages/dashboard.html';
        return;
    }
    
    // Si es página protegida y el usuario NO está autenticado → Redirigir al login
    if (!isPublicPage() && !isAuthenticated()) {
        console.log('⚠️ Acceso no autorizado a página protegida, redirigiendo al login...');
        window.location.href = '/index.html';
        return;
    }
    
    console.log('✅ Auth.js - Verificación completada');
});

// Prevenir navegación directa por URL usando el botón "atrás"
window.addEventListener('popstate', () => {
    if (!isPublicPage() && !isAuthenticated()) {
        console.log('⚠️ Intento de navegación sin autenticación, bloqueando...');
        window.location.href = '/index.html';
    }
});

// Prevenir que se cachee la página en el navegador
window.addEventListener('beforeunload', () => {
    // Esto ayuda a que las páginas protegidas no se cacheen
    if (!isPublicPage()) {
        sessionStorage.setItem('navigating', 'true');
    }
});

console.log('✅ Auth.js cargado');
