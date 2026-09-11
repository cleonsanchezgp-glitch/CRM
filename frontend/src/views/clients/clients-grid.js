import tpl from './clients-grid.html?raw'
import emptyStateTpl from '../shared/empty-state.html?raw'
import { compile } from '../../templates/engine.js'
import { icon } from '../../lib/icons.js'
import { filterSummary } from '../../lib/search.js'
import { clientCard } from './client-card.js'

const render = compile(tpl)

export function clientsGridView(route, items, heading) {
  return render({
    heading,
    summary: filterSummary(items.length),
    createType: route === 'clientes' ? 'cliente' : 'posible',
    plusIcon: icon('Plus', 17).outerHTML,
    cardsHtml: items.map((item, index) => clientCard(item, route, index)).join('') || emptyStateTpl,
  })
}
