import { state } from './state.js'
import { escapeHtml } from '../templates/engine.js'

export function filterRecords(items) {
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

export function searchTerms() {
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

export function itemHasTag(item, value) {
  return (item.tags || []).some((tag) => normalizeSearch(tag.nombre).includes(value))
}

export function filterSummary(count) {
  if (!state.query.trim()) return 'Vista de tarjetas sin agrupacion por estado.'
  return `${count} registros visibles para "${escapeHtml(state.query)}".`
}

export function searchable(item) {
  return [
    item.cif,
    item.id,
    item.nombre_empresa,
    item.nombre,
    item.cif_cliente,
    ...(item.tags || []).map((tag) => tag.nombre),
  ].filter(Boolean).join(' ').toLowerCase().replaceAll('_', ' ')
}

export function normalizeSearch(value) {
  return String(value).toLowerCase().replaceAll('_', ' ')
}
