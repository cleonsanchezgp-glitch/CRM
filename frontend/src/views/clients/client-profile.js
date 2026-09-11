import tpl from './client-profile.html?raw'
import fileCardTpl from './client-file-card.html?raw'
import infoItemTpl from './info-item.html?raw'
import miniEmptyTpl from './mini-empty.html?raw'
import miniApiCardTpl from './mini-api-card.html?raw'
import ledgerRowTpl from './ledger-row.html?raw'
import { compile } from '../../templates/engine.js'
import { state } from '../../lib/state.js'
import { icon } from '../../lib/icons.js'
import { logoInitial } from '../../lib/format.js'
import { tagManager } from '../shared/tag-manager.js'
import { clientsGridView } from './clients-grid.js'

const render = compile(tpl)
const fileCard = compile(fileCardTpl)
const infoItem = compile(infoItemTpl)
const miniEmpty = compile(miniEmptyTpl)
const miniApiCard = compile(miniApiCardTpl)
const ledgerRow = compile(ledgerRowTpl)

function clientFiles(item) {
  return [
    { icon: 'FileText', name: `${item.cif}-resumen.md` },
    { icon: 'FileArchive', name: 'documentacion.zip' },
    { icon: 'FileText', name: 'notas-comerciales.txt' },
    { icon: 'FileArchive', name: 'adjuntos-cliente' },
  ]
}

export function clientProfileView(cif, route) {
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

  const infoItemsHtml = [
    infoItem({ label: 'CIF', value: item.cif }),
    infoItem({ label: 'Nombre empresa', value: item.nombre_empresa }),
    infoItem({ label: 'Telefono contacto', value: item.telefono_contacto || 'Sin telefono' }),
    infoItem({ label: 'Direccion', value: item.direccion || 'Sin direccion' }),
  ].join('')

  const miniApisHtml = templateApis.map((api) => miniApiCard({
    route: 'plantillas', id: api.id, nombre: api.nombre, icon: icon('Boxes', 18).outerHTML,
  })).join('') || miniEmpty({ text: 'Sin APIs plantilla relacionadas.' })
  const specificApisHtml = specificApis.map((api) => miniApiCard({
    route: 'especificas', id: api.id, nombre: api.nombre, icon: icon('BriefcaseBusiness', 18).outerHTML,
  })).join('')

  const filesHtml = clientFiles(item).map((file) => fileCard({
    icon: icon(file.icon, 22).outerHTML, name: file.name,
  })).join('')

  const invoiceRows = invoices.map((invoice) => ledgerRow({
    type: 'Factura',
    id: `#${invoice.id}`,
    amount: `${Number(invoice.coste_facturacion).toLocaleString('es-ES')} EUR`,
    date: invoice.fecha || 'Sin fecha',
  })).join('') || miniEmpty({ text: 'Sin facturas registradas.' })
  const contractRows = contracts.map((contract) => ledgerRow({
    type: 'Contrato',
    id: `#${contract.id}`,
    amount: contract.nombre_empresa,
    date: contract.fecha || 'Sin fecha',
  })).join('')

  return render({
    backIcon: icon('ArrowLeft', 17).outerHTML,
    cif: item.cif,
    clientKind: route === 'posibles' ? 'posible' : 'cliente',
    deleteIcon: icon('Trash2', 16).outerHTML,
    deleteLabel: route === 'posibles' ? 'Borrar posible cliente' : 'Borrar cliente',
    avatar: logoInitial(item.nombre_empresa),
    nombre_empresa: item.nombre_empresa,
    estado: item.estado,
    phoneIcon: icon('Phone', 15).outerHTML,
    telefono: item.telefono_contacto || 'Sin telefono',
    mapIcon: icon('MapPin', 15).outerHTML,
    direccion: item.direccion || 'Sin direccion',
    tagManagerHtml: tagManager(entityType, item.cif, item.tags),
    buildingIcon: icon('Building2', 18).outerHTML,
    infoItemsHtml,
    messageIcon: icon('MessageSquareText', 18).outerHTML,
    necesidades: item.necesidades || 'Sin necesidades registradas.',
    boxesIcon: icon('Boxes', 18).outerHTML,
    apisHeading: route === 'posibles' ? 'APIs recomendadas' : 'APIs relacionadas',
    miniApisHtml: miniApisHtml + specificApisHtml,
    fileArchiveIcon: icon('FileArchive', 18).outerHTML,
    filesHtml,
    euroIcon: icon('BadgeEuro', 18).outerHTML,
    ledgerHtml: invoiceRows + contractRows,
  })
}
