import { state } from './state.js'

export function formatFileSize(size) {
  if (!Number.isFinite(Number(size))) return 'Archivo'
  const bytes = Number(size)
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function shortCommit(value) {
  let hash = 0
  for (const char of value) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0
  return Math.abs(hash).toString(16).padStart(6, '0').slice(0, 7)
}

export function logoInitial(value) {
  return (value || '?').trim().charAt(0).toUpperCase()
}

export function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function routeTitle() {
  return {
    dashboard: 'Pantalla inicial',
    clientes: 'Clientes',
    posibles: 'Posibles clientes',
    plantillas: 'APIs plantilla',
    especificas: 'APIs especificas',
    facturas: 'Facturas',
  }[state.route] || 'CRM'
}
