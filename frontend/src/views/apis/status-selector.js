import selectorTpl from './status-selector.html?raw'
import optionTpl from './status-option.html?raw'
import { compile } from '../../templates/engine.js'
import { statusTagOptions, currentStatusTag } from '../../lib/status.js'

const render = compile(selectorTpl)
const option = compile(optionTpl)

export function statusSelector(entityType, entityId, itemTags = []) {
  const current = currentStatusTag(itemTags)

  const optionsHtml = statusTagOptions().map((tag) => option({
    tagId: tag.id,
    nombre: tag.nombre,
    color: tag.color,
    activeClass: current && String(current.id) === String(tag.id) ? 'active' : '',
  })).join('')

  return render({
    entityType,
    entityId,
    currentTagId: current ? current.id : '',
    optionsHtml,
  })
}
