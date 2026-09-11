import tpl from './tag-manager.html?raw'
import removableTpl from './tag-removable.html?raw'
import { compile } from '../../templates/engine.js'
import { state } from '../../lib/state.js'
import { icon } from '../../lib/icons.js'
import { nonStatusTags } from '../../lib/status.js'

const render = compile(tpl)
const removableTag = compile(removableTpl)

export function tagManager(entityType, entityId, currentTags = []) {
  currentTags = nonStatusTags(currentTags)
  const currentIds = new Set(currentTags.map((tag) => String(tag.id)))
  const availableTags = nonStatusTags(state.data.tags || []).filter((tag) => !currentIds.has(String(tag.id)))
  const closeIcon = icon('X', 12).outerHTML

  return render({
    entityType,
    entityId,
    disabledAttr: availableTags.length ? '' : 'disabled',
    availableTags,
    currentTags: currentTags.map((tag) => removableTag({
      id: tag.id,
      nombre: tag.nombre,
      color: tag.color || '#52493a',
      closeIcon,
    })),
  })
}
