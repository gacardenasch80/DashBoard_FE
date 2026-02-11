// Proteger página
if (!protectPage()) {
    throw new Error('Acceso no autorizado');
}

// Cargar información del usuario
document.addEventListener('DOMContentLoaded', async () => {
    const user = getCurrentUser();
    if (user) {
        const userNameElement = document.getElementById('userName');
        const welcomeNameElement = document.getElementById('welcomeName');
        
        if (userNameElement) {
            userNameElement.textContent = user.nombreCompleto || user.username;
        }
        
        if (welcomeNameElement) {
            welcomeNameElement.textContent = user.nombres || user.username;
        }
    }
    
    // Botón de logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            const confirm = await showConfirm('¿Deseas cerrar sesión?');
            if (confirm) {
                logout();
            }
        });
    }
});

console.log('✅ Dashboard.js cargado');
