/* ==========================================================================
   HGW WELLNESS — LÓGICA DE APLICACIÓN
   Organización del archivo:
   1. Constantes y catálogo de objetivos
   2. Almacenamiento (localStorage)
   3. Datos demo (seed)
   4. Estado de aplicación
   5. Utilidades generales
   6. Notificaciones (toast)
   7. Modales genéricos
   8. Navegación / vistas
   9. Renderizado: dashboard
   10. Renderizado: clientes
   11. Renderizado: perfil de cliente
   12. Formulario modal de cliente (crear/editar)
   13. Formulario wizard de bienestar
   14. Motor de recomendaciones de productos
   15. Generador de plan semanal + PDF
   16. Seguimientos
   17. Productos HGW (CRUD)
   18. Estadísticas y gráficos
   19. Login / sesión
   20. Inicialización
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. CONSTANTES Y CATÁLOGO DE OBJETIVOS
   -------------------------------------------------------------------------- */
const OBJETIVOS = [
  { id: 'organizacion-alimentaria', nombre: 'Organización alimentaria', icon: 'utensils' },
  { id: 'control-peso', nombre: 'Control del peso', icon: 'scale' },
  { id: 'hidratacion', nombre: 'Hidratación', icon: 'droplets' },
  { id: 'actividad-fisica', nombre: 'Actividad física', icon: 'dumbbell' },
  { id: 'bienestar-general', nombre: 'Bienestar general', icon: 'heart-pulse' },
  { id: 'rutina-saludable', nombre: 'Rutina saludable', icon: 'sun' },
  { id: 'organizacion-habitos', nombre: 'Mejor organización de hábitos', icon: 'list-checks' },
];

const NOMBRE_OBJETIVO = (id) => (OBJETIVOS.find(o => o.id === id) || {}).nombre || 'Sin definir';

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/* --------------------------------------------------------------------------
   CONFIGURACIÓN DEL NEGOCIO SPA (NUEVO)
   Datos reales proporcionados por el emprendedor. SPA_INFO.whatsapp queda
   vacío a propósito: no se inventa ningún número. Cuando el emprendedor
   tenga uno real, basta con completarlo aquí para que el botón de
   contacto por WhatsApp se active automáticamente en la interfaz pública.
   -------------------------------------------------------------------------- */
const SPA_INFO = {
  nombre: 'SPA Loren',
  slogan: 'Que tu belleza no sea un gasto, sino una prioridad',
  horario: 'Lunes a viernes · 8:00 a. m. – 6:00 p. m.',
  correo: 'joyalorena58@gmail.com',
  whatsapp: '', // Pendiente: agregar el número real del negocio (solo dígitos, formato internacional).
};

/* Catálogo de servicios SPA Loren, tal como los describió el emprendedor.
   No se inventan duraciones, precios ni beneficios clínicos: esa
   información se confirma directamente al agendar la sesión. */
const SPA_SERVICIOS = [
  { id: 'masaje-reductor', nombre: 'Masaje reductor', categoria: 'Masajes' },
  { id: 'masaje-relajante', nombre: 'Masaje relajante', categoria: 'Masajes' },
  { id: 'drenaje-linfatico', nombre: 'Drenaje linfático', categoria: 'Masajes' },
  { id: 'ampolleta-quemadora', nombre: 'Ampolleta quemadora', categoria: 'Ampolletas' },
  { id: 'ampolleta-ansiedad', nombre: 'Ampolleta de control de ansiedad', categoria: 'Ampolletas' },
  { id: 'sueroterapia', nombre: 'Sueroterapia', categoria: 'Sueroterapia' },
  { id: 'suero-detox', nombre: 'Suero detox', categoria: 'Sueroterapia' },
];
const SPA_DESCRIPCION_GENERICA = 'Servicio ofrecido por SPA Loren. Duración y detalles se confirman directamente al agendar.';

const API_BASE_URL = 'https://hgw-wellness-api.marlonsherrera7002.workers.dev';

const LS_KEYS = {
  clientes: 'hgw_clientes',
  seguimientos: 'hgw_seguimientos',
  productos: 'hgw_productos',
  planes: 'hgw_planes',
  planesDeportivos: 'hgw_planes_deportivos',
  solicitudes: 'hgw_solicitudes',
  spaReservas: 'hgw_spa_reservas',
  seeded: 'hgw_seeded_v1',
};

/* --------------------------------------------------------------------------
   2. ALMACENAMIENTO (localStorage)
   -------------------------------------------------------------------------- */
const Storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error('Error leyendo almacenamiento', key, e);
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Error guardando almacenamiento', key, e);
      return false;
    }
  },
  remove(key) { localStorage.removeItem(key); },
};

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(isoDate, days) {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/* --------------------------------------------------------------------------
   3. DATOS DEMO (seed)
   -------------------------------------------------------------------------- */
function construirProductosDemo() {
  return [
    {
      id: uid('prod'), nombre: 'HGW Hidratación Plus', categoria: 'Hidratación',
      descripcion: 'Producto de ejemplo orientado a apoyar hábitos de hidratación diaria.',
      imagen: '', ingredientes: 'Información de ejemplo — completar con ficha oficial.',
      modoDeUso: 'Información de ejemplo — completar con ficha oficial.',
      advertencias: 'Consultar ficha técnica oficial antes de su uso.',
      objetivosCompatibles: ['hidratacion', 'bienestar-general'], activo: true, demo: true,
    },
    {
      id: uid('prod'), nombre: 'HGW Balance Nutricional', categoria: 'Nutrición',
      descripcion: 'Producto de ejemplo asociado a la organización alimentaria general.',
      imagen: '', ingredientes: 'Información de ejemplo — completar con ficha oficial.',
      modoDeUso: 'Información de ejemplo — completar con ficha oficial.',
      advertencias: 'Consultar ficha técnica oficial antes de su uso.',
      objetivosCompatibles: ['organizacion-alimentaria', 'control-peso'], activo: true, demo: true,
    },
    {
      id: uid('prod'), nombre: 'HGW Activa', categoria: 'Actividad física',
      descripcion: 'Producto de ejemplo pensado para acompañar rutinas de actividad física.',
      imagen: '', ingredientes: 'Información de ejemplo — completar con ficha oficial.',
      modoDeUso: 'Información de ejemplo — completar con ficha oficial.',
      advertencias: 'Consultar ficha técnica oficial antes de su uso.',
      objetivosCompatibles: ['actividad-fisica', 'rutina-saludable'], activo: true, demo: true,
    },
    {
      id: uid('prod'), nombre: 'HGW Rutina Diaria', categoria: 'Bienestar general',
      descripcion: 'Producto de ejemplo vinculado a la organización de hábitos diarios.',
      imagen: '', ingredientes: 'Información de ejemplo — completar con ficha oficial.',
      modoDeUso: 'Información de ejemplo — completar con ficha oficial.',
      advertencias: 'Consultar ficha técnica oficial antes de su uso.',
      objetivosCompatibles: ['organizacion-habitos', 'bienestar-general'], activo: true, demo: true,
    },
  ];
}

function construirClientesDemo() {
  const hoy = todayISO();
  return [
    {
      id: uid('cli'), nombre: 'Mariana Restrepo', telefono: '3001234567', correo: 'mariana.r@example.com',
      edad: 34, fechaRegistro: addDaysISO(hoy, -40), peso: 68, talla: 165,
      objetivo: 'control-peso', actividad: 'ligero', agua: 5,
      sexo: 'femenino', experiencia: 'principiante',
      preferencias: 'Comida casera, poco condimentada', restricciones: '', evitar: 'Frituras',
      habitos: 'Come fuera de casa con frecuencia, dificultad para dormir temprano.',
      observaciones: 'Prefiere seguimientos por la tarde.',
      proximoSeguimiento: addDaysISO(hoy, 2), demo: true,
      historialPeso: [
        { fecha: addDaysISO(hoy, -40), peso: 71 },
        { fecha: addDaysISO(hoy, -25), peso: 69.5 },
        { fecha: addDaysISO(hoy, -10), peso: 68.5 },
        { fecha: hoy, peso: 68 },
      ],
    },
    {
      id: uid('cli'), nombre: 'Julián Torres', telefono: '3109876543', correo: 'julian.torres@example.com',
      edad: 28, fechaRegistro: addDaysISO(hoy, -60), peso: 82, talla: 178,
      objetivo: 'actividad-fisica', actividad: 'moderado', agua: 7,
      sexo: 'masculino', experiencia: 'intermedio',
      preferencias: 'Alta en proteína', restricciones: '', evitar: '',
      habitos: 'Entrena tres veces por semana, buena rutina de sueño.',
      observaciones: '',
      proximoSeguimiento: addDaysISO(hoy, 6), demo: true,
      historialPeso: [
        { fecha: addDaysISO(hoy, -60), peso: 85 },
        { fecha: addDaysISO(hoy, -30), peso: 83.5 },
        { fecha: addDaysISO(hoy, -5), peso: 82 },
      ],
    },
    {
      id: uid('cli'), nombre: 'Camila Duarte', telefono: '3201122334', correo: 'camila.duarte@example.com',
      edad: 41, fechaRegistro: addDaysISO(hoy, -15), peso: 74, talla: 160,
      objetivo: 'hidratacion', actividad: 'sedentario', agua: 3,
      sexo: 'femenino', experiencia: 'ninguna',
      preferencias: '', restricciones: 'Intolerancia a la lactosa', evitar: 'Lácteos',
      habitos: 'Trabajo de oficina, olvida tomar agua durante el día.',
      observaciones: 'Interesada en recordatorios.',
      proximoSeguimiento: addDaysISO(hoy, -1), demo: true,
      historialPeso: [
        { fecha: addDaysISO(hoy, -15), peso: 74.8 },
        { fecha: addDaysISO(hoy, -2), peso: 74 },
      ],
    },
    {
      id: uid('cli'), nombre: 'Andrés Felipe Gómez', telefono: '3151234098', correo: 'af.gomez@example.com',
      edad: 50, fechaRegistro: addDaysISO(hoy, -90), peso: 90, talla: 172,
      objetivo: 'organizacion-habitos', actividad: 'ligero', agua: 4,
      sexo: 'masculino', experiencia: 'ninguna',
      preferencias: '', restricciones: '', evitar: 'Comida muy condimentada',
      habitos: 'Horarios de comida irregulares por trabajo.',
      observaciones: 'Sin seguimiento reciente.',
      proximoSeguimiento: '', demo: true,
      historialPeso: [
        { fecha: addDaysISO(hoy, -90), peso: 93 },
        { fecha: addDaysISO(hoy, -45), peso: 91 },
      ],
    },
  ];
}

function construirSeguimientosDemo(clientesDemo) {
  const hoy = todayISO();
  return [
    {
      id: uid('seg'), clienteId: clientesDemo[0].id, fecha: addDaysISO(hoy, -10),
      peso: 68.5, cumplimiento: 'alto', hidratacion: 5, actividad: 'ligero', bienestar: 'buena',
      productos: 'HGW Balance Nutricional', proximoSeguimiento: addDaysISO(hoy, 2),
      observaciones: 'Reporta mejor organización de comidas.', demo: true,
    },
    {
      id: uid('seg'), clienteId: clientesDemo[0].id, fecha: addDaysISO(hoy, -25),
      peso: 69.5, cumplimiento: 'medio', hidratacion: 4, actividad: 'sedentario', bienestar: 'regular',
      productos: '', proximoSeguimiento: addDaysISO(hoy, -10),
      observaciones: 'Semana con viajes de trabajo.', demo: true,
    },
    {
      id: uid('seg'), clienteId: clientesDemo[1].id, fecha: addDaysISO(hoy, -5),
      peso: 82, cumplimiento: 'alto', hidratacion: 7, actividad: 'activo', bienestar: 'excelente',
      productos: 'HGW Activa', proximoSeguimiento: addDaysISO(hoy, 6),
      observaciones: 'Buena adherencia a la rutina de entrenamiento.', demo: true,
    },
    {
      id: uid('seg'), clienteId: clientesDemo[2].id, fecha: addDaysISO(hoy, -2),
      peso: 74, cumplimiento: 'bajo', hidratacion: 3, actividad: 'sedentario', bienestar: 'regular',
      productos: 'HGW Hidratación Plus', proximoSeguimiento: addDaysISO(hoy, -1),
      observaciones: 'Le cuesta mantener el hábito de hidratación en horario laboral.', demo: true,
    },
  ];
}

function seedDemoData() {
  const yaSembrado = Storage.get(LS_KEYS.seeded, false);
  if (yaSembrado) return;

  const productosDemo = construirProductosDemo();
  Storage.set(LS_KEYS.productos, productosDemo);

  const clientesDemo = construirClientesDemo();
  Storage.set(LS_KEYS.clientes, clientesDemo);

  const seguimientosDemo = construirSeguimientosDemo(clientesDemo);
  Storage.set(LS_KEYS.seguimientos, seguimientosDemo);

  Storage.set(LS_KEYS.planes, []);
  Storage.set(LS_KEYS.seeded, true);
}

/* --------------------------------------------------------------------------
   CORRECCIÓN — "Reiniciar datos demo" (auditoría, prioridad 1)
   Antes: borraba TODAS las claves de localStorage sin distinguir datos
   reales de datos de ejemplo (afectaba también productos, clientes,
   seguimientos, solicitudes y reservas SPA reales).
   Ahora: elimina ÚNICAMENTE los registros marcados con demo === true
   (productos, clientes y seguimientos de ejemplo) y los reemplaza por su
   versión original. Cualquier registro creado por el emprendedor
   (demo !== true) permanece intacto. Solicitudes de asesoría, reservas
   SPA, planes semanales y planes deportivos NUNCA tuvieron datos de
   ejemplo, así que esta función no los toca en absoluto.
   -------------------------------------------------------------------------- */
function resetDemoData() {
  state.productos = state.productos.filter(p => p.demo !== true);
  state.clientes = state.clientes.filter(c => c.demo !== true);
  state.seguimientos = state.seguimientos.filter(s => s.demo !== true);

  const productosDemo = construirProductosDemo();
  const clientesDemo = construirClientesDemo();
  const seguimientosDemo = construirSeguimientosDemo(clientesDemo);

  state.productos = [...state.productos, ...productosDemo];
  state.clientes = [...state.clientes, ...clientesDemo];
  state.seguimientos = [...state.seguimientos, ...seguimientosDemo];

  persistProductos();
  persistClientes();
  persistSeguimientos();

  loadState();
  renderCurrentView();
  showToast('Datos de ejemplo restablecidos. Tus clientes, productos, seguimientos, solicitudes y reservas SPA reales no fueron modificados.', 'success');
}

/* --------------------------------------------------------------------------
   4. ESTADO DE APLICACIÓN
   -------------------------------------------------------------------------- */
const state = {
  clientes: [],
  seguimientos: [],
  productos: [],
  planes: [],
  planesDeportivos: [],
  solicitudes: [],
  spaReservas: [],
  currentView: 'dashboard',
  currentClienteId: null,
  currentPerfilTab: 'info',
  wizardStep: 1,
  wizardObjetivo: null,
  confirmCallback: null,
  charts: {},
};

function loadState() {
  state.clientes = Storage.get(LS_KEYS.clientes, []);
  state.seguimientos = Storage.get(LS_KEYS.seguimientos, []);
  state.productos = Storage.get(LS_KEYS.productos, []);
  state.planes = Storage.get(LS_KEYS.planes, []);
  state.planesDeportivos = Storage.get(LS_KEYS.planesDeportivos, []);
  state.solicitudes = Storage.get(LS_KEYS.solicitudes, []);
  state.spaReservas = Storage.get(LS_KEYS.spaReservas, []);
}

function persistClientes() { Storage.set(LS_KEYS.clientes, state.clientes); }
function persistSeguimientos() { Storage.set(LS_KEYS.seguimientos, state.seguimientos); }
function persistProductos() { Storage.set(LS_KEYS.productos, state.productos); }
function persistPlanes() { Storage.set(LS_KEYS.planes, state.planes); }
function persistPlanesDeportivos() { Storage.set(LS_KEYS.planesDeportivos, state.planesDeportivos); }
function persistSolicitudes() { Storage.set(LS_KEYS.solicitudes, state.solicitudes); }
function persistSpaReservas() { Storage.set(LS_KEYS.spaReservas, state.spaReservas); }

/* --------------------------------------------------------------------------
   5. UTILIDADES GENERALES
   -------------------------------------------------------------------------- */
function iniciales(nombre) {
  return nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function formatearFecha(iso) {
  if (!iso) return 'Sin definir';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function formatearFechaLarga(date) {
  return date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function estadoCliente(cliente) {
  if (!cliente.proximoSeguimiento) return 'inactivo';
  return cliente.proximoSeguimiento <= todayISO() ? 'pendiente' : 'activo';
}

function badgeEstado(estado) {
  const map = {
    activo: { clase: 'badge-success', texto: 'Activo' },
    pendiente: { clase: 'badge-warning', texto: 'Seguimiento pendiente' },
    inactivo: { clase: 'badge-muted', texto: 'Inactivo' },
  };
  const info = map[estado] || map.inactivo;
  return `<span class="badge ${info.clase}">${info.texto}</span>`;
}

function calcularIMC(peso, tallaCm) {
  if (!peso || !tallaCm) return null;
  const tallaM = tallaCm / 100;
  return +(peso / (tallaM * tallaM)).toFixed(1);
}

/* Interpretación por rangos reconocidos (clasificación de la OMS para
   personas adultas). El IMC es solo un indicador general: no diagnostica
   ni determina por sí solo una dieta médica. */
function interpretarIMC(imc) {
  if (imc === null || imc === undefined) return null;
  if (imc < 18.5) return { categoria: 'Bajo peso', clase: 'badge-warning' };
  if (imc < 25) return { categoria: 'Rango saludable', clase: 'badge-success' };
  if (imc < 30) return { categoria: 'Sobrepeso', clase: 'badge-warning' };
  return { categoria: 'Obesidad', clase: 'badge-danger' };
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

/* --------------------------------------------------------------------------
   6. NOTIFICACIONES (toast)
   -------------------------------------------------------------------------- */
function showToast(mensaje, tipo = 'info') {
  const stack = document.getElementById('toast-stack');
  const iconMap = { success: 'circle-check', error: 'circle-alert', info: 'info' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.innerHTML = `<span data-lucide="${iconMap[tipo] || 'info'}"></span><span>${escapeHTML(mensaje)}</span>`;
  stack.appendChild(toast);
  refreshIcons();
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 220);
  }, 3400);
}

/* --------------------------------------------------------------------------
   7. MODALES GENÉRICOS
   -------------------------------------------------------------------------- */
function openModal(id) {
  document.getElementById('modal-backdrop').classList.add('is-active');
  document.getElementById(id).classList.add('is-active');
}
function closeAllModals() {
  document.getElementById('modal-backdrop').classList.remove('is-active');
  document.querySelectorAll('.modal.is-active').forEach(m => m.classList.remove('is-active'));
  state.confirmCallback = null;
}

function askConfirm(texto, onConfirm) {
  document.getElementById('modal-confirm-text').textContent = texto;
  state.confirmCallback = onConfirm;
  openModal('modal-confirm');
}

document.addEventListener('click', (e) => {
  if (e.target.matches('[data-close-modal]') || e.target.closest('[data-close-modal]') || e.target.id === 'modal-backdrop') {
    closeAllModals();
  }
});

/* --------------------------------------------------------------------------
   8. NAVEGACIÓN / VISTAS
   -------------------------------------------------------------------------- */
const VIEW_TITLES = {
  dashboard: ['Panel principal', 'Vista general de tu actividad'],
  clientes: ['Clientes', 'Gestiona la información de tus clientes'],
  perfil: ['Perfil del cliente', 'Información completa y evolución'],
  formulario: ['Formulario de bienestar', 'Registra la orientación inicial de un cliente'],
  plan: ['Plan semanal', 'Genera y descarga la orientación semanal'],
  seguimientos: ['Seguimientos', 'Historial de seguimientos registrados'],
  productos: ['Productos HGW', 'Catálogo interno de productos y reglas de recomendación'],
  estadisticas: ['Estadísticas', 'Indicadores generales del negocio'],
  solicitudes: ['Solicitudes de asesoría', 'Códigos generados desde el acceso público'],
  deportivo: ['Plan deportivo', 'Orientación general de actividad física'],
  spa: ['Reservas SPA', 'Reservas generadas desde el acceso público'],
};

function goToView(viewName) {
  state.currentView = viewName;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('is-active'));
  document.getElementById(`view-${viewName}`).classList.add('is-active');
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.view === viewName);
  });
  const [titulo, sub] = VIEW_TITLES[viewName] || ['HGW Wellness', ''];
  document.getElementById('topbar-heading').textContent = titulo;
  document.getElementById('topbar-sub').textContent = sub;
  closeMobileSidebar();
  renderCurrentView();
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

function renderCurrentView() {
  switch (state.currentView) {
    case 'dashboard': renderDashboard(); break;
    case 'clientes': renderClientes(); break;
    case 'perfil': renderPerfil(); break;
    case 'formulario': renderWizard(); break;
    case 'plan': renderPlanSetup(); break;
    case 'seguimientos': renderSeguimientos(); break;
    case 'productos': renderProductos(); break;
    case 'estadisticas': renderEstadisticas(); break;
    case 'solicitudes': renderSolicitudes(); break;
    case 'deportivo': renderDeportivoSetup(); break;
    case 'spa': renderSpaReservas(); break;
  }
}

function openMobileSidebar() {
  document.getElementById('sidebar').classList.add('is-open');
  document.getElementById('mobile-overlay').classList.add('is-active');
}
function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('is-open');
  document.getElementById('mobile-overlay').classList.remove('is-active');
}

/* --------------------------------------------------------------------------
   9. RENDERIZADO: DASHBOARD
   -------------------------------------------------------------------------- */
function renderDashboard() {
  const nombreEmprendedor = 'Emprendedor HGW';
  const ahora = new Date();
  const hora = ahora.getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
  document.getElementById('greeting-text').textContent = saludo;
  document.getElementById('greeting-name').textContent = `${saludo}, ${nombreEmprendedor}`;
  document.getElementById('greeting-date').textContent = formatearFechaLarga(ahora);

  const activos = state.clientes.filter(c => estadoCliente(c) === 'activo').length;
  const pendientes = state.clientes.filter(c => estadoCliente(c) === 'pendiente').length;

  const stats = [
    { icon: 'users', valor: state.clientes.length, label: 'Clientes registrados' },
    { icon: 'circle-check', valor: activos, label: 'Clientes activos' },
    { icon: 'clock-alert', valor: pendientes, label: 'Seguimientos pendientes' },
    { icon: 'calendar-days', valor: state.planes.length, label: 'Planes generados' },
  ];
  document.getElementById('stats-grid').innerHTML = stats.map(statCardHTML).join('');

  const proximos = [...state.clientes]
    .filter(c => c.proximoSeguimiento)
    .sort((a, b) => a.proximoSeguimiento.localeCompare(b.proximoSeguimiento))
    .slice(0, 6);

  const tbody = document.getElementById('tabla-proximos-body');
  const emptyEl = document.getElementById('proximos-empty');
  if (proximos.length === 0) {
    tbody.innerHTML = '';
    emptyEl.classList.remove('hidden');
  } else {
    emptyEl.classList.add('hidden');
    tbody.innerHTML = proximos.map(c => {
      const ultimaVisita = ultimoSeguimientoDe(c.id);
      return `<tr class="row-clickable" data-cliente-id="${c.id}">
        <td class="cell-name">${escapeHTML(c.nombre)}</td>
        <td>${NOMBRE_OBJETIVO(c.objetivo)}</td>
        <td>${ultimaVisita ? formatearFecha(ultimaVisita.fecha) : 'Sin registros'}</td>
        <td>${formatearFecha(c.proximoSeguimiento)}</td>
        <td>${badgeEstado(estadoCliente(c))}</td>
      </tr>`;
    }).join('');
    tbody.querySelectorAll('tr[data-cliente-id]').forEach(tr => {
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', () => abrirPerfil(tr.dataset.clienteId));
    });
  }
  refreshIcons();
}

function statCardHTML(s) {
  return `<div class="stat-card">
    <div class="stat-card-top">
      <span class="stat-icon"><span data-lucide="${s.icon}"></span></span>
    </div>
    <span class="stat-value">${s.valor}</span>
    <span class="stat-label">${s.label}</span>
  </div>`;
}

function ultimoSeguimientoDe(clienteId) {
  const lista = state.seguimientos.filter(s => s.clienteId === clienteId).sort((a, b) => b.fecha.localeCompare(a.fecha));
  return lista[0] || null;
}

/* --------------------------------------------------------------------------
   10. RENDERIZADO: CLIENTES
   -------------------------------------------------------------------------- */
function poblarFiltroObjetivos() {
  const select = document.getElementById('filtro-objetivo');
  select.innerHTML = '<option value="">Todos los objetivos</option>' +
    OBJETIVOS.map(o => `<option value="${o.id}">${o.nombre}</option>`).join('');
}

function renderClientes() {
  const busqueda = (document.getElementById('buscar-cliente').value || '').toLowerCase();
  const filtroObjetivo = document.getElementById('filtro-objetivo').value;
  const filtroEstado = document.getElementById('filtro-estado').value;

  const filtrados = state.clientes.filter(c => {
    const coincideBusqueda = !busqueda ||
      c.nombre.toLowerCase().includes(busqueda) ||
      (c.correo || '').toLowerCase().includes(busqueda) ||
      (c.telefono || '').toLowerCase().includes(busqueda);
    const coincideObjetivo = !filtroObjetivo || c.objetivo === filtroObjetivo;
    const coincideEstado = !filtroEstado || estadoCliente(c) === filtroEstado;
    return coincideBusqueda && coincideObjetivo && coincideEstado;
  });

  const grid = document.getElementById('clients-grid');
  const empty = document.getElementById('clientes-empty');

  if (filtrados.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
    grid.innerHTML = filtrados.map(clientCardHTML).join('');
    grid.querySelectorAll('.client-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-card-action]')) return;
        abrirPerfil(card.dataset.id);
      });
    });
    grid.querySelectorAll('[data-card-action="editar"]').forEach(btn => {
      btn.addEventListener('click', () => abrirModalCliente(btn.dataset.id));
    });
    grid.querySelectorAll('[data-card-action="eliminar"]').forEach(btn => {
      btn.addEventListener('click', () => confirmarEliminarCliente(btn.dataset.id));
    });
  }
  refreshIcons();
}

function clientCardHTML(c) {
  const est = estadoCliente(c);
  return `<article class="client-card" data-id="${c.id}">
    <div class="client-card-top">
      <div class="client-avatar">${iniciales(c.nombre)}</div>
      <div>
        <div class="client-card-name">${escapeHTML(c.nombre)}</div>
        <div class="client-card-meta">${c.telefono || 'Sin teléfono'}</div>
      </div>
    </div>
    <div class="client-card-tags">
      <span class="badge badge-muted">${NOMBRE_OBJETIVO(c.objetivo)}</span>
      ${badgeEstado(est)}
    </div>
    <div class="client-card-foot">
      <span class="client-card-meta">Próximo: ${formatearFecha(c.proximoSeguimiento)}</span>
      <div class="client-card-actions">
        <button class="icon-btn" data-card-action="editar" data-id="${c.id}" title="Editar" aria-label="Editar cliente"><span data-lucide="pencil"></span></button>
        <button class="icon-btn" data-card-action="eliminar" data-id="${c.id}" title="Eliminar" aria-label="Eliminar cliente"><span data-lucide="trash-2"></span></button>
      </div>
    </div>
  </article>`;
}

function confirmarEliminarCliente(id) {
  const cliente = state.clientes.find(c => c.id === id);
  if (!cliente) return;
  askConfirm(`¿Eliminar a ${cliente.nombre}? Se eliminará también su historial de seguimientos.`, () => {
    state.clientes = state.clientes.filter(c => c.id !== id);
    state.seguimientos = state.seguimientos.filter(s => s.clienteId !== id);
    persistClientes();
    persistSeguimientos();
    closeAllModals();
    showToast('Cliente eliminado correctamente.', 'success');
    if (state.currentView === 'perfil' && state.currentClienteId === id) {
      goToView('clientes');
    } else {
      renderCurrentView();
    }
  });
}

/* --------------------------------------------------------------------------
   11. RENDERIZADO: PERFIL DE CLIENTE
   -------------------------------------------------------------------------- */
function abrirPerfil(clienteId) {
  state.currentClienteId = clienteId;
  state.currentPerfilTab = 'info';
  goToView('perfil');
}

function renderPerfil() {
  const cliente = state.clientes.find(c => c.id === state.currentClienteId);
  if (!cliente) {
    goToView('clientes');
    return;
  }

  document.getElementById('perfil-head').innerHTML = `
    <div class="profile-avatar">${iniciales(cliente.nombre)}</div>
    <div class="profile-head-info">
      <h2>${escapeHTML(cliente.nombre)}</h2>
      <div class="profile-head-meta">
        <span><span data-lucide="phone" style="width:14px;height:14px;vertical-align:-2px"></span> ${cliente.telefono || 'Sin teléfono'}</span>
        <span><span data-lucide="mail" style="width:14px;height:14px;vertical-align:-2px"></span> ${cliente.correo || 'Sin correo'}</span>
        <span>${badgeEstado(estadoCliente(cliente))}</span>
      </div>
    </div>
    <div class="profile-head-actions">
      <button class="btn btn-secondary btn-sm" id="perfil-btn-editar"><span data-lucide="pencil"></span> Editar</button>
      <button class="btn btn-primary btn-sm" id="perfil-btn-plan"><span data-lucide="calendar-days"></span> Generar plan</button>
    </div>`;

  document.getElementById('perfil-btn-editar').addEventListener('click', () => abrirModalCliente(cliente.id));
  document.getElementById('perfil-btn-plan').addEventListener('click', () => {
    state.currentView = 'plan';
    goToView('plan');
    document.getElementById('plan-cliente').value = cliente.id;
    cargarPlanDelClienteSeleccionado();
  });

  renderPerfilTabInfo(cliente);
  renderPerfilTabEvolucion(cliente);
  renderPerfilTabProductos(cliente);
  renderPerfilTabHistorial(cliente);
  activarTab(state.currentPerfilTab);
  refreshIcons();
}

function renderPerfilTabInfo(cliente) {
  const imc = calcularIMC(cliente.peso, cliente.talla);
  const imcInfo = interpretarIMC(imc);
  const items = [
    ['Edad', cliente.edad ? `${cliente.edad} años` : 'Sin definir'],
    ['Sexo', cliente.sexo ? capitalizar(cliente.sexo) : 'Sin definir'],
    ['Fecha de registro', formatearFecha(cliente.fechaRegistro)],
    ['Peso actual', cliente.peso ? `${cliente.peso} kg` : 'Sin definir'],
    ['Talla', cliente.talla ? `${cliente.talla} cm` : 'Sin definir'],
    ['Índice registrado (IMC)', imc ? `${imc} — ${imcInfo.categoria}` : 'Sin definir'],
    ['Objetivo de bienestar', NOMBRE_OBJETIVO(cliente.objetivo), true],
    ['Nivel de actividad', capitalizar(cliente.actividad)],
    ['Experiencia deportiva', capitalizar(cliente.experiencia)],
    ['Consumo de agua', cliente.agua ? `${cliente.agua} vasos/día` : 'Sin definir'],
    ['Próximo seguimiento', formatearFecha(cliente.proximoSeguimiento)],
  ];
  document.getElementById('tab-info').innerHTML = `
    <div class="panel">
      <div class="panel-head"><h3>Información del cliente</h3></div>
      <div class="info-grid">
        ${items.map(([label, valor, esTexto]) => `
          <div class="info-item">
            <div class="info-item-label">${label}</div>
            <div class="info-item-value ${esTexto ? 'text' : ''}">${valor}</div>
          </div>`).join('')}
      </div>
      ${imc ? `<p class="disclaimer-note" style="margin-top:16px"><span data-lucide="info"></span> El IMC es solo un indicador general de referencia; no diagnostica una enfermedad ni determina por sí solo un plan médico o nutricional.</p>` : ''}
      ${cliente.habitos ? `<div class="disclaimer-note" style="margin-top:12px;background:var(--sage-deep)"><span data-lucide="notebook-text"></span><span><strong>Hábitos generales:</strong> ${escapeHTML(cliente.habitos)}</span></div>` : ''}
      ${cliente.preferencias ? `<div class="disclaimer-note" style="margin-top:12px;background:var(--sage-deep)"><span data-lucide="salad"></span><span><strong>Preferencias alimentarias:</strong> ${escapeHTML(cliente.preferencias)}</span></div>` : ''}
      ${cliente.restricciones ? `<div class="disclaimer-note" style="margin-top:12px;background:var(--sage-deep)"><span data-lucide="shield-alert"></span><span><strong>Restricciones alimentarias:</strong> ${escapeHTML(cliente.restricciones)}</span></div>` : ''}
      ${cliente.evitar ? `<div class="disclaimer-note" style="margin-top:12px;background:var(--sage-deep)"><span data-lucide="circle-slash"></span><span><strong>Alimentos a evitar:</strong> ${escapeHTML(cliente.evitar)}</span></div>` : ''}
      ${cliente.observaciones ? `<div class="disclaimer-note" style="margin-top:12px;background:var(--sage-deep)"><span data-lucide="message-square"></span><span><strong>Observaciones:</strong> ${escapeHTML(cliente.observaciones)}</span></div>` : ''}
    </div>`;
  refreshIcons();
}

function capitalizar(str) {
  if (!str) return 'Sin definir';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function renderPerfilTabEvolucion(cliente) {
  const canvas = document.getElementById('chart-evolucion');
  const historial = (cliente.historialPeso || []).slice().sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (state.charts.evolucion) state.charts.evolucion.destroy();

  if (historial.length === 0) {
    state.charts.evolucion = null;
    return;
  }
  state.charts.evolucion = new Chart(canvas, {
    type: 'line',
    data: {
      labels: historial.map(h => formatearFecha(h.fecha)),
      datasets: [{
        label: 'Peso registrado (kg)',
        data: historial.map(h => h.peso),
        borderColor: '#4C7A64',
        backgroundColor: 'rgba(76,122,100,0.12)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#D6A24C',
        pointRadius: 4,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { grace: '10%' } },
    },
  });
}

function renderPerfilTabProductos(cliente) {
  const productos = productosRecomendados(cliente.objetivo);
  document.getElementById('perfil-productos').innerHTML = productos.length
    ? productos.map(productMiniCardHTML).join('')
    : `<p style="color:var(--slate);font-size:14px">No hay productos activos asociados a este objetivo todavía. Configúralos en la sección "Productos HGW".</p>`;
  refreshIcons();
}

function renderPerfilTabHistorial(cliente) {
  const lista = state.seguimientos
    .filter(s => s.clienteId === cliente.id)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const cont = document.getElementById('perfil-timeline');
  const empty = document.getElementById('timeline-empty');
  if (lista.length === 0) {
    cont.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  cont.innerHTML = lista.map(s => `
    <div class="timeline-item">
      <span class="timeline-dot"></span>
      <span class="timeline-date">${formatearFecha(s.fecha)}</span>
      <div class="timeline-content">
        <strong>Peso: ${s.peso ? s.peso + ' kg' : 'No registrado'}</strong>
        <div class="timeline-tags">
          <span class="badge badge-muted">Cumplimiento: ${capitalizar(s.cumplimiento)}</span>
          <span class="badge badge-muted">Bienestar: ${capitalizar(s.bienestar)}</span>
          <span class="badge badge-muted">Hidratación: ${s.hidratacion ?? '—'} vasos/día</span>
          <span class="badge badge-muted">Actividad: ${capitalizar(s.actividad)}</span>
        </div>
        ${s.productos ? `<div class="timeline-note"><strong>Productos:</strong> ${escapeHTML(s.productos)}</div>` : ''}
        ${s.observaciones ? `<div class="timeline-note">${escapeHTML(s.observaciones)}</div>` : ''}
      </div>
    </div>`).join('');
}

function activarTab(tabName) {
  state.currentPerfilTab = tabName;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('is-active', b.dataset.tab === tabName));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('is-active'));
  document.getElementById(`tab-${tabName}`).classList.add('is-active');
}

document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('.tab-btn');
  if (tabBtn) activarTab(tabBtn.dataset.tab);
});

/* --------------------------------------------------------------------------
   12. FORMULARIO MODAL DE CLIENTE (crear/editar)
   -------------------------------------------------------------------------- */
function poblarSelectObjetivos(selectEl) {
  selectEl.innerHTML = OBJETIVOS.map(o => `<option value="${o.id}">${o.nombre}</option>`).join('');
}

function abrirModalCliente(clienteId = null) {
  poblarSelectObjetivos(document.getElementById('c-objetivo'));
  const form = document.getElementById('form-cliente');
  form.reset();
  document.getElementById('cliente-id').value = '';

  if (clienteId) {
    const c = state.clientes.find(x => x.id === clienteId);
    document.getElementById('modal-cliente-title').textContent = 'Editar cliente';
    document.getElementById('cliente-id').value = c.id;
    document.getElementById('c-nombre').value = c.nombre || '';
    document.getElementById('c-telefono').value = c.telefono || '';
    document.getElementById('c-correo').value = c.correo || '';
    document.getElementById('c-edad').value = c.edad || '';
    document.getElementById('c-peso').value = c.peso || '';
    document.getElementById('c-talla').value = c.talla || '';
    document.getElementById('c-objetivo').value = c.objetivo || '';
    document.getElementById('c-actividad').value = c.actividad || 'sedentario';
    document.getElementById('c-agua').value = c.agua || '';
    document.getElementById('c-seguimiento').value = c.proximoSeguimiento || '';
    document.getElementById('c-habitos').value = c.habitos || '';
    document.getElementById('c-observaciones').value = c.observaciones || '';
    document.getElementById('c-sexo').value = c.sexo || '';
    document.getElementById('c-experiencia').value = c.experiencia || 'ninguna';
    document.getElementById('c-preferencias').value = c.preferencias || '';
    document.getElementById('c-restricciones').value = c.restricciones || '';
    document.getElementById('c-evitar').value = c.evitar || '';
  } else {
    document.getElementById('modal-cliente-title').textContent = 'Nuevo cliente';
  }
  clearFieldErrors(form);
  openModal('modal-cliente');
}

function clearFieldErrors(form) {
  form.querySelectorAll('.field-error').forEach(f => f.classList.remove('field-error'));
  form.querySelectorAll('.field-error-msg').forEach(m => m.remove());
}

function marcarError(inputEl, mensaje) {
  const field = inputEl.closest('.field');
  field.classList.add('field-error');
  const msg = document.createElement('span');
  msg.className = 'field-error-msg';
  msg.textContent = mensaje;
  field.appendChild(msg);
}

function validarClienteForm() {
  const form = document.getElementById('form-cliente');
  clearFieldErrors(form);
  let valido = true;
  const requeridos = [
    ['c-nombre', 'El nombre es obligatorio.'],
    ['c-telefono', 'El teléfono es obligatorio.'],
    ['c-peso', 'El peso es obligatorio.'],
    ['c-talla', 'La talla es obligatoria.'],
    ['c-objetivo', 'Selecciona un objetivo.'],
  ];
  requeridos.forEach(([id, msg]) => {
    const el = document.getElementById(id);
    if (!el.value || !el.value.trim()) {
      marcarError(el, msg);
      valido = false;
    }
  });
  const correo = document.getElementById('c-correo');
  if (correo.value && !/^\S+@\S+\.\S+$/.test(correo.value)) {
    marcarError(correo, 'Correo electrónico no válido.');
    valido = false;
  }
  return valido;
}

document.getElementById('btn-guardar-cliente').addEventListener('click', () => {
  if (!validarClienteForm()) {
    showToast('Revisa los campos marcados en el formulario.', 'error');
    return;
  }
  const id = document.getElementById('cliente-id').value;
  const peso = parseFloat(document.getElementById('c-peso').value);
  const datos = {
    nombre: document.getElementById('c-nombre').value.trim(),
    telefono: document.getElementById('c-telefono').value.trim(),
    correo: document.getElementById('c-correo').value.trim(),
    edad: parseInt(document.getElementById('c-edad').value) || null,
    peso,
    talla: parseFloat(document.getElementById('c-talla').value),
    objetivo: document.getElementById('c-objetivo').value,
    actividad: document.getElementById('c-actividad').value,
    agua: parseInt(document.getElementById('c-agua').value) || null,
    proximoSeguimiento: document.getElementById('c-seguimiento').value,
    habitos: document.getElementById('c-habitos').value.trim(),
    observaciones: document.getElementById('c-observaciones').value.trim(),
    sexo: document.getElementById('c-sexo').value,
    experiencia: document.getElementById('c-experiencia').value,
    preferencias: document.getElementById('c-preferencias').value.trim(),
    restricciones: document.getElementById('c-restricciones').value.trim(),
    evitar: document.getElementById('c-evitar').value.trim(),
  };

  if (id) {
    const cliente = state.clientes.find(c => c.id === id);
    Object.assign(cliente, datos);
    if (!cliente.historialPeso) cliente.historialPeso = [];
    const ultimo = cliente.historialPeso[cliente.historialPeso.length - 1];
    if (!ultimo || ultimo.peso !== peso) {
      cliente.historialPeso.push({ fecha: todayISO(), peso });
    }
    showToast('Cliente actualizado correctamente.', 'success');
  } else {
    const nuevo = {
      id: uid('cli'),
      fechaRegistro: todayISO(),
      historialPeso: [{ fecha: todayISO(), peso }],
      demo: false,
      ...datos,
    };
    state.clientes.push(nuevo);
    showToast('Cliente registrado correctamente.', 'success');
  }
  persistClientes();
  closeAllModals();
  renderCurrentView();
});

/* --------------------------------------------------------------------------
   13. FORMULARIO WIZARD DE BIENESTAR
   -------------------------------------------------------------------------- */
const WIZARD_TOTAL_PASOS = 6;
const WIZARD_LABELS = ['Básica', 'Corporal', 'Hábitos', 'Objetivo', 'Preferencias', 'Resumen'];

function renderWizard() {
  state.wizardStep = 1;
  state.wizardObjetivo = null;
  document.getElementById('wizard-form').reset();
  renderObjetivoGrid();
  actualizarWizardUI();
}

function renderObjetivoGrid() {
  const cont = document.getElementById('w-objetivo-grid');
  cont.innerHTML = OBJETIVOS.map(o => `
    <button type="button" class="objetivo-card" data-objetivo="${o.id}">
      <span data-lucide="${o.icon}"></span>
      <span class="objetivo-card-title">${o.nombre}</span>
    </button>`).join('');
  cont.querySelectorAll('.objetivo-card').forEach(card => {
    card.addEventListener('click', () => {
      cont.querySelectorAll('.objetivo-card').forEach(c => c.classList.remove('is-selected'));
      card.classList.add('is-selected');
      state.wizardObjetivo = card.dataset.objetivo;
      document.getElementById('w-objetivo').value = card.dataset.objetivo;
    });
  });
  refreshIcons();
}

document.getElementById('wizard-steps-labels').innerHTML =
  WIZARD_LABELS.map((l, i) => `<span data-step-label="${i + 1}">${i + 1}. ${l}</span>`).join('');

function actualizarWizardUI() {
  document.querySelectorAll('.wizard-step').forEach(s => {
    s.classList.toggle('is-active', parseInt(s.dataset.step) === state.wizardStep);
  });
  document.querySelectorAll('[data-step-label]').forEach(l => {
    l.classList.toggle('is-active', parseInt(l.dataset.stepLabel) === state.wizardStep);
  });
  const pct = (state.wizardStep / WIZARD_TOTAL_PASOS) * 100;
  document.getElementById('wizard-progress-bar').style.width = `${pct}%`;

  document.getElementById('wizard-back').classList.toggle('hidden', state.wizardStep === 1);
  document.getElementById('wizard-next').classList.toggle('hidden', state.wizardStep === WIZARD_TOTAL_PASOS);
  document.getElementById('wizard-finish').classList.toggle('hidden', state.wizardStep !== WIZARD_TOTAL_PASOS);

  if (state.wizardStep === WIZARD_TOTAL_PASOS) renderWizardResumen();
}

function renderWizardResumen() {
  const val = (id) => document.getElementById(id).value;
  const imc = calcularIMC(parseFloat(val('w-peso')), parseFloat(val('w-talla')));
  const imcInfo = interpretarIMC(imc);
  const items = [
    ['Nombre', val('w-nombre') || '—'],
    ['Teléfono', val('w-telefono') || '—'],
    ['Peso', val('w-peso') ? `${val('w-peso')} kg` : '—'],
    ['Talla', val('w-talla') ? `${val('w-talla')} cm` : '—'],
    ['IMC estimado', imc ? `${imc} — ${imcInfo.categoria}` : 'Faltan peso o talla'],
    ['Sexo', val('w-sexo') ? capitalizar(val('w-sexo')) : 'Sin indicar'],
    ['Actividad', capitalizar(val('w-actividad'))],
    ['Experiencia deportiva', capitalizar(val('w-experiencia'))],
    ['Agua', val('w-agua') ? `${val('w-agua')} vasos/día` : '—'],
    ['Objetivo', state.wizardObjetivo ? NOMBRE_OBJETIVO(state.wizardObjetivo) : 'Sin seleccionar'],
    ['Preferencias alimentarias', val('w-preferencias') || 'Sin indicar'],
    ['Restricciones alimentarias', val('w-restricciones') || 'Sin indicar'],
    ['Próximo seguimiento', val('w-seguimiento') ? formatearFecha(val('w-seguimiento')) : '—'],
  ];
  document.getElementById('wizard-summary').innerHTML = items.map(([k, v]) =>
    `<div class="summary-item"><strong>${k}</strong>${escapeHTML(String(v))}</div>`).join('');
}

function validarPasoWizard(paso) {
  const reqPorPaso = {
    1: ['w-nombre', 'w-telefono'],
    2: ['w-peso', 'w-talla'],
    3: [], 5: [],
  };
  let valido = true;
  (reqPorPaso[paso] || []).forEach(id => {
    const el = document.getElementById(id);
    el.closest('.field').classList.remove('field-error');
    if (!el.value || !el.value.trim()) {
      el.closest('.field').classList.add('field-error');
      valido = false;
    }
  });
  if (paso === 4 && !state.wizardObjetivo) valido = false;
  if (!valido) showToast('Completa los campos obligatorios para continuar.', 'error');
  return valido;
}

document.getElementById('wizard-next').addEventListener('click', () => {
  if (!validarPasoWizard(state.wizardStep)) return;
  state.wizardStep = Math.min(state.wizardStep + 1, WIZARD_TOTAL_PASOS);
  actualizarWizardUI();
});
document.getElementById('wizard-back').addEventListener('click', () => {
  state.wizardStep = Math.max(state.wizardStep - 1, 1);
  actualizarWizardUI();
});
document.getElementById('wizard-cancel').addEventListener('click', () => goToView('dashboard'));

document.getElementById('wizard-finish').addEventListener('click', () => {
  if (!validarPasoWizard(4)) { showToast('Selecciona un objetivo antes de finalizar.', 'error'); return; }
  const peso = parseFloat(document.getElementById('w-peso').value);
  const nuevoCliente = {
    id: uid('cli'),
    demo: false,
    nombre: document.getElementById('w-nombre').value.trim(),
    telefono: document.getElementById('w-telefono').value.trim(),
    correo: document.getElementById('w-correo').value.trim(),
    edad: parseInt(document.getElementById('w-edad').value) || null,
    fechaRegistro: todayISO(),
    peso,
    talla: parseFloat(document.getElementById('w-talla').value),
    actividad: document.getElementById('w-actividad').value,
    agua: parseInt(document.getElementById('w-agua').value) || null,
    habitos: document.getElementById('w-habitos').value.trim(),
    objetivo: state.wizardObjetivo,
    observaciones: document.getElementById('w-observaciones').value.trim(),
    proximoSeguimiento: document.getElementById('w-seguimiento').value,
    sexo: document.getElementById('w-sexo').value,
    experiencia: document.getElementById('w-experiencia').value,
    preferencias: document.getElementById('w-preferencias').value.trim(),
    restricciones: document.getElementById('w-restricciones').value.trim(),
    evitar: document.getElementById('w-evitar').value.trim(),
    historialPeso: [{ fecha: todayISO(), peso }],
  };
  state.clientes.push(nuevoCliente);
  persistClientes();
  showToast('Orientación de bienestar registrada. Cliente creado.', 'success');
  abrirPerfil(nuevoCliente.id);
});

/* --------------------------------------------------------------------------
   14. MOTOR DE RECOMENDACIONES DE PRODUCTOS
   Regla: un producto se sugiere si está activo y su lista de
   objetivosCompatibles incluye el objetivo del cliente.
   No se generan afirmaciones médicas de ningún tipo.
   -------------------------------------------------------------------------- */
function productosRecomendados(objetivoId) {
  return state.productos.filter(p => p.activo && (p.objetivosCompatibles || []).includes(objetivoId));
}

function productMiniCardHTML(p) {
  return `<div class="product-card">
    <div class="product-card-img">${p.imagen ? `<img src="${p.imagen}" alt="${escapeHTML(p.nombre)}">` : '<span data-lucide="package"></span>'}</div>
    <div class="product-card-body">
      <span class="product-card-cat">${escapeHTML(p.categoria || 'General')}</span>
      <span class="product-card-name">${escapeHTML(p.nombre)}</span>
      <p class="product-card-desc">${escapeHTML(p.descripcion || '')}</p>
    </div>
  </div>`;
}

/* --------------------------------------------------------------------------
   15. GENERADOR DE PLAN SEMANAL + PDF
   -------------------------------------------------------------------------- */
const BANCO_HABITOS = {
  'organizacion-alimentaria': {
    desayuno: ['Porción de fruta + proteína + hidratación', 'Desayuno equilibrado con cereal integral y fruta', 'Huevos + arepa integral + jugo natural sin azúcar añadida'],
    almuerzo: ['Plato con proteína, vegetales y porción de carbohidrato', 'Ensalada completa con proteína a la plancha', 'Sopa + seco balanceado con vegetales'],
    cena: ['Cena ligera con vegetales y proteína', 'Sopa de vegetales con porción moderada de proteína', 'Ensalada tibia con proteína magra'],
    recordatorio: ['Organiza tus horarios de comida con anticipación.', 'Evita saltarte comidas principales.', 'Prepara tus alimentos con tiempo para evitar improvisar.'],
  },
  'control-peso': {
    desayuno: ['Desayuno moderado en porciones con proteína', 'Fruta + proteína + infusión sin azúcar', 'Avena con fruta y canela'],
    almuerzo: ['Plato moderado en porciones con vegetales abundantes', 'Proteína magra + ensalada + porción controlada de carbohidrato', 'Vegetales al vapor + proteína a la plancha'],
    cena: ['Cena liviana, evitando frituras', 'Ensalada con proteína magra', 'Sopa de vegetales'],
    recordatorio: ['Registra tu peso semanalmente a la misma hora.', 'Mantén porciones moderadas y horarios regulares.', 'Evita comer frente a pantallas.'],
  },
  'hidratacion': {
    desayuno: ['Desayuno habitual + vaso de agua al despertar', 'Fruta jugosa + infusión + agua', 'Desayuno habitual con recordatorio de hidratación'],
    almuerzo: ['Almuerzo habitual + vaso de agua antes de comer', 'Incluir sopa o caldo como fuente adicional de líquidos', 'Almuerzo habitual + agua con limón'],
    cena: ['Cena habitual + vaso de agua', 'Infusión sin azúcar después de la cena', 'Cena habitual + agua'],
    recordatorio: ['Lleva una botella de agua visible durante el día.', 'Configura recordatorios cada 2 horas para tomar agua.', 'Aumenta gradualmente el consumo diario de agua.'],
  },
  'actividad-fisica': {
    desayuno: ['Desayuno energético antes de actividad física', 'Fruta + proteína antes de entrenar', 'Desayuno habitual con buena hidratación'],
    almuerzo: ['Almuerzo balanceado post actividad', 'Proteína + carbohidrato + vegetales', 'Plato completo para recuperación muscular'],
    cena: ['Cena ligera post actividad física', 'Proteína + vegetales', 'Cena moderada con buena hidratación'],
    recordatorio: ['Realiza al menos 20-30 minutos de movimiento hoy.', 'Estira antes y después de la actividad física.', 'Descansa lo suficiente entre sesiones de actividad.'],
  },
  'bienestar-general': {
    desayuno: ['Desayuno variado y equilibrado', 'Fruta + proteína + hidratación', 'Desayuno habitual con buena compañía y calma'],
    almuerzo: ['Almuerzo equilibrado sin prisas', 'Plato variado con colores diferentes de vegetales', 'Almuerzo tranquilo, masticando despacio'],
    cena: ['Cena ligera, temprano en la noche', 'Cena tranquila sin distracciones', 'Cena moderada favoreciendo el descanso'],
    recordatorio: ['Dedica 10 minutos del día a relajarte.', 'Prioriza tu descanso nocturno.', 'Reconoce un logro pequeño del día de hoy.'],
  },
  'rutina-saludable': {
    desayuno: ['Desayuno a una hora fija', 'Rutina de desayuno constante', 'Desayuno equilibrado a horario regular'],
    almuerzo: ['Almuerzo a horario regular', 'Pausa activa antes del almuerzo', 'Almuerzo balanceado sin distracciones'],
    cena: ['Cena a horario regular, no muy tarde', 'Rutina de cena ligera', 'Cena constante en horario'],
    recordatorio: ['Mantén horarios de sueño constantes.', 'Organiza tu rutina diaria con bloques de tiempo.', 'Evita pantallas una hora antes de dormir.'],
  },
  'organizacion-habitos': {
    desayuno: ['Desayuno planificado la noche anterior', 'Desayuno simple y organizado', 'Desayuno con lista de ingredientes preparada'],
    almuerzo: ['Almuerzo planificado con anticipación', 'Meal-prep semanal para el almuerzo', 'Almuerzo organizado según agenda semanal'],
    cena: ['Cena sencilla y organizada', 'Cena preparada con anticipación', 'Cena ligera dentro de la rutina planificada'],
    recordatorio: ['Planifica tu semana los domingos.', 'Usa una lista de tareas de hábitos diarios.', 'Revisa tu progreso semanal.'],
  },
};

/* Genera un desplazamiento (offset) estable a partir del id del cliente,
   para que dos clientes con el mismo objetivo no reciban exactamente
   las mismas frases del banco de hábitos. No altera ningún dato
   nutricional: solo cambia el punto de partida dentro de las mismas
   opciones generales ya existentes. */
function offsetPorCliente(clienteId) {
  let hash = 0;
  for (let i = 0; i < clienteId.length; i++) hash = (hash * 31 + clienteId.charCodeAt(i)) % 997;
  return hash;
}

function generarPlanSemanal(cliente) {
  const banco = BANCO_HABITOS[cliente.objetivo] || BANCO_HABITOS['bienestar-general'];
  const offset = offsetPorCliente(cliente.id);
  const dias = DIAS_SEMANA.map((dia, idx) => ({
    dia,
    desayuno: banco.desayuno[(idx + offset) % banco.desayuno.length],
    almuerzo: banco.almuerzo[(idx + offset + 1) % banco.almuerzo.length],
    cena: banco.cena[(idx + offset + 2) % banco.cena.length],
    hidratacion: `${cliente.agua || 6} vasos de agua distribuidos durante el día`,
    actividad: nivelActividadTexto(cliente.actividad, idx),
    recordatorio: banco.recordatorio[(idx + offset) % banco.recordatorio.length],
  }));
  return {
    id: uid('plan'),
    clienteId: cliente.id,
    fecha: todayISO(),
    objetivo: cliente.objetivo,
    dias,
  };
}

/* Resumen de "por qué se adapta a este cliente": combina objetivo, IMC,
   edad, actividad y preferencias/restricciones ya registradas. Solo usa
   datos que el emprendedor introdujo — no se inventa ni se supone
   ninguna condición médica o alimentaria no declarada. */
function construirJustificacionPlan(cliente) {
  const imc = calcularIMC(cliente.peso, cliente.talla);
  const imcInfo = interpretarIMC(imc);
  return [
    ['Objetivo', NOMBRE_OBJETIVO(cliente.objetivo)],
    ['IMC calculado', imc ? `${imc} — ${imcInfo.categoria}` : 'No disponible (faltan peso o talla)'],
    ['Edad', cliente.edad ? `${cliente.edad} años` : 'Sin indicar'],
    ['Nivel de actividad', capitalizar(cliente.actividad)],
    ['Preferencias alimentarias', cliente.preferencias || 'Sin indicar'],
    ['Restricciones alimentarias', cliente.restricciones || 'Sin indicar'],
    ['Alimentos a evitar', cliente.evitar || 'Sin indicar'],
  ];
}

function renderJustificacion(contenedorId, items) {
  document.getElementById(contenedorId).innerHTML = items.map(([k, v]) =>
    `<div class="summary-item"><strong>${k}</strong>${escapeHTML(String(v))}</div>`).join('');
}

function nivelActividadTexto(nivel, idx) {
  const opciones = {
    sedentario: ['Caminata corta de 10 minutos', 'Estiramientos suaves', 'Caminata de 15 minutos'],
    ligero: ['Caminata de 20 minutos', 'Rutina de estiramientos', 'Caminata o bicicleta suave 20 min'],
    moderado: ['Actividad física moderada 30 minutos', 'Rutina de fuerza ligera', 'Caminata rápida 30 minutos'],
    activo: ['Entrenamiento habitual', 'Sesión de entrenamiento planificada', 'Actividad física intensa según rutina'],
  };
  const lista = opciones[nivel] || opciones.ligero;
  return lista[idx % lista.length];
}

/* --------------------------------------------------------------------------
   CORRECCIÓN — Persistencia completa del Plan Semanal (auditoría, prioridad 3)
   Antes: solo se guardaba un registro {id, clienteId, fecha} en
   hgw_planes; el contenido real de los 7 días (y sus ediciones) vivía
   únicamente en la variable de memoria state.planActual y se perdía al
   recargar, cambiar de vista o reseleccionar el cliente.
   Ahora: el plan completo (incluidas las ediciones) se guarda en
   hgw_planes, uno por cliente (al generar uno nuevo para un cliente que
   ya tenía, se reemplaza). Se recupera automáticamente al entrar a la
   vista o al seleccionar ese cliente en el desplegable.
   -------------------------------------------------------------------------- */
function obtenerPlanGuardado(clienteId) {
  return state.planes.find(p => p.clienteId === clienteId) || null;
}

function guardarPlanSemanalCompleto(plan) {
  const idx = state.planes.findIndex(p => p.clienteId === plan.clienteId);
  if (idx >= 0) state.planes[idx] = plan;
  else state.planes.push(plan);
  persistPlanes();
}

function mostrarResultadoPlan(cliente, plan) {
  state.planActual = plan;
  document.getElementById('plan-cliente-nombre').textContent = cliente.nombre;
  renderJustificacion('plan-justificacion', construirJustificacionPlan(cliente));
  renderPlanGrid(plan);
  document.getElementById('plan-productos').innerHTML = productosRecomendados(cliente.objetivo).map(productMiniCardHTML).join('') ||
    `<p style="color:var(--slate);font-size:14px">No hay productos activos asociados a este objetivo.</p>`;
  document.getElementById('plan-resultado-panel').classList.remove('hidden');
  refreshIcons();
}

function cargarPlanDelClienteSeleccionado() {
  const clienteId = document.getElementById('plan-cliente').value;
  const cliente = state.clientes.find(c => c.id === clienteId);
  const planGuardado = clienteId ? obtenerPlanGuardado(clienteId) : null;
  if (cliente && planGuardado) {
    mostrarResultadoPlan(cliente, planGuardado);
  } else {
    state.planActual = null;
    document.getElementById('plan-resultado-panel').classList.add('hidden');
  }
}

function renderPlanSetup() {
  const select = document.getElementById('plan-cliente');
  select.innerHTML = state.clientes.map(c => `<option value="${c.id}">${escapeHTML(c.nombre)}</option>`).join('');
  cargarPlanDelClienteSeleccionado();
}

document.getElementById('plan-cliente').addEventListener('change', cargarPlanDelClienteSeleccionado);

document.getElementById('btn-generar-plan').addEventListener('click', () => {
  const clienteId = document.getElementById('plan-cliente').value;
  const cliente = state.clientes.find(c => c.id === clienteId);
  if (!cliente) { showToast('Registra al menos un cliente para generar un plan.', 'error'); return; }

  const plan = generarPlanSemanal(cliente);
  guardarPlanSemanalCompleto(plan);
  mostrarResultadoPlan(cliente, plan);
  showToast('Plan semanal generado. Puedes editarlo antes de descargarlo; tus cambios se guardan automáticamente.', 'success');
});

function renderPlanGrid(plan) {
  document.getElementById('plan-grid').innerHTML = plan.dias.map((d, i) => `
    <div class="plan-day-card">
      <div class="plan-day-title">${d.dia}</div>
      <div class="plan-field"><label>Desayuno</label><textarea rows="2" data-plan-idx="${i}" data-plan-field="desayuno">${escapeHTML(d.desayuno)}</textarea></div>
      <div class="plan-field"><label>Almuerzo</label><textarea rows="2" data-plan-idx="${i}" data-plan-field="almuerzo">${escapeHTML(d.almuerzo)}</textarea></div>
      <div class="plan-field"><label>Cena</label><textarea rows="2" data-plan-idx="${i}" data-plan-field="cena">${escapeHTML(d.cena)}</textarea></div>
      <div class="plan-field"><label>Hidratación</label><input type="text" data-plan-idx="${i}" data-plan-field="hidratacion" value="${escapeHTML(d.hidratacion)}"></div>
      <div class="plan-field"><label>Actividad</label><input type="text" data-plan-idx="${i}" data-plan-field="actividad" value="${escapeHTML(d.actividad)}"></div>
      <div class="plan-field"><label>Recordatorio de bienestar</label><input type="text" data-plan-idx="${i}" data-plan-field="recordatorio" value="${escapeHTML(d.recordatorio)}"></div>
    </div>`).join('');

  document.querySelectorAll('[data-plan-idx]').forEach(el => {
    el.addEventListener('input', () => {
      const idx = parseInt(el.dataset.planIdx);
      const field = el.dataset.planField;
      state.planActual.dias[idx][field] = el.value;
      persistPlanes(); // Prioridad 3: cada edición del plan queda guardada de inmediato, no solo en memoria.
    });
  });
}

document.getElementById('btn-descargar-pdf').addEventListener('click', () => {
  const plan = state.planActual;
  if (!plan) return;
  const cliente = state.clientes.find(c => c.id === plan.clienteId);
  generarPDFPlan(plan, cliente);
});

function generarPDFPlan(plan, cliente) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const marginX = 48;
  let y = 56;

  doc.setFillColor(27, 46, 40);
  doc.rect(0, 0, 612, 70, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('HGW Wellness', marginX, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Plan semanal de orientación de bienestar', marginX, 58);

  y = 100;
  doc.setTextColor(27, 46, 40);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Cliente: ${cliente.nombre}`, marginX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha de generación: ${formatearFecha(plan.fecha)}`, 340, y);
  y += 18;
  doc.text(`Objetivo de bienestar: ${NOMBRE_OBJETIVO(plan.objetivo)}`, marginX, y);
  y += 18;
  doc.text(`Próximo seguimiento sugerido: ${formatearFecha(cliente.proximoSeguimiento) || 'Por definir'}`, marginX, y);
  y += 26;

  plan.dias.forEach((d) => {
    if (y > 660) { doc.addPage(); y = 56; }
    doc.setFillColor(238, 243, 238);
    doc.roundedRect(marginX, y, 516, 96, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(58, 95, 78);
    doc.text(d.dia, marginX + 12, y + 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(40, 40, 40);
    const col1 = marginX + 12, col2 = marginX + 270;
    doc.text(doc.splitTextToSize(`Desayuno: ${d.desayuno}`, 245), col1, y + 32);
    doc.text(doc.splitTextToSize(`Almuerzo: ${d.almuerzo}`, 245), col1, y + 52);
    doc.text(doc.splitTextToSize(`Cena: ${d.cena}`, 245), col1, y + 72);
    doc.text(doc.splitTextToSize(`Hidratación: ${d.hidratacion}`, 235), col2, y + 32);
    doc.text(doc.splitTextToSize(`Actividad: ${d.actividad}`, 235), col2, y + 52);
    doc.text(doc.splitTextToSize(`Recordatorio: ${d.recordatorio}`, 235), col2, y + 72);
    y += 106;
  });

  const productos = productosRecomendados(plan.objetivo);
  if (productos.length) {
    if (y > 620) { doc.addPage(); y = 56; }
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(27, 46, 40);
    doc.text('Productos HGW asociados', marginX, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    productos.forEach(p => {
      if (y > 700) { doc.addPage(); y = 56; }
      doc.text(`• ${p.nombre} — ${p.categoria || 'General'}`, marginX, y);
      y += 14;
    });
    y += 6;
  }

  if (y > 660) { doc.addPage(); y = 56; }
  doc.setDrawColor(214, 162, 76);
  doc.setLineWidth(1);
  doc.line(marginX, y, marginX + 516, y);
  y += 16;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(90, 100, 95);
  const nota = 'Esta información tiene carácter general y educativo. No constituye diagnóstico, tratamiento ni prescripción médica y no sustituye la orientación de un profesional de la salud.';
  doc.text(doc.splitTextToSize(nota, 516), marginX, y);

  doc.save(`Plan_Semanal_${cliente.nombre.replace(/\s+/g, '_')}.pdf`);
  showToast('PDF generado y descargado correctamente.', 'success');
}

/* --------------------------------------------------------------------------
   15.1 PLAN DEPORTIVO (NUEVO)
   Genera una orientación general de actividad física, estructurada según
   el objetivo, el nivel de actividad y la experiencia declarada por el
   cliente. Es orientación general: no diagnostica, no prescribe
   tratamientos y no sustituye la valoración de un médico, nutricionista
   o profesional del deporte.
   -------------------------------------------------------------------------- */
const FRECUENCIA_POR_ACTIVIDAD = {
  sedentario: '2 a 3 días por semana, para construir el hábito de forma gradual',
  ligero: '3 días por semana',
  moderado: '3 a 4 días por semana',
  activo: '4 a 5 días por semana',
};

const DURACION_POR_EXPERIENCIA = {
  ninguna: '15 a 20 minutos por sesión',
  principiante: '20 a 30 minutos por sesión',
  intermedio: '30 a 45 minutos por sesión',
  avanzado: '45 a 60 minutos por sesión',
};

const DESCANSO_POR_EXPERIENCIA = {
  ninguna: 'Al menos 2 días de descanso completo entre sesiones.',
  principiante: 'Al menos 2 días de descanso completo entre sesiones.',
  intermedio: '1 a 2 días de descanso activo (caminata suave, estiramiento).',
  avanzado: '1 día de descanso completo, con posibilidad de recuperación activa.',
};

/* Énfasis general por objetivo: solo orienta qué tipo de actividad suele
   asociarse a cada objetivo, sin prometer resultados ni cuantificar
   beneficios clínicos. */
const ENFASIS_POR_OBJETIVO = {
  'control-peso': { cardio: 'Actividad aeróbica moderada (caminata rápida, bicicleta, baile).', fuerza: 'Ejercicios de fuerza con el propio peso corporal, 2 veces por semana.', movilidad: 'Estiramientos generales al final de cada sesión.' },
  'actividad-fisica': { cardio: 'Combinación de cardio moderado y ejercicios de resistencia.', fuerza: 'Rutina de fuerza progresiva, 2 a 3 veces por semana.', movilidad: 'Movilidad articular antes de entrenar y estiramientos después.' },
  'hidratacion': { cardio: 'Actividad ligera que no genere sudoración excesiva sin reposición de líquidos.', fuerza: 'Ejercicios suaves de tonificación general.', movilidad: 'Estiramientos suaves, con buena hidratación antes y después.' },
  'organizacion-alimentaria': { cardio: 'Caminatas después de las comidas principales.', fuerza: 'Ejercicios básicos de tonificación, 2 veces por semana.', movilidad: 'Estiramientos generales.' },
  'bienestar-general': { cardio: 'Actividad aeróbica ligera a moderada, según preferencia.', fuerza: 'Ejercicios de fuerza general, 2 veces por semana.', movilidad: 'Movilidad y estiramientos como parte de la rutina diaria.' },
  'rutina-saludable': { cardio: 'Actividad aeróbica a una hora fija del día.', fuerza: 'Rutina de fuerza breve dentro de un horario constante.', movilidad: 'Estiramientos como parte del cierre de la rutina diaria.' },
  'organizacion-habitos': { cardio: 'Actividad aeróbica planificada con anticipación en la agenda semanal.', fuerza: 'Rutina de fuerza corta y organizada.', movilidad: 'Estiramientos programados como parte del hábito semanal.' },
};

const PROGRESION_TEXTO = 'Aumenta la duración o la intensidad de forma gradual cada 1 a 2 semanas, priorizando la constancia sobre la intensidad. Si algo genera dolor (más allá del cansancio normal), detente y consulta a un profesional.';

function generarPlanDeportivo(cliente) {
  const actividad = cliente.actividad || 'ligero';
  const experiencia = cliente.experiencia || 'ninguna';
  const enfasis = ENFASIS_POR_OBJETIVO[cliente.objetivo] || ENFASIS_POR_OBJETIVO['bienestar-general'];

  return {
    frecuencia: FRECUENCIA_POR_ACTIVIDAD[actividad] || FRECUENCIA_POR_ACTIVIDAD.ligero,
    duracion: DURACION_POR_EXPERIENCIA[experiencia] || DURACION_POR_EXPERIENCIA.ninguna,
    cardio: enfasis.cardio,
    fuerza: enfasis.fuerza,
    movilidad: enfasis.movilidad,
    descanso: DESCANSO_POR_EXPERIENCIA[experiencia] || DESCANSO_POR_EXPERIENCIA.ninguna,
    progresion: PROGRESION_TEXTO,
    requiereValoracion: actividad === 'sedentario' && experiencia === 'ninguna',
  };
}

function renderResultadoDeportivo(cliente, registro) {
  const plan = registro.datos;
  document.getElementById('deportivo-cliente-nombre').textContent = cliente.nombre;
  renderJustificacion('deportivo-justificacion', registro.justificacion);

  const items = [
    ['Frecuencia semanal', plan.frecuencia],
    ['Duración por sesión', plan.duracion],
    ['Actividad cardiovascular', plan.cardio],
    ['Fuerza', plan.fuerza],
    ['Movilidad y estiramiento', plan.movilidad],
    ['Descanso', plan.descanso],
    ['Progresión', plan.progresion],
  ];
  document.getElementById('deportivo-grid').innerHTML = items.map(([label, valor]) => `
    <div class="info-item">
      <div class="info-item-label">${label}</div>
      <div class="info-item-value text">${escapeHTML(valor)}</div>
    </div>`).join('') + (plan.requiereValoracion
      ? `<div class="info-item"><div class="info-item-label">Recomendación adicional</div><div class="info-item-value text">Antes de iniciar, se recomienda una valoración médica por tratarse de una persona sin experiencia previa y con nivel de actividad sedentario.</div></div>`
      : '');

  document.getElementById('deportivo-resultado-panel').classList.remove('hidden');
  refreshIcons();
}

/* --------------------------------------------------------------------------
   CORRECCIÓN — Persistencia del Plan Deportivo (auditoría, prioridad 2)
   Antes: generarPlanDeportivo() solo devolvía un objeto que se pintaba en
   pantalla; no se guardaba en ninguna clave de localStorage y se perdía
   al recargar o cambiar de vista.
   Ahora: cada plan deportivo generado queda asociado al clienteId y
   guardado en hgw_planes_deportivos (uno por cliente; al generar uno
   nuevo para el mismo cliente, se reemplaza). Se recupera
   automáticamente al entrar a la vista o al reseleccionar ese cliente.
   -------------------------------------------------------------------------- */
function obtenerPlanDeportivoGuardado(clienteId) {
  return state.planesDeportivos.find(p => p.clienteId === clienteId) || null;
}

function guardarPlanDeportivo(registro) {
  const idx = state.planesDeportivos.findIndex(p => p.clienteId === registro.clienteId);
  if (idx >= 0) state.planesDeportivos[idx] = registro;
  else state.planesDeportivos.push(registro);
  persistPlanesDeportivos();
}

function cargarPlanDeportivoDelClienteSeleccionado() {
  const clienteId = document.getElementById('deportivo-cliente').value;
  const cliente = state.clientes.find(c => c.id === clienteId);
  const registroGuardado = clienteId ? obtenerPlanDeportivoGuardado(clienteId) : null;
  if (cliente && registroGuardado) {
    renderResultadoDeportivo(cliente, registroGuardado);
  } else {
    document.getElementById('deportivo-resultado-panel').classList.add('hidden');
  }
}

function renderDeportivoSetup() {
  const select = document.getElementById('deportivo-cliente');
  select.innerHTML = state.clientes.map(c => `<option value="${c.id}">${escapeHTML(c.nombre)}</option>`).join('');
  cargarPlanDeportivoDelClienteSeleccionado();
}

document.getElementById('deportivo-cliente').addEventListener('change', cargarPlanDeportivoDelClienteSeleccionado);

document.getElementById('btn-generar-deportivo').addEventListener('click', () => {
  const clienteId = document.getElementById('deportivo-cliente').value;
  const cliente = state.clientes.find(c => c.id === clienteId);
  if (!cliente) { showToast('Registra al menos un cliente para generar un plan deportivo.', 'error'); return; }

  const plan = generarPlanDeportivo(cliente);
  const justificacion = construirJustificacionPlan(cliente).filter(([label]) =>
    ['Objetivo', 'IMC calculado', 'Edad', 'Nivel de actividad'].includes(label));
  justificacion.push(['Experiencia deportiva', capitalizar(cliente.experiencia)]);

  const registro = { id: uid('pdep'), clienteId: cliente.id, fecha: todayISO(), datos: plan, justificacion };
  guardarPlanDeportivo(registro);
  renderResultadoDeportivo(cliente, registro);
  showToast('Plan deportivo generado y guardado para este cliente.', 'success');
  refreshIcons();
});

/* --------------------------------------------------------------------------
   16. SEGUIMIENTOS
   -------------------------------------------------------------------------- */
function poblarSelectClientesSeguimiento(preseleccion = null) {
  const select = document.getElementById('s-cliente');
  select.innerHTML = state.clientes.map(c => `<option value="${c.id}">${escapeHTML(c.nombre)}</option>`).join('');
  if (preseleccion) select.value = preseleccion;
}

function abrirModalSeguimiento() {
  if (state.clientes.length === 0) {
    showToast('Registra al menos un cliente antes de crear un seguimiento.', 'error');
    return;
  }
  document.getElementById('form-seguimiento').reset();
  poblarSelectClientesSeguimiento(state.currentClienteId);
  document.getElementById('s-fecha').value = todayISO();
  clearFieldErrors(document.getElementById('form-seguimiento'));
  openModal('modal-seguimiento');
}

document.getElementById('btn-guardar-seguimiento').addEventListener('click', () => {
  const form = document.getElementById('form-seguimiento');
  clearFieldErrors(form);
  const clienteId = document.getElementById('s-cliente').value;
  const fecha = document.getElementById('s-fecha').value;
  let valido = true;
  if (!clienteId) valido = false;
  if (!fecha) { marcarError(document.getElementById('s-fecha'), 'La fecha es obligatoria.'); valido = false; }
  if (!valido) { showToast('Completa los campos obligatorios.', 'error'); return; }

  const peso = parseFloat(document.getElementById('s-peso').value) || null;
  const nuevo = {
    id: uid('seg'),
    clienteId, fecha,
    peso,
    cumplimiento: document.getElementById('s-cumplimiento').value,
    hidratacion: parseInt(document.getElementById('s-hidratacion').value) || null,
    actividad: document.getElementById('s-actividad').value,
    bienestar: document.getElementById('s-bienestar').value,
    productos: document.getElementById('s-productos').value.trim(),
    proximoSeguimiento: document.getElementById('s-proximo').value,
    observaciones: document.getElementById('s-observaciones').value.trim(),
    demo: false,
  };
  state.seguimientos.push(nuevo);
  persistSeguimientos();

  const cliente = state.clientes.find(c => c.id === clienteId);
  if (cliente) {
    if (peso) {
      cliente.peso = peso;
      cliente.historialPeso = cliente.historialPeso || [];
      cliente.historialPeso.push({ fecha, peso });
    }
    if (nuevo.proximoSeguimiento) cliente.proximoSeguimiento = nuevo.proximoSeguimiento;
    persistClientes();
  }

  closeAllModals();
  showToast('Seguimiento registrado correctamente.', 'success');
  renderCurrentView();
});

function renderSeguimientos() {
  const busqueda = (document.getElementById('buscar-seguimiento').value || '').toLowerCase();
  const lista = state.seguimientos
    .map(s => ({ ...s, clienteNombre: (state.clientes.find(c => c.id === s.clienteId) || {}).nombre || 'Cliente eliminado' }))
    .filter(s => !busqueda || s.clienteNombre.toLowerCase().includes(busqueda))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const tbody = document.getElementById('tabla-seguimientos-body');
  const empty = document.getElementById('seguimientos-empty');
  if (lista.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
    tbody.innerHTML = lista.map(s => `
      <tr>
        <td>${formatearFecha(s.fecha)}</td>
        <td class="cell-name">${escapeHTML(s.clienteNombre)}</td>
        <td>${s.peso ? s.peso + ' kg' : '—'}</td>
        <td><span class="badge badge-muted">${capitalizar(s.cumplimiento)}</span></td>
        <td>${capitalizar(s.bienestar)}</td>
        <td>${formatearFecha(s.proximoSeguimiento)}</td>
        <td class="row-actions">
          <button class="icon-btn" data-seg-delete="${s.id}" title="Eliminar" aria-label="Eliminar seguimiento"><span data-lucide="trash-2"></span></button>
        </td>
      </tr>`).join('');
    tbody.querySelectorAll('[data-seg-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        askConfirm('¿Eliminar este registro de seguimiento?', () => {
          state.seguimientos = state.seguimientos.filter(s => s.id !== btn.dataset.segDelete);
          persistSeguimientos();
          closeAllModals();
          showToast('Seguimiento eliminado.', 'success');
          renderCurrentView();
        });
      });
    });
  }
  refreshIcons();
}

/* --------------------------------------------------------------------------
   17. PRODUCTOS HGW (CRUD)
   -------------------------------------------------------------------------- */
function renderCheckboxObjetivos(seleccionados = []) {
  const cont = document.getElementById('p-objetivos-grid');
  cont.innerHTML = OBJETIVOS.map(o => `
    <label class="checkbox-item">
      <input type="checkbox" value="${o.id}" ${seleccionados.includes(o.id) ? 'checked' : ''}>
      ${o.nombre}
    </label>`).join('');
}

function abrirModalProducto(productoId = null) {
  const form = document.getElementById('form-producto');
  form.reset();
  document.getElementById('p-id').value = '';
  renderCheckboxObjetivos();

  if (productoId) {
    const p = state.productos.find(x => x.id === productoId);
    document.getElementById('modal-producto-title').textContent = 'Editar producto';
    document.getElementById('p-id').value = p.id;
    document.getElementById('p-nombre').value = p.nombre || '';
    document.getElementById('p-categoria').value = p.categoria || '';
    document.getElementById('p-imagen').value = p.imagen || '';
    document.getElementById('p-descripcion').value = p.descripcion || '';
    document.getElementById('p-ingredientes').value = p.ingredientes || '';
    document.getElementById('p-modo').value = p.modoDeUso || '';
    document.getElementById('p-advertencias').value = p.advertencias || '';
    document.getElementById('p-activo').value = String(p.activo);
    renderCheckboxObjetivos(p.objetivosCompatibles || []);
  } else {
    document.getElementById('modal-producto-title').textContent = 'Nuevo producto HGW';
  }
  clearFieldErrors(form);
  openModal('modal-producto');
}
document.getElementById('btn-nuevo-producto').addEventListener('click', () => abrirModalProducto());

document.getElementById('btn-guardar-producto').addEventListener('click', () => {
  const form = document.getElementById('form-producto');
  clearFieldErrors(form);
  const nombreEl = document.getElementById('p-nombre');
  if (!nombreEl.value.trim()) {
    marcarError(nombreEl, 'El nombre del producto es obligatorio.');
    showToast('Completa el nombre del producto.', 'error');
    return;
  }
  const objetivosCompatibles = Array.from(document.querySelectorAll('#p-objetivos-grid input:checked')).map(i => i.value);
  const id = document.getElementById('p-id').value;
  const datos = {
    nombre: nombreEl.value.trim(),
    categoria: document.getElementById('p-categoria').value.trim(),
    imagen: document.getElementById('p-imagen').value.trim(),
    descripcion: document.getElementById('p-descripcion').value.trim(),
    ingredientes: document.getElementById('p-ingredientes').value.trim(),
    modoDeUso: document.getElementById('p-modo').value.trim(),
    advertencias: document.getElementById('p-advertencias').value.trim(),
    objetivosCompatibles,
    activo: document.getElementById('p-activo').value === 'true',
  };

  if (id) {
    Object.assign(state.productos.find(p => p.id === id), datos);
    showToast('Producto actualizado correctamente.', 'success');
  } else {
    state.productos.push({ id: uid('prod'), demo: false, ...datos });
    showToast('Producto agregado correctamente.', 'success');
  }
  persistProductos();
  closeAllModals();
  renderCurrentView();
});

function renderProductos() {
  const busqueda = (document.getElementById('buscar-producto').value || '').toLowerCase();
  const lista = state.productos.filter(p => !busqueda || p.nombre.toLowerCase().includes(busqueda));
  document.getElementById('products-grid').innerHTML = lista.map(p => `
    <article class="product-card">
      <div class="product-card-img">${p.imagen ? `<img src="${p.imagen}" alt="${escapeHTML(p.nombre)}">` : '<span data-lucide="package"></span>'}</div>
      <div class="product-card-body">
        <span class="product-card-cat">${escapeHTML(p.categoria || 'General')}</span>
        <span class="product-card-name">${escapeHTML(p.nombre)}</span>
        <p class="product-card-desc">${escapeHTML(p.descripcion || 'Sin descripción registrada.')}</p>
        <div class="product-card-tags">
          ${(p.objetivosCompatibles || []).map(o => `<span class="badge badge-muted">${NOMBRE_OBJETIVO(o)}</span>`).join('')}
        </div>
      </div>
      <div class="product-card-foot">
        <span class="badge ${p.activo ? 'badge-success' : 'badge-muted'}">${p.activo ? 'Activo' : 'Inactivo'}</span>
        ${p.demo ? '<span class="product-demo-flag">Ejemplo demo</span>' : ''}
        <div class="row-actions">
          <button class="icon-btn" data-prod-edit="${p.id}" title="Editar" aria-label="Editar producto"><span data-lucide="pencil"></span></button>
          <button class="icon-btn" data-prod-toggle="${p.id}" title="${p.activo ? 'Desactivar' : 'Activar'}" aria-label="Cambiar estado"><span data-lucide="${p.activo ? 'eye-off' : 'eye'}"></span></button>
          <button class="icon-btn" data-prod-delete="${p.id}" title="Eliminar" aria-label="Eliminar producto"><span data-lucide="trash-2"></span></button>
        </div>
      </div>
    </article>`).join('');

  document.querySelectorAll('[data-prod-edit]').forEach(b => b.addEventListener('click', () => abrirModalProducto(b.dataset.prodEdit)));
  document.querySelectorAll('[data-prod-toggle]').forEach(b => b.addEventListener('click', () => {
    const p = state.productos.find(x => x.id === b.dataset.prodToggle);
    p.activo = !p.activo;
    persistProductos();
    renderProductos();
    showToast(`Producto ${p.activo ? 'activado' : 'desactivado'}.`, 'success');
  }));
  document.querySelectorAll('[data-prod-delete]').forEach(b => b.addEventListener('click', () => {
    const p = state.productos.find(x => x.id === b.dataset.prodDelete);
    askConfirm(`¿Eliminar el producto "${p.nombre}"?`, () => {
      state.productos = state.productos.filter(x => x.id !== p.id);
      persistProductos();
      closeAllModals();
      showToast('Producto eliminado.', 'success');
      renderProductos();
    });
  }));
  refreshIcons();
}

/* --------------------------------------------------------------------------
   18. ESTADÍSTICAS Y GRÁFICOS
   -------------------------------------------------------------------------- */
function renderEstadisticas() {
  const activos = state.clientes.filter(c => estadoCliente(c) === 'activo').length;
  const pendientes = state.clientes.filter(c => estadoCliente(c) === 'pendiente').length;
  const stats = [
    { icon: 'users', valor: state.clientes.length, label: 'Clientes registrados' },
    { icon: 'activity', valor: state.seguimientos.length, label: 'Seguimientos registrados' },
    { icon: 'package', valor: state.productos.filter(p => p.activo).length, label: 'Productos activos' },
    { icon: 'calendar-days', valor: state.planes.length, label: 'Planes generados' },
  ];
  document.getElementById('stats-grid-2').innerHTML = stats.map(statCardHTML).join('');
  refreshIcons();

  const conteoObjetivos = OBJETIVOS.map(o => ({
    nombre: o.nombre,
    total: state.clientes.filter(c => c.objetivo === o.id).length,
  })).filter(o => o.total > 0);

  if (state.charts.objetivos) state.charts.objetivos.destroy();
  state.charts.objetivos = new Chart(document.getElementById('chart-objetivos'), {
    type: 'bar',
    data: {
      labels: conteoObjetivos.map(o => o.nombre),
      datasets: [{
        data: conteoObjetivos.map(o => o.total),
        backgroundColor: '#4C7A64',
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { stepSize: 1 }, beginAtZero: true } },
    },
  });

  const ultimasSemanas = obtenerConteoSeguimientosPorSemana();
  if (state.charts.seguimientos) state.charts.seguimientos.destroy();
  state.charts.seguimientos = new Chart(document.getElementById('chart-seguimientos'), {
    type: 'line',
    data: {
      labels: ultimasSemanas.map(s => s.etiqueta),
      datasets: [{
        label: 'Seguimientos',
        data: ultimasSemanas.map(s => s.total),
        borderColor: '#D6A24C',
        backgroundColor: 'rgba(214,162,76,0.15)',
        fill: true, tension: 0.35, pointRadius: 4, pointBackgroundColor: '#4C7A64',
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { stepSize: 1 }, beginAtZero: true } },
    },
  });
}

function obtenerConteoSeguimientosPorSemana() {
  const semanas = [];
  const hoy = new Date();
  for (let i = 5; i >= 0; i--) {
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - i * 7 - 6);
    const fin = new Date(hoy);
    fin.setDate(hoy.getDate() - i * 7);
    const inicioISO = inicio.toISOString().slice(0, 10);
    const finISO = fin.toISOString().slice(0, 10);
    const total = state.seguimientos.filter(s => s.fecha >= inicioISO && s.fecha <= finISO).length;
    semanas.push({ etiqueta: `${formatearFecha(inicioISO).slice(0, 5)}–${formatearFecha(finISO).slice(0, 5)}`, total });
  }
  return semanas;
}

/* --------------------------------------------------------------------------
   19. LOGIN / SESIÓN
   -------------------------------------------------------------------------- */
/* La autenticación se valida en el Worker y la sesión se mantiene mediante
  la cookie HttpOnly emitida por su endpoint de login. */
let sesionWorkerValida = false;

async function leerRespuestaJSON(respuesta) {
  const texto = await respuesta.text();
  if (!texto) return {};
  try { return JSON.parse(texto); } catch { return {}; }
}

async function comprobarSesionWorker() {
  const respuesta = await fetch(`${API_BASE_URL}/api/auth/session`, { credentials: 'include' });
  const datos = await leerRespuestaJSON(respuesta);
  sesionWorkerValida = respuesta.ok && datos.autenticado === true;
  return sesionWorkerValida;
}

function mostrarErrorLogin(mensaje) {
  const el = document.getElementById('login-error-msg');
  el.textContent = mensaje;
  el.classList.remove('hidden');
}

function limpiarErrorLogin() {
  document.getElementById('login-error-msg').classList.add('hidden');
  document.getElementById('login-user').closest('.field').classList.remove('field-error');
  document.getElementById('login-pass').closest('.field').classList.remove('field-error');
}

// Un único handler de 'submit' del formulario cubre tanto el clic en el
// botón (type="submit") como presionar Enter dentro de los campos: el
// navegador dispara 'submit' en ambos casos, así que ambas vías ejecutan
// exactamente esta misma validación.
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  limpiarErrorLogin();

  const usuarioEl = document.getElementById('login-user');
  const passEl = document.getElementById('login-pass');
  const usuario = usuarioEl.value.trim();
  const password = passEl.value;

  if (!usuario || !password) {
    if (!usuario) usuarioEl.closest('.field').classList.add('field-error');
    if (!password) passEl.closest('.field').classList.add('field-error');
    mostrarErrorLogin('Ingresa tu usuario y tu contraseña para continuar.');
    return;
  }

  try {
    const respuesta = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password }),
    });
    const datos = await leerRespuestaJSON(respuesta);
    if (!respuesta.ok) {
      throw new Error(datos.error || 'Usuario o contraseña incorrectos.');
    }
    if (!(await comprobarSesionWorker())) {
      throw new Error('No se pudo confirmar la sesión.');
    }
    mostrarApp();
    showToast(`Bienvenido, ${datos.usuario || usuario}.`, 'success');
  } catch (error) {
    usuarioEl.closest('.field').classList.add('field-error');
    passEl.closest('.field').classList.add('field-error');
    mostrarErrorLogin(error.message || 'No se pudo iniciar sesión.');
    showToast(error.message || 'No se pudo iniciar sesión.', 'error');
  }
});

document.getElementById('btn-logout').addEventListener('click', async () => {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } finally {
    sesionWorkerValida = false;
    document.getElementById('app').classList.add('hidden');
    document.getElementById('login-form').reset();
    limpiarErrorLogin();
    document.getElementById('access-gate').classList.remove('hidden');
  }
});

function mostrarApp() {
  // Guardia de seguridad (auditoría, prioridad 1): mostrarApp() ya NO
  // revela el panel privado bajo ninguna circunstancia si no existe una
  // sesión activa y válida guardada, sin importar desde qué punto del
  // código se la llame. Antes, cualquier función que llamara a
  // mostrarApp() exponía el panel sin validar nada.
  if (!sesionWorkerValida) {
    document.getElementById('app').classList.add('hidden');
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('public-app').classList.add('hidden');
    document.getElementById('access-gate').classList.remove('hidden');
    return;
  }
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('access-gate').classList.add('hidden');
  document.getElementById('public-app').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  goToView('dashboard');
}

/* --------------------------------------------------------------------------
   21. ACCESO PÚBLICO (NUEVO)
   Todo este bloque es aditivo: no modifica ninguna función de las
   secciones 1-20. Reutiliza utilidades ya existentes (Storage, uid,
   showToast, clearFieldErrors, marcarError, escapeHTML, todayISO,
   formatearFecha, productMiniCardHTML, refreshIcons) tal como están.

   IMPORTANTE — límite técnico honesto: como este proyecto no tiene
   backend ni base de datos, "hgw_solicitudes" vive únicamente en el
   localStorage del navegador donde se llenó el formulario. El listado
   privado de abajo solo puede mostrar solicitudes hechas desde ESE
   MISMO navegador/dispositivo. Para que el emprendedor vea en tiempo
   real las solicitudes hechas por clientes en sus propios celulares,
   se necesitaría un backend real (API + base de datos) que reciba el
   formulario y guarde el registro de forma centralizada.
   -------------------------------------------------------------------------- */

/* --- Puerta de acceso: navegación entre gate / login / público --- */
document.getElementById('gate-btn-privado').addEventListener('click', () => {
  document.getElementById('access-gate').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
});
document.getElementById('gate-btn-publico').addEventListener('click', () => {
  document.getElementById('access-gate').classList.add('hidden');
  mostrarPublicApp();
});
document.getElementById('login-back-btn').addEventListener('click', () => {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('access-gate').classList.remove('hidden');
});
document.getElementById('public-back-btn').addEventListener('click', () => {
  document.getElementById('public-app').classList.add('hidden');
  document.getElementById('access-gate').classList.remove('hidden');
});

function mostrarPublicApp() {
  document.getElementById('public-app').classList.remove('hidden');
  renderPublicProducts();
  renderSpaServicios();
  poblarSpaTipoSelect();
  activarPublicTab('productos');
  refreshIcons();
}

/* --- Pestañas públicas: clases y funciones propias, independientes
   de activarTab()/.tab-btn/.tab-panel usados en el perfil de cliente,
   para no interferir con esa lógica ya existente. --- */
function activarPublicTab(tabName) {
  document.querySelectorAll('.tab-btn-pub').forEach(b => b.classList.toggle('is-active', b.dataset.publicTab === tabName));
  document.querySelectorAll('.tab-panel-pub').forEach(p => p.classList.remove('is-active'));
  document.getElementById(`public-tab-${tabName}`).classList.add('is-active');
}
document.querySelectorAll('.tab-btn-pub').forEach(btn => {
  btn.addEventListener('click', () => activarPublicTab(btn.dataset.publicTab));
});

/* --- Catálogo público de productos ---
   Reutiliza productMiniCardHTML(), la misma función ya usada en el
   perfil de cliente y en el plan semanal, y state.productos, ya
   cargado por loadState(). Solo se muestran productos activos y no
   se inventa ningún dato: si falta información, se refleja tal cual
   está en el registro del producto. */
function renderPublicProducts() {
  const activos = state.productos.filter(p => p.activo);
  const cont = document.getElementById('public-products-grid');
  cont.innerHTML = activos.length
    ? activos.map(productMiniCardHTML).join('')
    : `<p style="color:var(--slate);font-size:14px">Todavía no hay productos activos para mostrar. Vuelve pronto o solicita una asesoría para más información.</p>`;
  refreshIcons();
}

/* --------------------------------------------------------------------------
   21.1 SPA (NUEVO)
   Catálogo, reserva pública y gestión privada de sesiones de SPA Loren.
   Mismo patrón ya usado para el formulario de asesoría: validación con
   clearFieldErrors/marcarError, código único generado en el navegador,
   y almacenamiento separado (hgw_spa_reservas) con la misma advertencia
   de límite técnico (solo visible en el navegador donde se reservó).
   -------------------------------------------------------------------------- */
function spaServiceCardHTML(s) {
  return `<div class="product-card">
    <div class="product-card-img"><span data-lucide="flower-2"></span></div>
    <div class="product-card-body">
      <span class="product-card-cat">${escapeHTML(s.categoria)}</span>
      <span class="product-card-name">${escapeHTML(s.nombre)}</span>
      <p class="product-card-desc">${SPA_DESCRIPCION_GENERICA}</p>
    </div>
  </div>`;
}

function renderSpaServicios() {
  document.getElementById('spa-servicios-grid').innerHTML = SPA_SERVICIOS.map(spaServiceCardHTML).join('');
  refreshIcons();
}

function poblarSpaTipoSelect() {
  document.getElementById('spa-tipo').innerHTML = SPA_SERVICIOS.map(s => `<option value="${s.id}">${escapeHTML(s.nombre)}</option>`).join('');
}

function generarCodigoSPA() {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let sufijo = '';
  for (let i = 0; i < 5; i++) sufijo += caracteres[Math.floor(Math.random() * caracteres.length)];
  return `SPA-KR-${sufijo}`;
}

function validarSpaForm() {
  const form = document.getElementById('form-spa');
  clearFieldErrors(form);
  let valido = true;

  const requeridos = [
    ['spa-tipo', 'Selecciona un tipo de sesión.'],
    ['spa-fecha', 'La fecha es obligatoria.'],
    ['spa-hora', 'La hora es obligatoria.'],
    ['spa-nombre', 'El nombre es obligatorio.'],
    ['spa-telefono', 'El teléfono es obligatorio.'],
  ];
  requeridos.forEach(([id, msg]) => {
    const el = document.getElementById(id);
    if (!el.value || !el.value.trim()) {
      marcarError(el, msg);
      valido = false;
    }
  });

  const fechaEl = document.getElementById('spa-fecha');
  if (fechaEl.value && fechaEl.value < todayISO()) {
    marcarError(fechaEl, 'La fecha no puede ser anterior a hoy.');
    valido = false;
  }

  const horaEl = document.getElementById('spa-hora');
  if (horaEl.value && (horaEl.value < '08:00' || horaEl.value > '18:00')) {
    marcarError(horaEl, 'El horario de atención es de 8:00 a. m. a 6:00 p. m.');
    valido = false;
  }

  const telefono = document.getElementById('spa-telefono');
  if (telefono.value.trim() && !/^[\d+()\s-]{7,20}$/.test(telefono.value.trim())) {
    marcarError(telefono, 'Ingresa un teléfono válido (mínimo 7 dígitos).');
    valido = false;
  }

  const correo = document.getElementById('spa-correo');
  if (correo.value.trim() && !/^\S+@\S+\.\S+$/.test(correo.value.trim())) {
    marcarError(correo, 'Correo electrónico no válido.');
    valido = false;
  }

  return valido;
}

document.getElementById('btn-reservar-spa').addEventListener('click', () => {
  if (!validarSpaForm()) {
    showToast('Revisa los campos marcados en el formulario.', 'error');
    return;
  }

  const tipo = SPA_SERVICIOS.find(s => s.id === document.getElementById('spa-tipo').value);
  const reserva = {
    id: uid('spa'),
    codigo: generarCodigoSPA(),
    tipoId: tipo.id,
    tipoNombre: tipo.nombre,
    fecha: document.getElementById('spa-fecha').value,
    hora: document.getElementById('spa-hora').value,
    nombre: document.getElementById('spa-nombre').value.trim(),
    telefono: document.getElementById('spa-telefono').value.trim(),
    correo: document.getElementById('spa-correo').value.trim(),
    observaciones: document.getElementById('spa-observaciones').value.trim(),
    estado: 'pendiente',
  };

  state.spaReservas.push(reserva);
  persistSpaReservas();

  document.getElementById('spa-codigo-generado').textContent = reserva.codigo;

  const asunto = encodeURIComponent(`Reserva SPA Loren — ${reserva.codigo}`);
  const cuerpo = encodeURIComponent(
    `Hola, quiero confirmar mi reserva en SPA Loren.\n\nCódigo: ${reserva.codigo}\nTipo de sesión: ${reserva.tipoNombre}\nFecha solicitada: ${formatearFecha(reserva.fecha)}\nHora solicitada: ${reserva.hora}\nNombre: ${reserva.nombre}\nTeléfono: ${reserva.telefono}`
  );
  document.getElementById('btn-contactar-spa').href = `mailto:${SPA_INFO.correo}?subject=${asunto}&body=${cuerpo}`;

  document.getElementById('spa-form-panel').classList.add('hidden');
  document.getElementById('spa-confirmacion-panel').classList.remove('hidden');
  document.getElementById('form-spa').reset();
  showToast('Reserva registrada correctamente.', 'success');
});

document.getElementById('btn-copiar-codigo-spa').addEventListener('click', () => {
  const codigo = document.getElementById('spa-codigo-generado').textContent;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(codigo)
      .then(() => showToast('Código copiado al portapapeles.', 'success'))
      .catch(() => showToast('No se pudo copiar automáticamente. Copia el código manualmente.', 'error'));
  } else {
    showToast('No se pudo copiar automáticamente. Copia el código manualmente.', 'error');
  }
});

document.getElementById('btn-nueva-reserva-spa').addEventListener('click', () => {
  document.getElementById('spa-confirmacion-panel').classList.add('hidden');
  document.getElementById('spa-form-panel').classList.remove('hidden');
});

/* --- Vista privada: listado de reservas SPA (misma advertencia de
   límite técnico que en Solicitudes de asesoría: solo se ven las
   reservas hechas desde este mismo navegador). --- */
const ESTADOS_SPA = ['pendiente', 'confirmada', 'reprogramada', 'cancelada', 'atendida'];
const BADGE_POR_ESTADO_SPA = {
  pendiente: 'badge-warning', confirmada: 'badge-success', reprogramada: 'badge-muted',
  cancelada: 'badge-danger', atendida: 'badge-success',
};

function renderSpaReservas() {
  const busqueda = (document.getElementById('buscar-spa').value || '').toLowerCase();
  const lista = state.spaReservas
    .filter(r =>
      !busqueda ||
      r.codigo.toLowerCase().includes(busqueda) ||
      r.nombre.toLowerCase().includes(busqueda) ||
      r.tipoNombre.toLowerCase().includes(busqueda))
    .sort((a, b) => `${b.fecha}${b.hora}`.localeCompare(`${a.fecha}${a.hora}`));

  const tbody = document.getElementById('tabla-spa-body');
  const empty = document.getElementById('spa-empty');

  if (lista.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
    tbody.innerHTML = lista.map(r => `
      <tr>
        <td class="cell-name">${escapeHTML(r.codigo)}</td>
        <td>${escapeHTML(r.nombre)}</td>
        <td>${escapeHTML(r.telefono)}${r.correo ? ' · ' + escapeHTML(r.correo) : ''}</td>
        <td>${escapeHTML(r.tipoNombre)}</td>
        <td>${formatearFecha(r.fecha)}</td>
        <td>${escapeHTML(r.hora)}</td>
        <td>
          <span class="badge ${BADGE_POR_ESTADO_SPA[r.estado] || 'badge-muted'}">${capitalizar(r.estado)}</span>
          <select class="select-filter" data-spa-estado="${r.id}" aria-label="Cambiar estado de la reserva">
            ${ESTADOS_SPA.map(e => `<option value="${e}" ${e === r.estado ? 'selected' : ''}>${capitalizar(e)}</option>`).join('')}
          </select>
        </td>
      </tr>`).join('');

    tbody.querySelectorAll('[data-spa-estado]').forEach(select => {
      select.addEventListener('change', () => {
        const r = state.spaReservas.find(x => x.id === select.dataset.spaEstado);
        r.estado = select.value;
        persistSpaReservas();
        showToast(`Reserva marcada como ${r.estado}.`, 'success');
        renderSpaReservas();
      });
    });
  }
  refreshIcons();
}

document.getElementById('buscar-spa').addEventListener('input', renderSpaReservas);

/* --- Validación del formulario de asesoría ---
   Reutiliza clearFieldErrors() y marcarError(), ya usadas en los
   formularios de cliente y wizard, sin modificarlas. */
function validarAsesoriaForm() {
  const form = document.getElementById('form-asesoria');
  clearFieldErrors(form);
  let valido = true;

  const requeridos = [
    ['a-nombre', 'El nombre es obligatorio.'],
    ['a-telefono', 'El teléfono o WhatsApp es obligatorio.'],
    ['a-ciudad', 'La ciudad es obligatoria.'],
    ['a-motivo', 'Cuéntanos brevemente el motivo de la asesoría.'],
  ];
  requeridos.forEach(([id, msg]) => {
    const el = document.getElementById(id);
    if (!el.value || !el.value.trim()) {
      marcarError(el, msg);
      valido = false;
    }
  });

  const telefono = document.getElementById('a-telefono');
  if (telefono.value.trim() && !/^[\d+()\s-]{7,20}$/.test(telefono.value.trim())) {
    marcarError(telefono, 'Ingresa un teléfono válido (mínimo 7 dígitos).');
    valido = false;
  }

  const correo = document.getElementById('a-correo');
  if (correo.value.trim() && !/^\S+@\S+\.\S+$/.test(correo.value.trim())) {
    marcarError(correo, 'Correo electrónico no válido.');
    valido = false;
  }

  const motivo = document.getElementById('a-motivo');
  if (motivo.value.trim() && motivo.value.trim().length < 8) {
    marcarError(motivo, 'Describe el motivo con un poco más de detalle.');
    valido = false;
  }

  return valido;
}

document.getElementById('btn-enviar-asesoria').addEventListener('click', async () => {
  if (!validarAsesoriaForm()) {
    showToast('Revisa los campos marcados en el formulario.', 'error');
    return;
  }

  const solicitud = {
    nombre: document.getElementById('a-nombre').value.trim(),
    telefono: document.getElementById('a-telefono').value.trim(),
    correo: document.getElementById('a-correo').value.trim(),
    negocio: document.getElementById('a-negocio').value.trim(),
    ciudad: document.getElementById('a-ciudad').value.trim(),
    motivo: document.getElementById('a-motivo').value.trim(),
    preferencia: document.getElementById('a-preferencia').value,
  };

  let respuesta;
  try {
    respuesta = await fetch(`${API_BASE_URL}/api/consultation-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(solicitud),
    });
    const datos = await respuesta.json();
    if (!respuesta.ok || !datos.codigo) {
      throw new Error(datos.error || 'No se pudo registrar la solicitud.');
    }
    solicitud.id = datos.id;
    solicitud.codigo = datos.codigo;
    solicitud.fecha = todayISO();
    solicitud.estado = 'pendiente';
  } catch (error) {
    showToast(error.message || 'No se pudo registrar la solicitud.', 'error');
    return;
  }

  state.solicitudes.push(solicitud);
  persistSolicitudes();

  document.getElementById('codigo-generado').textContent = solicitud.codigo;
  document.getElementById('asesoria-form-panel').classList.add('hidden');
  document.getElementById('asesoria-confirmacion-panel').classList.remove('hidden');
  document.getElementById('form-asesoria').reset();
  showToast('Solicitud registrada correctamente.', 'success');
});

document.getElementById('btn-copiar-codigo').addEventListener('click', () => {
  const codigo = document.getElementById('codigo-generado').textContent;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(codigo)
      .then(() => showToast('Código copiado al portapapeles.', 'success'))
      .catch(() => showToast('No se pudo copiar automáticamente. Copia el código manualmente.', 'error'));
  } else {
    showToast('No se pudo copiar automáticamente. Copia el código manualmente.', 'error');
  }
});

document.getElementById('btn-nueva-solicitud').addEventListener('click', () => {
  document.getElementById('asesoria-confirmacion-panel').classList.add('hidden');
  document.getElementById('asesoria-form-panel').classList.remove('hidden');
});

/* --- Vista privada: listado de solicitudes recibidas (ver nota legal
   de límite técnico al inicio de esta sección). --- */
function renderSolicitudes() {
  const busqueda = (document.getElementById('buscar-solicitud').value || '').toLowerCase();
  const lista = state.solicitudes
    .filter(s =>
      !busqueda ||
      s.codigo.toLowerCase().includes(busqueda) ||
      s.nombre.toLowerCase().includes(busqueda) ||
      (s.ciudad || '').toLowerCase().includes(busqueda))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const tbody = document.getElementById('tabla-solicitudes-body');
  const empty = document.getElementById('solicitudes-empty');

  if (lista.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
    tbody.innerHTML = lista.map(s => `
      <tr>
        <td class="cell-name">${escapeHTML(s.codigo)}</td>
        <td>${escapeHTML(s.nombre)}</td>
        <td>${escapeHTML(s.telefono)}${s.correo ? ' · ' + escapeHTML(s.correo) : ''}</td>
        <td>${escapeHTML(s.ciudad)}</td>
        <td>${escapeHTML(s.motivo)}</td>
        <td>${formatearFecha(s.fecha)}</td>
        <td><span class="badge ${s.estado === 'atendida' ? 'badge-success' : 'badge-warning'}">${s.estado === 'atendida' ? 'Atendida' : 'Pendiente'}</span></td>
        <td class="row-actions">
          <button class="icon-btn" data-sol-toggle="${s.id}" title="${s.estado === 'atendida' ? 'Marcar pendiente' : 'Marcar atendida'}" aria-label="Cambiar estado de la solicitud"><span data-lucide="${s.estado === 'atendida' ? 'rotate-ccw' : 'check'}"></span></button>
        </td>
      </tr>`).join('');

    tbody.querySelectorAll('[data-sol-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = state.solicitudes.find(x => x.id === btn.dataset.solToggle);
        s.estado = s.estado === 'atendida' ? 'pendiente' : 'atendida';
        persistSolicitudes();
        renderSolicitudes();
        showToast(`Solicitud marcada como ${s.estado === 'atendida' ? 'atendida' : 'pendiente'}.`, 'success');
      });
    });
  }
  refreshIcons();
}

/* --------------------------------------------------------------------------
   20. INICIALIZACIÓN Y EVENTOS GLOBALES
   -------------------------------------------------------------------------- */
document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
  btn.addEventListener('click', () => goToView(btn.dataset.view));
});
document.querySelectorAll('[data-view-link]').forEach(btn => {
  btn.addEventListener('click', () => goToView(btn.dataset.viewLink));
});
document.querySelectorAll('[data-action="nuevo-cliente"]').forEach(btn => {
  btn.addEventListener('click', () => abrirModalCliente());
});
document.querySelectorAll('[data-action="nuevo-seguimiento"]').forEach(btn => {
  btn.addEventListener('click', () => abrirModalSeguimiento());
});
document.querySelectorAll('[data-action="generar-plan"]').forEach(btn => {
  btn.addEventListener('click', () => goToView('plan'));
});

document.getElementById('btn-open-sidebar').addEventListener('click', openMobileSidebar);
document.getElementById('sidebar-close').addEventListener('click', closeMobileSidebar);
document.getElementById('mobile-overlay').addEventListener('click', closeMobileSidebar);

document.getElementById('btn-reset-data').addEventListener('click', () => {
  askConfirm('Esto restablecerá ÚNICAMENTE los 4 clientes y 4 productos de EJEMPLO a sus valores originales (se perderán ediciones hechas sobre ellos). Tus clientes, productos, seguimientos, solicitudes de asesoría y reservas SPA reales NO se eliminarán ni se modificarán.', resetDemoData);
});

/* --------------------------------------------------------------------------
   EXPORTACIÓN DE RESPALDO (NUEVO)
   Genera y descarga una copia JSON de todos los datos actuales
   (clientes, productos, seguimientos, planes semanales completos,
   planes deportivos, solicitudes de asesoría y reservas SPA). Es
   únicamente una copia de seguridad local para preparar la futura
   migración a una base de datos real: no sustituye esa migración ni
   crea ninguna sincronización automática.
   -------------------------------------------------------------------------- */
function exportarRespaldoJSON() {
  const respaldo = {
    generadoEn: new Date().toISOString(),
    version: 'hgw-wellness-respaldo-v1',
    clientes: state.clientes,
    productos: state.productos,
    seguimientos: state.seguimientos,
    planesSemanales: state.planes,
    planesDeportivos: state.planesDeportivos,
    solicitudes: state.solicitudes,
    spaReservas: state.spaReservas,
  };

  try {
    const blob = new Blob([JSON.stringify(respaldo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `HGW_Wellness_respaldo_${todayISO()}.json`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
    showToast('Respaldo exportado correctamente.', 'success');
  } catch (e) {
    console.error('Error exportando el respaldo', e);
    showToast('No se pudo generar el respaldo. Intenta de nuevo.', 'error');
  }
}

document.getElementById('btn-exportar-respaldo').addEventListener('click', exportarRespaldoJSON);

document.getElementById('btn-confirm-action').addEventListener('click', () => {
  if (typeof state.confirmCallback === 'function') state.confirmCallback();
});

document.getElementById('buscar-cliente').addEventListener('input', renderClientes);
document.getElementById('filtro-objetivo').addEventListener('change', renderClientes);
document.getElementById('filtro-estado').addEventListener('change', renderClientes);
document.getElementById('buscar-seguimiento').addEventListener('input', renderSeguimientos);
document.getElementById('buscar-producto').addEventListener('input', renderProductos);
document.getElementById('buscar-solicitud').addEventListener('input', renderSolicitudes);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAllModals();
});

function init() {
  seedDemoData();
  loadState();
  poblarFiltroObjetivos();

  comprobarSesionWorker()
    .then((sesionValida) => {
      if (sesionValida) mostrarApp();
    })
    .catch(() => { sesionWorkerValida = false; })
    .finally(() => refreshIcons());
  refreshIcons();
}

init();