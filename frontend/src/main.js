import './style.css'
import { state, clearSession } from './lib/state.js'
import { loadApiData, verifyAuthToken, createClient, createRecord, deleteRecord, mutateTag } from './lib/api.js'
import { selectApi, loadRepositoryFileContent, toggleRepositoryFolder } from './lib/repository.js'
import { completeKeycloakLogin, loginWithKeycloakPassword } from './lib/keycloak.js'
import { loginView } from './views/layout/login.js'
import { shellView } from './views/layout/shell.js'

async function boot() {
  try {
    const keycloakSession = await completeKeycloakLogin()
    if (keycloakSession) {
      saveSession(keycloakSession)
    }
  } catch (error) {
    state.loginError = error.message
  }

  if (state.authToken) {
    state.route = 'dashboard'
    await loadApiData()
  }
  render()
}

export function render() {
  document.querySelector('#app').innerHTML = state.route === 'login' ? loginView() : shellView()
  bindEvents()
}

function formValue(form, name) {
  return String(form.get(name) || '').trim()
}

function saveSession(session) {
  state.authToken = session.token
  state.authUser = session.usuario
  state.authProvider = session.provider || 'local'
  state.authIdToken = session.idToken || ''
  state.loginError = ''
  state.actionError = ''
  state.route = 'dashboard'
  sessionStorage.setItem('crm_auth_token', state.authToken)
  sessionStorage.setItem('crm_auth_user', state.authUser)
  sessionStorage.setItem('crm_auth_provider', state.authProvider)
  sessionStorage.setItem('crm_auth_id_token', state.authIdToken)
}

function createPayload(type, form) {
  if (type === 'cliente') {
    return {
      path: '/clientes',
      label: 'cliente',
      payload: {
        cif: formValue(form, 'cif'),
        nombre_empresa: formValue(form, 'nombre_empresa'),
        telefono_contacto: formValue(form, 'telefono_contacto'),
        necesidades: formValue(form, 'necesidades'),
        direccion: formValue(form, 'direccion'),
        url_archivos_adjuntos: formValue(form, 'url_archivos_adjuntos'),
      },
      afterCreate: (record) => {
        state.route = 'clientes'
        state.selectedClient = record.cif
        state.selectedApi = null
      },
    }
  }
  if (type === 'posible') {
    return {
      path: '/posibles-clientes',
      label: 'posible cliente',
      payload: {
        cif: formValue(form, 'cif'),
        nombre_empresa: formValue(form, 'nombre_empresa'),
        telefono_contacto: formValue(form, 'telefono_contacto'),
        necesidades: formValue(form, 'necesidades'),
        estado: formValue(form, 'estado'),
        direccion: formValue(form, 'direccion'),
        tickets: formValue(form, 'tickets'),
        url_archivos_adjuntos: formValue(form, 'url_archivos_adjuntos'),
      },
      afterCreate: (record) => {
        state.route = 'posibles'
        state.selectedClient = record.cif
        state.selectedApi = null
      },
    }
  }
  if (type === 'api_plantilla' || type === 'api_especifica') {
    const route = type === 'api_plantilla' ? 'plantillas' : 'especificas'
    return {
      path: type === 'api_plantilla' ? '/apis/plantilla' : '/apis/especificas',
      label: type === 'api_plantilla' ? 'API plantilla' : 'API especifica',
      payload: {
        id: formValue(form, 'id'),
        nombre: formValue(form, 'nombre'),
        descripcion: formValue(form, 'descripcion'),
        url: formValue(form, 'url'),
      },
      afterCreate: (record) => {
        state.route = route
        state.selectedClient = null
        selectApi(route, record.id)
      },
    }
  }
  return {
    path: '/facturas',
    label: 'factura',
    payload: {
      nombre_empresa: formValue(form, 'nombre_empresa'),
      url_factura: formValue(form, 'url_factura'),
      coste_facturacion: Number(formValue(form, 'coste_facturacion') || 0),
      fecha: formValue(form, 'fecha'),
      cif_cliente: formValue(form, 'cif_cliente'),
    },
    afterCreate: () => {
      state.route = 'facturas'
      state.selectedApi = null
      state.selectedClient = null
    },
  }
}

function bindEvents() {
  const sidebar = document.querySelector('.sidebar')
  const layout = document.querySelector('.crm-layout')
  sidebar?.addEventListener('pointerenter', () => {
    state.sidebarOpen = true
    layout?.classList.add('sidebar-open')
  })
  sidebar?.addEventListener('pointerleave', (event) => {
    const { clientX, clientY } = event
    const leavingSidebar = event.currentTarget
    requestAnimationFrame(() => {
      if (!leavingSidebar.isConnected) return

      const hoveredElement = document.elementFromPoint(clientX, clientY)
      if (hoveredElement?.closest?.('.sidebar')) {
        state.sidebarOpen = true
        document.querySelector('.crm-layout')?.classList.add('sidebar-open')
        return
      }

      state.sidebarOpen = false
      document.querySelector('.crm-layout')?.classList.remove('sidebar-open')
    })
  })

  document.querySelector('#login-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const usuario = String(form.get('user') || '')
    const contrasenya = String(form.get('password') || '')

    loginWithKeycloakPassword(usuario, contrasenya)
      .then(async (session) => {
        const verified = await verifyAuthToken(session.token)
        saveSession({
          token: session.token,
          usuario: verified.usuario || session.usuario,
          provider: session.provider || 'local',
          idToken: session.idToken || '',
        })
        await loadApiData()
        render()
      })
      .catch((error) => {
        clearSession()
        state.loginError = error.message
        render()
      })
  })
  document.querySelectorAll('[data-route]').forEach((button) => {
    button.addEventListener('click', () => {
      const keepSidebarOpen = Boolean(button.closest('.sidebar'))
      if (keepSidebarOpen) {
        state.sidebarOpen = true
        document.querySelector('.crm-layout')?.classList.add('sidebar-open')
      }
      state.route = button.dataset.route
      state.selectedClient = null
      state.selectedApi = null
      state.showNewClientModal = false
      state.newClientError = ''
      state.activeCreateModal = ''
      state.createModalError = ''
      state.actionError = ''
      render()
    })
  })
  document.querySelector('[data-new-client]')?.addEventListener('click', () => {
    state.showNewClientModal = true
    state.newClientError = ''
    render()
  })
  document.querySelectorAll('[data-open-create]').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeCreateModal = button.dataset.openCreate
      state.createModalError = ''
      state.actionError = ''
      state.showNewClientModal = false
      render()
    })
  })
  document.querySelector('[data-modal-panel]')?.addEventListener('click', (event) => {
    event.stopPropagation()
  })
  document.querySelectorAll('[data-close-new-client]').forEach((button) => {
    button.addEventListener('click', () => {
      state.showNewClientModal = false
      state.newClientError = ''
      render()
    })
  })
  document.querySelectorAll('[data-close-create-modal]').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeCreateModal = ''
      state.createModalError = ''
      render()
    })
  })
  document.querySelector('#new-client-form')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = {
      cif: String(form.get('cif') || ''),
      nombre_empresa: String(form.get('nombre_empresa') || ''),
      telefono_contacto: String(form.get('telefono_contacto') || ''),
      necesidades: String(form.get('necesidades') || ''),
      direccion: String(form.get('direccion') || ''),
      url_archivos_adjuntos: String(form.get('url_archivos_adjuntos') || ''),
    }

    createClient(payload)
      .then(async (client) => {
        await loadApiData()
        state.route = 'clientes'
        state.selectedClient = client.cif
        state.showNewClientModal = false
        state.newClientError = ''
        render()
      })
      .catch((error) => {
        state.newClientError = error.message
        render()
      })
  })
  document.querySelector('[data-create-form]')?.addEventListener('submit', (event) => {
    event.preventDefault()
    const type = event.currentTarget.dataset.createForm
    const form = new FormData(event.currentTarget)
    const { path, label, payload, afterCreate } = createPayload(type, form)

    createRecord(path, payload, label)
      .then(async (record) => {
        await loadApiData()
        state.activeCreateModal = ''
        state.createModalError = ''
        afterCreate(record)
        render()
      })
      .catch((error) => {
        state.createModalError = error.message
        render()
      })
  })
  document.querySelectorAll('[data-api-id]').forEach((row) => {
    row.addEventListener('click', () => {
      selectApi(row.dataset.apiRoute, row.dataset.apiId)
    })
    row.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      selectApi(row.dataset.apiRoute, row.dataset.apiId)
    })
  })
  document.querySelectorAll('[data-delete-client]').forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault()
      event.stopPropagation()
      const cif = button.dataset.deleteClient
      const kind = button.dataset.clientKind
      const path = kind === 'posible' ? `/posibles-clientes/${encodeURIComponent(cif)}` : `/clientes/${encodeURIComponent(cif)}`
      const label = kind === 'posible' ? 'posible cliente' : 'cliente'
      if (!window.confirm(`Borrar el ${label} ${cif}? Esta accion no se puede deshacer.`)) return
      try {
        state.actionError = ''
        await deleteRecord(path, 'el cliente')
        state.selectedClient = null
        await loadApiData()
        render()
      } catch (error) {
        state.actionError = error.message
        render()
      }
    })
  })
  document.querySelectorAll('[data-delete-api]').forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault()
      event.stopPropagation()
      const id = button.dataset.deleteApi
      const kind = button.dataset.apiKind
      const path = kind === 'plantilla' ? `/apis/plantilla/${encodeURIComponent(id)}` : `/apis/especificas/${encodeURIComponent(id)}`
      if (!window.confirm(`Borrar la API ${id}? Esta accion no se puede deshacer.`)) return
      try {
        state.actionError = ''
        await deleteRecord(path, 'la API')
        state.selectedApi = null
        await loadApiData()
        render()
      } catch (error) {
        state.actionError = error.message
        render()
      }
    })
  })
  document.querySelector('[data-api-back]')?.addEventListener('click', () => {
    state.selectedApi = null
    render()
  })
  document.querySelectorAll('[data-repo-folder]').forEach((folder) => {
    folder.addEventListener('click', () => {
      toggleRepositoryFolder(folder.dataset.repoFolder)
    })
  })
  document.querySelectorAll('[data-repo-file]').forEach((file) => {
    file.addEventListener('click', () => {
      if (!state.selectedApi) return
      loadRepositoryFileContent(state.selectedApi, file.dataset.repoFile)
    })
  })
  document.querySelector('[data-client-back]')?.addEventListener('click', () => {
    state.selectedClient = null
    render()
  })
  document.querySelectorAll('[data-tag-add]').forEach((select) => {
    select.addEventListener('change', (event) => {
      const scope = event.currentTarget.closest('[data-tag-scope]')
      const tagId = event.currentTarget.value
      if (!scope || !tagId) return
      mutateTag('add', scope.dataset.tagScope, scope.dataset.tagEntity, tagId)
        .then(() => render())
        .catch((error) => {
          state.loginError = error.message
          render()
        })
    })
  })
  document.querySelectorAll('[data-tag-remove]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      const scope = event.currentTarget.closest('[data-tag-scope]')
      if (!scope) return
      mutateTag('remove', scope.dataset.tagScope, scope.dataset.tagEntity, event.currentTarget.dataset.tagRemove)
        .then(() => render())
        .catch((error) => {
          state.loginError = error.message
          render()
        })
    })
  })
  document.querySelectorAll('[data-status-set]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      const scope = event.currentTarget.closest('[data-status-scope]')
      if (!scope) return
      const newTagId = event.currentTarget.dataset.statusSet
      const currentTagId = scope.dataset.statusCurrent
      if (currentTagId === newTagId) return

      const entityType = scope.dataset.statusScope
      const entityId = scope.dataset.statusEntity
      const removal = currentTagId ? mutateTag('remove', entityType, entityId, currentTagId) : Promise.resolve()

      removal
        .then(() => mutateTag('add', entityType, entityId, newTagId))
        .then(() => render())
        .catch((error) => {
          state.loginError = error.message
          render()
        })
    })
  })
  document.querySelectorAll('[data-client]').forEach((row) => {
    row.addEventListener('click', () => {
      state.selectedClient = row.dataset.client
      render()
    })
    row.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      state.selectedClient = row.dataset.client
      render()
    })
  })
  document.querySelector('#global-search')?.addEventListener('input', (event) => {
    const cursorStart = event.target.selectionStart ?? event.target.value.length
    const cursorEnd = event.target.selectionEnd ?? cursorStart
    state.query = event.target.value
    state.selectedApi = null
    state.selectedClient = null
    state.actionError = ''
    render()
    const searchInput = document.querySelector('#global-search')
    searchInput?.focus()
    searchInput?.setSelectionRange(cursorStart, cursorEnd)
  })
  document.querySelector('#logout')?.addEventListener('click', () => {
    state.query = ''
    state.activeCreateModal = ''
    state.createModalError = ''
    state.actionError = ''
    clearSession()
    render()
  })
}

boot()
