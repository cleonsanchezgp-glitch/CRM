import { state } from './state.js'
import { render } from '../main.js'
import { fetchRepositoryFiles, fetchRepositoryFileContent } from './api.js'

export function findApi(selection) {
  const source = selection.route === 'plantillas' ? state.data.plantillas : state.data.especificas
  return source.find((api) => api.id === selection.id)
}

export function repositoryKey(selection) {
  return `${selection.route}:${selection.id}`
}

export function selectApi(route, id) {
  state.selectedApi = { route, id }
  const key = repositoryKey(state.selectedApi)
  state.repositoryOpenFolders[key] = state.repositoryOpenFolders[key] || {}
  state.repositorySelectedFiles[key] = state.repositorySelectedFiles[key] || ''
  render()
  loadRepositoryFiles(state.selectedApi)
}

export async function loadRepositoryFiles(selection) {
  const api = findApi(selection)
  if (!api) return
  const key = repositoryKey(selection)
  if (state.repositoryFiles[key] || state.repositoryLoading === key) return

  if (!api.url) {
    state.repositoryErrors[key] = 'Esta API no tiene URL de GitHub registrada.'
    render()
    return
  }

  state.repositoryLoading = key
  state.repositoryErrors[key] = ''
  render()

  try {
    state.repositoryFiles[key] = await fetchRepositoryFiles(api)
  } catch (error) {
    state.repositoryErrors[key] = error.message
  } finally {
    if (state.repositoryLoading === key) state.repositoryLoading = ''
    render()
  }
}

export async function loadRepositoryFileContent(selection, path) {
  const api = findApi(selection)
  if (!api || !path) return
  const key = repositoryKey(selection)
  const contentKey = `${key}:${path}`
  state.repositorySelectedFiles[key] = path
  state.repositoryFileErrors[contentKey] = ''

  if (state.repositoryFileContents[contentKey]) {
    render()
    return
  }

  state.repositoryFileLoading = contentKey
  render()

  try {
    state.repositoryFileContents[contentKey] = await fetchRepositoryFileContent(api, path)
  } catch (error) {
    state.repositoryFileErrors[contentKey] = error.message
  } finally {
    if (state.repositoryFileLoading === contentKey) state.repositoryFileLoading = ''
    render()
  }
}

export function toggleRepositoryFolder(path) {
  if (!state.selectedApi || !path) return
  const key = repositoryKey(state.selectedApi)
  state.repositoryOpenFolders[key] = state.repositoryOpenFolders[key] || {}
  if (state.repositoryOpenFolders[key][path]) {
    delete state.repositoryOpenFolders[key][path]
  } else {
    state.repositoryOpenFolders[key][path] = true
  }
  render()
}

export function visibleRepositoryFiles(files, openFolders) {
  return files
    .filter((file) => isRepositoryFileVisible(file, openFolders))
    .map((file) => ({ file, depth: repositoryFileDepth(file) }))
}

export function isRepositoryFileVisible(file, openFolders) {
  const path = String(file.path || file.name || '')
  const parentParts = path.split('/').slice(0, -1)
  let parentPath = ''
  for (const part of parentParts) {
    parentPath = parentPath ? `${parentPath}/${part}` : part
    if (!openFolders[parentPath]) return false
  }
  return true
}

export function repositoryFileDepth(file) {
  return Math.max(0, String(file.path || file.name || '').split('/').length - 1)
}

export function fileIcon(file) {
  if (file?.media_type?.startsWith('image/')) return 'Image'
  if (file?.is_binary) return 'FileArchive'
  if (file?.media_type === 'text/markdown' || file?.path?.toLowerCase().endsWith('.md')) return 'BookOpenText'
  return 'FileText'
}
