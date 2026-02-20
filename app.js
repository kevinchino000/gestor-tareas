const input = document.getElementById('inputTarea');
const listaPendientes = document.getElementById('listaTareas');
const listaCompletadas = document.getElementById('listaCompletadas');
const fechaElemento = document.getElementById('fecha');

// Inicialización de fecha
const fechaActual = new Date();
fechaElemento.innerHTML = fechaActual.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

// ==========================================
// NUEVO: SISTEMA DE NOTIFICACIONES
// ==========================================
// 1. Pedir permiso al usuario al entrar a la app
if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
}

function revisarNotificaciones() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    let tareas = JSON.parse(localStorage.getItem('tareas') || "[]");
    let huboCambios = false;
    
    const hoy = new Date();
    hoy.setHours(0,0,0,0);

    tareas.forEach(tarea => {
        // Solo avisar de tareas no completadas, que tienen fecha y que NO se han notificado antes
        if (!tarea.completada && tarea.fechaVencimiento && !tarea.notificada) {
            const fechaT = new Date(tarea.fechaVencimiento + 'T00:00:00');
            const diffTiempo = fechaT.getTime() - hoy.getTime();
            const diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));

            // Si la tarea vence HOY o MAÑANA
            if (diffDias === 0 || diffDias === 1) {
                const diaTexto = diffDias === 0 ? "HOY" : "MAÑANA";
                new Notification("¡Tarea próxima a vencer!", {
                    body: `Tu tarea "${tarea.nombre}" vence ${diaTexto}.`,
                    icon: "https://cdn-icons-png.flaticon.com/512/1828/1828614.png"
                });
                
                tarea.notificada = true; // Marcar para no enviarle spam al usuario
                huboCambios = true;
            }
        }
    });

    if (huboCambios) {
        localStorage.setItem('tareas', JSON.stringify(tareas));
    }
}

// Revisar notificaciones al iniciar y luego cada 10 minutos (600000 ms)
setTimeout(revisarNotificaciones, 2000);
setInterval(revisarNotificaciones, 600000); 

// ==========================================
// RESTO DE LA APLICACIÓN
// ==========================================

function mostrarTareas() {
    listaPendientes.innerHTML = ''; 
    listaCompletadas.innerHTML = ''; 
    
    const tareas = JSON.parse(localStorage.getItem('tareas') || "[]");

    const pendientes = tareas.filter(t => !t.completada);
    const completadas = tareas.filter(t => t.completada);

    if (tareas.length === 0) {
        listaPendientes.innerHTML = `<div class="text-center py-10 text-gray-300">
            <i class="fas fa-clipboard-list text-5xl mb-3"></i>
            <p>Todo limpio por hoy</p>
        </div>`;
        document.getElementById('footerApp').classList.add('hidden');
    } else {
        document.getElementById('footerApp').classList.remove('hidden');
    }

    pendientes.forEach(tarea => listaPendientes.appendChild(crearElementoTarea(tarea)));
    completadas.forEach(tarea => listaCompletadas.appendChild(crearElementoTarea(tarea)));

    actualizarMetricas(tareas);
}

function crearElementoTarea(tarea) {
    const li = document.createElement('li');
    const colores = { alta: 'border-l-4 border-l-red-500', media: 'border-l-4 border-l-yellow-500', baja: 'border-l-4 border-l-green-500' };
    const colorClase = colores[tarea.prioridad] || 'border-l-4 border-l-gray-300';

    // Lógica visual para la fecha de vencimiento
    let fechaHtml = '';
    if (tarea.fechaVencimiento) {
        const fechaT = new Date(tarea.fechaVencimiento + 'T00:00:00');
        const hoy = new Date();
        hoy.setHours(0,0,0,0);
        
        const diffTiempo = fechaT.getTime() - hoy.getTime();
        const diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));
        
        let colorFecha = 'text-gray-400';
        let textoExtra = '';

        if (!tarea.completada) {
            if (diffDias < 0) { colorFecha = 'text-red-500 font-bold'; textoExtra = ' (Vencida)'; }
            else if (diffDias === 0) { colorFecha = 'text-orange-500 font-bold'; textoExtra = ' (¡Vence Hoy!)'; }
            else if (diffDias === 1) { colorFecha = 'text-yellow-600 font-medium'; textoExtra = ' (Mañana)'; }
        }

        const formatoFecha = fechaT.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        fechaHtml = `<div class="text-[11px] mt-0.5 ${colorFecha} flex items-center gap-1">
                        <i class="far fa-calendar-alt"></i> ${formatoFecha} ${textoExtra}
                     </div>`;
    }

    li.className = `tarea-animada flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl group hover:shadow-md transition-all dark:bg-slate-800 ${colorClase}`;
    
    li.innerHTML = `
        <div class="flex items-center gap-4 w-full">
            <div class="relative flex items-center shrink-0">
                <input type="checkbox" ${tarea.completada ? 'checked' : ''} 
                    onchange="toggleTarea(${tarea.id})" 
                    class="w-6 h-6 cursor-pointer appearance-none border-2 border-indigo-200 rounded-full checked:bg-indigo-600 checked:border-indigo-600 transition-all">
                <i class="fas fa-check absolute text-white text-[10px] left-1.5 pointer-events-none ${tarea.completada ? '' : 'hidden'}"></i>
            </div>
            <div class="flex flex-col flex-1 overflow-hidden">
                <span class="font-medium truncate transition-all ${tarea.completada ? 'line-through text-gray-400 font-normal' : 'text-gray-700'}">
                    ${tarea.nombre}
                </span>
                ${fechaHtml}
            </div>
        </div>
        <button onclick="eliminarTarea(${tarea.id})" class="text-gray-300 hover:text-red-500 transition-colors shrink-0 ml-2">
            <i class="fas fa-trash-alt"></i>
        </button>
    `;
    return li;
}

function crearTarea() {
    const texto = input.value.trim();
    if (!texto) return; 

    const prioridad = document.getElementById('selectPrioridad').value;
    const fechaVencimiento = document.getElementById('inputFecha').value;
    
    const nuevaTarea = { 
        id: Date.now(), 
        nombre: texto, 
        completada: false, 
        prioridad: prioridad,
        fechaVencimiento: fechaVencimiento, // Guardamos la fecha
        notificada: false // Control de spam de notificaciones
    };

    const tareas = JSON.parse(localStorage.getItem('tareas') || "[]");
    tareas.unshift(nuevaTarea); 
    localStorage.setItem('tareas', JSON.stringify(tareas));
    
    input.value = ''; 
    document.getElementById('inputFecha').value = ''; // Limpiar fecha
    mostrarTareas();
    revisarNotificaciones(); // Revisar al instante si la nueva tarea vence pronto
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
    if(confirm("¿Estás seguro de que quieres borrar el historial de tareas completadas?")) {
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
    
    document.getElementById('barra').style.width = porc + "%";
    document.getElementById('porcentaje').innerText = porc + "%";
    document.getElementById('tareasPendientes').innerText = `${pendientes} pendientes`;
    document.getElementById('contadorCompletadas').innerText = completadas;
}

input.addEventListener('keypress', (e) => { if (e.key === 'Enter') crearTarea(); });

function toggleDarkMode() {
    const body = document.body;
    const icon = document.getElementById('darkIcon');
    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
        icon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('tema', 'oscuro');
    } else {
        icon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('tema', 'claro');
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