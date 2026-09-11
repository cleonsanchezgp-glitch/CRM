import gridTpl from './api-grid.html?raw'
import cardTpl from './api-card.html?raw'
import emptyStateTpl from '../shared/empty-state.html?raw'
import { compile } from '../../templates/engine.js'
import { icon } from '../../lib/icons.js'
import { tags } from '../shared/tags.js'
import { nonStatusTags } from '../../lib/status.js'
import { statusSelector } from './status-selector.js'

const render = compile(gridTpl)
const card = compile(cardTpl)

export function apiGrid(route, items, heading) {
  const entityType = route === 'plantillas' ? 'api_plantilla' : 'api_especifica'
  return render({
    heading,
    createType: entityType,
    plusIcon: icon('Plus', 17).outerHTML,
    cardsHtml: items.map((item) => card({
      route,
      apiKind: route === 'plantillas' ? 'plantilla' : 'especifica',
      deleteIcon: icon('Trash2', 16).outerHTML,
      id: item.id,
      railClass: route === 'plantillas' ? '' : 'action',
      icon: icon(route === 'plantillas' ? 'Boxes' : 'BriefcaseBusiness', 30).outerHTML,
      nombre: item.nombre,
      descripcion: item.descripcion,
      tagsHtml: tags(nonStatusTags(item.tags)),
      statusHtml: statusSelector(entityType, item.id, item.tags),
      clientesRelacionados: (item.clientes_relacionados || []).join(', ') || 'Sin relacion',
      url: item.url,
    })).join('') || emptyStateTpl,
  })
}
