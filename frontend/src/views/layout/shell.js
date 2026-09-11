import tpl from './shell.html?raw'
import navItemTpl from './nav-item.html?raw'
import { compile, escapeHtml } from '../../templates/engine.js'
import { icon } from '../../lib/icons.js'
import { state } from '../../lib/state.js'
import { routeTitle } from '../../lib/format.js'
import { filterRecords } from '../../lib/search.js'
import { clientsGridView } from '../clients/clients-grid.js'
import { clientProfileView } from '../clients/client-profile.js'
import { apiGrid } from '../apis/api-grid.js'
import { apiRepositoryView } from '../apis/api-repository.js'
import { invoicesView } from '../invoices/invoices.js'
import { dashboardView } from './dashboard.js'
import { newClientModal } from '../modals/new-client-modal.js'
import { createRecordModal } from '../modals/create-record-modal.js'

const render = compile(tpl)
const navItem = compile(navItemTpl)

const NAV_ITEMS = [
  ['dashboard', 'Home', 'Inicio'],
  ['clientes', 'Building2', 'Clientes'],
  ['posibles', 'Users', 'Posibles clientes'],
  ['plantillas', 'Boxes', 'APIs plantilla'],
  ['especificas', 'BriefcaseBusiness', 'APIs especificas'],
  ['facturas', 'BadgeEuro', 'Facturas'],
]

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

export function shellView() {
  return render({
    sidebarOpenClass: state.sidebarOpen ? 'sidebar-open' : '',
    boxesIcon: icon('Boxes', 22).outerHTML,
    navItemsHtml: NAV_ITEMS.map(([route, iconName, label]) => navItem({
      route,
      label,
      activeClass: state.route === route ? 'active' : '',
      icon: icon(iconName, 20).outerHTML,
    })).join(''),
    apiStatusLabel: state.apiOnline ? 'API conectada' : 'Modo demo local',
    title: routeTitle(),
    searchIcon: icon('Search', 18).outerHTML,
    query: state.query,
    bellIcon: icon('Bell', 19).outerHTML,
    logoutIcon: icon('LogOut', 19).outerHTML,
    actionErrorHtml: state.actionError ? `<p class="form-error action-error">${escapeHtml(state.actionError)}</p>` : '',
    activeViewHtml: activeView(),
    newClientModalHtml: state.showNewClientModal ? newClientModal() : '',
    createModalHtml: state.activeCreateModal ? createRecordModal(state.activeCreateModal) : '',
  })
}
