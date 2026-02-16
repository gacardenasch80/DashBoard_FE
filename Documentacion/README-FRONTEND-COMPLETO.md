# DOCUMENTACIÓN TÉCNICA DEL FRONTEND
## Sistema de Análisis de Facturas Médicas

---

## TABLA DE CONTENIDOS

1. Arquitectura General del Sistema
2. Módulos y Funciones Principales
3. Diagramas de Flujo por Módulo
4. Diccionario de Funciones
5. Flujos de Usuario Completos

---

## 1. ARQUITECTURA GENERAL DEL SISTEMA

### Estructura de Archivos

```
Dashboard-Frontend/
├── index.html                      # Página de login
├── css/
│   ├── auth.css                    # Estilos del login
│   ├── dashboard.css               # Estilos del sistema
│   └── analisis.css                # Estilos de análisis
├── js/
│   ├── config.js                   # Configuración global
│   ├── auth.js                     # Sistema de autenticación
│   ├── login.js                    # Lógica del login
│   ├── dashboard.js                # Dashboard principal
│   ├── usuarios.js                 # Gestión de usuarios
│   ├── analisis-core.js            # Motor de análisis Excel
│   ├── analisis-filtros-cascada.js # Sistema de filtros
│   ├── analisis-core-patch.js      # Parches y correcciones
│   ├── analisis-guardar.js         # Guardar análisis en API
│   ├── analisis-cargar.js          # Cargar análisis guardados
│   ├── analisis-editar.js          # Edición de análisis
│   └── analisis-lista.js           # Lista de análisis
└── pages/
    ├── dashboard.html              # Página principal
    ├── usuarios.html               # Gestión de usuarios
    ├── analisis-lista.html         # Lista de análisis
    └── analisis-nuevo.html         # Crear/editar análisis
```

### Dependencias Externas

- **SweetAlert2**: Alertas y diálogos
- **Chart.js**: Gráficos interactivos
- **XLSX.js**: Lectura de archivos Excel

---

## 2. MÓDULOS Y FUNCIONES PRINCIPALES

### 2.1 CONFIG.JS - Configuración Global

**Propósito**: Centralizar configuración de la aplicación.

#### Funciones Principales:

##### `getApiUrl(endpoint)`
**Descripción**: Construye la URL completa de un endpoint de la API.

**Parámetros**:
- `endpoint` (string): Ruta del endpoint (ej: '/auth/login')

**Retorna**: String - URL completa

**Ejemplo**:
```javascript
const url = getApiUrl('/analisis');
// Retorna: 'https://localhost:58886/api/analisis'
```

##### `fetchAPI(url, options)`
**Descripción**: Realiza peticiones HTTP autenticadas a la API.

**Parámetros**:
- `url` (string): URL completa del endpoint
- `options` (object): Opciones de fetch (method, body, headers)

**Retorna**: Promise<Response>

**Funcionalidad**:
1. Obtiene token de localStorage
2. Agrega header Authorization
3. Realiza petición fetch
4. Si 401 (no autorizado) → logout automático

**Ejemplo**:
```javascript
const response = await fetchAPI(url, {
    method: 'POST',
    body: JSON.stringify(datos)
});
```

##### `formatCurrency(value)`
**Descripción**: Formatea números como moneda colombiana.

**Parámetros**:
- `value` (number): Valor a formatear

**Retorna**: String - Valor formateado (ej: '$2.215.722')

##### `formatDateTime(dateString)`
**Descripción**: Formatea fecha y hora en formato local.

**Parámetros**:
- `dateString` (string): Fecha en formato ISO

**Retorna**: String - Fecha formateada

---

### 2.2 AUTH.JS - Sistema de Autenticación

**Propósito**: Proteger rutas y verificar autenticación.

#### Funciones Principales:

##### `isAuthenticated()`
**Descripción**: Verifica si el usuario tiene sesión activa.

**Retorna**: Boolean

**Lógica**:
1. Obtiene token de localStorage
2. Obtiene fecha de expiración
3. Compara con fecha actual
4. Si expiró → logout() y return false
5. Si válido → return true

##### `getCurrentUser()`
**Descripción**: Obtiene datos del usuario actual del localStorage.

**Retorna**: Object | null - Datos del usuario

##### `protectPage()`
**Descripción**: Protege una página redirigiendo si no está autenticado.

**Retorna**: Boolean

**Uso**:
```javascript
// Al inicio de cada página protegida
if (!protectPage()) {
    throw new Error('Acceso no autorizado');
}
```

##### `logout()`
**Descripción**: Cierra sesión y limpia localStorage.

**Funcionalidad**:
1. Elimina token de localStorage
2. Elimina datos de usuario
3. Elimina fecha de expiración
4. Redirige a /index.html

---

### 2.3 LOGIN.JS - Lógica del Login

**Propósito**: Manejar el formulario de inicio de sesión.

#### Funciones Principales:

##### `handleLogin(e)`
**Descripción**: Maneja el envío del formulario de login.

**Parámetros**:
- `e` (Event): Evento submit del formulario

**Flujo**:
1. Previene submit por defecto
2. Valida campos (username, password)
3. Deshabilita botón y muestra loader
4. Hace POST a /api/auth/login
5. Si exitoso:
   - Guarda token en localStorage
   - Guarda usuario en localStorage
   - Guarda fecha de expiración
   - Muestra mensaje de bienvenida
   - Redirige a /pages/dashboard.html
6. Si falla:
   - Muestra mensaje de error
   - Habilita botón

**Ejemplo de Petición**:
```javascript
POST /api/auth/login
Body: {
    "username": "Admin",
    "password": "123456"
}

Response: {
    "token": "eyJhbGc...",
    "usuario": {
        "id": "...",
        "nombreCompleto": "Admin User",
        "username": "Admin"
    },
    "expiration": "2024-02-12T12:00:00Z"
}
```

---

### 2.4 ANALISIS-CORE.JS - Motor de Análisis

**Propósito**: Procesar archivos Excel y generar análisis.

#### Clases Principales:

##### `class Servicio`
**Descripción**: Representa un servicio médico.

**Propiedades**:
- `codigoServicio` (string)
- `nombreServicio` (string)
- `cantidad` (number)
- `valorUnitario` (number)
- `valorTotal` (number)

##### `class Factura`
**Descripción**: Representa una factura completa con servicios.

**Propiedades**:
- `numeroFactura` (string)
- `fecha` (Date)
- `regimen` (string)
- `administradora` (string)
- `contrato` (string)
- `valorPaciente` (number)
- `valorContrato` (number)
- `valorTotal` (number)
- `servicios` (Array<Servicio>)

**Métodos**:
- `agregarServicio(servicio)`: Agrega un servicio a la factura
- `toDisplayObject()`: Convierte a objeto para visualización
- `toSimpleObject()`: Convierte a objeto para JSON

#### Funciones Principales:

##### `procesarArchivo(file)`
**Descripción**: Lee y procesa un archivo Excel.

**Parámetros**:
- `file` (File): Archivo Excel seleccionado

**Flujo**:
1. Valida que sea archivo Excel (.xlsx o .xls)
2. Lee archivo con FileReader
3. Parsea con XLSX.read()
4. Extrae primera hoja
5. Convierte a JSON
6. Llama a convertirDatos()

##### `convertirDatos(rawData)`
**Descripción**: Convierte datos crudos de Excel en objetos Factura.

**Parámetros**:
- `rawData` (Array): Datos crudos del Excel

**Flujo**:
1. Valida columnas requeridas
2. Agrupa servicios por número de factura
3. Crea objetos Factura
4. Agrega servicios a cada factura
5. Calcula totales
6. Guarda en `facturasProcesadas`
7. Llama a `mostrarDashboard()`

##### `mostrarDashboard()`
**Descripción**: Muestra el dashboard con los datos procesados.

**Flujo**:
1. Oculta sección de upload
2. Muestra sección de dashboard
3. Inicializa filtros
4. Actualiza dashboard
5. Genera gráficos

##### `inicializarFiltros()`
**Descripción**: Inicializa los combos de filtros.

**Flujo**:
1. Extrae valores únicos de:
   - Regímenes
   - Administradoras
   - Contratos
2. Pobla los select correspondientes
3. Configura rango de fechas

##### `actualizarDashboard()`
**Descripción**: Actualiza KPIs, gráficos y tabla con datos filtrados.

**Flujo**:
1. Llama a `actualizarKPIs()`
2. Llama a `generarGraficos()`
3. Llama a `actualizarTabla()`

##### `actualizarKPIs()`
**Descripción**: Calcula y muestra los indicadores clave.

**Cálculos**:
```javascript
totalFacturacion = datosFiltrados.reduce((sum, f) => sum + f.valorTotal, 0)
totalContratos = datosFiltrados.reduce((sum, f) => sum + f.valorContrato, 0)
totalPacientes = datosFiltrados.reduce((sum, f) => sum + f.valorPaciente, 0)
totalFacturas = datosFiltrados.length
promedioFactura = totalFacturacion / totalFacturas
```

##### `generarGraficos()`
**Descripción**: Genera los 5 gráficos principales usando Chart.js.

**Gráficos**:
1. **Tendencia por Fecha**: Línea - Facturación diaria
2. **Por Administradora**: Barra - Facturación por entidad
3. **Por Régimen**: Dona - Distribución porcentual
4. **Top Servicios**: Barra horizontal - Servicios más frecuentes
5. **Por Contrato**: Barra - Facturación por contrato

##### `aplicarFiltros()`
**Descripción**: Filtra datos según criterios seleccionados.

**Criterios**:
- Régimen
- Administradora
- Contrato
- Rango de fechas

**Flujo**:
1. Parte de `facturasProcesadas`
2. Aplica filtro de régimen (si no es "TODOS")
3. Aplica filtro de administradora
4. Aplica filtro de contrato
5. Aplica filtro de fechas
6. Guarda resultado en `datosFiltrados`
7. Llama a `actualizarDashboard()`

---

### 2.5 ANALISIS-FILTROS-CASCADA.JS - Sistema de Filtros

**Propósito**: Manejar dependencias entre filtros.

#### Funciones Principales:

##### `inicializarComboRegimen()`
**Descripción**: Inicializa el combo de regímenes.

**Flujo**:
1. Extrae regímenes únicos de `facturasProcesadas`
2. Ordena alfabéticamente
3. Limpia combo
4. Agrega opción "Todos los Regímenes"
5. Agrega cada régimen como opción
6. Llama a `construirMapaAdministradoras()`

##### `construirMapaAdministradoras()`
**Descripción**: Construye mapa de administradoras por régimen.

**Resultado**:
```javascript
administradorasPorRegimen = {
    'CONTRIBUTIVO': ['SURA', 'SANITAS', 'NUEVA EPS'],
    'SUBSIDIADO': ['COOSALUD', 'MUTUAL SER'],
    'PARTICULAR': []
}
```

##### `actualizarComboAdministradoras(regimenSeleccionado, valorActual)`
**Descripción**: Actualiza combo de administradoras según régimen.

**Parámetros**:
- `regimenSeleccionado` (string): Régimen filtrado
- `valorActual` (string): Valor a preseleccionar (opcional)

**Flujo**:
1. Limpia combo
2. Si régimen = "TODOS":
   - Muestra todas las administradoras únicas
3. Si régimen específico:
   - Muestra solo administradoras del régimen
4. Agrega opción "Todas las Administradoras" como default
5. Agrega opciones filtradas
6. Establece valor actual si se proporcionó
7. Habilita combo

##### `actualizarComboContratos(regimenSeleccionado, administradoraSeleccionada, valorActual)`
**Descripción**: Actualiza combo de contratos según régimen y admin.

**Parámetros**:
- `regimenSeleccionado` (string): Régimen filtrado
- `administradoraSeleccionada` (string): Administradora filtrada
- `valorActual` (string): Valor a preseleccionar (opcional)

**Flujo**:
1. Limpia combo
2. Si administradora = "TODOS":
   - DESHABILITA combo
   - Establece valor "TODOS"
   - Return
3. Si administradora específica:
   - Filtra facturas por régimen Y administradora
   - Extrae contratos únicos
   - Agrega opciones al combo
   - HABILITA combo

##### `configurarEventosCascada()`
**Descripción**: Configura eventos onChange para cascada.

**Eventos**:
1. **onChange Régimen**:
   - Actualiza combo administradoras
   - Resetea y deshabilita combo contratos
   - Aplica filtros

2. **onChange Administradora**:
   - Actualiza combo contratos
   - Aplica filtros

##### `aplicarFiltrosGuardados(filtrosGuardados)`
**Descripción**: Aplica filtros de un análisis guardado.

**Parámetros**:
- `filtrosGuardados` (object): Objeto con filtros

**Flujo con Esperas**:
```javascript
// Paso 1: Aplicar régimen
selectRegimen.value = filtros.regimen;
actualizarComboAdministradoras(filtros.regimen);

// Esperar 100ms
setTimeout(() => {
    // Paso 2: Aplicar administradora
    selectAdmin.value = filtros.administradora;
    
    if (filtros.administradora !== 'TODOS') {
        actualizarComboContratos(...);
        
        // Esperar 100ms
        setTimeout(() => {
            // Paso 3: Aplicar contrato
            selectContrato.value = filtros.contrato;
            
            // Paso 4: Aplicar fechas
            inputInicio.value = filtros.fechaInicio;
            inputFin.value = filtros.fechaFin;
            
            // Paso 5: Ejecutar filtros
            aplicarFiltros();
        }, 100);
    }
}, 100);
```

---

### 2.6 ANALISIS-GUARDAR.JS - Guardar Análisis

**Propósito**: Guardar análisis completos en la API.

#### Funciones Principales:

##### `mostrarBotonesAccion()`
**Descripción**: Muestra botones de guardar y cargar otro.

**Se ejecuta cuando**: El dashboard se muestra (observador de mutaciones).

##### `guardarAnalisis()`
**Descripción**: Guarda el análisis actual en la API.

**Flujo**:
1. Valida que existan datos (`facturasProcesadas`)
2. Si ya fue guardado, pregunta si actualizar
3. Solicita nombre del análisis (SweetAlert)
4. Prepara objeto de datos:
```javascript
{
    nombreAnalisis: "Análisis Enero 2024",
    jsonData: {
        datosOriginales: [...],
        facturasProcesadas: [...],
        fechaMinima: "2024-01-01",
        fechaMaxima: "2024-01-31"
    },
    filtrosAplicados: {
        regimen: "CONTRIBUTIVO",
        administradora: "SURA",
        contrato: "TODOS",
        fechaInicio: "2024-01-01",
        fechaFin: "2024-01-31"
    },
    totalFacturas: 35044,
    valorTotal: 2215722444
}
```
5. Hace POST a /api/analisis
6. Muestra mensaje de éxito
7. Ofrece ir a "Mis Análisis"

##### `cargarOtroArchivo()`
**Descripción**: Recarga la página para cargar nuevo archivo.

**Flujo**:
1. Confirma con el usuario
2. Ejecuta `location.reload()`

---

### 2.7 ANALISIS-CARGAR.JS - Cargar Análisis Guardados

**Propósito**: Cargar y restaurar análisis desde la API.

#### Funciones Principales:

##### `cargarAnalisisGuardado()`
**Descripción**: Carga un análisis guardado desde la URL.

**Parámetros (URL)**:
- `?id=xxx`: Modo visualización
- `?edit=xxx`: Modo edición

**Flujo**:
1. Obtiene parámetro ID de URL
2. Si no hay ID, return false
3. Muestra loading con progreso
4. Hace GET a /api/analisis/{id}
5. Recibe respuesta con jsonData completo
6. Parsea jsonData (string → object)
7. Restaura variables globales:
```javascript
window.datosOriginales = datosCompletos.datosOriginales;
window.facturasProcesadas = datosCompletos.facturasProcesadas;
window.datosFiltrados = [...facturasProcesadas];
window.fechaMinima = datosCompletos.metadatos.fechaMinima;
window.fechaMaxima = datosCompletos.metadatos.fechaMaxima;
```
8. Oculta sección de upload
9. Muestra dashboard
10. Inicializa filtros
11. Aplica filtros guardados
12. Actualiza dashboard
13. Muestra mensaje de éxito

**Nota**: Usa timeouts de 200-300ms para esperar carga de DOM.

---

### 2.8 ANALISIS-EDITAR.JS - Edición de Análisis

**Propósito**: Permitir editar análisis guardados.

#### Funciones Principales:

##### `detectarModoEdicion()`
**Descripción**: Detecta si estamos en modo edición.

**Retorna**: Boolean

**Lógica**:
```javascript
const editId = urlParams.get('edit');
if (editId) {
    modoEdicion = true;
    analisisEditandoId = editId;
    return true;
}
return false;
```

##### `habilitarEdicion()`
**Descripción**: Configura interfaz para modo edición.

**Cambios**:
1. Cambia botón "Guardar" → "Actualizar Análisis"
2. Oculta botón "Cargar Otro Archivo"
3. Muestra mensaje: "📝 Modo Edición"
4. Cambia onclick del botón a `actualizarAnalisisEditado()`

##### `actualizarAnalisisEditado()`
**Descripción**: Actualiza el análisis en la API.

**Flujo**:
1. Valida que haya análisis para actualizar
2. Obtiene filtros actuales
3. Muestra diálogo con:
   - Nombre actual (editable)
   - Filtros actuales
   - Totales recalculados
4. Usuario confirma o cancela
5. Si confirma:
   - Prepara datos actualizados:
```javascript
{
    nombreAnalisis: "Análisis Editado",
    filtrosAplicados: {...},
    totalFacturas: datosFiltrados.length,
    valorTotal: datosFiltrados.reduce(...)
}
```
   - Hace PUT a /api/analisis/{id}
   - Muestra mensaje de éxito
   - Ofrece volver a lista o continuar editando

---

### 2.9 ANALISIS-LISTA.JS - Lista de Análisis

**Propósito**: Mostrar lista de análisis guardados.

#### Funciones Principales:

##### `cargarAnalisis()`
**Descripción**: Carga lista de análisis del usuario.

**Flujo**:
1. Muestra loader
2. Hace GET a /api/analisis?soloMios=true
3. Guarda respuesta en array `analisis`
4. Llama a `mostrarAnalisis()`

##### `mostrarAnalisis()`
**Descripción**: Renderiza tabla con análisis.

**Estructura de Tabla**:
```html
<tr>
    <td>Nombre del Análisis</td>
    <td>Fecha de Creación</td>
    <td>Total Facturas</td>
    <td>Valor Total</td>
    <td>
        <button onclick="verAnalisis(id)">👁️ Ver</button>
        <button onclick="editarAnalisis(id)">✏️ Editar</button>
        <button onclick="eliminarAnalisis(id)">🗑️ Eliminar</button>
    </td>
</tr>
```

##### `verAnalisis(id)`
**Descripción**: Abre análisis en modo visualización.

**Flujo**:
1. Muestra loading
2. Redirige a: `analisis-nuevo.html?id={id}`

##### `editarAnalisis(id)`
**Descripción**: Abre análisis en modo edición.

**Flujo**:
1. Muestra loading
2. Redirige a: `analisis-nuevo.html?edit={id}`

##### `eliminarAnalisis(id)`
**Descripción**: Elimina un análisis.

**Flujo**:
1. Confirma con usuario
2. Hace DELETE a /api/analisis/{id}
3. Muestra mensaje de éxito
4. Recarga lista

---

### 2.10 USUARIOS.JS - Gestión de Usuarios

**Propósito**: CRUD completo de usuarios.

#### Funciones Principales:

##### `cargarUsuarios()`
**Descripción**: Carga lista de usuarios.

**Flujo**:
1. Hace GET a /api/usuarios
2. Guarda respuesta en array `usuarios`
3. Llama a `mostrarUsuarios()`

##### `mostrarUsuarios()`
**Descripción**: Renderiza tabla de usuarios.

##### `nuevoUsuario()`
**Descripción**: Crea un nuevo usuario.

**Flujo**:
1. Muestra formulario (SweetAlert):
   - Nombres
   - Apellidos
   - Username
   - Contraseña
2. Valida campos
3. Hace POST a /api/usuarios
4. Muestra mensaje de éxito
5. Recarga lista

##### `editarUsuario(id)`
**Descripción**: Edita un usuario existente.

**Flujo**:
1. Busca usuario en array
2. Muestra formulario pre-llenado
3. Campos editables:
   - Nombres
   - Apellidos
   - Nueva contraseña (opcional)
4. Hace PUT a /api/usuarios/{id}
5. Recarga lista

##### `eliminarUsuario(id)`
**Descripción**: Elimina un usuario.

**Flujo**:
1. Confirma con usuario
2. Hace DELETE a /api/usuarios/{id}
3. Recarga lista

---

## 3. DIAGRAMAS DE FLUJO POR MÓDULO

### 3.1 Flujo de Login

```
[Usuario abre index.html]
         ↓
[Formulario de Login]
         ↓
[Ingresa username y password]
         ↓
[Click "Iniciar Sesión"]
         ↓
[handleLogin(e)]
         ↓
[Valida campos] ──NO─→ [Muestra error]
         ↓ SI
[POST /api/auth/login]
         ↓
[¿Exitoso?] ──NO─→ [Muestra error]
         ↓ SI
[Guarda token en localStorage]
         ↓
[Guarda usuario en localStorage]
         ↓
[Guarda expiration en localStorage]
         ↓
[Muestra mensaje "Bienvenido"]
         ↓
[Redirige a /pages/dashboard.html]
```

### 3.2 Flujo de Carga de Excel

```
[Usuario click "Seleccionar Archivo"]
         ↓
[Selecciona archivo .xlsx]
         ↓
[procesarArchivo(file)]
         ↓
[¿Es .xlsx o .xls?] ──NO─→ [Muestra error]
         ↓ SI
[Lee archivo con FileReader]
         ↓
[Parsea con XLSX.read()]
         ↓
[Extrae primera hoja]
         ↓
[Convierte a JSON]
         ↓
[convertirDatos(rawData)]
         ↓
[¿Tiene columnas requeridas?] ──NO─→ [Muestra error]
         ↓ SI
[Agrupa servicios por factura]
         ↓
[Crea objetos Factura]
         ↓
[Calcula totales]
         ↓
[facturasProcesadas = [...]      ]
         ↓
[datosOriginales = [...]         ]
         ↓
[datosFiltrados = [...]          ]
         ↓
[mostrarDashboard()]
         ↓
[Oculta upload section]
         ↓
[Muestra dashboard]
         ↓
[inicializarFiltros()]
         ↓
[actualizarDashboard()]
         ↓
[Dashboard visible con datos]
```

### 3.3 Flujo de Inicialización de Filtros (Con Cascada)

```
[inicializarFiltros()]
         ↓
[inicializarComboRegimen()]
         ↓
[Extrae regímenes únicos]
         ↓
[Pobla combo RÉGIMEN]
    - TODOS (default)
    - CONTRIBUTIVO
    - SUBSIDIADO
         ↓
[construirMapaAdministradoras()]
         ↓
[Crea mapa: régimen → admins]
    {
      'CONTRIBUTIVO': ['SURA', ...],
      'SUBSIDIADO': ['COOSALUD', ...]
    }
         ↓
[actualizarComboAdministradoras('TODOS')]
         ↓
[Pobla combo ADMINISTRADORAS]
    - Todas las Administradoras (default)
    - [Lista completa de admins]
         ↓
[Combo CONTRATOS]
    - Todos los Contratos
    - DESHABILITADO (porque admin = "TODOS")
         ↓
[configurarEventosCascada()]
         ↓
[Eventos onChange configurados]
```

### 3.4 Flujo de Cambio de Régimen

```
[Usuario cambia RÉGIMEN]
         ↓
[handleRegimenChange(e)]
         ↓
[regimenSeleccionado = e.target.value]
         ↓
[actualizarComboAdministradoras(regimenSeleccionado)]
         ↓
[¿Régimen = "TODOS"?] ──SI─→ [Muestra todas las admins]
         ↓ NO
[Muestra solo admins del régimen]
         ↓
[Combo CONTRATOS]
    - Resetea a "TODOS"
    - DESHABILITA
         ↓
[aplicarFiltros()]
         ↓
[Filtra datosFiltrados]
         ↓
[actualizarDashboard()]
```

### 3.5 Flujo de Cambio de Administradora

```
[Usuario cambia ADMINISTRADORA]
         ↓
[handleAdministradoraChange(e)]
         ↓
[adminSeleccionada = e.target.value]
         ↓
[¿Admin = "TODOS"?] ──SI─→ [Deshabilita CONTRATOS]
         ↓ NO
[actualizarComboContratos(regimen, admin)]
         ↓
[Filtra facturas: régimen Y admin]
         ↓
[Extrae contratos únicos]
         ↓
[Pobla combo CONTRATOS]
         ↓
[HABILITA combo CONTRATOS]
         ↓
[aplicarFiltros()]
         ↓
[actualizarDashboard()]
```

### 3.6 Flujo de Guardar Análisis

```
[Usuario click "💾 Guardar Análisis"]
         ↓
[guardarAnalisis()]
         ↓
[¿Hay facturasProcesadas?] ──NO─→ [Muestra error]
         ↓ SI
[¿Ya fue guardado?] ──SI─→ [Pregunta si actualizar]
         ↓ NO
[Solicita nombre (SweetAlert)]
         ↓
[¿Usuario ingresó nombre?] ──NO─→ [Cancela]
         ↓ SI
[Prepara datos]
    - nombreAnalisis
    - jsonData (completo)
    - filtrosAplicados
    - totalFacturas
    - valorTotal
         ↓
[POST /api/analisis]
         ↓
[¿Exitoso?] ──NO─→ [Muestra error]
         ↓ SI
[analisisGuardado = true]
         ↓
[Muestra mensaje éxito]
         ↓
[Ofrece ir a "Mis Análisis"]
```

### 3.7 Flujo de Cargar Análisis Guardado

```
[Usuario click "Ver" o "Editar"]
         ↓
[Redirige a analisis-nuevo.html]
    ?id=xxx (ver) o ?edit=xxx (editar)
         ↓
[cargarAnalisisGuardado()]
         ↓
[Obtiene ID de URL]
         ↓
[¿Hay ID?] ──NO─→ [return false]
         ↓ SI
[Muestra loading]
         ↓
[GET /api/analisis/{id}]
         ↓
[¿Exitoso?] ──NO─→ [Muestra error]
         ↓ SI
[Parsea jsonData]
         ↓
[Restaura variables globales]
    - datosOriginales
    - facturasProcesadas
    - datosFiltrados
    - fechaMinima
    - fechaMaxima
         ↓
[Oculta upload section]
         ↓
[Muestra dashboard]
         ↓
[inicializarFiltros()]
         ↓
[¿Hay filtros guardados?] ──NO─→ [Usa defaults]
         ↓ SI
[aplicarFiltrosGuardados(filtros)]
         ↓
[Aplica régimen] → Espera 100ms
         ↓
[Aplica administradora] → Espera 100ms
         ↓
[Aplica contrato] → Espera 100ms
         ↓
[Aplica fechas]
         ↓
[aplicarFiltros()]
         ↓
[actualizarDashboard()]
         ↓
[Dashboard visible con filtros aplicados]
```

### 3.8 Flujo de Edición de Análisis

```
[Usuario en modo edición (?edit=xxx)]
         ↓
[analisis-editar.js detecta modo]
         ↓
[detectarModoEdicion()] → true
         ↓
[Espera carga del análisis]
         ↓
[habilitarEdicion()]
         ↓
[Cambios en interfaz:]
    - Mensaje "📝 Modo Edición"
    - Botón "💾 Actualizar Análisis"
    - Oculta "Cargar Otro Archivo"
         ↓
[Usuario modifica filtros]
         ↓
[Click "💾 Actualizar Análisis"]
         ↓
[actualizarAnalisisEditado()]
         ↓
[Obtiene filtros actuales]
         ↓
[Muestra diálogo]
    - Nombre (editable)
    - Filtros actuales
    - Totales calculados
         ↓
[¿Usuario confirma?] ──NO─→ [Cancela]
         ↓ SI
[Prepara datos actualizados]
         ↓
[PUT /api/analisis/{id}]
         ↓
[¿Exitoso?] ──NO─→ [Muestra error]
         ↓ SI
[Muestra mensaje éxito]
         ↓
[Ofrece: "Ver Mis Análisis" o "Continuar Editando"]
```

---

## 4. DICCIONARIO DE FUNCIONES COMPLETO

### Módulo: CONFIG.JS

| Función | Parámetros | Retorna | Descripción |
|---------|------------|---------|-------------|
| `getApiUrl` | endpoint: string | string | Construye URL completa de API |
| `fetchAPI` | url: string, options: object | Promise<Response> | Petición autenticada a API |
| `logout` | - | void | Cierra sesión y limpia storage |
| `formatCurrency` | value: number | string | Formatea moneda colombiana |
| `formatDate` | dateString: string | string | Formatea fecha local |
| `formatDateTime` | dateString: string | string | Formatea fecha y hora |
| `showError` | message: string | void | Muestra mensaje de error |
| `showSuccess` | message: string | void | Muestra mensaje de éxito |
| `showConfirm` | message: string | Promise<boolean> | Muestra confirmación |

### Módulo: AUTH.JS

| Función | Parámetros | Retorna | Descripción |
|---------|------------|---------|-------------|
| `isPublicPage` | - | boolean | Verifica si página es pública |
| `isAuthenticated` | - | boolean | Verifica sesión activa |
| `getCurrentUser` | - | object\|null | Obtiene usuario actual |
| `protectPage` | - | boolean | Protege página con redirección |
| `verifyTokenWithServer` | - | Promise<boolean> | Verifica token con API |
| `fetchCurrentUser` | - | Promise<object\|null> | Obtiene datos de usuario |

### Módulo: LOGIN.JS

| Función | Parámetros | Retorna | Descripción |
|---------|------------|---------|-------------|
| `handleLogin` | e: Event | void | Maneja submit del login |

### Módulo: ANALISIS-CORE.JS

| Función | Parámetros | Retorna | Descripción |
|---------|------------|---------|-------------|
| `procesarArchivo` | file: File | void | Lee y procesa Excel |
| `convertirDatos` | rawData: Array | void | Convierte a objetos Factura |
| `mostrarDashboard` | - | void | Muestra dashboard con datos |
| `inicializarFiltros` | - | void | Inicializa combos de filtros |
| `aplicarFiltros` | - | void | Aplica filtros seleccionados |
| `actualizarDashboard` | - | void | Actualiza KPIs, gráficos, tabla |
| `actualizarKPIs` | - | void | Calcula y muestra indicadores |
| `generarGraficos` | - | void | Genera 5 gráficos principales |
| `actualizarTabla` | - | void | Actualiza tabla de facturas |
| `verDetalleFactura` | numeroFactura: string | void | Muestra modal de detalle |

### Módulo: ANALISIS-FILTROS-CASCADA.JS

| Función | Parámetros | Retorna | Descripción |
|---------|------------|---------|-------------|
| `inicializarComboRegimen` | - | void | Inicializa combo régimen |
| `construirMapaAdministradoras` | - | void | Crea mapa régimen→admins |
| `construirMapaContratos` | regimen: string, admin: string | Array | Extrae contratos filtrados |
| `actualizarComboAdministradoras` | regimen: string, valorActual?: string | void | Actualiza combo admins |
| `actualizarComboContratos` | regimen: string, admin: string, valorActual?: string | void | Actualiza combo contratos |
| `configurarEventosCascada` | - | void | Configura eventos onChange |
| `handleRegimenChange` | e: Event | void | Maneja cambio de régimen |
| `handleAdministradoraChange` | e: Event | void | Maneja cambio de admin |
| `inicializarRangoFechas` | - | void | Inicializa inputs de fecha |
| `aplicarFiltrosGuardados` | filtros: object | void | Aplica filtros de análisis guardado |

### Módulo: ANALISIS-GUARDAR.JS

| Función | Parámetros | Retorna | Descripción |
|---------|------------|---------|-------------|
| `mostrarBotonesAccion` | - | void | Muestra botones guardar/nuevo |
| `guardarAnalisis` | - | void | Guarda análisis en API |
| `cargarOtroArchivo` | - | void | Recarga página para nuevo |
| `verificarAnalisisExistente` | - | void | Verifica si hay análisis cargado |

### Módulo: ANALISIS-CARGAR.JS

| Función | Parámetros | Retorna | Descripción |
|---------|------------|---------|-------------|
| `cargarAnalisisGuardado` | - | Promise<boolean> | Carga análisis desde API |

### Módulo: ANALISIS-EDITAR.JS

| Función | Parámetros | Retorna | Descripción |
|---------|------------|---------|-------------|
| `detectarModoEdicion` | - | boolean | Detecta parámetro ?edit |
| `habilitarEdicion` | - | void | Configura interfaz para edición |
| `actualizarAnalisisEditado` | - | void | Actualiza análisis en API |

### Módulo: ANALISIS-LISTA.JS

| Función | Parámetros | Retorna | Descripción |
|---------|------------|---------|-------------|
| `cargarAnalisis` | - | void | Carga lista de análisis |
| `mostrarAnalisis` | - | void | Renderiza tabla de análisis |
| `verAnalisis` | id: string | void | Abre análisis en modo ver |
| `editarAnalisis` | id: string | void | Abre análisis en modo editar |
| `eliminarAnalisis` | id: string | void | Elimina análisis de API |
| `mostrarMensaje` | texto: string | void | Muestra mensaje en tabla |

### Módulo: USUARIOS.JS

| Función | Parámetros | Retorna | Descripción |
|---------|------------|---------|-------------|
| `cargarUsuarios` | - | void | Carga lista de usuarios |
| `mostrarUsuarios` | - | void | Renderiza tabla de usuarios |
| `nuevoUsuario` | - | void | Crea nuevo usuario |
| `editarUsuario` | id: string | void | Edita usuario existente |
| `eliminarUsuario` | id: string | void | Elimina usuario de API |

---

## 5. FLUJOS DE USUARIO COMPLETOS

### 5.1 Flujo Completo: Primer Uso del Sistema

```
1. [Usuario abre http://localhost:8080]
         ↓
2. [Ve página de login (index.html)]
         ↓
3. [Ingresa: Admin / 123456]
         ↓
4. [Sistema valida credenciales]
         ↓
5. [Guarda token JWT en localStorage]
         ↓
6. [Redirige a /pages/dashboard.html]
         ↓
7. [auth.js verifica autenticación]
         ↓
8. [dashboard.js carga info del usuario]
         ↓
9. [Ve: "Bienvenido, Admin!"]
         ↓
10. [Menu lateral con 4 opciones:]
    - Inicio
    - Mis Análisis
    - Nuevo Análisis
    - Usuarios
```

### 5.2 Flujo Completo: Crear Primer Análisis

```
1. [Dashboard → Click "Nuevo Análisis"]
         ↓
2. [Redirige a analisis-nuevo.html]
         ↓
3. [Ve sección de upload]
         ↓
4. [Click "Seleccionar Archivo" o arrastra]
         ↓
5. [Selecciona archivo Excel (92,296 registros)]
         ↓
6. [procesarArchivo(file) inicia]
         ↓
7. [Muestra barra de progreso]
         ↓
8. [Lee archivo con XLSX.read()]
         ↓
9. [convertirDatos(rawData) procesa]
         ↓
10. [Agrupa 92,296 líneas en 35,044 facturas]
         ↓
11. [Calcula totales: $2,215,722,444]
         ↓
12. [mostrarDashboard() ejecuta]
         ↓
13. [Oculta upload, muestra dashboard]
         ↓
14. [inicializarFiltros() ejecuta]
         ↓
15. [Ve dashboard con:]
    - KPIs calculados
    - Filtros inicializados (TODOS por default)
    - 5 gráficos generados
    - Tabla de facturas paginada
         ↓
16. [Usuario explora filtros]
         ↓
17. [Cambia régimen a "CONTRIBUTIVO"]
         ↓
18. [Combo admins se actualiza (solo CONTRIBUTIVO)]
         ↓
19. [Selecciona admin "SURA"]
         ↓
20. [Combo contratos se habilita]
         ↓
21. [Dashboard se actualiza en tiempo real]
         ↓
22. [Click "💾 Guardar Análisis"]
         ↓
23. [Ingresa nombre: "Análisis Enero 2024"]
         ↓
24. [POST /api/analisis guarda todo]
         ↓
25. [Mensaje: "Análisis guardado exitosamente"]
         ↓
26. [Opción: "Ver Mis Análisis"]
```

### 5.3 Flujo Completo: Ver Análisis Guardado

```
1. [Menu → Mis Análisis]
         ↓
2. [cargarAnalisis() ejecuta]
         ↓
3. [GET /api/analisis?soloMios=true]
         ↓
4. [Ve tabla con sus análisis]
         ↓
5. [Click "👁️ Ver" en "Análisis Enero 2024"]
         ↓
6. [Redirige a: analisis-nuevo.html?id=abc-123]
         ↓
7. [cargarAnalisisGuardado() ejecuta]
         ↓
8. [GET /api/analisis/abc-123]
         ↓
9. [Recibe jsonData completo]
         ↓
10. [Restaura variables globales]
         ↓
11. [inicializarFiltros() ejecuta]
         ↓
12. [aplicarFiltrosGuardados(filtros) ejecuta]
         ↓
13. [Aplica régimen → Espera 100ms]
         ↓
14. [Actualiza combo admins]
         ↓
15. [Aplica administradora → Espera 100ms]
         ↓
16. [Actualiza combo contratos]
         ↓
17. [Aplica contrato → Espera 100ms]
         ↓
18. [Aplica fechas]
         ↓
19. [aplicarFiltros() ejecuta]
         ↓
20. [actualizarDashboard() ejecuta]
         ↓
21. [Ve dashboard exactamente como lo guardó:]
    - Régimen: CONTRIBUTIVO
    - Administradora: SURA
    - Contrato: TODOS
    - KPIs calculados para esos filtros
    - Gráficos actualizados
    - Tabla filtrada
```

### 5.4 Flujo Completo: Editar Análisis Guardado

```
1. [Menu → Mis Análisis]
         ↓
2. [Click "✏️ Editar" en "Análisis Enero 2024"]
         ↓
3. [Redirige a: analisis-nuevo.html?edit=abc-123]
         ↓
4. [cargarAnalisisGuardado() ejecuta]
    (mismo flujo que ver)
         ↓
5. [detectarModoEdicion() detecta ?edit]
         ↓
6. [habilitarEdicion() ejecuta después de 1.5s]
         ↓
7. [Ve interfaz con cambios:]
    - Mensaje: "📝 Modo Edición"
    - Botón: "💾 Actualizar Análisis"
    - Sin botón "Cargar Otro Archivo"
         ↓
8. [Usuario modifica filtros:]
    - Cambia régimen a "SUBSIDIADO"
    - Selecciona admin "COOSALUD"
    - Ajusta fechas
         ↓
9. [Dashboard se actualiza en tiempo real]
         ↓
10. [Ve nuevos totales calculados]
         ↓
11. [Click "💾 Actualizar Análisis"]
         ↓
12. [Diálogo muestra:]
    - Nombre actual (puede cambiar)
    - Filtros actuales
    - Totales recalculados
         ↓
13. [Cambia nombre a "Análisis Febrero 2024"]
         ↓
14. [Click "Actualizar"]
         ↓
15. [PUT /api/analisis/abc-123]
         ↓
16. [Backend actualiza registro]
         ↓
17. [Mensaje: "Análisis actualizado"]
         ↓
18. [Opciones:]
    - "Ver Mis Análisis" → Lista
    - "Continuar Editando" → Sigue en edición
```

### 5.5 Flujo Completo: Gestión de Usuarios

```
1. [Menu → Usuarios]
         ↓
2. [cargarUsuarios() ejecuta]
         ↓
3. [GET /api/usuarios]
         ↓
4. [Ve tabla de usuarios]
         ↓
5. [Click "➕ Nuevo Usuario"]
         ↓
6. [Formulario aparece:]
    - Nombres
    - Apellidos
    - Username
    - Contraseña
         ↓
7. [Llena campos]
         ↓
8. [Click "Crear Usuario"]
         ↓
9. [POST /api/usuarios]
         ↓
10. [Usuario creado]
         ↓
11. [Tabla se actualiza]
         ↓
12. [Click "✏️ Editar" en usuario]
         ↓
13. [Formulario pre-llenado aparece]
         ↓
14. [Modifica campos]
         ↓
15. [Click "Guardar Cambios"]
         ↓
16. [PUT /api/usuarios/{id}]
         ↓
17. [Usuario actualizado]
         ↓
18. [Click "🗑️ Eliminar" en usuario]
         ↓
19. [Confirmación aparece]
         ↓
20. [Click "Sí, continuar"]
         ↓
21. [DELETE /api/usuarios/{id}]
         ↓
22. [Usuario eliminado]
         ↓
23. [Tabla se actualiza]
```

---

## GLOSARIO DE TÉRMINOS

- **JWT**: JSON Web Token - Token de autenticación
- **localStorage**: Almacenamiento local del navegador
- **SweetAlert**: Librería para alertas visuales
- **Chart.js**: Librería para gráficos
- **XLSX.js**: Librería para leer Excel
- **Factura**: Objeto que representa una factura médica completa
- **Servicio**: Objeto que representa un servicio médico dentro de una factura
- **KPI**: Key Performance Indicator - Indicador clave de rendimiento
- **Cascada**: Filtros dependientes que se actualizan entre sí
- **Modo Edición**: Estado donde se permite modificar un análisis guardado
- **Modo Visualización**: Estado donde solo se consulta un análisis

---

## CONVENCIONES DE CÓDIGO

### Nombres de Variables

- **Globales**: camelCase (ej: `facturasProcesadas`)
- **Constantes**: UPPER_SNAKE_CASE (ej: `API_CONFIG`)
- **Funciones**: camelCase (ej: `procesarArchivo`)
- **Clases**: PascalCase (ej: `Factura`, `Servicio`)

### Nombres de Funciones

- **Cargar datos**: `cargarXxx()` (ej: `cargarAnalisis`)
- **Mostrar UI**: `mostrarXxx()` (ej: `mostrarDashboard`)
- **Actualizar**: `actualizarXxx()` (ej: `actualizarKPIs`)
- **Aplicar**: `aplicarXxx()` (ej: `aplicarFiltros`)
- **Manejar eventos**: `handleXxxChange()` (ej: `handleRegimenChange`)

### Estructura de Funciones

```javascript
/**
 * Descripción de la función
 * @param {tipo} nombre - Descripción del parámetro
 * @returns {tipo} Descripción del retorno
 */
async function nombreFuncion(parametro) {
    // 1. Validaciones
    if (!parametro) {
        showError('Mensaje de error');
        return;
    }
    
    // 2. Lógica principal
    const resultado = await operacion(parametro);
    
    // 3. Actualizar UI
    mostrarResultado(resultado);
    
    // 4. Retorno
    return resultado;
}
```

---

## MEJORES PRÁCTICAS IMPLEMENTADAS

1. **Separación de Responsabilidades**: Cada módulo tiene un propósito específico
2. **Gestión de Estado**: Variables globales claramente definidas
3. **Manejo de Errores**: try-catch en todas las operaciones asíncronas
4. **Feedback Visual**: Loaders y mensajes en todas las operaciones
5. **Validación de Datos**: Antes de cada operación crítica
6. **Documentación**: Logs de consola para debugging
7. **Reutilización**: Funciones helper en config.js
8. **Seguridad**: Token JWT en todas las peticiones
9. **UX**: Confirmaciones antes de acciones destructivas
10. **Performance**: Filtros optimizados con mapas

---

FIN DE LA DOCUMENTACIÓN TÉCNICA
