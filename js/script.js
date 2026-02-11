// Variables globales
let datosOriginales = [];
let datosFiltrados = [];
let facturasProcesadas = [];
let charts = {};
const COLUMNAS_MINIMAS = 30;
const COLUMNAS_NECESARIAS = [
    'FACTURA', 'FECHAFAC', 'NOM_SERVIC', 'VAL_TOTAL', 
    'NOM_ADMINI', 'NOM_REGIME', 'CANTIDAD', 'VAL_PACIEN', 'VAL_CONTRA'
];

// Variables de paginación
let paginaActualTabla = 1;
let filasPorPagina = 10;
let paginaActualModal = 1;
let filasPorPaginaModal = 5;
let serviciosActuales = [];

// Variables de fechas
let fechaMinima = null;
let fechaMaxima = null;

// Variables de ordenamiento
let columnaOrden = 'fecha'; // Columna por defecto
let direccionOrden = 'asc'; // Orden ascendente por defecto (más antigua primero)
let columnaOrdenModal = 'nombre'; // Columna por defecto en modal
let direccionOrdenModal = 'asc'; // Orden ascendente por defecto en modal

// ========================================
// CLASES DE ESTRUCTURA DE DATOS
// ========================================

/**
 * Clase que representa un servicio dentro de una factura
 */
class Servicio {
    constructor(datos) {
        this.codigoServicio = datos.COD_SERVIC || '';
        this.nombreServicio = (datos.NOM_SERVIC || 'Sin servicio').toString();
        this.cantidad = parseInt(datos.CANTIDAD) || 0;
        this.valorUnitario = parseFloat(datos.VLRUNITARI) || 0;
        this.valorPaciente = parseFloat(datos.VAL_PACIEN) || 0;
        this.valorContrato = parseFloat(datos.VAL_CONTRA) || 0;
        this.valorTotal = parseFloat(datos.VAL_TOTAL) || 0;
    }
}

/**
 * Clase que representa una factura completa
 */
class Factura {
    constructor(numeroFactura, datosLinea) {
        // Información básica de la factura
        this.numero = this.normalizarNumeroFactura(numeroFactura);
        this.fecha = this.normalizarFecha(datosLinea.FECHAFAC);
        this.radicada = datosLinea.RADICADA || 0;
        this.fechaRadicacion = this.normalizarFecha(datosLinea.FECH_RADIC);
        this.tipoFactura = datosLinea.TIPO_FACTU || '';
        this.envio = datosLinea.ENVIO || '';
        this.usuarioFacturador = (datosLinea.USU_FACTUR || '').toString();
        this.prefijoFactura = datosLinea.FACT_PREFI || '';
        
        // Información de la administradora
        this.codigoAdministradora = datosLinea.COD_ADMINI || '';
        this.administradora = (datosLinea.NOM_ADMINI || 'Sin administradora').toString().trim();
        this.nitAdministradora = datosLinea.NIT_ADMINI || '';
        
        // Información del contrato
        this.codigoContrato = datosLinea.COD_CONTRA || '';
        this.numeroContrato = datosLinea.NUM_CONTRA || '';
        
        // Información del régimen
        this.codigoRegimen = datosLinea.COD_REGIME || '';
        this.regimen = (datosLinea.NOM_REGIME || 'Sin régimen').toString();
        
        // Información del paciente
        this.paciente = {
            identificacion: datosLinea.IDENTIFICA || '',
            tipoIdentificacion: datosLinea.TIPO_INDEN || '',
            apellido1: (datosLinea.APELLIDO1 || '').toString(),
            apellido2: (datosLinea.APELLIDO2 || '').toString(),
            nombre1: (datosLinea.NOMBRE1 || '').toString(),
            nombre2: (datosLinea.NOMBRE2 || '').toString(),
            sexo: datosLinea.SEXO || '',
            fechaNacimiento: this.normalizarFecha(datosLinea.FECHA_NACI),
            edad: datosLinea.EDAD || '',
            email: datosLinea.EMAIL || '',
            celular: datosLinea.CELULAR || '',
            direccion: datosLinea.DIRECCION || '',
            telefono: datosLinea.TELEFONO || '',
            observacion: datosLinea.OBSERVACIO || '',
            codigoClaseDiagnostico: datosLinea.COD_CLASDI || '',
            nombreClaseDiagnostico: datosLinea.NOM_CLASDI || ''
        };
        
        // Información del ingreso
        this.numeroIngreso = datosLinea.INGRESO || '';
        this.autorizacionIngreso = datosLinea.AUT_INGRES || '';
        this.fechaIngreso = this.normalizarFecha(datosLinea.FECH_INGRE);
        
        // Información de la orden
        this.numeroOrden = datosLinea.ORDEN || '';
        this.autorizacionOrden = datosLinea.AUT_ORDEN || '';
        this.fechaOrden = this.normalizarFecha(datosLinea.FECH_ORDEN);
        this.ordenMedica = datosLinea.ORDEN_MEDI || '';
        
        // Información del médico
        this.medico = {
            codigo: datosLinea.COD_MEDICO || '',
            nombre: (datosLinea.NOM_MEDICO || '').toString(),
            codigoEspecialidad: datosLinea.COD_ESPECI || '',
            especialidad: (datosLinea.NOM_ESPECI || '').toString()
        };
        
        // Información de pertenencia étnica y grupo poblacional
        this.codigoPertenenciaEtnica = datosLinea.COD_PERTET || '';
        this.nombrePertenenciaEtnica = datosLinea.NOM_PERTET || '';
        this.codigoGrupoPoblacional = datosLinea.COD_GRUPOP || '';
        this.nombreGrupoPoblacional = datosLinea.NOM_GRUPOP || '';
        
        // Información de diagnósticos
        this.diagnosticos = {
            principal: {
                codigo: datosLinea.CODDX_PPAL || '',
                nombre: datosLinea.NOMDX_PPAL || ''
            },
            relacionado1: {
                codigo: datosLinea.CODDX_REL1 || '',
                nombre: datosLinea.NOMDX_REL1 || ''
            },
            relacionado2: {
                codigo: datosLinea.CODDX_REL2 || '',
                nombre: datosLinea.NOMDX_REL2 || ''
            }
        };
        
        // Información del programa y centro de costo
        this.codigoPrograma = datosLinea.COD_PROGRA || '';
        this.programa = datosLinea.PROGRAMA || '';
        this.nombrePrograma = datosLinea.NOM_PROGRA || '';
        this.codigoMenu = datosLinea.COD_MENU || '';
        this.nombreMenu = datosLinea.NOM_MENU || '';
        this.codigoCentroCosto = datosLinea.COD_CCOSTO || '';
        this.nombreCentroCosto = datosLinea.NOM_CCOSTO || '';
        this.codigoSubCentroCosto = datosLinea.COD_SCCOST || '';
        this.nombreSubCentroCosto = datosLinea.NOM_SCCOST || '';
        this.codigoSolicitante = datosLinea.COD_SOLICI || '';
        this.nombreSolicitante = datosLinea.NOM_SOLICI || '';
        
        // Cuentas contables
        this.cuentaDebito = datosLinea.CUENTA_DEB || '';
        this.cuentaCredito = datosLinea.CUENTA_CRE || '';
        
        // Información de resultados
        this.numeroResultado = datosLinea.NUM_RESULT || '';
        this.usuarioResultado = datosLinea.USU_RESUL || '';
        this.fechaResultado = this.normalizarFecha(datosLinea.FECH_RESUL);
        this.usuarioResultadoModificado = datosLinea.USU_RES_MO || '';
        this.fechaResultadoModificado = this.normalizarFecha(datosLinea.FECH_RES_M);
        
        // Información de citas y horarios
        this.fechaCita = this.normalizarFecha(datosLinea.FECH_CITA);
        this.fechaSolicitud = this.normalizarFecha(datosLinea.FECH_SOLI_);
        this.horaInicio = datosLinea.HORA_INI || '';
        this.horaFin = datosLinea.HORA_FIN || '';
        this.tipoHora = datosLinea.TIPO_HORA || '';
        
        // Usuarios de creación y edición
        this.usuarioCreacion = {
            codigo: datosLinea.COD_USU_CR || '',
            nombre: datosLinea.NOM_USU_CR || ''
        };
        this.usuarioEdicion = {
            codigo: datosLinea.COD_USU_ED || '',
            nombre: datosLinea.NOM_USU_ED || ''
        };
        
        // Servicios y valores
        this.servicios = [];
        this.totales = {
            valorPaciente: 0,
            valorContrato: 0,
            valorTotal: 0
        };
    }
    
    /**
     * Normaliza el número de factura
     */
    normalizarNumeroFactura(numero) {
        if (!numero) return '';
        return typeof numero === 'string' ? numero : String(numero);
    }
    
    /**
     * Normaliza fechas de Excel a formato YYYY-MM-DD
     */
    normalizarFecha(fecha) {
        if (!fecha) return '';
        if (typeof fecha === 'string' && fecha.includes('-')) return fecha;
        if (typeof fecha === 'number') {
            const date = new Date((fecha - 25569) * 86400 * 1000);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        if (fecha instanceof Date) {
            return fecha.toISOString().split('T')[0];
        }
        return '';
    }
    
    /**
     * Agrega un servicio a la factura
     */
    agregarServicio(datosLinea) {
        const servicio = new Servicio(datosLinea);
        this.servicios.push(servicio);
        this.actualizarTotales();
    }
    
    /**
     * Actualiza los totales de la factura
     */
    actualizarTotales() {
        this.totales.valorPaciente = this.servicios.reduce((sum, s) => sum + s.valorPaciente, 0);
        this.totales.valorContrato = this.servicios.reduce((sum, s) => sum + s.valorContrato, 0);
        this.totales.valorTotal = this.servicios.reduce((sum, s) => sum + s.valorTotal, 0);
    }
    
    /**
     * Obtiene el nombre completo del paciente
     */
    getNombreCompletoPaciente() {
        const partes = [
            this.paciente.nombre1,
            this.paciente.nombre2,
            this.paciente.apellido1,
            this.paciente.apellido2
        ].filter(p => p && p.trim() !== '');
        return partes.join(' ');
    }
    
    /**
     * Convierte la factura a un objeto simple para compatibilidad
     * Incluye TODOS los 86 campos del Excel
     */
    toSimpleObject() {
        return {
            // Información básica de la factura (FACTURA, FECHAFAC, RADICADA, FECH_RADIC, TIPO_FACTU, ENVIO, USU_FACTUR, FACT_PREFI)
            numero: this.numero,
            fecha: this.fecha,
            radicada: this.radicada,
            fechaRadicacion: this.fechaRadicacion,
            tipoFactura: this.tipoFactura,
            envio: this.envio,
            usuarioFacturador: this.usuarioFacturador,
            prefijoFactura: this.prefijoFactura,
            
            // Información de la administradora (COD_ADMINI, NOM_ADMINI, NIT_ADMINI)
            codigoAdministradora: this.codigoAdministradora,
            administradora: this.administradora,
            nitAdministradora: this.nitAdministradora,
            
            // Información del contrato (COD_CONTRA, NUM_CONTRA)
            codigoContrato: this.codigoContrato,
            numeroContrato: this.numeroContrato,
            
            // Información del régimen (COD_REGIME, NOM_REGIME)
            codigoRegimen: this.codigoRegimen,
            regimen: this.regimen,
            
            // Información del paciente (IDENTIFICA, TIPO_INDEN, APELLIDO1, APELLIDO2, NOMBRE1, NOMBRE2, SEXO, EMAIL, CELULAR, DIRECCION, TELEFONO, OBSERVACIO, FECHA_NACI, EDAD, COD_CLASDI, NOM_CLASDI)
            paciente: {
                identificacion: this.paciente.identificacion,
                tipoIdentificacion: this.paciente.tipoIdentificacion,
                apellido1: this.paciente.apellido1,
                apellido2: this.paciente.apellido2,
                nombre1: this.paciente.nombre1,
                nombre2: this.paciente.nombre2,
                nombreCompleto: this.getNombreCompletoPaciente(),
                sexo: this.paciente.sexo,
                fechaNacimiento: this.paciente.fechaNacimiento,
                edad: this.paciente.edad,
                email: this.paciente.email,
                celular: this.paciente.celular,
                direccion: this.paciente.direccion,
                telefono: this.paciente.telefono,
                observacion: this.paciente.observacion,
                codigoClaseDiagnostico: this.paciente.codigoClaseDiagnostico,
                nombreClaseDiagnostico: this.paciente.nombreClaseDiagnostico
            },
            
            // Información del ingreso (INGRESO, AUT_INGRES, FECH_INGRE)
            numeroIngreso: this.numeroIngreso,
            autorizacionIngreso: this.autorizacionIngreso,
            fechaIngreso: this.fechaIngreso,
            
            // Información de la orden (ORDEN, AUT_ORDEN, FECH_ORDEN, ORDEN_MEDI)
            numeroOrden: this.numeroOrden,
            autorizacionOrden: this.autorizacionOrden,
            fechaOrden: this.fechaOrden,
            ordenMedica: this.ordenMedica,
            
            // Información del médico (COD_MEDICO, NOM_MEDICO, COD_ESPECI, NOM_ESPECI)
            medico: {
                codigo: this.medico.codigo,
                nombre: this.medico.nombre,
                codigoEspecialidad: this.medico.codigoEspecialidad,
                especialidad: this.medico.especialidad
            },
            
            // Pertenencia étnica y grupo poblacional (COD_PERTET, NOM_PERTET, COD_GRUPOP, NOM_GRUPOP)
            codigoPertenenciaEtnica: this.codigoPertenenciaEtnica,
            nombrePertenenciaEtnica: this.nombrePertenenciaEtnica,
            codigoGrupoPoblacional: this.codigoGrupoPoblacional,
            nombreGrupoPoblacional: this.nombreGrupoPoblacional,
            
            // Información de diagnósticos (CODDX_PPAL, NOMDX_PPAL, CODDX_REL1, NOMDX_REL1, CODDX_REL2, NOMDX_REL2)
            diagnosticos: {
                principal: {
                    codigo: this.diagnosticos.principal.codigo,
                    nombre: this.diagnosticos.principal.nombre
                },
                relacionado1: {
                    codigo: this.diagnosticos.relacionado1.codigo,
                    nombre: this.diagnosticos.relacionado1.nombre
                },
                relacionado2: {
                    codigo: this.diagnosticos.relacionado2.codigo,
                    nombre: this.diagnosticos.relacionado2.nombre
                }
            },
            
            // Información del programa y centro de costo (COD_PROGRA, PROGRAMA, NOM_PROGRA, COD_MENU, NOM_MENU, COD_CCOSTO, NOM_CCOSTO, COD_SCCOST, NOM_SCCOST, COD_SOLICI, NOM_SOLICI)
            codigoPrograma: this.codigoPrograma,
            programa: this.programa,
            nombrePrograma: this.nombrePrograma,
            codigoMenu: this.codigoMenu,
            nombreMenu: this.nombreMenu,
            codigoCentroCosto: this.codigoCentroCosto,
            nombreCentroCosto: this.nombreCentroCosto,
            codigoSubCentroCosto: this.codigoSubCentroCosto,
            nombreSubCentroCosto: this.nombreSubCentroCosto,
            codigoSolicitante: this.codigoSolicitante,
            nombreSolicitante: this.nombreSolicitante,
            
            // Cuentas contables (CUENTA_DEB, CUENTA_CRE)
            cuentaDebito: this.cuentaDebito,
            cuentaCredito: this.cuentaCredito,
            
            // Información de resultados (NUM_RESULT, USU_RESUL, FECH_RESUL, USU_RES_MO, FECH_RES_M)
            numeroResultado: this.numeroResultado,
            usuarioResultado: this.usuarioResultado,
            fechaResultado: this.fechaResultado,
            usuarioResultadoModificado: this.usuarioResultadoModificado,
            fechaResultadoModificado: this.fechaResultadoModificado,
            
            // Información de citas y horarios (FECH_CITA, FECH_SOLI_, HORA_INI, HORA_FIN, TIPO_HORA)
            fechaCita: this.fechaCita,
            fechaSolicitud: this.fechaSolicitud,
            horaInicio: this.horaInicio,
            horaFin: this.horaFin,
            tipoHora: this.tipoHora,
            
            // Usuarios de creación y edición (COD_USU_CR, NOM_USU_CR, COD_USU_ED, NOM_USU_ED)
            usuarioCreacion: {
                codigo: this.usuarioCreacion.codigo,
                nombre: this.usuarioCreacion.nombre
            },
            usuarioEdicion: {
                codigo: this.usuarioEdicion.codigo,
                nombre: this.usuarioEdicion.nombre
            },
            
            // Servicios detallados (COD_SERVIC, NOM_SERVIC, CANTIDAD, VLRUNITARI, VAL_PACIEN, VAL_CONTRA, VAL_TOTAL)
            servicios: this.servicios.map(s => ({
                codigoServicio: s.codigoServicio,
                nombreServicio: s.nombreServicio,
                cantidad: s.cantidad,
                valorUnitario: s.valorUnitario,
                valorPaciente: s.valorPaciente,
                valorContrato: s.valorContrato,
                valorTotal: s.valorTotal
            })),
            
            // Totales calculados
            totales: {
                valorPaciente: this.totales.valorPaciente,
                valorContrato: this.totales.valorContrato,
                valorTotal: this.totales.valorTotal,
                cantidadServicios: this.servicios.length
            }
        };
    }
    
    /**
     * Convierte a objeto para mostrar en la interfaz (compatibilidad)
     */
    toDisplayObject() {
        return {
            factura: this.numero,
            fecha: this.fecha,
            administradora: this.administradora,
            regimen: this.regimen,
            numeroContrato: this.numeroContrato,
            servicios: this.servicios.map(s => ({
                nombre: s.nombreServicio,
                cantidad: s.cantidad,
                valorUnitario: s.valorUnitario,
                valPacien: s.valorPaciente,
                valContra: s.valorContrato,
                valTotal: s.valorTotal
            })),
            valorPaciente: this.totales.valorPaciente,
            valorContrato: this.totales.valorContrato,
            valorTotal: this.totales.valorTotal
        };
    }
}

// ========================================
// FIN DE CLASES
// ========================================

// Referencias DOM
const uploadBox = document.getElementById('uploadBox');
const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectBtn');
const uploadSection = document.getElementById('uploadSection');
const dashboard = document.getElementById('dashboard');
const message = document.getElementById('message');
const loader = document.getElementById('loader');
const resetBtn = document.getElementById('resetBtn');
const downloadJsonBtn = document.getElementById('downloadJsonBtn');
const modal = document.getElementById('modalDetalle');
const closeModal = document.querySelector('.close');

// Event Listeners
selectBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
uploadBox.addEventListener('click', () => fileInput.click());
uploadBox.addEventListener('dragover', handleDragOver);
uploadBox.addEventListener('dragleave', handleDragLeave);
uploadBox.addEventListener('drop', handleDrop);
resetBtn.addEventListener('click', resetearSistema);
downloadJsonBtn.addEventListener('click', descargarJSON);
closeModal.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', (e) => {
    if (e.target == modal) modal.style.display = 'none';
});

function handleDragOver(e) {
    e.preventDefault();
    uploadBox.classList.add('dragging');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadBox.classList.remove('dragging');
}

function handleDrop(e) {
    e.preventDefault();
    uploadBox.classList.remove('dragging');
    const files = e.dataTransfer.files;
    if (files.length > 0) procesarArchivo(files[0]);
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) procesarArchivo(files[0]);
}

function mostrarMensaje(texto, tipo) {
    message.className = 'message ' + tipo;
    message.innerHTML = texto;
    message.style.display = 'block';
}

function ocultarMensaje() {
    message.style.display = 'none';
}

function procesarArchivo(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(extension)) {
        Swal.fire({
            icon: 'error',
            title: 'Archivo Inválido',
            text: 'El archivo debe ser formato Excel (.xlsx o .xls)',
            confirmButtonColor: '#667eea'
        });
        return;
    }

    mostrarMensaje('📂 Validando archivo...', 'info');
    loader.style.display = 'block';

    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const range = XLSX.utils.decode_range(firstSheet['!ref']);
            const numColumnas = range.e.c - range.s.c + 1;
            const numFilas = range.e.r - range.s.r + 1;
            
            console.log('Columnas en archivo:', numColumnas);
            console.log('Filas en archivo:', numFilas);
            
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: null });
            
            if (jsonData.length === 0) {
                throw new Error('El archivo está vacío');
            }

            const columnas = Object.keys(jsonData[0]);
            console.log('Columnas detectadas:', columnas.length);
            
            if (columnas.length < COLUMNAS_MINIMAS) {
                throw new Error(`El archivo debe tener al menos ${COLUMNAS_MINIMAS} columnas. Se encontraron ${columnas.length} columnas.`);
            }

            const columnasFaltantes = COLUMNAS_NECESARIAS.filter(col => !columnas.includes(col));
            if (columnasFaltantes.length > 0) {
                throw new Error(`Faltan columnas requeridas: ${columnasFaltantes.join(', ')}`);
            }

            mostrarMensaje(
                `✅ Archivo validado correctamente
                <br>📊 ${numColumnas} columnas • ${columnas.length} con datos
                <br>📄 ${numFilas.toLocaleString()} registros
                <br>⏳ Procesando datos...`, 
                'success'
            );
            
            setTimeout(() => convertirDatos(jsonData), 500);
            
        } catch (error) {
            loader.style.display = 'none';
            mostrarMensaje('❌ Error: ' + error.message, 'error');
            
            Swal.fire({
                icon: 'error',
                title: 'Error al procesar archivo',
                text: error.message,
                confirmButtonColor: '#667eea'
            });
            
            console.error('Error:', error);
        }
    };

    reader.onerror = function() {
        loader.style.display = 'none';
        mostrarMensaje('❌ Error al leer el archivo', 'error');
        
        Swal.fire({
            icon: 'error',
            title: 'Error de lectura',
            text: 'No se pudo leer el archivo. Verifica que no esté corrupto.',
            confirmButtonColor: '#667eea'
        });
    };

    reader.readAsArrayBuffer(file);
}

function convertirDatos(rawData) {
    try {
        console.log('=== PROCESANDO DATOS CON CLASES ===');
        console.log('Total líneas:', rawData.length);
        
        // Agrupar por factura usando la clase Factura
        const facturasPorNumero = {};
        
        rawData.forEach(row => {
            let numFactura = row.FACTURA || '';
            if (typeof numFactura !== 'string') {
                numFactura = String(numFactura);
            }
            
            // Si la factura no existe, crearla
            if (!facturasPorNumero[numFactura]) {
                facturasPorNumero[numFactura] = new Factura(numFactura, row);
            }
            
            // Agregar el servicio a la factura
            facturasPorNumero[numFactura].agregarServicio(row);
        });
        
        // Convertir a array manteniendo las instancias completas de Factura
        const facturasCompletas = Object.values(facturasPorNumero);
        
        // Crear objetos simplificados para la interfaz
        facturasProcesadas = facturasCompletas.map(factura => factura.toDisplayObject());
        
        // Guardar también las facturas completas para exportación JSON
        window.facturasCompletasJSON = facturasCompletas.map(factura => factura.toSimpleObject());
        
        datosOriginales = [...facturasProcesadas];
        datosFiltrados = [...facturasProcesadas];
        
        const totalLineas = rawData.length;
        const totalFacturacion = facturasProcesadas.reduce((sum, f) => sum + f.valorTotal, 0);
        const totalContratos = facturasProcesadas.reduce((sum, f) => sum + f.valorContrato, 0);
        const totalPacientes = facturasProcesadas.reduce((sum, f) => sum + f.valorPaciente, 0);
        
        console.log('=== RESUMEN DE PROCESAMIENTO ===');
        console.log('Facturas únicas:', facturasProcesadas.length);
        console.log('Total facturación:', totalFacturacion);
        console.log('Total contratos:', totalContratos);
        console.log('Total pacientes:', totalPacientes);
        
        loader.style.display = 'none';
        
        mostrarMensaje(
            `✅ ¡Datos procesados exitosamente!
            <br>📄 ${facturasProcesadas.length.toLocaleString()} facturas únicas
            <br>📋 ${totalLineas.toLocaleString()} líneas de detalle
            <br>💰 Total facturación: $${(totalFacturacion/1000000).toFixed(2)} Millones`, 
            'success'
        );
        
        // Toast de éxito adicional
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: '¡Datos cargados exitosamente!',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
        
        setTimeout(() => mostrarDashboard(), 1500);

    } catch (error) {
        loader.style.display = 'none';
        mostrarMensaje('❌ Error al procesar: ' + error.message, 'error');
        
        Swal.fire({
            icon: 'error',
            title: 'Error al procesar datos',
            html: `<p>${error.message}</p><p style="font-size: 0.9em; color: #666;">Verifica que el archivo tenga el formato correcto.</p>`,
            confirmButtonColor: '#667eea'
        });
        
        console.error('Error:', error);
        console.error('Stack:', error.stack);
    }
}

function excelDateToJSDate(excelDate) {
    if (typeof excelDate === 'string' && excelDate.includes('-')) {
        return excelDate;
    }
    if (!excelDate) {
        return new Date().toISOString().split('T')[0];
    }
    if (typeof excelDate === 'number') {
        const date = new Date((excelDate - 25569) * 86400 * 1000);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    if (excelDate instanceof Date) {
        return excelDate.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
}

function mostrarDashboard() {
    uploadSection.style.display = 'none';
    dashboard.style.display = 'block';
    resetBtn.style.display = 'block';
    downloadJsonBtn.style.display = 'block';
    
    inicializarFiltros();
    actualizarDashboard();
}

function resetearSistema() {
    Swal.fire({
        title: '¿Cargar otro archivo?',
        text: 'Se perderán los datos actuales',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#667eea',
        cancelButtonColor: '#f5576c',
        confirmButtonText: 'Sí, cargar otro',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            Object.values(charts).forEach(chart => chart.destroy());
            charts = {};
            datosOriginales = [];
            datosFiltrados = [];
            facturasProcesadas = [];
            uploadSection.style.display = 'block';
            dashboard.style.display = 'none';
            resetBtn.style.display = 'none';
            downloadJsonBtn.style.display = 'none';
            fileInput.value = '';
            ocultarMensaje();
            
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'info',
                title: 'Sistema reseteado',
                showConfirmButton: false,
                timer: 2000
            });
        }
    });
}

function inicializarFiltros() {
    // Calcular fechas mínima y máxima
    const fechas = datosOriginales.map(d => d.fecha).sort();
    fechaMinima = fechas[0];
    fechaMaxima = fechas[fechas.length - 1];
    
    console.log('Rango de fechas:', fechaMinima, 'a', fechaMaxima);
    
    // Configurar inputs de fecha
    const inputFechaInicio = document.getElementById('fechaInicio');
    const inputFechaFin = document.getElementById('fechaFin');
    
    inputFechaInicio.min = fechaMinima;
    inputFechaInicio.max = fechaMaxima;
    inputFechaFin.min = fechaMinima;
    inputFechaFin.max = fechaMaxima;
    
    // Regímenes
    const regimenes = [...new Set(datosOriginales.map(d => d.regimen))].sort();
    const selectRegimen = document.getElementById('filtroRegimen');
    selectRegimen.innerHTML = '<option value="TODOS">Todos los Regímenes</option>';
    regimenes.forEach(regimen => {
        const option = document.createElement('option');
        option.value = regimen;
        option.textContent = regimen;
        selectRegimen.appendChild(option);
    });

    // Administradoras
    const administradoras = [...new Set(datosOriginales.map(d => d.administradora))].sort();
    const selectAdmin = document.getElementById('filtroAdministradora');
    selectAdmin.innerHTML = '<option value="TODOS">Todas las Administradoras</option>';
    administradoras.forEach(admin => {
        const option = document.createElement('option');
        option.value = admin;
        option.textContent = admin;
        selectAdmin.appendChild(option);
    });

    // Event listeners para filtros
    selectRegimen.addEventListener('change', aplicarFiltros);
    selectAdmin.addEventListener('change', function() {
        cargarContratosPorAdministradora();
        aplicarFiltros();
    });
    
    document.getElementById('filtroContrato').addEventListener('change', aplicarFiltros);
    
    inputFechaInicio.addEventListener('change', validarYAplicarFechas);
    inputFechaFin.addEventListener('change', validarYAplicarFechas);
    
    document.getElementById('btnLimpiarFechas').addEventListener('click', () => {
        inputFechaInicio.value = '';
        inputFechaFin.value = '';
        aplicarFiltros();
        
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: 'Filtros de fecha limpiados',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });
    });
    
    // Event listeners para paginación de tabla principal
    document.getElementById('rowsPerPage').addEventListener('change', (e) => {
        filasPorPagina = parseInt(e.target.value);
        paginaActualTabla = 1;
        actualizarTabla();
    });
    
    document.getElementById('btnPrimera').addEventListener('click', () => {
        paginaActualTabla = 1;
        actualizarTabla();
    });
    
    document.getElementById('btnAnterior').addEventListener('click', () => {
        if (paginaActualTabla > 1) {
            paginaActualTabla--;
            actualizarTabla();
        }
    });
    
    document.getElementById('btnSiguiente').addEventListener('click', () => {
        const totalPaginas = Math.ceil(datosFiltrados.length / filasPorPagina);
        if (paginaActualTabla < totalPaginas) {
            paginaActualTabla++;
            actualizarTabla();
        }
    });
    
    document.getElementById('btnUltima').addEventListener('click', () => {
        const totalPaginas = Math.ceil(datosFiltrados.length / filasPorPagina);
        paginaActualTabla = totalPaginas;
        actualizarTabla();
    });
    
    // Event listeners para paginación del modal
    document.getElementById('rowsPerPageModal').addEventListener('change', (e) => {
        filasPorPaginaModal = parseInt(e.target.value);
        paginaActualModal = 1;
        renderizarServiciosModal();
    });
    
    document.getElementById('btnPrimeraModal').addEventListener('click', () => {
        paginaActualModal = 1;
        renderizarServiciosModal();
    });
    
    document.getElementById('btnAnteriorModal').addEventListener('click', () => {
        if (paginaActualModal > 1) {
            paginaActualModal--;
            renderizarServiciosModal();
        }
    });
    
    document.getElementById('btnSiguienteModal').addEventListener('click', () => {
        const totalPaginas = Math.ceil(serviciosActuales.length / filasPorPaginaModal);
        if (paginaActualModal < totalPaginas) {
            paginaActualModal++;
            renderizarServiciosModal();
        }
    });
    
    document.getElementById('btnUltimaModal').addEventListener('click', () => {
        const totalPaginas = Math.ceil(serviciosActuales.length / filasPorPaginaModal);
        paginaActualModal = totalPaginas;
        renderizarServiciosModal();
    });
    
    // Event listeners para ordenamiento de columnas
    document.querySelectorAll('#tablaFacturas th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const columna = th.dataset.column;
            
            // Si es la misma columna, cambiar dirección
            if (columnaOrden === columna) {
                direccionOrden = direccionOrden === 'asc' ? 'desc' : 'asc';
            } else {
                // Nueva columna, comenzar ascendente
                columnaOrden = columna;
                direccionOrden = 'asc';
            }
            
            // Actualizar clases visuales
            document.querySelectorAll('#tablaFacturas th.sortable').forEach(header => {
                header.classList.remove('sort-asc', 'sort-desc');
            });
            
            th.classList.add(direccionOrden === 'asc' ? 'sort-asc' : 'sort-desc');
            
            // Actualizar tabla
            paginaActualTabla = 1; // Volver a página 1
            actualizarTabla();
        });
    });
}

function cargarContratosPorAdministradora() {
    const administradoraSeleccionada = document.getElementById('filtroAdministradora').value;
    const selectContrato = document.getElementById('filtroContrato');
    
    if (administradoraSeleccionada === 'TODOS') {
        // Deshabilitar y resetear
        selectContrato.disabled = true;
        selectContrato.innerHTML = '<option value="TODOS">Seleccione una administradora primero</option>';
        
        // Ocultar gráfico de contratos
        document.getElementById('chartContratosCard').style.display = 'none';
        if (charts.contratos) {
            charts.contratos.destroy();
            delete charts.contratos;
        }
    } else {
        // Habilitar y cargar contratos de esa administradora
        selectContrato.disabled = false;
        
        const contratosDeLaAdmin = [...new Set(
            datosOriginales
                .filter(f => f.administradora === administradoraSeleccionada)
                .map(f => f.numeroContrato)
        )].sort();
        
        selectContrato.innerHTML = '<option value="TODOS">Todos los Contratos</option>';
        contratosDeLaAdmin.forEach(contrato => {
            const option = document.createElement('option');
            option.value = contrato;
            option.textContent = contrato;
            selectContrato.appendChild(option);
        });
        
        // Mostrar gráfico de contratos
        document.getElementById('chartContratosCard').style.display = 'block';
    }
}

function validarYAplicarFechas() {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    
    // Si ambas fechas están llenas, validar
    if (fechaInicio && fechaFin) {
        if (fechaInicio > fechaFin) {
            Swal.fire({
                icon: 'warning',
                title: 'Fecha Inválida',
                text: 'La fecha de inicio no puede ser mayor que la fecha de fin',
                confirmButtonColor: '#667eea',
                confirmButtonText: 'Entendido'
            });
            document.getElementById('fechaInicio').value = '';
            return;
        }
        if (fechaFin < fechaInicio) {
            Swal.fire({
                icon: 'warning',
                title: 'Fecha Inválida',
                text: 'La fecha de fin no puede ser menor que la fecha de inicio',
                confirmButtonColor: '#667eea',
                confirmButtonText: 'Entendido'
            });
            document.getElementById('fechaFin').value = '';
            return;
        }
    }
    
    aplicarFiltros();
}

function aplicarFiltros() {
    const regimen = document.getElementById('filtroRegimen').value;
    const admin = document.getElementById('filtroAdministradora').value;
    const contrato = document.getElementById('filtroContrato').value;
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;

    datosFiltrados = datosOriginales.filter(d => {
        const cumpleRegimen = regimen === 'TODOS' || d.regimen === regimen;
        const cumpleAdmin = admin === 'TODOS' || d.administradora === admin;
        const cumpleContrato = contrato === 'TODOS' || d.numeroContrato === contrato;
        
        let cumpleFecha = true;
        if (fechaInicio && fechaFin) {
            cumpleFecha = d.fecha >= fechaInicio && d.fecha <= fechaFin;
        } else if (fechaInicio) {
            cumpleFecha = d.fecha >= fechaInicio;
        } else if (fechaFin) {
            cumpleFecha = d.fecha <= fechaFin;
        }
        
        return cumpleRegimen && cumpleAdmin && cumpleContrato && cumpleFecha;
    });

    paginaActualTabla = 1; // Resetear a la primera página
    actualizarDashboard();
}

function actualizarDashboard() {
    actualizarKPIs();
    actualizarGraficos();
    actualizarTabla();
}

function actualizarKPIs() {
    // Calcular totales
    const totalFacturacion = datosFiltrados.reduce((sum, f) => sum + f.valorTotal, 0);
    const totalContratos = datosFiltrados.reduce((sum, f) => sum + f.valorContrato, 0);
    const totalPacientes = datosFiltrados.reduce((sum, f) => sum + f.valorPaciente, 0);
    const totalFacturas = datosFiltrados.length;
    const promedioFactura = totalFacturas > 0 ? totalFacturacion / totalFacturas : 0;

    // Servicio más facturado
    const serviciosPorNombre = {};
    datosFiltrados.forEach(f => {
        f.servicios.forEach(s => {
            if (!serviciosPorNombre[s.nombre]) {
                serviciosPorNombre[s.nombre] = 0;
            }
            serviciosPorNombre[s.nombre]++;
        });
    });
    const servicioTop = Object.entries(serviciosPorNombre)
        .sort((a, b) => b[1] - a[1])[0];

    // Actualizar KPIs en el DOM
    document.getElementById('valorTotal').textContent = 
        '$' + (totalFacturacion / 1000000).toFixed(2) + 'M';
    document.getElementById('valorContrato').textContent = 
        '$' + (totalContratos / 1000000).toFixed(2) + 'M';
    document.getElementById('valorPaciente').textContent = 
        '$' + (totalPacientes / 1000000).toFixed(2) + 'M';
    document.getElementById('totalFacturas').textContent = totalFacturas.toLocaleString();
    document.getElementById('promedioFactura').textContent = 
        '$' + (promedioFactura / 1000).toFixed(0) + 'K';
    document.getElementById('servicioTop').textContent = 
        servicioTop ? servicioTop[0].substring(0, 25) + '...' : '-';
}

function actualizarGraficos() {
    actualizarGraficoTendencia();
    actualizarGraficoAdministradoras();
    actualizarGraficoRegimen();
    actualizarGraficoServicios();
    
    // Actualizar gráfico de contratos solo si hay una administradora seleccionada
    const admin = document.getElementById('filtroAdministradora').value;
    if (admin !== 'TODOS') {
        actualizarGraficoContratos();
    }
}

function actualizarGraficoTendencia() {
    const facturacionPorFecha = {};
    datosFiltrados.forEach(f => {
        if (!facturacionPorFecha[f.fecha]) {
            facturacionPorFecha[f.fecha] = 0;
        }
        facturacionPorFecha[f.fecha] += f.valorTotal;
    });

    const fechasOrdenadas = Object.keys(facturacionPorFecha).sort();
    const valores = fechasOrdenadas.map(f => facturacionPorFecha[f]);

    if (charts.tendencia) charts.tendencia.destroy();

    const ctx = document.getElementById('chartTendencia').getContext('2d');
    charts.tendencia = new Chart(ctx, {
        type: 'line',
        data: {
            labels: fechasOrdenadas,
            datasets: [{
                label: 'Facturación Diaria',
                data: valores,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => 'Facturación: $' + context.parsed.y.toLocaleString()
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => '$' + (value / 1000000).toFixed(1) + 'M'
                    }
                }
            }
        }
    });
}

function actualizarGraficoAdministradoras() {
    const facturacionPorAdmin = {};
    datosFiltrados.forEach(f => {
        if (!facturacionPorAdmin[f.administradora]) {
            facturacionPorAdmin[f.administradora] = 0;
        }
        facturacionPorAdmin[f.administradora] += f.valorTotal;
    });

    const admins = Object.entries(facturacionPorAdmin).sort((a, b) => b[1] - a[1]);

    if (charts.administradoras) charts.administradoras.destroy();

    const ctx = document.getElementById('chartAdministradoras').getContext('2d');
    charts.administradoras = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: admins.map(a => a[0]),
            datasets: [{
                data: admins.map(a => a[1]),
                backgroundColor: [
                    '#667eea', '#764ba2', '#f093fb', '#f5576c',
                    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return context.label + ': $' + value.toLocaleString() + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

function actualizarGraficoRegimen() {
    const facturacionPorRegimen = {};
    datosFiltrados.forEach(f => {
        if (!facturacionPorRegimen[f.regimen]) {
            facturacionPorRegimen[f.regimen] = 0;
        }
        facturacionPorRegimen[f.regimen] += f.valorTotal;
    });

    const regimenes = Object.entries(facturacionPorRegimen);

    if (charts.regimen) charts.regimen.destroy();

    const ctx = document.getElementById('chartRegimen').getContext('2d');
    charts.regimen = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: regimenes.map(r => r[0]),
            datasets: [{
                data: regimenes.map(r => r[1]),
                backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#f5576c']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return context.label + ': $' + value.toLocaleString() + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

function actualizarGraficoServicios() {
    const serviciosPorNombre = {};
    datosFiltrados.forEach(f => {
        f.servicios.forEach(s => {
            if (!serviciosPorNombre[s.nombre]) {
                serviciosPorNombre[s.nombre] = 0;
            }
            serviciosPorNombre[s.nombre]++;
        });
    });

    const serviciosTop = Object.entries(serviciosPorNombre)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    if (charts.servicios) charts.servicios.destroy();

    const ctx = document.getElementById('chartServicios').getContext('2d');
    charts.servicios = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: serviciosTop.map(s => s[0].substring(0, 30) + '...'),
            datasets: [{
                label: 'Cantidad Facturada',
                data: serviciosTop.map(s => s[1]),
                backgroundColor: [
                    '#667eea', '#764ba2', '#f093fb', '#f5576c',
                    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
                    '#fa709a', '#fee140'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { beginAtZero: true }
            }
        }
    });
}

function actualizarGraficoContratos() {
    const adminSeleccionada = document.getElementById('filtroAdministradora').value;
    
    // Filtrar solo facturas de la administradora seleccionada
    const facturasAdmin = datosFiltrados.filter(f => f.administradora === adminSeleccionada);
    
    const facturacionPorContrato = {};
    facturasAdmin.forEach(f => {
        if (!facturacionPorContrato[f.numeroContrato]) {
            facturacionPorContrato[f.numeroContrato] = 0;
        }
        facturacionPorContrato[f.numeroContrato] += f.valorTotal;
    });

    const contratos = Object.entries(facturacionPorContrato).sort((a, b) => b[1] - a[1]);

    if (charts.contratos) charts.contratos.destroy();

    const ctx = document.getElementById('chartContratos').getContext('2d');
    charts.contratos = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: contratos.map(c => c[0]),
            datasets: [{
                data: contratos.map(c => c[1]),
                backgroundColor: [
                    '#667eea', '#764ba2', '#f093fb', '#f5576c',
                    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
                    '#fa709a', '#fee140', '#30cfd0', '#330867'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'right',
                    labels: {
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return label + ': $' + value.toLocaleString() + ' (' + percentage + '%)';
                        }
                    }
                },
                title: {
                    display: true,
                    text: `Contratos de ${adminSeleccionada}`,
                    font: { size: 14 }
                }
            }
        }
    });
}

function ordenarFacturas(facturas) {
    return [...facturas].sort((a, b) => {
        let valorA, valorB;
        
        switch(columnaOrden) {
            case 'factura':
                valorA = a.factura.toString().toLowerCase();
                valorB = b.factura.toString().toLowerCase();
                break;
            case 'fecha':
                valorA = a.fecha;
                valorB = b.fecha;
                break;
            case 'administradora':
                valorA = a.administradora.toLowerCase();
                valorB = b.administradora.toLowerCase();
                break;
            case 'numeroContrato':
                valorA = (a.numeroContrato || '').toString().toLowerCase();
                valorB = (b.numeroContrato || '').toString().toLowerCase();
                break;
            case 'regimen':
                valorA = a.regimen.toLowerCase();
                valorB = b.regimen.toLowerCase();
                break;
            case 'valorPaciente':
                valorA = a.valorPaciente;
                valorB = b.valorPaciente;
                break;
            case 'valorContrato':
                valorA = a.valorContrato;
                valorB = b.valorContrato;
                break;
            case 'valorTotal':
                valorA = a.valorTotal;
                valorB = b.valorTotal;
                break;
            default:
                valorA = a.fecha;
                valorB = b.fecha;
        }
        
        // Comparación
        let comparacion = 0;
        if (valorA > valorB) {
            comparacion = 1;
        } else if (valorA < valorB) {
            comparacion = -1;
        }
        
        // Aplicar dirección
        return direccionOrden === 'asc' ? comparacion : -comparacion;
    });
}

function actualizarTabla() {
    // Ordenar facturas
    const facturasOrdenadas = ordenarFacturas(datosFiltrados);
    
    // Calcular paginación
    const totalFacturas = facturasOrdenadas.length;
    const totalPaginas = Math.ceil(totalFacturas / filasPorPagina);
    const inicio = (paginaActualTabla - 1) * filasPorPagina;
    const fin = inicio + filasPorPagina;
    const facturasPagina = facturasOrdenadas.slice(inicio, fin);

    // Renderizar tabla
    const tbody = document.querySelector('#tablaFacturas tbody');
    tbody.innerHTML = '';

    facturasPagina.forEach(factura => {
        const row = document.createElement('tr');
        
        // Crear celdas
        const cellFactura = document.createElement('td');
        cellFactura.innerHTML = `<strong>${factura.factura}</strong>`;
        
        const cellFecha = document.createElement('td');
        cellFecha.textContent = factura.fecha;
        
        const cellAdmin = document.createElement('td');
        createTruncatedCell(cellAdmin, factura.administradora, 30);
        
        const cellContrato = document.createElement('td');
        createTruncatedCell(cellContrato, factura.numeroContrato, 20);
        
        const cellRegimen = document.createElement('td');
        createTruncatedCell(cellRegimen, factura.regimen, 25);
        
        const cellValorPaciente = document.createElement('td');
        cellValorPaciente.textContent = '$' + factura.valorPaciente.toLocaleString();
        
        const cellValorContrato = document.createElement('td');
        cellValorContrato.textContent = '$' + factura.valorContrato.toLocaleString();
        
        const cellValorTotal = document.createElement('td');
        cellValorTotal.innerHTML = `<strong>$${factura.valorTotal.toLocaleString()}</strong>`;
        
        const cellAccion = document.createElement('td');
        const btnDetalle = document.createElement('button');
        btnDetalle.className = 'btn btn-small';
        btnDetalle.innerHTML = '👁️ Ver Detalle';
        btnDetalle.onclick = () => verDetalle(factura.factura);
        cellAccion.appendChild(btnDetalle);
        
        // Agregar celdas a la fila
        row.appendChild(cellFactura);
        row.appendChild(cellFecha);
        row.appendChild(cellAdmin);
        row.appendChild(cellContrato);
        row.appendChild(cellRegimen);
        row.appendChild(cellValorPaciente);
        row.appendChild(cellValorContrato);
        row.appendChild(cellValorTotal);
        row.appendChild(cellAccion);
        
        tbody.appendChild(row);
    });
    
    // Inicializar tooltips con delay para asegurar que el DOM esté listo
    setTimeout(() => {
        initTooltips();
    }, 50);
    
    // Actualizar controles de paginación
    document.getElementById('paginaActual').textContent = 
        `Página ${paginaActualTabla} de ${totalPaginas} (${totalFacturas.toLocaleString()} facturas)`;
    
    document.getElementById('btnPrimera').disabled = paginaActualTabla === 1;
    document.getElementById('btnAnterior').disabled = paginaActualTabla === 1;
    document.getElementById('btnSiguiente').disabled = paginaActualTabla === totalPaginas;
    document.getElementById('btnUltima').disabled = paginaActualTabla === totalPaginas;
}

function verDetalle(numeroFactura) {
    const factura = datosFiltrados.find(f => f.factura === numeroFactura);
    if (!factura) return;

    // Calcular totales
    const totalFactura = factura.valorTotal;
    const totalContrato = factura.valorContrato;
    const totalPaciente = factura.valorPaciente;

    // Información de la factura
    const modalInfo = document.getElementById('modalInfo');
    modalInfo.innerHTML = `
        <div class="modal-info-item">
            <div class="modal-info-label">Factura</div>
            <div class="modal-info-value">${factura.factura}</div>
        </div>
        <div class="modal-info-item">
            <div class="modal-info-label">Fecha</div>
            <div class="modal-info-value">${factura.fecha}</div>
        </div>
        <div class="modal-info-item">
            <div class="modal-info-label">Administradora</div>
            <div class="modal-info-value">${factura.administradora}</div>
        </div>
        <div class="modal-info-item">
            <div class="modal-info-label">Régimen</div>
            <div class="modal-info-value">${factura.regimen}</div>
        </div>
        <div class="modal-info-item">
            <div class="modal-info-label">Contrato</div>
            <div class="modal-info-value">${factura.numeroContrato}</div>
        </div>
    `;
    
    // Actualizar totales en el modal
    document.getElementById('modalTotalFactura').textContent = '$' + totalFactura.toLocaleString();
    document.getElementById('modalTotalContrato').textContent = '$' + totalContrato.toLocaleString();
    document.getElementById('modalTotalPaciente').textContent = '$' + totalPaciente.toLocaleString();

    // Guardar servicios y resetear paginación y ordenamiento
    serviciosActuales = factura.servicios;
    paginaActualModal = 1;
    columnaOrdenModal = 'nombre';
    direccionOrdenModal = 'asc';
    
    // Inicializar listeners de ordenamiento en modal
    setTimeout(() => {
        document.querySelectorAll('#tablaServicios th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const columna = th.dataset.column;
                
                if (columnaOrdenModal === columna) {
                    direccionOrdenModal = direccionOrdenModal === 'asc' ? 'desc' : 'asc';
                } else {
                    columnaOrdenModal = columna;
                    direccionOrdenModal = 'asc';
                }
                
                document.querySelectorAll('#tablaServicios th.sortable').forEach(header => {
                    header.classList.remove('sort-asc', 'sort-desc');
                });
                
                th.classList.add(direccionOrdenModal === 'asc' ? 'sort-asc' : 'sort-desc');
                
                paginaActualModal = 1;
                renderizarServiciosModal();
            });
        });
    }, 100);
    
    renderizarServiciosModal();

    modal.style.display = 'block';
}

function ordenarServicios(servicios) {
    return [...servicios].sort((a, b) => {
        let valorA, valorB;
        
        switch(columnaOrdenModal) {
            case 'nombre':
                valorA = a.nombre.toLowerCase();
                valorB = b.nombre.toLowerCase();
                break;
            case 'cantidad':
                valorA = a.cantidad;
                valorB = b.cantidad;
                break;
            case 'valorUnitario':
                valorA = a.valorUnitario || 0;
                valorB = b.valorUnitario || 0;
                break;
            case 'valPacien':
                valorA = a.valPacien;
                valorB = b.valPacien;
                break;
            case 'valContra':
                valorA = a.valContra;
                valorB = b.valContra;
                break;
            case 'valTotal':
                valorA = a.valTotal;
                valorB = b.valTotal;
                break;
            default:
                valorA = a.nombre.toLowerCase();
                valorB = b.nombre.toLowerCase();
        }
        
        let comparacion = 0;
        if (valorA > valorB) {
            comparacion = 1;
        } else if (valorA < valorB) {
            comparacion = -1;
        }
        
        return direccionOrdenModal === 'asc' ? comparacion : -comparacion;
    });
}

function renderizarServiciosModal() {
    // Ordenar servicios
    const serviciosOrdenados = ordenarServicios(serviciosActuales);
    
    const totalServicios = serviciosOrdenados.length;
    const totalPaginas = Math.ceil(totalServicios / filasPorPaginaModal);
    const inicio = (paginaActualModal - 1) * filasPorPaginaModal;
    const fin = inicio + filasPorPaginaModal;
    const serviciosPagina = serviciosOrdenados.slice(inicio, fin);
    
    const tbodyServicios = document.querySelector('#tablaServicios tbody');
    tbodyServicios.innerHTML = '';

    serviciosPagina.forEach(servicio => {
        const row = document.createElement('tr');
        
        // Crear celdas
        const cellServicio = document.createElement('td');
        createTruncatedCell(cellServicio, servicio.nombre, 40);
        
        const cellCantidad = document.createElement('td');
        cellCantidad.textContent = servicio.cantidad;
        
        const cellValorUnitario = document.createElement('td');
        cellValorUnitario.textContent = '$' + (servicio.valorUnitario ? servicio.valorUnitario.toLocaleString() : '0');
        
        const cellValorPaciente = document.createElement('td');
        cellValorPaciente.textContent = '$' + servicio.valPacien.toLocaleString();
        
        const cellValorContrato = document.createElement('td');
        cellValorContrato.textContent = '$' + servicio.valContra.toLocaleString();
        
        const cellValorTotal = document.createElement('td');
        cellValorTotal.innerHTML = `<strong>$${servicio.valTotal.toLocaleString()}</strong>`;
        
        // Agregar celdas a la fila
        row.appendChild(cellServicio);
        row.appendChild(cellCantidad);
        row.appendChild(cellValorUnitario);
        row.appendChild(cellValorPaciente);
        row.appendChild(cellValorContrato);
        row.appendChild(cellValorTotal);
        
        tbodyServicios.appendChild(row);
    });
    
    // Inicializar tooltips con delay para asegurar que el DOM esté listo
    setTimeout(() => {
        initTooltips();
    }, 50);
    
    // Actualizar controles de paginación del modal
    document.getElementById('paginaActualModal').textContent = 
        `Página ${paginaActualModal} de ${totalPaginas}`;
    
    document.getElementById('btnPrimeraModal').disabled = paginaActualModal === 1;
    document.getElementById('btnAnteriorModal').disabled = paginaActualModal === 1;
    document.getElementById('btnSiguienteModal').disabled = paginaActualModal === totalPaginas;
    document.getElementById('btnUltimaModal').disabled = paginaActualModal === totalPaginas;
}

// ========================================
// FUNCIONES DE UTILIDAD PARA TOOLTIPS
// ========================================

/**
 * Crea una celda con texto truncado y tooltip
 */
function createTruncatedCell(cell, text, maxLength) {
    if (!text) {
        cell.textContent = '';
        return;
    }
    
    const textStr = text.toString();
    
    if (textStr.length <= maxLength) {
        cell.textContent = textStr;
        return;
    }
    
    // Crear span truncado
    const span = document.createElement('span');
    span.className = 'truncate';
    span.textContent = textStr.substring(0, maxLength) + '...';
    span.dataset.fullText = textStr;
    span.title = ''; // Prevenir tooltip nativo del navegador
    
    cell.appendChild(span);
}

/**
 * Inicializa tooltips en elementos con clase .truncate
 */
function initTooltips() {
    // Remover tooltips existentes
    document.querySelectorAll('.tooltip').forEach(t => t.remove());
    
    // Agregar event listeners a elementos truncados
    const elementos = document.querySelectorAll('.truncate');
    console.log('🔍 Inicializando tooltips para', elementos.length, 'elementos');
    
    elementos.forEach((element, index) => {
        // Remover listeners anteriores
        element.removeEventListener('mouseenter', showTooltip);
        element.removeEventListener('mouseleave', hideTooltip);
        
        // Agregar nuevos listeners
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
        
        console.log(`   ${index + 1}. Tooltip configurado:`, element.textContent.substring(0, 30) + '...');
    });
}

/**
 * Muestra el tooltip
 */
function showTooltip(e) {
    const element = e.currentTarget || e.target;
    const fullText = element.dataset.fullText;
    
    console.log('👆 Mouse sobre elemento:', {
        textoVisible: element.textContent,
        textoCompleto: fullText,
        tieneDataset: !!fullText
    });
    
    if (!fullText) {
        console.warn('⚠️ No hay fullText en dataset');
        return;
    }
    
    // Remover tooltip anterior si existe
    const tooltipAnterior = document.getElementById('active-tooltip');
    if (tooltipAnterior) {
        tooltipAnterior.remove();
    }
    
    // Crear tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = fullText;
    tooltip.id = 'active-tooltip';
    
    console.log('🎨 Tooltip creado:', {
        elemento: tooltip,
        contenido: tooltip.textContent,
        clases: tooltip.className,
        id: tooltip.id
    });
    
    // Agregar al body
    document.body.appendChild(tooltip);
    
    console.log('📦 Tooltip agregado al DOM:', {
        enElDOM: document.getElementById('active-tooltip') !== null,
        estilosComputados: window.getComputedStyle(tooltip)
    });
    
    // Obtener posición del elemento
    const rect = element.getBoundingClientRect();
    
    // Calcular posición inicial del tooltip (debajo del elemento)
    let tooltipLeft = rect.left;
    let tooltipTop = rect.bottom + 10;
    
    // Aplicar posición
    tooltip.style.left = tooltipLeft + 'px';
    tooltip.style.top = tooltipTop + 'px';
    
    console.log('📍 Posición del tooltip:', {
        left: tooltipLeft,
        top: tooltipTop,
        elementRect: rect
    });
    
    // Esperar un frame para que el navegador calcule el tamaño del tooltip
    requestAnimationFrame(() => {
        const tooltipRect = tooltip.getBoundingClientRect();
        
        // Ajustar horizontalmente si se sale por la derecha
        if (tooltipRect.right > window.innerWidth - 20) {
            tooltipLeft = window.innerWidth - tooltipRect.width - 20;
            tooltip.style.left = tooltipLeft + 'px';
        }
        
        // Ajustar horizontalmente si se sale por la izquierda
        if (tooltipRect.left < 20) {
            tooltipLeft = 20;
            tooltip.style.left = tooltipLeft + 'px';
        }
        
        // Ajustar verticalmente si se sale por abajo
        if (tooltipRect.bottom > window.innerHeight - 20) {
            tooltipTop = rect.top - tooltipRect.height - 10;
            tooltip.style.top = tooltipTop + 'px';
        }
        
        console.log('📍 Posición ajustada:', {
            left: tooltipLeft,
            top: tooltipTop,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight
        });
        
        // Mostrar con animación
        setTimeout(() => {
            tooltip.classList.add('show');
            console.log('✅ Tooltip mostrado con clase .show');
        }, 10);
    });
}

/**
 * Oculta el tooltip
 */
function hideTooltip() {
    const tooltip = document.getElementById('active-tooltip');
    if (tooltip) {
        console.log('🚫 Ocultando tooltip');
        tooltip.classList.remove('show');
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.remove();
            }
        }, 300);
    }
}

// ========================================
// FUNCIONES DE DESCARGA DE DATOS
// ========================================

/**
 * Descarga los datos procesados en formato JSON
 */
function descargarJSON() {
    // Obtener índices de facturas filtradas
    const indicesFiltrados = datosFiltrados.map(f => datosOriginales.findIndex(d => d.factura === f.factura));
    const facturasCompletasFiltradas = indicesFiltrados.map(i => window.facturasCompletasJSON[i]);
    
    Swal.fire({
        title: 'Descargar datos en JSON',
        html: `
            <p>Selecciona qué datos deseas descargar:</p>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                <button id="btnTodos" class="btn" style="width: 100%;">
                    📊 Todos los Datos Completos (${datosOriginales.length} facturas)
                </button>
                <button id="btnFiltrados" class="btn" style="width: 100%;">
                    🔍 Datos Filtrados Completos (${datosFiltrados.length} facturas)
                </button>
                <button id="btnEstructuraCompleta" class="btn" style="width: 100%;">
                    🗂️ Estructura Completa con Metadatos
                </button>
            </div>
            <p style="margin-top: 15px; font-size: 0.85em; color: #666;">
                ℹ️ Los archivos incluyen TODOS los campos del Excel
            </p>
        `,
        showConfirmButton: false,
        showCloseButton: true,
        width: '600px',
        didOpen: () => {
            document.getElementById('btnTodos').addEventListener('click', () => {
                descargarArchivoJSON(window.facturasCompletasJSON, 'facturas-completas-todos-campos.json');
                Swal.close();
            });
            
            document.getElementById('btnFiltrados').addEventListener('click', () => {
                descargarArchivoJSON(facturasCompletasFiltradas, 'facturas-filtradas-todos-campos.json');
                Swal.close();
            });
            
            document.getElementById('btnEstructuraCompleta').addEventListener('click', () => {
                const estructura = {
                    metadata: {
                        fechaExportacion: new Date().toISOString(),
                        sistemaVersion: '2.5.0',
                        totalFacturas: datosOriginales.length,
                        facturasFiltradas: datosFiltrados.length,
                        rangoFechas: {
                            minima: fechaMinima,
                            maxima: fechaMaxima
                        },
                        totales: {
                            valorTotal: datosOriginales.reduce((sum, f) => sum + f.valorTotal, 0),
                            valorContrato: datosOriginales.reduce((sum, f) => sum + f.valorContrato, 0),
                            valorPaciente: datosOriginales.reduce((sum, f) => sum + f.valorPaciente, 0)
                        },
                        estadisticas: {
                            totalServicios: window.facturasCompletasJSON.reduce((sum, f) => sum + f.totales.cantidadServicios, 0),
                            promedioServiciosPorFactura: (window.facturasCompletasJSON.reduce((sum, f) => sum + f.totales.cantidadServicios, 0) / window.facturasCompletasJSON.length).toFixed(2)
                        }
                    },
                    facturas: window.facturasCompletasJSON
                };
                descargarArchivoJSON(estructura, 'facturas-estructura-completa-todos-campos.json');
                Swal.close();
            });
        }
    });
}

/**
 * Descarga un objeto como archivo JSON
 */
function descargarArchivoJSON(data, filename) {
    try {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `Archivo ${filename} descargado`,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error al descargar',
            text: 'No se pudo generar el archivo JSON: ' + error.message,
            confirmButtonColor: '#667eea'
        });
    }
}