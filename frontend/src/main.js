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
}

const state = {
  route: 'login',
  query: '',
  selectedClient: null,
  data: emptyData,
  apiOnline: false,
}

async function boot() {
  await loadApiData()
  render()
}

async function loadApiData() {
  try {
    const [clientes, posibles, plantillas, especificas, facturas] = await Promise.all([
      fetchJson('/clientes'),
      fetchJson('/posibles-clientes'),
      fetchJson('/apis/plantilla'),
      fetchJson('/apis/especificas'),
      fetchJson('/facturas'),
    ])
    state.data = { clientes, posibles, plantillas, especificas, facturas }
    state.apiOnline = true
  } catch {
    state.apiOnline = false
  }
}

async function fetchJson(path) {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) throw new Error(path)
  return response.json()
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
    </div>
  `
}

function navItem(route, iconName, label) {
  return `<button class="nav-item ${state.route === route ? 'active' : ''}" data-route="${route}" title="${label}">${icon(iconName, 20).outerHTML}<span class="sidebar-label">${label}</span></button>`
}

function activeView() {
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
        <button class="flex items-center gap-2 rounded-lg bg-[#de733e] px-3 py-2 font-bold text-white">${icon('Plus', 17).outerHTML} Nuevo</button>
      </div>
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        ${items.map((item, index) => clientCard(item, route, index)).join('') || emptyState()}
      </div>
      ${state.selectedClient && items.some((item) => item.cif === state.selectedClient) ? `<div class="mt-5">${clientDetail(state.selectedClient, route)}</div>` : ''}
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
        <p class="rounded-lg border border-[rgba(255,253,244,0.12)] bg-[#2b2b29] p-4 text-[#d8d0bd]">${item.necesidades}</p>
      </div>
      <div class="grid gap-3">
        <info-block title="APIs plantilla" items="${item.apis_plantilla.map((api) => `${api.id} ${api.nombre}`).join('|')}"></info-block>
        <info-block title="${route === 'posibles' ? 'APIs recomendadas' : 'APIs especificas'}" items="${item.apis_especificas.map((api) => `${api.id} ${api.nombre}`).join('|') || 'Sin API especifica'}"></info-block>
      </div>
    </div>
  `
}

function apiGrid(route, items, heading) {
  return `
    <section>
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-bold text-[#d8d0bd]">${heading}</h2>
        <button class="flex items-center gap-2 rounded-lg bg-[#de733e] px-3 py-2 font-bold text-white">${icon('Plus', 17).outerHTML} Nueva</button>
      </div>
      <div class="grid gap-4 xl:grid-cols-2">
        ${items.map((item) => `
          <article class="api-card">
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
          </article>
        `).join('') || emptyState()}
      </div>
    </section>
  `
}

function invoicesView(items = state.data.facturas) {
  return `
    <section class="panel overflow-hidden">
      <div class="flex items-center justify-between border-b border-[rgba(255,253,244,0.12)] p-4">
        <h2 class="font-bold">Facturas</h2>
        <button class="icon-button" title="Nueva factura">${icon('Plus', 18).outerHTML}</button>
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
    state.route = 'dashboard'
    render()
  })
  document.querySelectorAll('[data-route]').forEach((button) => {
    button.addEventListener('click', () => {
      state.route = button.dataset.route
      state.selectedClient = null
      render()
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
    render()
    const searchInput = document.querySelector('#global-search')
    searchInput?.focus()
    searchInput?.setSelectionRange(cursorStart, cursorEnd)
  })
  document.querySelector('#logout')?.addEventListener('click', () => {
    state.route = 'login'
    state.query = ''
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
