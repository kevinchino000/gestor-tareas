const input = document.getElementById('inputTarea');
const listaPendientes = document.getElementById('listaTareas');
const listaCompletadas = document.getElementById('listaCompletadas');
const fechaElemento = document.getElementById('fecha');

// Inicialización de fecha
const fechaActual = new Date();
fechaElemento.innerHTML = fechaActual.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

function mostrarTareas() {
    listaPendientes.innerHTML = ''; 
    listaCompletadas.innerHTML = ''; 
    
    const tareas = JSON.parse(localStorage.getItem('tareas') || "[]");

    // Filtrar las tareas
    const pendientes = tareas.filter(t => !t.completada);
    const completadas = tareas.filter(t => t.completada);

    // Mostrar mensaje si no hay nada
    if (tareas.length === 0) {
        listaPendientes.innerHTML = `<div class="text-center py-10 text-gray-300">
            <i class="fas fa-clipboard-list text-5xl mb-3"></i>
            <p>Todo limpio por hoy</p>
        </div>`;
        document.getElementById('footerApp').classList.add('hidden');
    } else {
        document.getElementById('footerApp').classList.remove('hidden');
    }

    // Dibujar Pendientes
    pendientes.forEach(tarea => {
        listaPendientes.appendChild(crearElementoTarea(tarea));
    });

    // Dibujar Completadas
    completadas.forEach(tarea => {
        listaCompletadas.appendChild(crearElementoTarea(tarea));
    });

    actualizarMetricas(tareas);
}

// Función para crear el HTML de cada tarea
function crearElementoTarea(tarea) {
    const li = document.createElement('li');
    const colores = { alta: 'border-l-4 border-l-red-500', media: 'border-l-4 border-l-yellow-500', baja: 'border-l-4 border-l-green-500' };
    const colorClase = colores[tarea.prioridad] || 'border-l-4 border-l-gray-300';

    li.className = `tarea-animada flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl group hover:shadow-md transition-all dark:bg-slate-800 ${colorClase}`;
    
    li.innerHTML = `
        <div class="flex items-center gap-4">
            <div class="relative flex items-center">
                <input type="checkbox" ${tarea.completada ? 'checked' : ''} 
                    onchange="toggleTarea(${tarea.id})" 
                    class="w-6 h-6 cursor-pointer appearance-none border-2 border-indigo-200 rounded-full checked:bg-indigo-600 checked:border-indigo-600 transition-all">
                <i class="fas fa-check absolute text-white text-[10px] left-1.5 pointer-events-none ${tarea.completada ? '' : 'hidden'}"></i>
            </div>
            <span class="font-medium transition-all ${tarea.completada ? 'line-through text-gray-400 font-normal' : 'text-gray-700'}">
                ${tarea.nombre}
            </span>
        </div>
        <button onclick="eliminarTarea(${tarea.id})" class="text-gray-300 hover:text-red-500 transition-colors">
            <i class="fas fa-trash-alt"></i>
        </button>
    `;
    return li;
}

function crearTarea() {
    const texto = input.value.trim();
    if (!texto) return; 

    const prioridad = document.getElementById('selectPrioridad').value;
    
    const nuevaTarea = { 
        id: Date.now(), 
        nombre: texto, 
        completada: false, 
        prioridad: prioridad 
    };

    const tareas = JSON.parse(localStorage.getItem('tareas') || "[]");
    tareas.unshift(nuevaTarea); 
    localStorage.setItem('tareas', JSON.stringify(tareas));
    
    input.value = ''; 
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

// Eventos
input.addEventListener('keypress', (e) => { if (e.key === 'Enter') crearTarea(); });

// Modo Oscuro
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

// Cargar tema e inicio
(function iniciarApp() {
    if (localStorage.getItem('tema') === 'oscuro') {
        document.body.classList.add('dark-mode');
        const icon = document.getElementById('darkIcon');
        if(icon) icon.classList.replace('fa-moon', 'fa-sun');
    }
    mostrarTareas();
})();