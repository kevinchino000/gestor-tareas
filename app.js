const input = document.getElementById('inputTarea');
const listaPendientes = document.getElementById('listaTareas');
const listaCompletadas = document.getElementById('listaCompletadas');
const fechaElemento = document.getElementById('fecha');

// 1. Inicialización de fecha
const fechaActual = new Date();
fechaElemento.innerHTML = fechaActual.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

// ==========================================
// SISTEMA DE NOTIFICACIONES
// ==========================================

if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
}

function enviarAlertaWeb(titulo, mensaje) {
    if (Notification.permission === "granted") {
        new Notification(titulo, {
            body: mensaje,
            icon: "https://cdn-icons-png.flaticon.com/512/1828/1828614.png"
        });
    }
}

function revisarNotificaciones() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    let tareas = JSON.parse(localStorage.getItem('tareas') || "[]");
    let huboCambios = false;
    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    tareas.forEach(tarea => {
        if (!tarea.completada && tarea.fechaVencimiento && !tarea.notificada) {
            const fechaT = new Date(tarea.fechaVencimiento + 'T00:00:00');
            const diffTiempo = fechaT.getTime() - hoy.getTime();
            const diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));

            if (diffDias === 0 || diffDias === 1) {
                const diaTexto = diffDias === 0 ? "HOY" : "MAÑANA";
                enviarAlertaWeb("¡Tarea próxima a vencer!", `Tu tarea "${tarea.nombre}" vence ${diaTexto}.`);
                tarea.notificada = true; 
                huboCambios = true;
            }
        }
    });

    if (huboCambios) localStorage.setItem('tareas', JSON.stringify(tareas));
}

setTimeout(revisarNotificaciones, 2000);
setInterval(revisarNotificaciones, 600000);

// ==========================================
// LÓGICA CORE DE LA APLICACIÓN
// ==========================================

function mostrarTareas() {
    const tareas = JSON.parse(localStorage.getItem('tareas') || "[]");
    renderizarListas(tareas);
    actualizarMetricas(tareas);
}

function renderizarListas(tareasArray) {
    listaPendientes.innerHTML = ''; 
    listaCompletadas.innerHTML = ''; 
    
    if (tareasArray.length === 0) {
        listaPendientes.innerHTML = `
            <div class="text-center py-10 text-gray-300">
                <i class="fas fa-clipboard-list text-5xl mb-3"></i>
                <p>No hay tareas registradas</p>
            </div>`;
    }

    const pendientes = tareasArray.filter(t => !t.completada);
    const completadas = tareasArray.filter(t => t.completada);

    pendientes.forEach(tarea => listaPendientes.appendChild(crearElementoTarea(tarea)));
    completadas.forEach(tarea => listaCompletadas.appendChild(crearElementoTarea(tarea)));
    
    const footer = document.getElementById('footerApp');
    if (footer) {
        tareasArray.length === 0 ? footer.classList.add('hidden') : footer.classList.remove('hidden');
    }
}

function crearElementoTarea(tarea) {
    const li = document.createElement('li');
    const colores = { alta: 'border-l-4 border-l-red-500', media: 'border-l-4 border-l-yellow-500', baja: 'border-l-4 border-l-green-500' };
    const colorClase = colores[tarea.prioridad] || 'border-l-4 border-l-gray-300';

    let fechaHtml = '';
    if (tarea.fechaVencimiento) {
        const fechaT = new Date(tarea.fechaVencimiento + 'T00:00:00');
        const hoy = new Date();
        hoy.setHours(0,0,0,0);
        const diffDias = Math.ceil((fechaT.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        let colorFecha = 'text-gray-400';
        let textoExtra = '';

        if (!tarea.completada) {
            if (diffDias < 0) { colorFecha = 'text-red-500 font-bold'; textoExtra = ' (Vencida)'; }
            else if (diffDias === 0) { colorFecha = 'text-orange-500 font-bold'; textoExtra = ' (¡Vence Hoy!)'; }
            else if (diffDias === 1) { colorFecha = 'text-yellow-600 font-medium'; textoExtra = ' (Mañana)'; }
        }
        fechaHtml = `<div class="text-[11px] mt-0.5 ${colorFecha} flex items-center gap-1">
                        <i class="far fa-calendar-alt"></i> ${fechaT.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} ${textoExtra}
                     </div>`;
    }

    li.className = `tarea-animada flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl group hover:shadow-md transition-all dark:bg-slate-800 ${colorClase}`;
    li.innerHTML = `
        <div class="flex items-center gap-4 w-full">
            <div class="relative flex items-center shrink-0">
                <input type="checkbox" ${tarea.completada ? 'checked' : ''} onchange="toggleTarea(${tarea.id})" 
                    class="w-6 h-6 cursor-pointer appearance-none border-2 border-indigo-200 rounded-full checked:bg-indigo-600 checked:border-indigo-600 transition-all">
                <i class="fas fa-check absolute text-white text-[10px] left-1.5 pointer-events-none ${tarea.completada ? '' : 'hidden'}"></i>
            </div>
            <div class="flex flex-col flex-1 overflow-hidden">
                <span id="nombre-tarea-${tarea.id}" onclick="habilitarEdicion(${tarea.id})" 
                    class="font-medium truncate transition-all cursor-pointer hover:text-indigo-600 ${tarea.completada ? 'line-through text-gray-400 font-normal' : 'text-gray-700 dark:text-gray-200'}">
                    ${tarea.nombre}
                </span>
                ${fechaHtml}
            </div>
        </div>
        <button onclick="eliminarTarea(${tarea.id})" class="text-gray-300 hover:text-red-500 transition-colors shrink-0 ml-2">
            <i class="fas fa-trash-alt"></i>
        </button>`;
    return li;
}

// ==========================================
// FUNCIONES DE EDICIÓN Y FILTRADO
// ==========================================

function habilitarEdicion(id) {
    const span = document.getElementById(`nombre-tarea-${id}`);
    const nombreOriginal = span.innerText;
    const inputEdit = document.createElement('input');
    inputEdit.type = 'text';
    inputEdit.value = nombreOriginal;
    inputEdit.className = "border-b-2 border-indigo-500 outline-none bg-transparent w-full text-gray-700 dark:text-white font-medium";
    
    inputEdit.onblur = () => guardarEdicion(id, inputEdit.value);
    inputEdit.onkeydown = (e) => {
        if(e.key === 'Enter') guardarEdicion(id, inputEdit.value);
        if(e.key === 'Escape') mostrarTareas();
    };

    span.parentElement.replaceChild(inputEdit, span);
    inputEdit.focus();
}

function guardarEdicion(id, nuevoNombre) {
    const nombreLimpio = nuevoNombre.trim();
    if (!nombreLimpio) return mostrarTareas();
    
    let tareas = JSON.parse(localStorage.getItem('tareas'));
    tareas = tareas.map(t => t.id === id ? { ...t, nombre: nombreLimpio } : t);
    localStorage.setItem('tareas', JSON.stringify(tareas));
    mostrarTareas();
}

function filtrarPorPrioridad(prioridad) {
    const tareas = JSON.parse(localStorage.getItem('tareas') || "[]");
    const filtradas = prioridad === 'todas' ? tareas : tareas.filter(t => t.prioridad === prioridad);
    renderizarListas(filtradas);
}

// ==========================================
// OPERACIONES CRUD
// ==========================================

function crearTarea() {
    const texto = input.value.trim();
    if (!texto) return; 
    const prioridad = document.getElementById('selectPrioridad').value;
    const fechaVencimiento = document.getElementById('inputFecha').value;
    
    const nuevaTarea = { id: Date.now(), nombre: texto, completada: false, prioridad, fechaVencimiento, notificada: false };
    const tareas = JSON.parse(localStorage.getItem('tareas') || "[]");
    tareas.unshift(nuevaTarea); 
    localStorage.setItem('tareas', JSON.stringify(tareas));
    
    if (prioridad === 'alta' || prioridad === 'media') enviarAlertaWeb("¡Tarea Guardada!", `Has añadido: ${texto}`);
    input.value = ''; 
    document.getElementById('inputFecha').value = ''; 
    mostrarTareas();
}

function toggleTarea(id) {
    let tareas = JSON.parse(localStorage.getItem('tareas'));
    tareas = tareas.map(t => t.id === id ? { ...t, completada: !t.completada } : t);
    localStorage.setItem('tareas', JSON.stringify(tareas));
    mostrarTareas(); 
}

function eliminarTarea(id) {
    let tareas = JSON.parse(localStorage.getItem('tareas'));
    tareas = tareas.filter(t => t.id !== id);
    localStorage.setItem('tareas', JSON.stringify(tareas));
    mostrarTareas();
}

function limpiarCompletadas() {
    if(confirm("¿Estás seguro de que quieres borrar el historial?")) {
        let tareas = JSON.parse(localStorage.getItem('tareas'));
        tareas = tareas.filter(t => !t.completada);
        localStorage.setItem('tareas', JSON.stringify(tareas));
        mostrarTareas();
    }
}

function toggleCompletadas() {
    const lista = document.getElementById('listaCompletadas');
    const flecha = document.getElementById('flechaCompletadas');
    lista.classList.toggle('hidden');
    flecha.classList.toggle('rotate-90');
}

function actualizarMetricas(tareas) {
    const total = tareas.length;
    const completadas = tareas.filter(t => t.completada).length;
    const pendientes = total - completadas;
    const porc = total === 0 ? 0 : Math.round((completadas / total) * 100);
    
    const barra = document.getElementById('barra');
    const porcentaje = document.getElementById('porcentaje');
    if(barra) barra.style.width = porc + "%";
    if(porcentaje) porcentaje.innerText = porc + "%";
    
    document.getElementById('tareasPendientes').innerText = `${pendientes} pendientes`;
    document.getElementById('contadorCompletadas').innerText = completadas;
}

input.addEventListener('keypress', (e) => { if (e.key === 'Enter') crearTarea(); });

// ==========================================
// CONFIGURACIÓN INICIAL Y TEMA
// ==========================================

function toggleDarkMode() {
    const body = document.body;
    const icon = document.getElementById('darkIcon');
    body.classList.toggle('dark-mode');
    localStorage.setItem('tema', body.classList.contains('dark-mode') ? 'oscuro' : 'claro');
    if(icon) {
        icon.classList.toggle('fa-sun', body.classList.contains('dark-mode'));
        icon.classList.toggle('fa-moon', !body.classList.contains('dark-mode'));
    }
}

(function iniciarApp() {
    if (localStorage.getItem('tema') === 'oscuro') {
        document.body.classList.add('dark-mode');
        const icon = document.getElementById('darkIcon');
        if(icon) icon.classList.replace('fa-moon', 'fa-sun');
    }
    mostrarTareas();
})();