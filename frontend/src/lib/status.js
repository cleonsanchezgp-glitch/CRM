import { state } from './state.js'

export const STATUS_TAG_TYPE = 'estado_proyecto'
const STATUS_LABEL_ORDER = ['Sin iniciar', 'En curso', 'Finalizado']

export function isStatusTag(tag) {
  return tag?.tipo === STATUS_TAG_TYPE
}

export function statusTagOptions() {
  const statusTags = (state.data.tags || []).filter(isStatusTag)
  return STATUS_LABEL_ORDER
    .map((label) => statusTags.find((tag) => tag.nombre === label))
    .filter(Boolean)
}

export function currentStatusTag(itemTags = []) {
  return itemTags.find(isStatusTag) || null
}

export function nonStatusTags(itemTags = []) {
  return itemTags.filter((tag) => !isStatusTag(tag))
}

export function countByStatus(items, label) {
  return items.filter((item) => (item.tags || []).some((tag) => isStatusTag(tag) && tag.nombre === label)).length
}
