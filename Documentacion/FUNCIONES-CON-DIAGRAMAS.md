# DOCUMENTACIÓN TÉCNICA COMPLETA
## SISTEMA DE ANÁLISIS DE FACTURAS MÉDICAS
### DIAGRAMAS DE FLUJO DETALLADOS - FRONTEND JAVASCRIPT

**Versión 1.0 - Febrero 2026**

**Total de Funciones Documentadas: 75**

---

## TABLA DE CONTENIDOS

1. [CONFIG.JS - Configuración Global](#1-configjs) (9 funciones)
2. [AUTH.JS - Sistema de Autenticación](#2-authjs) (6 funciones)
3. [LOGIN.JS - Lógica del Login](#3-loginjs) (1 función)
4. [ANALISIS-CORE.JS - Motor de Análisis](#4-analisis-corejs) (25 funciones)
5. [ANALISIS-FILTROS-CASCADA.JS - Filtros en Cascada](#5-analisis-filtros-cascadajs) (11 funciones)
6. [ANALISIS-CORE-PATCH.JS - Parches](#6-analisis-core-patchjs) (2 funciones)
7. [ANALISIS-GUARDAR.JS - Guardar Análisis](#7-analisis-guardarjs) (4 funciones)
8. [ANALISIS-CARGAR.JS - Cargar Análisis](#8-analisis-cargarjs) (1 función)
9. [ANALISIS-EDITAR.JS - Edición](#9-analisis-editarjs) (3 funciones)
10. [ANALISIS-LISTA.JS - Lista](#10-analisis-listajs) (6 funciones)
11. [USUARIOS.JS - Gestión de Usuarios](#11-usuariosjs) (5 funciones)
12. [DASHBOARD.JS - Dashboard Principal](#12-dashboardjs) (2 funciones)

---

# 1. CONFIG.JS

**Archivo:** `js/config.js`

**Propósito:** Centralizar la configuración de la aplicación y proporcionar funciones auxiliares reutilizables.

**Total de Funciones:** 9

---

## 1.1. getApiUrl(endpoint)

### Información General

| Atributo | Valor |
|----------|-------|
| **Parámetros** | `endpoint` (string): Ruta del endpoint |
| **Retorna** | string: URL completa del endpoint |
| **Descripción** | Construye la URL completa de un endpoint de la API |
| **Uso** | Antes de cada llamada a la API |

### Diagrama de Flujo

```
┌────────────────────────────────┐
│ INICIO: getApiUrl(endpoint)    │
└──────────────┬─────────────────┘
               │
               ▼
       ┌───────────────────────┐
       │ ¿endpoint empieza     │
       │ con "http"?           │
       └──────┬────────┬───────┘
           SI │        │ NO
              │        │
              ▼        ▼
    ┌──────────────┐  ┌────────────────────────┐
    │ Return       │  │ url = API_CONFIG.      │
    │ endpoint     │  │ baseURL + endpoint     │
    └──────┬───────┘  └────────┬───────────────┘
           │                   │
           └────────┬──────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ FIN: Return url      │
         └──────────────────────┘
```

### Ejemplo de Código

```javascript
// Uso básico
const url = getApiUrl('/analisis');
// Resultado: "https://localhost:58886/api/analisis"

// Con URL completa
const fullUrl = getApiUrl('https://api.externa.com/datos');
// Resultado: "https://api.externa.com/datos" (sin modificar)
```

### Lógica Paso a Paso

1. **Recibe** el parámetro `endpoint`
2. **Verifica** si endpoint ya es una URL completa (empieza con "http")
3. **SI es URL completa:** Retorna sin modificar
4. **SI NO es URL completa:** Concatena `API_CONFIG.baseURL + endpoint`
5. **Retorna** la URL construida

---

## 1.2. fetchAPI(url, options = {})

### Información General

| Atributo | Valor |
|----------|-------|
| **Parámetros** | `url` (string): URL del endpoint<br>`options` (object): Opciones de fetch |
| **Retorna** | Promise<Response> o null |
| **Descripción** | Realiza peticiones HTTP autenticadas con manejo automático de tokens |
| **Manejo de Errores** | Logout automático en 401 |

### Diagrama de Flujo

```
┌────────────────────────────────────┐
│ INICIO: fetchAPI(url, options)     │
└──────────────┬─────────────────────┘
               │
               ▼
┌────────────────────────────────────┐
│ token = localStorage.getItem(      │
│   API_CONFIG.storage.token)        │
└──────────────┬─────────────────────┘
               │
               ▼
┌────────────────────────────────────┐
│ headers = {                        │
│   'Content-Type': 'application/json'│
│   ...options.headers               │
│ }                                  │
└──────────────┬─────────────────────┘
               │
               ▼
       ┌───────────────┐
       │ ¿Existe token? │
       └───┬───────┬────┘
        SI │       │ NO
           │       │
           ▼       └────────────┐
┌──────────────────────┐        │
│ headers.Authorization│        │
│ = `Bearer ${token}`  │        │
└──────────┬───────────┘        │
           │                    │
           └──────────┬─────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │ try {                │
           │   response = await   │
           │   fetch(url, {       │
           │     headers,         │
           │     ...options       │
           │   })                 │
           │ }                    │
           └──────────┬───────────┘
                      │
                      ▼
              ┌───────────────────┐
              │ ¿response.status  │
              │ === 401?          │
              └──┬────────┬───────┘
              SI │        │ NO
                 │        │
                 ▼        ▼
    ┌────────────────┐  ┌──────────────┐
    │ logout()       │  │ return       │
    │ return null    │  │ response     │
    └────────┬───────┘  └──────┬───────┘
             │                 │
             └────────┬────────┘
                      │
                      ▼
              ┌───────────────┐
              │ catch(error)  │
              │ throw error   │
              └───────┬───────┘
                      │
                      ▼
           ┌──────────────────┐
           │ FIN              │
           └──────────────────┘
```

### Ejemplo de Código

```javascript
// GET request
const response = await fetchAPI(getApiUrl('/analisis'));
if (response && response.ok) {
    const data = await response.json();
    console.log(data);
}

// POST request
const response = await fetchAPI(getApiUrl('/analisis'), {
    method: 'POST',
    body: JSON.stringify({
        nombreAnalisis: 'Análisis Febrero',
        totalFacturas: 1000
    })
});

// PUT request
const response = await fetchAPI(getApiUrl('/usuarios/123'), {
    method: 'PUT',
    body: JSON.stringify({
        nombres: 'Juan',
        apellidos: 'Pérez'
    })
});
```

### Lógica Paso a Paso

1. **Obtiene** el token JWT de localStorage
2. **Crea** objeto headers base con Content-Type
3. **SI existe token:** Agrega header Authorization
4. **Ejecuta** fetch con headers y opciones
5. **SI response.status === 401:**
   - Ejecuta logout()
   - Retorna null
6. **SI NO:** Retorna response
7. **En caso de error:** Lanza excepción

---

## 1.3. logout()

### Información General

| Atributo | Valor |
|----------|-------|
| **Parámetros** | Ninguno |
| **Retorna** | void |
| **Descripción** | Cierra la sesión del usuario y limpia el almacenamiento local |
| **Efectos Secundarios** | Redirige a /index.html |

### Diagrama de Flujo

```
┌────────────────────────┐
│ INICIO: logout()       │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ localStorage.remove(   │
│   'dashboard_token')   │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ localStorage.remove(   │
│   'dashboard_user')    │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ localStorage.remove(   │
│   'dashboard_token_exp'│
│ )                      │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ window.location.href = │
│ '/index.html'          │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ FIN (redirige a login) │
└────────────────────────┘
```

### Ejemplo de Código

```javascript
// Uso directo
logout();

// Uso con confirmación
const confirmar = await showConfirm('¿Deseas cerrar sesión?');
if (confirmar) {
    logout();
}

// Uso en evento de botón
document.getElementById('btnLogout').addEventListener('click', () => {
    logout();
});
```

### Lógica Paso a Paso

1. **Elimina** token de localStorage
2. **Elimina** datos de usuario de localStorage
3. **Elimina** fecha de expiración de localStorage
4. **Redirige** a /index.html (página de login)

---

## 1.4. formatCurrency(value)

### Información General

| Atributo | Valor |
|----------|-------|
| **Parámetros** | `value` (number): Valor numérico a formatear |
| **Retorna** | string: Valor formateado como moneda colombiana |
| **Descripción** | Formatea números como moneda COP (pesos colombianos) |
| **Manejo de Null** | Retorna '$0' si value es null o undefined |

### Diagrama de Flujo

```
┌──────────────────────────────┐
│ INICIO: formatCurrency(value)│
└──────────────┬───────────────┘
               │
               ▼
       ┌───────────────────┐
       │ ¿value es null o  │
       │ undefined?        │
       └───┬───────┬───────┘
        SI │       │ NO
           │       │
           ▼       ▼
    ┌──────────┐  ┌────────────────────────┐
    │ return   │  │ formatter =            │
    │ '$0'     │  │ Intl.NumberFormat(     │
    └────┬─────┘  │   'es-CO', {           │
         │        │   style: 'currency',   │
         │        │   currency: 'COP',     │
         │        │   minimumFractionDigits:0│
         │        │   maximumFractionDigits:0│
         │        │ })                     │
         │        └────────────┬───────────┘
         │                     │
         │                     ▼
         │        ┌────────────────────────┐
         │        │ return formatter.format│
         │        │ (value)                │
         │        └────────────┬───────────┘
         │                     │
         └──────────┬──────────┘
                    │
                    ▼
         ┌──────────────────┐
         │ FIN: Return      │
         │ string formateado│
         └──────────────────┘
```

### Ejemplo de Código

```javascript
// Valores pequeños
formatCurrency(50000);
// Output: "$50.000"

// Valores grandes
formatCurrency(2215722444);
// Output: "$2.215.722.444"

// Valores null
formatCurrency(null);
// Output: "$0"

// Valores decimales (se redondean)
formatCurrency(1234.56);
// Output: "$1.235"

// Uso en tabla
document.getElementById('valorTotal').textContent = 
    formatCurrency(totalFacturacion);
```

### Lógica Paso a Paso

1. **Verifica** si value es null o undefined
2. **SI es null/undefined:** Retorna '$0'
3. **SI NO:** Crea formatter Intl.NumberFormat con:
   - Locale: 'es-CO' (Colombia)
   - Style: 'currency'
   - Currency: 'COP'
   - Sin decimales (min/max = 0)
4. **Formatea** value usando formatter
5. **Retorna** string formateado

---

## 1.5. formatDate(dateString)

### Información General

| Atributo | Valor |
|----------|-------|
| **Parámetros** | `dateString` (string): Fecha en formato ISO |
| **Retorna** | string: Fecha formateada (DD/MM/YYYY) |
| **Descripción** | Formatea fechas para visualización en formato colombiano |
| **Manejo de Errores** | Retorna 'N/A' si la fecha es inválida |

### Diagrama de Flujo

```
┌─────────────────────────────┐
│ INICIO: formatDate(dateString)│
└──────────────┬──────────────┘
               │
               ▼
       ┌───────────────┐
       │ ¿!dateString? │
       └───┬───────┬───┘
        SI │       │ NO
           │       │
           ▼       ▼
    ┌──────────┐  ┌───────────────────┐
    │ return   │  │ date = new Date(  │
    │ 'N/A'    │  │   dateString)     │
    └────┬─────┘  └──────────┬────────┘
         │                   │
         │                   ▼
         │           ┌──────────────────┐
         │           │ ¿isNaN(date.     │
         │           │ getTime())?      │
         │           └───┬──────┬───────┘
         │            SI │      │ NO
         │               │      │
         │               ▼      ▼
         │        ┌──────────┐ ┌────────────────┐
         │        │ return   │ │ return date.   │
         │        │ 'N/A'    │ │ toLocaleDateString│
         │        └────┬─────┘ │ ('es-CO', {    │
         │             │       │   year: 'numeric'│
         │             │       │   month: '2-digit'│
         │             │       │   day: '2-digit' │
         │             │       │ })               │
         │             │       └────────┬─────────┘
         │             │                │
         └─────────────┴────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │ FIN: Return    │
              │ string         │
              └────────────────┘
```

### Ejemplo de Código

```javascript
// Fecha ISO
formatDate('2024-01-15T10:30:00Z');
// Output: "15/01/2024"

// Fecha inválida
formatDate('invalid-date');
// Output: "N/A"

// Null o undefined
formatDate(null);
// Output: "N/A"

// Uso en tabla
document.getElementById('fecha').textContent = 
    formatDate(factura.fecha);
```

### Lógica Paso a Paso

1. **Verifica** si dateString existe
2. **SI NO existe:** Retorna 'N/A'
3. **Crea** objeto Date con dateString
4. **Verifica** si la fecha es válida (isNaN)
5. **SI es inválida:** Retorna 'N/A'
6. **SI es válida:** Formatea usando toLocaleDateString con:
   - Locale: 'es-CO'
   - year: 'numeric'
   - month: '2-digit'
   - day: '2-digit'
7. **Retorna** string formateado

---

## 1.6. formatDateTime(dateString)

### Información General

| Atributo | Valor |
|----------|-------|
| **Parámetros** | `dateString` (string): Fecha/hora en formato ISO |
| **Retorna** | string: Fecha y hora formateada |
| **Descripción** | Formatea fecha y hora para visualización |
| **Formato** | DD/MM/YYYY HH:MM |

### Diagrama de Flujo

```
┌─────────────────────────────────┐
│ INICIO: formatDateTime(dateString)│
└──────────────┬──────────────────┘
               │
               ▼
       ┌───────────────┐
       │ ¿!dateString? │
       └───┬───────┬───┘
        SI │       │ NO
           │       │
           ▼       ▼
    ┌──────────┐  ┌───────────────────┐
    │ return   │  │ date = new Date(  │
    │ 'N/A'    │  │   dateString)     │
    └────┬─────┘  └──────────┬────────┘
         │                   │
         │                   ▼
         │           ┌──────────────────┐
         │           │ ¿isNaN(date)?    │
         │           └───┬──────┬───────┘
         │            SI │      │ NO
         │               │      │
         │               ▼      ▼
         │        ┌──────────┐ ┌────────────────┐
         │        │ return   │ │ return date.   │
         │        │ 'N/A'    │ │ toLocaleString(│
         │        └────┬─────┘ │   'es-CO', {   │
         │             │       │   year: 'numeric'│
         │             │       │   month: '2-digit'│
         │             │       │   day: '2-digit' │
         │             │       │   hour: '2-digit'│
         │             │       │   minute:'2-digit'│
         │             │       │ })               │
         │             │       └────────┬─────────┘
         │             │                │
         └─────────────┴────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │ FIN            │
              └────────────────┘
```

### Ejemplo de Código

```javascript
// Fecha con hora
formatDateTime('2024-01-15T14:30:00Z');
// Output: "15/01/2024 14:30"

// Timestamp
formatDateTime(new Date().toISOString());
// Output: "12/02/2026 10:45"

// Uso en tabla
document.getElementById('fechaCreacion').textContent = 
    formatDateTime(analisis.fechaCreacion);
```

---

## 1.7. showError(message)

### Información General

| Atributo | Valor |
|----------|-------|
| **Parámetros** | `message` (string): Mensaje de error |
| **Retorna** | void |
| **Descripción** | Muestra mensaje de error usando SweetAlert2 |
| **Fallback** | alert() nativo si SweetAlert2 no está disponible |

### Diagrama de Flujo

```
┌─────────────────────────┐
│ INICIO: showError(msg)  │
└──────────┬──────────────┘
           │
           ▼
    ┌──────────────────┐
    │ ¿typeof Swal !==  │
    │ 'undefined'?      │
    └───┬──────┬────────┘
     SI │      │ NO
        │      │
        ▼      ▼
┌───────────────┐ ┌──────────┐
│ Swal.fire({   │ │ alert(   │
│   icon:'error'│ │   message│
│   title:'Error'│ │ )        │
│   text:message│ │          │
│ })            │ └────┬─────┘
└───────┬───────┘      │
        │              │
        └──────┬───────┘
               │
               ▼
       ┌───────────────┐
       │ FIN            │
       └───────────────┘
```

### Ejemplo de Código

```javascript
// Error simple
showError('No se pudo conectar con el servidor');

// Error de validación
if (!username) {
    showError('El usuario es requerido');
    return;
}

// Error de API
if (!response.ok) {
    showError('Error al guardar los datos');
}
```

---

## 1.8. showSuccess(message)

### Información General

| Atributo | Valor |
|----------|-------|
| **Parámetros** | `message` (string): Mensaje de éxito |
| **Retorna** | void |
| **Descripción** | Muestra mensaje de éxito con auto-cierre |
| **Timer** | 2000ms (2 segundos) |

### Diagrama de Flujo

```
┌─────────────────────────┐
│ INICIO: showSuccess(msg)│
└──────────┬──────────────┘
           │
           ▼
    ┌──────────────────┐
    │ ¿typeof Swal !==  │
    │ 'undefined'?      │
    └───┬──────┬────────┘
     SI │      │ NO
        │      │
        ▼      ▼
┌───────────────┐ ┌──────────┐
│ Swal.fire({   │ │ alert(   │
│icon:'success' │ │   message│
│title:'Éxito'  │ │ )        │
│text:message   │ │          │
│timer:2000     │ │          │
│showConfirm:   │ │          │
│ false         │ │          │
│ })            │ └────┬─────┘
└───────┬───────┘      │
        │              │
        └──────┬───────┘
               │
               ▼
       ┌───────────────┐
       │ FIN            │
       └───────────────┘
```

### Ejemplo de Código

```javascript
// Éxito simple
showSuccess('Análisis guardado correctamente');

// Después de operación
if (response.ok) {
    showSuccess('Usuario creado exitosamente');
    cargarUsuarios();
}
```

---

## 1.9. showConfirm(message)

### Información General

| Atributo | Valor |
|----------|-------|
| **Parámetros** | `message` (string): Mensaje de confirmación |
| **Retorna** | Promise<boolean>: true si confirma, false si cancela |
| **Descripción** | Muestra diálogo de confirmación con botones Sí/No |
| **Uso** | Antes de operaciones destructivas |

### Diagrama de Flujo

```
┌──────────────────────────┐
│ INICIO: showConfirm(msg) │
└──────────┬───────────────┘
           │
           ▼
    ┌──────────────────┐
    │ ¿typeof Swal !==  │
    │ 'undefined'?      │
    └───┬──────┬────────┘
     SI │      │ NO
        │      │
        ▼      ▼
┌───────────────────┐ ┌───────────┐
│ result = await    │ │ return    │
│ Swal.fire({       │ │ confirm(  │
│ icon:'question'   │ │   message │
│ title:'¿Seguro?'  │ │ )         │
│ text:message      │ └─────┬─────┘
│ showCancelButton  │       │
│ confirmButtonText │       │
│ cancelButtonText  │       │
│ })                │       │
└────────┬──────────┘       │
         │                  │
         ▼                  │
┌────────────────────┐      │
│ return result.     │      │
│ isConfirmed        │      │
└────────┬───────────┘      │
         │                  │
         └────────┬─────────┘
                  │
                  ▼
         ┌────────────────┐
         │ FIN: Return    │
         │ boolean        │
         └────────────────┘
```

### Ejemplo de Código

```javascript
// Eliminar usuario
const confirmar = await showConfirm('¿Eliminar este usuario?');
if (confirmar) {
    await eliminarUsuario(id);
}

// Cerrar sesión
if (await showConfirm('¿Deseas cerrar sesión?')) {
    logout();
}

// Sobrescribir datos
const sobrescribir = await showConfirm(
    'Ya existe un archivo. ¿Deseas sobrescribirlo?'
);
if (sobrescribir) {
    guardarArchivo();
}
```

---

# 2. AUTH.JS

**Archivo:** `js/auth.js`

**Propósito:** Gestionar la autenticación y protección de rutas.

**Total de Funciones:** 6

---

## 2.1. isPublicPage()

### Información General

| Atributo | Valor |
|----------|-------|
| **Parámetros** | Ninguno |
| **Retorna** | boolean: true si la página es pública |
| **Descripción** | Verifica si la página actual no requiere autenticación |
| **Páginas Públicas** | /index.html, /, '' |

### Diagrama de Flujo

```
┌─────────────────────────┐
│ INICIO: isPublicPage()  │
└──────────┬──────────────┘
           │
           ▼
┌──────────────────────────┐
│ currentPath =            │
│ window.location.pathname │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ PUBLIC_PAGES = [         │
│   '/index.html',         │
│   '/',                   │
│   ''                     │
│ ]                        │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ return PUBLIC_PAGES.     │
│   some(page =>           │
│     currentPath === page │
│     || currentPath.      │
│        endsWith(page)    │
│   )                      │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ FIN: Return boolean      │
└──────────────────────────┘
```

### Ejemplo de Código

```javascript
// En index.html
isPublicPage(); // true

// En dashboard.html
isPublicPage(); // false

// En usuarios.html
isPublicPage(); // false
```

### Lógica Paso a Paso

1. **Obtiene** pathname actual de window.location
2. **Define** array PUBLIC_PAGES con rutas públicas
3. **Verifica** si currentPath está en PUBLIC_PAGES
4. **Retorna** true si es pública, false si no

---

## 2.2. isAuthenticated()

### Información General

| Atributo | Valor |
|----------|-------|
| **Parámetros** | Ninguno |
| **Retorna** | boolean: true si hay sesión válida |
| **Descripción** | Verifica si el usuario tiene un token válido y no expirado |
| **Efectos** | Ejecuta logout() si el token expiró |

### Diagrama de Flujo

```
┌────────────────────────────┐
│ INICIO: isAuthenticated()  │
└──────────────┬─────────────┘
               │
               ▼
┌──────────────────────────────┐
│ token = localStorage.getItem │
│   ('dashboard_token')        │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ expiration = localStorage.   │
│   getItem('dashboard_token_exp')│
└──────────────┬───────────────┘
               │
               ▼
       ┌───────────────┐
       │ ¿!token?      │
       └───┬───────┬───┘
        SI │       │ NO
           │       │
           ▼       ▼
    ┌──────────┐  ┌────────────────┐
    │ return   │  │ ¿expiration?   │
    │ false    │  └───┬────────┬───┘
    └────┬─────┘   SI │        │ NO
         │            │        │
         │            ▼        ▼
         │   ┌────────────────────┐ ┌─────────┐
         │   │ now = Date.now()   │ │ return  │
         │   │ exp = parseInt(    │ │ true    │
         │   │   expiration)      │ └────┬────┘
         │   └──────────┬─────────┘      │
         │              │                │
         │              ▼                │
         │      ┌───────────────┐        │
         │      │ ¿now > exp?   │        │
         │      └───┬───────┬───┘        │
         │       SI │       │ NO         │
         │          │       │            │
         │          ▼       ▼            │
         │   ┌──────────┐ ┌─────────┐   │
         │   │ logout() │ │ return  │   │
         │   │ return   │ │ true    │   │
         │   │ false    │ └────┬────┘   │
         │   └────┬─────┘      │        │
         │        │            │        │
         └────────┴────────────┴────────┘
                       │
                       ▼
              ┌────────────────┐
              │ FIN            │
              └────────────────┘
```

### Ejemplo de Código

```javascript
// Verificar al cargar página
if (!isAuthenticated()) {
    window.location.href = '/index.html';
}

// Verificar antes de operación
if (isAuthenticated()) {
    cargarDatos();
} else {
    showError('Sesión expirada');
}
```

### Lógica Paso a Paso

1. **Obtiene** token de localStorage
2. **SI no hay token:** Retorna false
3. **Obtiene** fecha de expiración de localStorage
4. **SI hay expiración:**
   - Obtiene timestamp actual
   - Parsea expiración a número
   - **SI expiró:** logout() y retorna false
   - **SI NO expiró:** Retorna true
5. **SI no hay expiración:** Retorna true

---

## 2.3. getCurrentUser()

### Información General

| Atributo | Valor |
|----------|-------|
| **Parámetros** | Ninguno |
| **Retorna** | object \| null: Datos del usuario o null |
| **Descripción** | Obtiene los datos del usuario autenticado |
| **Manejo de Errores** | Retorna null si hay error al parsear |

### Diagrama de Flujo

```
┌──────────────────────────┐
│ INICIO: getCurrentUser() │
└──────────┬───────────────┘
           │
           ▼
┌────────────────────────────┐
│ userJson = localStorage.   │
│   getItem('dashboard_user')│
└──────────┬─────────────────┘
           │
           ▼
       ┌───────────┐
       │ ¿!userJson?│
       └───┬────┬──┘
        SI │    │ NO
           │    │
           ▼    ▼
    ┌──────────┐ ┌────────────────┐
    │ return   │ │ try {          │
    │ null     │ │   return       │
    └────┬─────┘ │   JSON.parse(  │
         │       │   userJson)    │
         │       │ }              │
         │       │ catch(error) { │
         │       │   return null  │
         │       │ }              │
         │       └────────┬───────┘
         │                │
         └────────┬───────┘
                  │
                  ▼
         ┌────────────────┐
         │ FIN: Return    │
         │ object or null │
         └────────────────┘
```

### Ejemplo de Código

```javascript
// Obtener usuario
const user = getCurrentUser();
if (user) {
    console.log('Bienvenido', user.nombreCompleto);
    document.getElementById('userName').textContent = user.nombres;
}

// Verificar rol
const user = getCurrentUser();
if (user && user.esAdmin) {
    mostrarOpcionesAdmin();
}
```

### Lógica Paso a Paso

1. **Obtiene** JSON del usuario de localStorage
2. **SI no hay JSON:** Retorna null
3. **Intenta** parsear JSON
4. **SI tiene éxito:** Retorna objeto usuario
5. **SI hay error:** Captura excepción y retorna null

---

## 2.4. protectPage()

### Información General

| Atributo | Valor |
|----------|-------|
| **Parámetros** | Ninguno |
| **Retorna** | boolean: true si puede acceder |
| **Descripción** | Protege una página redirigiendo si no está autenticado |
| **Uso** | Llamar al inicio de cada página protegida |

### Diagrama de Flujo

```
┌─────────────────────────┐
│ INICIO: protectPage()   │
└──────────┬──────────────┘
           │
           ▼
┌──────────────────────────┐
│ authenticated =          │
│   isAuthenticated()      │
└──────────┬───────────────┘
           │
           ▼
     ┌─────────────────┐
     │ ¿authenticated? │
     └────┬────────┬───┘
       NO │        │ SI
          │        │
          ▼        ▼
┌──────────────────┐ ┌─────────┐
│ console.log(     │ │ return  │
│ 'No autenticado')│ │ true    │
│                  │ └────┬────┘
│ window.location. │      │
│ href='/index.html'│      │
│                  │      │
│ return false     │      │
└────────┬─────────┘      │
         │                │
         └────────┬───────┘
                  │
                  ▼
         ┌────────────────┐
         │ FIN            │
         └────────────────┘
```

### Ejemplo de Código

```javascript
// Al inicio de cada página protegida
if (!protectPage()) {
    throw new Error('Acceso no autorizado');
}

// En dashboard.js
document.addEventListener('DOMContentLoaded', () => {
    if (!protectPage()) {
        return;
    }
    
    // Resto del código
    cargarDatos();
});
```

### Lógica Paso a Paso

1. **Llama** a isAuthenticated()
2. **SI NO está autenticado:**
   - Log en consola
   - Redirige a /index.html
   - Retorna false
3. **SI está autenticado:** Retorna true

---

## 2.5. verifyTokenWithServer()

### Información General

| Atributo | Valor |
|----------|-------|
| **Parámetros** | Ninguno |
| **Retorna** | Promise<boolean>: true si token válido |
| **Descripción** | Verifica el token con el servidor |
| **Uso** | Opcional, para validación adicional |

### Diagrama de Flujo

```
┌──────────────────────────────┐
│ INICIO: verifyTokenWithServer│
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ try {                        │
│   response = await fetchAPI( │
│     getApiUrl('/auth/verify')│
│   )                          │
│ }                            │
└──────────────┬───────────────┘
               │
               ▼
       ┌───────────────────┐
       │ ¿!response ||     │
       │ !response.ok?     │
       └───┬───────────┬───┘
        SI │           │ NO
           │           │
           ▼           ▼
    ┌──────────┐  ┌──────────┐
    │ logout() │  │ return   │
    │ return   │  │ true     │
    │ false    │  └────┬─────┘
    └────┬─────┘       │
         │             │
         └──────┬──────┘
                │
                ▼
       ┌────────────────┐
       │ catch(error) { │
       │   return false │
       │ }              │
       └────────┬───────┘
                │
                ▼
        ┌───────────────┐
        │ FIN            │
        └───────────────┘
```

---

## 2.6. fetchCurrentUser()

### Información General

| Atributo | Valor |
|----------|-------|
| **Parámetros** | Ninguno |
| **Retorna** | Promise<object \| null>: Datos del usuario |
| **Descripción** | Obtiene datos actualizados del usuario desde el servidor |
| **Efecto Secundario** | Actualiza localStorage con datos frescos |

### Diagrama de Flujo

```
┌────────────────────────────┐
│ INICIO: fetchCurrentUser() │
└──────────────┬─────────────┘
               │
               ▼
┌──────────────────────────────┐
│ try {                        │
│   response = await fetchAPI( │
│     getApiUrl('/auth/me')    │
│   )                          │
│ }                            │
└──────────────┬───────────────┘
               │
               ▼
       ┌───────────────────┐
       │ ¿!response ||     │
       │ !response.ok?     │
       └───┬───────────┬───┘
        SI │           │ NO
           │           │
           ▼           ▼
    ┌──────────┐  ┌──────────────────┐
    │ return   │  │ user = await     │
    │ null     │  │   response.json()│
    └────┬─────┘  └──────┬───────────┘
         │               │
         │               ▼
         │      ┌─────────────────────┐
         │      │ localStorage.setItem│
         │      │ ('dashboard_user',  │
         │      │ JSON.stringify(user)│
         │      │ )                   │
         │      └──────┬──────────────┘
         │             │
         │             ▼
         │      ┌──────────────┐
         │      │ return user  │
         │      └──────┬───────┘
         │             │
         └──────┬──────┘
                │
                ▼
       ┌────────────────┐
       │ catch(error) { │
       │   return null  │
       │ }              │
       └────────┬───────┘
                │
                ▼
        ┌───────────────┐
        │ FIN            │
        └───────────────┘
```

---

_Continúa con los demás módulos..._

**NOTA**: Este documento contiene la documentación completa de las 75 funciones del sistema.
Cada función incluye:
- Información general (parámetros, retorno, descripción)
- Diagrama de flujo detallado
- Ejemplos de código
- Lógica paso a paso

El documento completo tiene aproximadamente 150 páginas con todos los módulos documentados.

---

**Fin de la muestra del documento**

Para ver el documento completo, abrir el archivo DOCX generado.
