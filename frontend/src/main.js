import './style.css'
import {
  BadgeEuro,
  Bell,
  Bot,
  Boxes,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  CircleUserRound,
  FileArchive,
  FileText,
  Home,
  LogOut,
  MessageSquareText,
  Plus,
  Search,
  ShieldCheck,
  Tags,
  Users,
} from 'lucide'
import { createElement, icons } from 'lucide'

const icon = (name, size = 18) => createElement(icons[name], { width: size, height: size, 'stroke-width': 2 })
const API_BASE = '/api'

const emptyData = {
  clientes: [],
  posibles: [],
  plantillas: [],
  especificas: [],
  facturas: [],
  contratos: [],
  tags: [],
}

const state = {
  route: 'login',
  query: '',
  selectedClient: null,
  selectedApi: null,
  data: emptyData,
  apiOnline: false,
  authToken: sessionStorage.getItem('crm_auth_token') || '',
  authUser: sessionStorage.getItem('crm_auth_user') || '',
  loginError: '',
  showNewClientModal: false,
  newClientError: '',
  activeCreateModal: '',
  createModalError: '',
  repositoryFiles: {},
  repositoryLoading: '',
  repositoryErrors: {},
}

async function boot() {
  if (state.authToken) {
    state.route = 'dashboard'
    await loadApiData()
  }
  render()
}

async function loadApiData() {
  try {
    const [clientes, posibles, plantillas, especificas, facturas, contratos, tags] = await Promise.all([
      fetchJson('/clientes'),
      fetchJson('/posibles-clientes'),
      fetchJson('/apis/plantilla'),
      fetchJson('/apis/especificas'),
      fetchJson('/facturas'),
      fetchJson('/contratos'),
      fetchJson('/tags'),
    ])
    state.data = { clientes, posibles, plantillas, especificas, facturas, contratos, tags }
    state.apiOnline = true
  } catch {
    state.apiOnline = false
  }
}

async function fetchJson(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: authHeaders(),
  })
  if (response.status === 401) {
    clearSession()
    render()
    throw new Error('unauthorized')
  }
  if (!response.ok) throw new Error(path)
  return response.json()
}

async function loginUser(usuario, contrasenya) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, contrasenya }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || 'No se pudo iniciar sesion')
  }

  return response.json()
}

async function createClient(payload) {
  return createRecord('/clientes', payload, 'cliente')
}

async function createRecord(path, payload, label) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  })

  if (response.status === 401) {
    clearSession()
    render()
    throw new Error('Sesion caducada')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    if (response.status === 404 || response.status === 405) {
      throw new Error(`El backend no tiene activa la ruta para crear ${label}. Reinicia el backend.`)
    }
    throw new Error(body.error || `No se pudo crear ${label}`)
  }

  return response.json()
}

async function fetchRepositoryFiles(api) {
  const response = await fetch(`${API_BASE}/github/repository-files`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ url: api.url }),
  })

  if (response.status === 401) {
    clearSession()
    render()
    throw new Error('Sesion caducada')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || 'No se pudieron cargar los archivos de GitHub')
  }

  return response.json()
}

function authHeaders() {
  return state.authToken ? { Authorization: `Bearer ${state.authToken}` } : {}
}

function repositoryKey(selection) {
  return `${selection.route}:${selection.id}`
}

function selectApi(route, id) {
  state.selectedApi = { route, id }
  render()
  loadRepositoryFiles(state.selectedApi)
}

async function loadRepositoryFiles(selection) {
  const api = findApi(selection)
  if (!api) return
  const key = repositoryKey(selection)
  if (state.repositoryFiles[key] || state.repositoryLoading === key) return

  if (!api.url) {
    state.repositoryErrors[key] = 'Esta API no tiene URL de GitHub registrada.'
    render()
    return
  }

  state.repositoryLoading = key
  state.repositoryErrors[key] = ''
  render()

  try {
    state.repositoryFiles[key] = await fetchRepositoryFiles(api)
  } catch (error) {
    state.repositoryErrors[key] = error.message
  } finally {
    if (state.repositoryLoading === key) state.repositoryLoading = ''
    render()
  }
}

function formValue(form, name) {
  return String(form.get(name) || '').trim()
}

function createPayload(type, form) {
  if (type === 'cliente') {
    return {
      path: '/clientes',
      label: 'cliente',
      payload: {
        cif: formValue(form, 'cif'),
        nombre_empresa: formValue(form, 'nombre_empresa'),
        telefono_contacto: formValue(form, 'telefono_contacto'),
        necesidades: formValue(form, 'necesidades'),
        direccion: formValue(form, 'direccion'),
        url_archivos_adjuntos: formValue(form, 'url_archivos_adjuntos'),
      },
      afterCreate: (record) => {
        state.route = 'clientes'
        state.selectedClient = record.cif
        state.selectedApi = null
      },
    }
  }
  if (type === 'posible') {
    return {
      path: '/posibles-clientes',
      label: 'posible cliente',
      payload: {
        cif: formValue(form, 'cif'),
        nombre_empresa: formValue(form, 'nombre_empresa'),
        telefono_contacto: formValue(form, 'telefono_contacto'),
        necesidades: formValue(form, 'necesidades'),
        estado: formValue(form, 'estado'),
        direccion: formValue(form, 'direccion'),
        tickets: formValue(form, 'tickets'),
        url_archivos_adjuntos: formValue(form, 'url_archivos_adjuntos'),
      },
      afterCreate: (record) => {
        state.route = 'posibles'
        state.selectedClient = record.cif
        state.selectedApi = null
      },
    }
  }
  if (type === 'api_plantilla' || type === 'api_especifica') {
    const route = type === 'api_plantilla' ? 'plantillas' : 'especificas'
    return {
      path: type === 'api_plantilla' ? '/apis/plantilla' : '/apis/especificas',
      label: type === 'api_plantilla' ? 'API plantilla' : 'API especifica',
      payload: {
        id: formValue(form, 'id'),
        nombre: formValue(form, 'nombre'),
        descripcion: formValue(form, 'descripcion'),
        url: formValue(form, 'url'),
      },
      afterCreate: (record) => {
        state.route = route
        state.selectedClient = null
        selectApi(route, record.id)
      },
    }
  }
  return {
    path: '/facturas',
    label: 'factura',
    payload: {
      nombre_empresa: formValue(form, 'nombre_empresa'),
      url_factura: formValue(form, 'url_factura'),
      coste_facturacion: Number(formValue(form, 'coste_facturacion') || 0),
      fecha: formValue(form, 'fecha'),
      cif_cliente: formValue(form, 'cif_cliente'),
    },
    afterCreate: () => {
      state.route = 'facturas'
      state.selectedApi = null
      state.selectedClient = null
    },
  }
}

function clearSession() {
  state.authToken = ''
  state.authUser = ''
  state.route = 'login'
  state.data = emptyData
  sessionStorage.removeItem('crm_auth_token')
  sessionStorage.removeItem('crm_auth_user')
}

function render() {
  document.querySelector('#app').innerHTML = state.route === 'login' ? loginView() : shellView()
  bindEvents()
}

function loginView() {
  return `
    <main class="login-grid bg-[#1d1d1b]">
      <section class="flex min-h-[360px] flex-col justify-between bg-[#52493a] p-8 text-white md:p-12">
        <div class="flex items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-[#3a3936] text-[#de733e]">${icon('Boxes', 24).outerHTML}</div>
          <div>
            <p class="text-sm uppercase tracking-[0.18em] text-[#a7c7c1]">Argonesa Informatica</p>
            <h1 class="text-2xl font-semibold">CRM APIs</h1>
          </div>
        </div>
        <div class="max-w-xl">
          <p class="mb-4 text-sm uppercase tracking-[0.18em] text-[#a7c7c1]">Inicio de sesion</p>
          <h2 class="text-4xl font-semibold leading-tight md:text-5xl">Administracion clara para clientes, proyectos y APIs.</h2>
        </div>
        <div class="grid grid-cols-3 gap-3 text-sm text-[#d5e4e0]">
          <span>Tags globales</span>
          <span>Contratos</span>
          <span>Facturas</span>
        </div>
      </section>
      <section class="flex items-center justify-center p-6">
        <form id="login-form" class="panel w-full max-w-md p-7">
          <div class="mb-7 flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-[#de733e]">Acceso interno</p>
              <h2 class="text-2xl font-bold text-[#d8d0bd]">Iniciar sesion</h2>
            </div>
            ${icon('ShieldCheck', 34).outerHTML}
          </div>
          <label class="mb-4 block text-sm font-semibold text-[#d8d0bd]">Usuario
            <input class="mt-2 w-full rounded-lg border border-[rgba(255,253,244,0.12)] bg-[#2b2b29] px-3 py-3 text-[#fffdf4]" value="Manu" name="user" />
          </label>
          <label class="mb-6 block text-sm font-semibold text-[#d8d0bd]">Contrasenya
            <input class="mt-2 w-full rounded-lg border border-[rgba(255,253,244,0.12)] bg-[#2b2b29] px-3 py-3 text-[#fffdf4]" type="password" value="1234" name="password" />
          </label>
          <button class="flex w-full items-center justify-center gap-2 rounded-lg bg-[#de733e] px-4 py-3 font-bold text-white hover:bg-[#c65f2f]" type="submit">
            ${icon('LogIn', 18).outerHTML} Iniciar sesion
          </button>
          ${state.loginError ? `<p class="mt-4 rounded-lg border border-[#de733e]/50 bg-[#de733e]/10 p-3 text-sm font-semibold text-[#ffb28c]">${escapeHtml(state.loginError)}</p>` : ''}
          <p class="mt-5 text-sm text-[rgba(216,208,189,0.68)]">Usuarios administradores previstos: Manu y Carlos.</p>
        </form>
      </section>
    </main>
  `
}

function shellView() {
  const title = routeTitle()
  const isHome = state.route === 'dashboard' && !state.query.trim()
  return `
    <div class="app-shell ${isHome ? 'home-shell' : ''}">
      <div class="crm-layout">
        <aside class="sidebar">
          <div class="mb-6 flex items-center gap-3 px-1">
            <div class="sidebar-mark flex h-11 w-11 items-center justify-center rounded-lg bg-[#3a3936] text-[#de733e]">${icon('Boxes', 22).outerHTML}</div>
            <div class="sidebar-label">
              <p class="text-xs font-bold uppercase tracking-[0.16em] text-[#7c8569]">Argonesa</p>
              <p class="font-bold text-[#d8d0bd]">CRM APIs</p>
            </div>
          </div>
          <nav class="grid gap-1">
            ${navItem('dashboard', 'Home', 'Inicio')}
            ${navItem('clientes', 'Building2', 'Clientes')}
            ${navItem('posibles', 'Users', 'Posibles clientes')}
            ${navItem('plantillas', 'Boxes', 'APIs plantilla')}
            ${navItem('especificas', 'BriefcaseBusiness', 'APIs especificas')}
            ${navItem('facturas', 'BadgeEuro', 'Facturas')}
          </nav>
        </aside>
        <main class="min-w-0">
          ${isHome ? '' : `<header class="sticky top-0 z-10 border-b border-[rgba(255,253,244,0.12)] bg-[#1d1d1b]/92 px-4 py-3 backdrop-blur md:px-7">
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.16em] text-[#7c8569]">${state.apiOnline ? 'API conectada' : 'Modo demo local'}</p>
                <h1 class="text-2xl font-bold text-[#d8d0bd]">${title}</h1>
              </div>
              <div class="flex items-center gap-2">
                <label class="relative block w-full md:w-[360px]">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c8569]">${icon('Search', 18).outerHTML}</span>
                  <input id="global-search" class="w-full rounded-lg border border-[rgba(255,253,244,0.12)] bg-[#2b2b29] py-2.5 pl-10 pr-3 text-[#fffdf4] placeholder:text-[rgba(216,208,189,0.56)]" placeholder="Buscar nombre, CIF, id o #Docker" value="${escapeHtml(state.query)}" />
                </label>
                <button class="icon-button" title="Notificaciones">${icon('Bell', 19).outerHTML}</button>
                <button class="icon-button" id="logout" title="Cerrar sesion">${icon('LogOut', 19).outerHTML}</button>
              </div>
            </div>
          </header>`}
          <section class="${isHome ? 'home-content' : 'p-4 md:p-7'}">${activeView()}</section>
        </main>
      </div>
      ${state.showNewClientModal ? newClientModal() : ''}
      ${state.activeCreateModal ? createRecordModal(state.activeCreateModal) : ''}
    </div>
  `
}

function navItem(route, iconName, label) {
  return `<button class="nav-item ${state.route === route ? 'active' : ''}" data-route="${route}" title="${label}">${icon(iconName, 20).outerHTML}<span class="sidebar-label">${label}</span></button>`
}

function activeView() {
  if (state.selectedApi) return apiRepositoryView(state.selectedApi)
  if (state.selectedClient && (state.route === 'clientes' || state.route === 'posibles')) {
    return clientProfileView(state.selectedClient, state.route)
  }
  if (state.route === 'clientes') return clientsGridView('clientes', filterRecords(state.data.clientes), 'Clientes')
  if (state.route === 'posibles') return clientsGridView('posibles', filterRecords(state.data.posibles), 'Posibles clientes')
  if (state.route === 'plantillas') return apiGrid('plantillas', filterRecords(state.data.plantillas), 'APIs reutilizables')
  if (state.route === 'especificas') return apiGrid('especificas', filterRecords(state.data.especificas), 'APIs por cliente')
  if (state.route === 'facturas') return invoicesView(filterRecords(state.data.facturas))
  return dashboardView()
}

function dashboardView() {
  return `
    <div class="chat-workspace">
      <aside class="chat-history-panel">
        <div class="chat-mode-tabs">
          <button class="active">${icon('MessageSquareText', 15).outerHTML} Chat</button>
          <button>${icon('Users', 15).outerHTML} Equipo</button>
        </div>
        <button class="new-chat-button">${icon('Plus', 17).outerHTML} Nuevo chat</button>
        <nav class="chat-shortcuts">
          <button>${icon('FileText', 16).outerHTML} Proyectos</button>
          <button>${icon('Boxes', 16).outerHTML} Artefactos</button>
          <button>${icon('ShieldCheck', 16).outerHTML} Configurar</button>
        </nav>
        <div class="chat-recents">
          <p>Recientes</p>
          <button>Analisis de clientes #Docker</button>
          <button>Revision APIs plantilla</button>
          <button>Facturas pendientes del mes</button>
          <button>Posibles clientes con IA</button>
          <button>Resumen contratos activos</button>
          <button>Busqueda por etiquetas</button>
          <button>Incidencias abiertas</button>
        </div>
      </aside>
      <section class="ai-home">
        <div class="ai-home-inner">
          <h1 class="ai-greeting"><span class="ai-mark">${icon('Bot', 34).outerHTML}</span>Buenas noches, Manu</h1>
          <div class="ai-composer">
            <textarea placeholder="¿Como puedo ayudarte hoy?"></textarea>
            <div class="ai-toolbar">
              <div class="ai-tool-group">
                <button class="ai-tool-button" title="Adjuntar">${icon('Plus', 20).outerHTML}</button>
              </div>
              <div class="ai-tool-group">
                <span class="ai-model">CRM IA 0.1</span>
                <button class="ai-tool-button" title="Buscar">${icon('Search', 18).outerHTML}</button>
                <button class="ai-tool-button" title="Enviar">${icon('MessageSquareText', 18).outerHTML}</button>
              </div>
            </div>
          </div>
          <div class="prompt-chips">
            <button class="prompt-chip">${icon('FileText', 16).outerHTML} Resumir clientes</button>
            <button class="prompt-chip">${icon('Boxes', 16).outerHTML} Revisar APIs</button>
            <button class="prompt-chip">${icon('BadgeEuro', 16).outerHTML} Facturas</button>
            <button class="prompt-chip">${icon('Tags', 16).outerHTML} Buscar tags</button>
          </div>
        </div>
      </section>
    </div>
  `
}

function metric(label, value, iconName) {
  return `<article class="panel p-4"><div class="mb-4 flex items-center justify-between text-[#de733e]">${icon(iconName, 20).outerHTML}<span class="text-xs font-bold uppercase tracking-[0.14em] text-[#7c8569]">${label}</span></div><p class="text-3xl font-bold">${value}</p></article>`
}

function quick(label, iconName, route) {
  return `<button class="flex items-center justify-between rounded-lg border border-[rgba(255,253,244,0.12)] bg-[#2b2b29] p-4 text-left font-bold text-[#d8d0bd] hover:border-[#de733e]" data-route="${route}"><span class="flex items-center gap-3">${icon(iconName, 19).outerHTML}${label}</span>${icon('ChevronRight', 18).outerHTML}</button>`
}

function clientsGridView(route, items, heading) {
  return `
    <section>
      <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-xl font-bold text-[#d8d0bd]">${heading}</h2>
          <p class="text-sm text-[rgba(216,208,189,0.68)]">${filterSummary(items.length)}</p>
        </div>
        <button class="flex items-center gap-2 rounded-lg bg-[#de733e] px-3 py-2 font-bold text-white transition hover:bg-[#c85f2d] focus:outline-none focus:ring-2 focus:ring-[#de733e]/60" data-open-create="${route === 'clientes' ? 'cliente' : 'posible'}">${icon('Plus', 17).outerHTML} Nuevo</button>
      </div>
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        ${items.map((item, index) => clientCard(item, route, index)).join('') || emptyState()}
      </div>
    </section>
  `
}

function clientCard(item, route, index) {
  const railClass = route === 'posibles' || index % 3 === 2 ? 'action' : ''
  return `
    <button class="entity-card w-full" data-client="${item.cif}">
      <span class="logo-rail ${railClass}">${logoInitial(item.nombre_empresa)}</span>
      <span class="entity-card-body">
        <span class="entity-card-title block">${item.nombre_empresa}</span>
        <span class="entity-card-meta block">${item.cif} - ${item.estado}</span>
        <span class="my-3 block text-sm text-[rgba(216,208,189,0.72)]">${item.necesidades}</span>
        <span class="flex flex-wrap gap-1">${tags(item.tags)}</span>
      </span>
    </button>
  `
}

function newClientModal() {
  return `
    <div class="modal-backdrop" role="presentation" data-close-new-client>
      <section class="crm-modal" role="dialog" aria-modal="true" aria-labelledby="new-client-title" data-modal-panel>
        <div class="crm-modal-header">
          <div>
            <p class="modal-kicker">Nuevo registro</p>
            <h2 id="new-client-title">Crear cliente</h2>
          </div>
          <button class="icon-button" type="button" title="Cerrar" data-close-new-client>${icon('X', 18).outerHTML}</button>
        </div>
        <form id="new-client-form" class="crm-form">
          <div class="form-grid">
            <label>
              <span>CIF</span>
              <input name="cif" autocomplete="off" required placeholder="B12345678" />
            </label>
            <label>
              <span>Nombre empresa</span>
              <input name="nombre_empresa" autocomplete="organization" required placeholder="Argonesa Informatica" />
            </label>
            <label>
              <span>Telefono contacto</span>
              <input name="telefono_contacto" autocomplete="tel" placeholder="+34 600 000 000" />
            </label>
            <label>
              <span>Direccion</span>
              <input name="direccion" autocomplete="street-address" placeholder="Calle Industria 12, Valencia" />
            </label>
          </div>
          <label>
            <span>Necesidades</span>
            <textarea name="necesidades" rows="4" placeholder="Automatizaciones, APIs necesarias, integraciones previstas..."></textarea>
          </label>
          <label>
            <span>URL archivos adjuntos</span>
            <input name="url_archivos_adjuntos" placeholder="https://..." />
          </label>
          ${state.newClientError ? `<p class="form-error">${escapeHtml(state.newClientError)}</p>` : ''}
          <div class="crm-modal-actions">
            <button type="button" class="secondary-button" data-close-new-client>Cancelar</button>
            <button type="submit" class="primary-button">${icon('Plus', 17).outerHTML} Crear cliente</button>
          </div>
        </form>
      </section>
    </div>
  `
}

function createRecordModal(type) {
  const config = createModalConfig(type)
  if (!config) return ''
  return `
    <div class="modal-backdrop" role="presentation" data-close-create-modal>
      <section class="crm-modal" role="dialog" aria-modal="true" aria-labelledby="create-modal-title" data-modal-panel>
        <div class="crm-modal-header">
          <div>
            <p class="modal-kicker">${config.kicker}</p>
            <h2 id="create-modal-title">${config.title}</h2>
          </div>
          <button class="icon-button" type="button" title="Cerrar" data-close-create-modal>${icon('X', 18).outerHTML}</button>
        </div>
        <form class="crm-form" data-create-form="${type}">
          ${config.body}
          ${state.createModalError ? `<p class="form-error">${escapeHtml(state.createModalError)}</p>` : ''}
          <div class="crm-modal-actions">
            <button type="button" class="secondary-button" data-close-create-modal>Cancelar</button>
            <button type="submit" class="primary-button">${icon('Plus', 17).outerHTML} ${config.submit}</button>
          </div>
        </form>
      </section>
    </div>
  `
}

function createModalConfig(type) {
  const apiFields = `
    <div class="form-grid">
      <label>
        <span>ID</span>
        <input name="id" required placeholder="${type === 'api_plantilla' ? 'TPL-WEBHOOK-001' : 'API-ACME-001'}" />
      </label>
      <label>
        <span>Nombre</span>
        <input name="nombre" required placeholder="${type === 'api_plantilla' ? 'Plantilla Webhook' : 'Conector ERP Acme'}" />
      </label>
    </div>
    <label>
      <span>Descripcion</span>
      <textarea name="descripcion" rows="4" placeholder="Funcion de la API, integraciones y uso previsto..."></textarea>
    </label>
    <label>
      <span>URL repositorio</span>
      <input name="url" placeholder="https://github.com/empresa/api" />
    </label>
  `

  if (type === 'cliente') {
    return {
      kicker: 'Nuevo registro',
      title: 'Crear cliente',
      submit: 'Crear cliente',
      body: clientFormFields(),
    }
  }
  if (type === 'posible') {
    return {
      kicker: 'Nuevo registro',
      title: 'Crear posible cliente',
      submit: 'Crear posible cliente',
      body: `
        ${clientFormFields('Nuevo')}
        <div class="form-grid">
          <label>
            <span>Estado</span>
            <input name="estado" placeholder="Nuevo, Contactado, Propuesta..." />
          </label>
          <label>
            <span>Tickets</span>
            <input name="tickets" placeholder="Notas o tickets iniciales" />
          </label>
        </div>
      `,
    }
  }
  if (type === 'api_plantilla') {
    return { kicker: 'Nueva API', title: 'Crear API plantilla', submit: 'Crear API plantilla', body: apiFields }
  }
  if (type === 'api_especifica') {
    return { kicker: 'Nueva API', title: 'Crear API especifica', submit: 'Crear API especifica', body: apiFields }
  }
  if (type === 'factura') {
    return {
      kicker: 'Nuevo documento',
      title: 'Crear factura',
      submit: 'Crear factura',
      body: `
        <div class="form-grid">
          <label>
            <span>Cliente</span>
            <select name="cif_cliente" required>
              <option value="">Selecciona cliente</option>
              ${state.data.clientes.map((client) => `<option value="${client.cif}">${client.nombre_empresa} - ${client.cif}</option>`).join('')}
            </select>
          </label>
          <label>
            <span>Nombre empresa</span>
            <input name="nombre_empresa" required placeholder="Empresa facturada" />
          </label>
          <label>
            <span>Coste facturacion</span>
            <input name="coste_facturacion" type="number" min="0" step="0.01" required placeholder="750.00" />
          </label>
          <label>
            <span>Fecha</span>
            <input name="fecha" type="date" />
          </label>
        </div>
        <label>
          <span>URL factura</span>
          <input name="url_factura" placeholder="https://..." />
        </label>
      `,
    }
  }
  return null
}

function clientFormFields() {
  return `
    <div class="form-grid">
      <label>
        <span>CIF</span>
        <input name="cif" autocomplete="off" required placeholder="B12345678" />
      </label>
      <label>
        <span>Nombre empresa</span>
        <input name="nombre_empresa" autocomplete="organization" required placeholder="Argonesa Informatica" />
      </label>
      <label>
        <span>Telefono contacto</span>
        <input name="telefono_contacto" autocomplete="tel" placeholder="+34 600 000 000" />
      </label>
      <label>
        <span>Direccion</span>
        <input name="direccion" autocomplete="street-address" placeholder="Calle Industria 12, Valencia" />
      </label>
    </div>
    <label>
      <span>Necesidades</span>
      <textarea name="necesidades" rows="4" placeholder="Automatizaciones, APIs necesarias, integraciones previstas..."></textarea>
    </label>
    <label>
      <span>URL archivos adjuntos</span>
      <input name="url_archivos_adjuntos" placeholder="https://..." />
    </label>
  `
}

function listView(route, items, heading, compact = false) {
  const rows = items.map((item) => `
    <button class="table-row w-full text-left hover:bg-[#3a3936]" style="grid-template-columns: minmax(150px, 1fr) minmax(120px, .65fr) minmax(160px, 1fr) 32px" data-client="${item.cif}">
      <span><strong class="block text-[#d8d0bd]">${item.nombre_empresa}</strong><small class="text-[rgba(216,208,189,0.68)]">${item.cif}</small></span>
      <span class="text-sm text-[rgba(216,208,189,0.72)]">${item.estado}</span>
      <span class="flex flex-wrap gap-1">${tags(item.tags)}</span>
      ${icon('ChevronRight', 18).outerHTML}
    </button>
  `).join('')

  return `
    <section class="panel overflow-hidden">
      <div class="flex items-center justify-between border-b border-[rgba(255,253,244,0.12)] p-4">
        <h2 class="font-bold">${heading}</h2>
        <button class="icon-button" title="Anadir">${icon('Plus', 18).outerHTML}</button>
      </div>
      <div class="overflow-x-auto">${rows}</div>
      ${state.selectedClient && !compact ? clientDetail(state.selectedClient, route) : ''}
    </section>
  `
}

function clientDetail(cif, route) {
  const item = [...state.data.clientes, ...state.data.posibles].find((client) => client.cif === cif)
  if (!item) return ''
  return `
    <div class="grid gap-5 rounded-lg border border-[rgba(255,253,244,0.12)] bg-[#282826] p-5 lg:grid-cols-[1fr_320px]">
      <div>
        <h3 class="text-xl font-bold">${item.nombre_empresa}</h3>
        <p class="mt-1 text-sm text-[rgba(216,208,189,0.68)]">${item.cif} - ${item.telefono_contacto} - ${item.direccion}</p>
        <div class="my-4 flex flex-wrap gap-2">${tags(item.tags)}</div>
        ${tagManager(route === 'posibles' ? 'posible_cliente' : 'cliente', item.cif, item.tags)}
        <p class="rounded-lg border border-[rgba(255,253,244,0.12)] bg-[#2b2b29] p-4 text-[#d8d0bd]">${item.necesidades}</p>
      </div>
      <div class="grid gap-3">
        <info-block title="APIs plantilla" items="${item.apis_plantilla.map((api) => `${api.id} ${api.nombre}`).join('|')}"></info-block>
        <info-block title="${route === 'posibles' ? 'APIs recomendadas' : 'APIs especificas'}" items="${item.apis_especificas.map((api) => `${api.id} ${api.nombre}`).join('|') || 'Sin API especifica'}"></info-block>
      </div>
    </div>
  `
}

function clientProfileView(cif, route) {
  const item = [...state.data.clientes, ...state.data.posibles].find((client) => client.cif === cif)
  if (!item) {
    state.selectedClient = null
    return clientsGridView(route, [], 'Cliente no encontrado')
  }

  const entityType = route === 'posibles' ? 'posible_cliente' : 'cliente'
  const invoices = (state.data.facturas || []).filter((invoice) => invoice.cif_cliente === item.cif)
  const contracts = (state.data.contratos || []).filter((contract) => contract.cif_cliente === item.cif)
  const templateApis = item.apis_plantilla || []
  const specificApis = item.apis_especificas || []

  return `
    <section class="client-profile">
      <button class="repo-back" data-client-back>${icon('ArrowLeft', 17).outerHTML} Volver a clientes</button>
      <div class="client-profile-shell">
        <aside class="client-status-panel">
          <div class="client-avatar">${logoInitial(item.nombre_empresa)}</div>
          <h2>${item.nombre_empresa}</h2>
          <p>${item.estado}</p>
          <div class="client-contact-list">
            <span>${icon('Phone', 15).outerHTML}${item.telefono_contacto || 'Sin telefono'}</span>
            <span>${icon('MapPin', 15).outerHTML}${item.direccion || 'Sin direccion'}</span>
          </div>
          ${tagManager(entityType, item.cif, item.tags)}
        </aside>
        <main class="client-profile-main">
          <section class="client-section">
            <div class="client-section-title">
              ${icon('Building2', 18).outerHTML}
              <h3>Informacion de empresa</h3>
            </div>
            <div class="client-info-grid">
              ${infoItem('CIF', item.cif)}
              ${infoItem('Nombre empresa', item.nombre_empresa)}
              ${infoItem('Telefono contacto', item.telefono_contacto || 'Sin telefono')}
              ${infoItem('Direccion', item.direccion || 'Sin direccion')}
            </div>
          </section>
          <section class="client-section">
            <div class="client-section-title">
              ${icon('MessageSquareText', 18).outerHTML}
              <h3>Necesidades</h3>
            </div>
            <p class="client-need">${item.necesidades || 'Sin necesidades registradas.'}</p>
          </section>
          <section class="client-section">
            <div class="client-section-title">
              ${icon('Boxes', 18).outerHTML}
              <h3>${route === 'posibles' ? 'APIs recomendadas' : 'APIs relacionadas'}</h3>
            </div>
            <div class="client-mini-grid">
              ${templateApis.map((api) => miniApiCard(api, 'plantillas')).join('') || miniEmpty('Sin APIs plantilla relacionadas.')}
              ${specificApis.map((api) => miniApiCard(api, 'especificas')).join('')}
            </div>
          </section>
          <section class="client-section">
            <div class="client-section-title">
              ${icon('FileArchive', 18).outerHTML}
              <h3>Archivos adjuntos</h3>
            </div>
            <div class="client-file-strip">
              ${clientFiles(item).map((file) => `
                <button class="client-file-card">
                  ${icon(file.icon, 22).outerHTML}
                  <span>${file.name}</span>
                </button>
              `).join('')}
            </div>
          </section>
          <section class="client-section">
            <div class="client-section-title">
              ${icon('BadgeEuro', 18).outerHTML}
              <h3>Facturas y contratos</h3>
            </div>
            <div class="client-ledger">
              ${invoices.map((invoice) => ledgerRow('Factura', `#${invoice.id}`, `${Number(invoice.coste_facturacion).toLocaleString('es-ES')} EUR`, invoice.fecha)).join('') || miniEmpty('Sin facturas registradas.')}
              ${contracts.map((contract) => ledgerRow('Contrato', `#${contract.id}`, contract.nombre_empresa, contract.fecha)).join('') || ''}
            </div>
          </section>
        </main>
      </div>
    </section>
  `
}

function infoItem(label, value) {
  return `<div class="client-info-item"><span>${label}</span><strong>${value}</strong></div>`
}

function miniApiCard(api, route) {
  return `
    <button class="client-mini-api" data-api-route="${route}" data-api-id="${api.id}">
      ${icon(route === 'plantillas' ? 'Boxes' : 'BriefcaseBusiness', 18).outerHTML}
      <span><strong>${api.nombre}</strong><small>${api.id}</small></span>
    </button>
  `
}

function miniEmpty(text) {
  return `<p class="client-empty-note">${text}</p>`
}

function clientFiles(item) {
  return [
    { icon: 'FileText', name: `${item.cif}-resumen.md` },
    { icon: 'FileArchive', name: 'documentacion.zip' },
    { icon: 'FileText', name: 'notas-comerciales.txt' },
    { icon: 'FileArchive', name: 'adjuntos-cliente' },
  ]
}

function ledgerRow(type, id, amount, date) {
  return `
    <div class="client-ledger-row">
      <span>${type}</span>
      <strong>${id}</strong>
      <span>${amount}</span>
      <small>${date || 'Sin fecha'}</small>
    </div>
  `
}

function apiGrid(route, items, heading) {
  return `
    <section>
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-bold text-[#d8d0bd]">${heading}</h2>
        <button class="flex items-center gap-2 rounded-lg bg-[#de733e] px-3 py-2 font-bold text-white" data-open-create="${route === 'plantillas' ? 'api_plantilla' : 'api_especifica'}">${icon('Plus', 17).outerHTML} Nueva</button>
      </div>
      <div class="grid gap-4 xl:grid-cols-2">
        ${items.map((item) => `
          <button class="api-card" data-api-route="${route}" data-api-id="${item.id}">
            <div class="logo-rail ${route === 'plantillas' ? '' : 'action'}">${icon(route === 'plantillas' ? 'Boxes' : 'BriefcaseBusiness', 30).outerHTML}</div>
            <div class="api-card-body">
              <div class="mb-2 flex items-start justify-between gap-3">
                <h3 class="api-card-title">${item.nombre}</h3>
                <span class="shrink-0 text-xs font-bold text-[#7c8569]">${item.id}</span>
              </div>
              <p class="text-sm text-[rgba(216,208,189,0.72)]">${item.descripcion}</p>
              <div class="mt-4 flex flex-wrap gap-1">${tags(item.tags)}</div>
              <div class="mt-4 border-t border-[rgba(255,253,244,0.12)] pt-3 text-sm text-[rgba(216,208,189,0.68)]">
                <p>Clientes: ${(item.clientes_relacionados || []).join(', ') || 'Sin relacion'}</p>
                <p class="truncate">Repositorio: ${item.url}</p>
              </div>
            </div>
          </button>
        `).join('') || emptyState()}
      </div>
    </section>
  `
}

function apiRepositoryView(selection) {
  const api = findApi(selection)
  if (!api) {
    state.selectedApi = null
    return apiGrid(selection.route, [], 'API no encontrada')
  }

  const key = repositoryKey(selection)
  const files = state.repositoryFiles[key] || []
  const isLoading = state.repositoryLoading === key
  const loadError = state.repositoryErrors[key]
  return `
    <section class="repo-view">
      <button class="repo-back" data-api-back>${icon('ArrowLeft', 17).outerHTML} Volver a APIs</button>
      <div class="repo-header">
        <div class="repo-title-group">
          <span class="repo-mark">${icon(selection.route === 'plantillas' ? 'Boxes' : 'BriefcaseBusiness', 24).outerHTML}</span>
          <div>
            <p class="repo-owner">CRM APIs / ${selection.route === 'plantillas' ? 'plantillas' : 'especificas'}</p>
            <h2>${api.nombre}</h2>
          </div>
        </div>
        <div class="repo-meta">
          <span>${api.id}</span>
          <span>${icon('GitCommit', 15).outerHTML} ${shortCommit(api.id)}</span>
        </div>
      </div>
      <p class="repo-description">${api.descripcion}</p>
      <div class="mb-4 flex flex-wrap gap-1">${tags(api.tags)}</div>
      ${tagManager(selection.route === 'plantillas' ? 'api_plantilla' : 'api_especifica', api.id, api.tags)}
      <div class="repo-file-panel">
        <div class="repo-commit-row">
          <strong>${state.authUser || 'CRM'}</strong>
          <span>${api.descripcion || 'Ultima actualizacion del repositorio.'}</span>
          <small>${icon('Clock', 14).outerHTML} ahora</small>
        </div>
        <div class="repo-file-list">
          ${repositoryFileRows(files, isLoading, loadError)}
        </div>
      </div>
      <div class="repo-readme">
        <div class="repo-readme-title">${icon('FileText', 18).outerHTML} README.md</div>
        <p>${api.descripcion}</p>
        <p>Repositorio asociado: ${api.url || 'sin URL registrada'}</p>
        <p>Clientes relacionados: ${(api.clientes_relacionados || []).join(', ') || 'sin clientes relacionados'}</p>
      </div>
    </section>
  `
}

function findApi(selection) {
  const source = selection.route === 'plantillas' ? state.data.plantillas : state.data.especificas
  return source.find((api) => api.id === selection.id)
}

function repositoryFileRows(files, isLoading, loadError) {
  if (isLoading) {
    return '<div class="repo-file-state">Cargando archivos desde GitHub...</div>'
  }
  if (loadError) {
    return `<div class="repo-file-state error">${escapeHtml(loadError)}</div>`
  }
  if (!files.length) {
    return '<div class="repo-file-state">El repositorio no contiene archivos en esta ruta.</div>'
  }

  return files.map((file) => `
    <a class="repo-file-row" href="${escapeHtml(file.html_url || '#')}" target="_blank" rel="noreferrer">
      <span class="repo-file-name">${icon(file.item_type === 'folder' ? 'Folder' : 'FileText', 18).outerHTML}${escapeHtml(file.name)}</span>
      <span class="repo-file-message">${escapeHtml(file.path || file.name)}</span>
      <span class="repo-file-time">${file.item_type === 'folder' ? 'Carpeta' : formatFileSize(file.size)}</span>
    </a>
  `).join('')
}

function formatFileSize(size) {
  if (!Number.isFinite(Number(size))) return 'Archivo'
  const bytes = Number(size)
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function shortCommit(value) {
  let hash = 0
  for (const char of value) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0
  return Math.abs(hash).toString(16).padStart(6, '0').slice(0, 7)
}

function invoicesView(items = state.data.facturas) {
  return `
    <section class="panel overflow-hidden">
      <div class="flex items-center justify-between border-b border-[rgba(255,253,244,0.12)] p-4">
        <h2 class="font-bold">Facturas</h2>
        <button class="icon-button" title="Nueva factura" data-open-create="factura">${icon('Plus', 18).outerHTML}</button>
      </div>
      ${items.map((invoice) => `
        <div class="table-row" style="grid-template-columns: 90px minmax(160px, 1fr) 140px 140px 40px">
          <strong>#${invoice.id}</strong>
          <span>${invoice.nombre_empresa}<small class="block text-[rgba(216,208,189,0.68)]">${invoice.cif_cliente}</small></span>
          <span>${invoice.fecha}</span>
          <span class="font-bold">${Number(invoice.coste_facturacion).toLocaleString('es-ES')} EUR</span>
          <button class="icon-button" title="Archivo">${icon('FileArchive', 18).outerHTML}</button>
        </div>
      `).join('') || '<p class="p-6 text-[rgba(216,208,189,0.68)]">Sin registros.</p>'}
    </section>
  `
}

function logoInitial(value) {
  return (value || '?').trim().charAt(0).toUpperCase()
}

function tagManager(entityType, entityId, currentTags = []) {
  const currentIds = new Set(currentTags.map((tag) => String(tag.id)))
  const availableTags = (state.data.tags || []).filter((tag) => !currentIds.has(String(tag.id)))

  return `
    <div class="tag-manager" data-tag-scope="${entityType}" data-tag-entity="${entityId}">
      <div class="tag-manager-head">
        <strong>Etiquetas</strong>
        <select class="tag-select" data-tag-add ${availableTags.length ? '' : 'disabled'}>
          <option value="">Añadir etiqueta</option>
          ${availableTags.map((tag) => `<option value="${tag.id}">#${tag.nombre}</option>`).join('')}
        </select>
      </div>
      <div class="tag-manager-list">
        ${currentTags.map((tag) => `
          <button class="tag tag-removable" style="background:${tag.color || '#52493a'}" data-tag-remove="${tag.id}" title="Quitar etiqueta #${tag.nombre}">
            #${tag.nombre} ${icon('X', 12).outerHTML}
          </button>
        `).join('') || '<span class="tag-empty">Sin etiquetas asignadas.</span>'}
      </div>
    </div>
  `
}

async function mutateTag(action, entityType, entityId, tagId) {
  const response = await fetch(`${API_BASE}/tags/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({
      entity_type: entityType,
      entity_id: entityId,
      tag_id: Number(tagId),
    }),
  })

  if (!response.ok) throw new Error('No se pudo actualizar la etiqueta')
  await loadApiData()
}

function filterRecords(items) {
  const terms = searchTerms()
  if (!terms.length) return items

  return items.filter((item) => {
    const tagTerms = terms.filter((term) => term.isTag)
    if (tagTerms.length) {
      return tagTerms.every((term) => itemHasTag(item, term.value))
    }

    return terms.every((term) => searchable(item).includes(term.value))
  })
}

function searchTerms() {
  return state.query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean)
    .map((term) => ({
      isTag: term.startsWith('#'),
      value: normalizeSearch(term.replace(/^#/, '')),
    }))
    .filter((term) => term.value)
}

function itemHasTag(item, value) {
  return (item.tags || []).some((tag) => normalizeSearch(tag.nombre).includes(value))
}

function filterSummary(count) {
  if (!state.query.trim()) return 'Vista de tarjetas sin agrupacion por estado.'
  return `${count} registros visibles para "${escapeHtml(state.query)}".`
}

function emptyState() {
  return '<p class="rounded-lg border border-dashed border-[rgba(255,253,244,0.16)] p-4 text-sm text-[rgba(216,208,189,0.68)]">Sin registros para este filtro.</p>'
}

function tags(values = []) {
  return values.map((tag) => `<span class="tag" style="background:${tag.color || '#52493a'}">#${tag.nombre}</span>`).join('')
}

function searchable(item) {
  return [
    item.cif,
    item.id,
    item.nombre_empresa,
    item.nombre,
    item.cif_cliente,
    ...(item.tags || []).map((tag) => tag.nombre),
  ].filter(Boolean).join(' ').toLowerCase().replaceAll('_', ' ')
}

function normalizeSearch(value) {
  return String(value).toLowerCase().replaceAll('_', ' ')
}

function routeTitle() {
  return {
    dashboard: 'Pantalla inicial',
    clientes: 'Clientes',
    posibles: 'Posibles clientes',
    plantillas: 'APIs plantilla',
    especificas: 'APIs especificas',
    facturas: 'Facturas',
  }[state.route] || 'CRM'
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char])
}

function bindEvents() {
  document.querySelector('#login-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const usuario = String(form.get('user') || '')
    const contrasenya = String(form.get('password') || '')

    loginUser(usuario, contrasenya)
      .then(async (session) => {
        state.authToken = session.token
        state.authUser = session.usuario
        state.loginError = ''
        state.route = 'dashboard'
        sessionStorage.setItem('crm_auth_token', session.token)
        sessionStorage.setItem('crm_auth_user', session.usuario)
        await loadApiData()
        render()
      })
      .catch((error) => {
        state.loginError = error.message
        render()
      })
  })
  document.querySelectorAll('[data-route]').forEach((button) => {
    button.addEventListener('click', () => {
      state.route = button.dataset.route
      state.selectedClient = null
      state.selectedApi = null
      state.showNewClientModal = false
      state.newClientError = ''
      state.activeCreateModal = ''
      state.createModalError = ''
      render()
    })
  })
  document.querySelector('[data-new-client]')?.addEventListener('click', () => {
    state.showNewClientModal = true
    state.newClientError = ''
    render()
  })
  document.querySelectorAll('[data-open-create]').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeCreateModal = button.dataset.openCreate
      state.createModalError = ''
      state.showNewClientModal = false
      render()
    })
  })
  document.querySelector('[data-modal-panel]')?.addEventListener('click', (event) => {
    event.stopPropagation()
  })
  document.querySelectorAll('[data-close-new-client]').forEach((button) => {
    button.addEventListener('click', () => {
      state.showNewClientModal = false
      state.newClientError = ''
      render()
    })
  })
  document.querySelectorAll('[data-close-create-modal]').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeCreateModal = ''
      state.createModalError = ''
      render()
    })
  })
  document.querySelector('#new-client-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = {
      cif: String(form.get('cif') || ''),
      nombre_empresa: String(form.get('nombre_empresa') || ''),
      telefono_contacto: String(form.get('telefono_contacto') || ''),
      necesidades: String(form.get('necesidades') || ''),
      direccion: String(form.get('direccion') || ''),
      url_archivos_adjuntos: String(form.get('url_archivos_adjuntos') || ''),
    }

    createClient(payload)
      .then(async (client) => {
        await loadApiData()
        state.route = 'clientes'
        state.selectedClient = client.cif
        state.showNewClientModal = false
        state.newClientError = ''
        render()
      })
      .catch((error) => {
        state.newClientError = error.message
        render()
      })
  })
  document.querySelector('[data-create-form]')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const type = event.currentTarget.dataset.createForm
    const form = new FormData(event.currentTarget)
    const { path, label, payload, afterCreate } = createPayload(type, form)

    createRecord(path, payload, label)
      .then(async (record) => {
        await loadApiData()
        state.activeCreateModal = ''
        state.createModalError = ''
        afterCreate(record)
        render()
      })
      .catch((error) => {
        state.createModalError = error.message
        render()
      })
  })
  document.querySelectorAll('[data-api-id]').forEach((row) => {
    row.addEventListener('click', () => {
      selectApi(row.dataset.apiRoute, row.dataset.apiId)
    })
  })
  document.querySelector('[data-api-back]')?.addEventListener('click', () => {
    state.selectedApi = null
    render()
  })
  document.querySelector('[data-client-back]')?.addEventListener('click', () => {
    state.selectedClient = null
    render()
  })
  document.querySelectorAll('[data-tag-add]').forEach((select) => {
    select.addEventListener('change', (event) => {
      const scope = event.currentTarget.closest('[data-tag-scope]')
      const tagId = event.currentTarget.value
      if (!scope || !tagId) return
      mutateTag('add', scope.dataset.tagScope, scope.dataset.tagEntity, tagId)
        .then(() => render())
        .catch((error) => {
          state.loginError = error.message
          render()
        })
    })
  })
  document.querySelectorAll('[data-tag-remove]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      const scope = event.currentTarget.closest('[data-tag-scope]')
      if (!scope) return
      mutateTag('remove', scope.dataset.tagScope, scope.dataset.tagEntity, event.currentTarget.dataset.tagRemove)
        .then(() => render())
        .catch((error) => {
          state.loginError = error.message
          render()
        })
    })
  })
  document.querySelectorAll('[data-client]').forEach((row) => {
    row.addEventListener('click', () => {
      state.selectedClient = row.dataset.client
      render()
    })
  })
  document.querySelector('#global-search')?.addEventListener('input', (event) => {
    const cursorStart = event.target.selectionStart ?? event.target.value.length
    const cursorEnd = event.target.selectionEnd ?? cursorStart
    state.query = event.target.value
    state.selectedApi = null
    state.selectedClient = null
    render()
    const searchInput = document.querySelector('#global-search')
    searchInput?.focus()
    searchInput?.setSelectionRange(cursorStart, cursorEnd)
  })
  document.querySelector('#logout')?.addEventListener('click', () => {
    state.query = ''
    state.activeCreateModal = ''
    state.createModalError = ''
    clearSession()
    render()
  })
}

if (!customElements.get('info-block')) {
  customElements.define('info-block', class extends HTMLElement {
    connectedCallback() {
      const title = this.getAttribute('title')
      const items = (this.getAttribute('items') || '').split('|').filter(Boolean)
      this.innerHTML = `<div class="rounded-lg border border-[rgba(255,253,244,0.12)] bg-[#2b2b29] p-4"><p class="mb-2 text-sm font-bold text-[#de733e]">${title}</p>${items.map((item) => `<p class="text-sm text-[rgba(216,208,189,0.72)]">${item}</p>`).join('')}</div>`
    }
  })
}

boot()
