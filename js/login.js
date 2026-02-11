// ==========================================
// LÓGICA DEL FORMULARIO DE LOGIN
// ==========================================

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const btnLogin = document.getElementById('btnLogin');
    const loader = document.getElementById('loader');
    
    // Validación básica
    if (!username || !password) {
        showError('Por favor ingrese usuario y contraseña');
        return;
    }
    
    // Deshabilitar botón y mostrar loader
    btnLogin.disabled = true;
    btnLogin.textContent = 'Iniciando sesión...';
    loader.style.display = 'block';
    
    try {
        const response = await fetch(getApiUrl(API_CONFIG.endpoints.login), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Guardar token y datos del usuario
            localStorage.setItem(API_CONFIG.storage.token, data.token);
            localStorage.setItem(API_CONFIG.storage.user, JSON.stringify(data.usuario));
            
            // Calcular y guardar expiración
            const expiration = new Date(data.expiration).getTime();
            localStorage.setItem(API_CONFIG.storage.tokenExpiration, expiration.toString());
            
            console.log('✅ Login exitoso');
            console.log('Token:', data.token.substring(0, 20) + '...');
            console.log('Usuario:', data.usuario);
            console.log('Expiración:', new Date(expiration).toLocaleString());
            
            // Mostrar mensaje de éxito
            await Swal.fire({
                icon: 'success',
                title: '¡Bienvenido!',
                text: `Hola ${data.usuario.nombreCompleto}`,
                timer: 1500,
                showConfirmButton: false
            });
            
            // Redirigir al dashboard
            window.location.href = '/pages/dashboard.html';
        } else {
            // Mostrar error
            console.error('❌ Error de login:', data);
            Swal.fire({
                icon: 'error',
                title: 'Error de autenticación',
                text: data.message || 'Credenciales inválidas. Verifica tu usuario y contraseña.'
            });
        }
    } catch (error) {
        console.error('❌ Error en login:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            html: `
                <p>No se pudo conectar con el servidor.</p>
                <p><strong>Verifica:</strong></p>
                <ul style="text-align: left; padding-left: 20px;">
                    <li>Que la API esté ejecutándose</li>
                    <li>La URL en <code>js/config.js</code></li>
                    <li>CORS configurado en el backend</li>
                </ul>
            `
        });
    } finally {
        // Rehabilitar botón y ocultar loader
        btnLogin.disabled = false;
        btnLogin.textContent = 'Iniciar Sesión';
        loader.style.display = 'none';
    }
});

// Enter en el campo de contraseña también envía el formulario
document.getElementById('password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('loginForm').dispatchEvent(new Event('submit'));
    }
});

console.log('✅ Login.js cargado');
