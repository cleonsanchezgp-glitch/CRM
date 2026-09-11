import { state, clearSession } from './state.js'
import { render } from '../main.js'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export function authHeaders() {
  return state.authToken ? { Authorization: `Bearer ${state.authToken}` } : {}
}

export async function fetchJson(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: authHeaders(),
  })
  if (response.status === 401) {
    clearSession()
    render()
    throw new Error('unauthorized')
  }
  if (!response.ok) throw new Error(path)
  return response.json()
}

export async function loginUser(usuario, contrasenya) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, contrasenya }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || 'No se pudo iniciar sesion')
  }

  return response.json()
}

export async function verifyAuthToken(token) {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const message = response.status === 403
      ? 'Keycloak ha iniciado sesion, pero el usuario no tiene el rol requerido para el CRM.'
      : 'Keycloak ha iniciado sesion, pero el backend no acepta el token emitido.'
    throw new Error(message)
  }

  return response.json()
}

export async function createClient(payload) {
  return createRecord('/clientes', payload, 'cliente')
}

export async function createRecord(path, payload, label) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  })

  if (response.status === 401) {
    clearSession()
    render()
    throw new Error('Sesion caducada')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    if (response.status === 404 || response.status === 405) {
      throw new Error(`El backend no tiene activa la ruta para crear ${label}. Reinicia el backend.`)
    }
    throw new Error(body.error || `No se pudo crear ${label}`)
  }

  return response.json()
}

export async function deleteRecord(path, label) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })

  if (response.status === 401) {
    clearSession()
    render()
    throw new Error('Sesion caducada')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `No se pudo borrar ${label}`)
  }
}

export async function fetchRepositoryFiles(api) {
  const response = await fetch(`${API_BASE}/github/repository-files`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ url: api.url }),
  })

  if (response.status === 401) {
    clearSession()
    render()
    throw new Error('Sesion caducada')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || 'No se pudieron cargar los archivos de GitHub')
  }

  return response.json()
}

export async function fetchLastCommit(api) {
  const response = await fetch(`${API_BASE}/github/last-commit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ url: api.url }),
  })

  if (response.status === 401) {
    clearSession()
    render()
    throw new Error('Sesion caducada')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || 'No se pudo cargar el ultimo commit de GitHub')
  }

  return response.json()
}

export async function fetchRepositoryFileContent(api, path) {
  const response = await fetch(`${API_BASE}/github/file-content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ url: api.url, path }),
  })

  if (response.status === 401) {
    clearSession()
    render()
    throw new Error('Sesion caducada')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || 'No se pudo cargar el contenido del archivo')
  }

  return response.json()
}

export async function loadApiData() {
  try {
    const [clientes, posibles, plantillas, especificas, facturas, contratos, tags] = await Promise.all([
      fetchJson('/clientes'),
      fetchJson('/posibles-clientes'),
      fetchJson('/apis/plantilla'),
      fetchJson('/apis/especificas'),
      fetchJson('/facturas'),
      fetchJson('/contratos'),
      fetchJson('/tags'),
    ])
    state.data = { clientes, posibles, plantillas, especificas, facturas, contratos, tags }
    state.apiOnline = true
  } catch {
    state.apiOnline = false
  }
}

export async function mutateTag(action, entityType, entityId, tagId) {
  const response = await fetch(`${API_BASE}/tags/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({
      entity_type: entityType,
      entity_id: entityId,
      tag_id: Number(tagId),
    }),
  })

  if (!response.ok) throw new Error('No se pudo actualizar la etiqueta')
  await loadApiData()
}
