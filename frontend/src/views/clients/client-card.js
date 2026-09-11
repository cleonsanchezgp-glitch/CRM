import tpl from './client-card.html?raw'
import { compile } from '../../templates/engine.js'
import { logoInitial } from '../../lib/format.js'
import { tags } from '../shared/tags.js'
import { icon } from '../../lib/icons.js'

const render = compile(tpl)

export function clientCard(item, route, index) {
  const railClass = route === 'posibles' || index % 3 === 2 ? 'action' : ''
  return render({
    cif: item.cif,
    clientKind: route === 'posibles' ? 'posible' : 'cliente',
    deleteIcon: icon('Trash2', 16).outerHTML,
    railClass,
    logoInitial: logoInitial(item.nombre_empresa),
    nombre_empresa: item.nombre_empresa,
    estado: item.estado,
    necesidades: item.necesidades,
    tagsHtml: tags(item.tags),
  })
}
