import tpl from './api-repository.html?raw'
import folderRowTpl from './repo-file-row-folder.html?raw'
import documentRowTpl from './repo-file-row-document.html?raw'
import rowContentTpl from './repo-file-row-content.html?raw'
import contentLoadingTpl from './repo-content-loading.html?raw'
import contentErrorTpl from './repo-content-error.html?raw'
import contentFileTpl from './repo-content-file.html?raw'
import previewImageTpl from './repo-preview-image.html?raw'
import previewBinaryTpl from './repo-preview-binary.html?raw'
import previewMarkdownTpl from './repo-preview-markdown.html?raw'
import previewCodeTpl from './repo-preview-code.html?raw'
import { compile, escapeHtml } from '../../templates/engine.js'
import { state } from '../../lib/state.js'
import { icon } from '../../lib/icons.js'
import { formatFileSize, shortCommit } from '../../lib/format.js'
import { nonStatusTags } from '../../lib/status.js'
import { findApi, repositoryKey, visibleRepositoryFiles, fileIcon } from '../../lib/repository.js'
import { tags } from '../shared/tags.js'
import { tagManager } from '../shared/tag-manager.js'
import { renderMarkdownPreview } from '../markdown/markdown.js'
import { apiGrid } from './api-grid.js'

const render = compile(tpl)
const folderRow = compile(folderRowTpl)
const documentRow = compile(documentRowTpl)
const rowContent = compile(rowContentTpl)
const contentLoading = compile(contentLoadingTpl)
const contentError = compile(contentErrorTpl)
const contentFile = compile(contentFileTpl)
const previewImage = compile(previewImageTpl)
const previewBinary = compile(previewBinaryTpl)
const previewMarkdown = compile(previewMarkdownTpl)
const previewCode = compile(previewCodeTpl)

function repositoryFileRows(files, isLoading, loadError, selectedPath = '') {
  if (isLoading) {
    return '<div class="repo-file-state">Cargando archivos desde GitHub...</div>'
  }
  if (loadError) {
    return `<div class="repo-file-state error">${escapeHtml(loadError)}</div>`
  }
  if (!files.length) {
    return '<div class="repo-file-state">El repositorio no contiene archivos en esta ruta.</div>'
  }

  const openFolders = state.selectedApi ? state.repositoryOpenFolders[repositoryKey(state.selectedApi)] || {} : {}
  return visibleRepositoryFiles(files, openFolders).map(({ file, depth }) => {
    const path = file.path || file.name
    const isFolder = file.item_type === 'folder'
    const isOpen = Boolean(openFolders[path])
    const isSelected = selectedPath === path
    const chevron = isFolder ? icon(isOpen ? 'ChevronDown' : 'ChevronRight', 16).outerHTML : '<span class="repo-file-spacer"></span>'
    const content = rowContent({
      indent: depth * 18,
      chevron,
      icon: icon(isFolder ? 'Folder' : 'FileText', 18).outerHTML,
      name: file.name,
      path,
      sizeOrState: isFolder ? (isOpen ? 'Carpeta abierta' : 'Carpeta') : formatFileSize(file.size),
    })

    if (isFolder) {
      return folderRow({ path, isOpen, content })
    }
    return documentRow({ path, selectedClass: isSelected ? 'selected' : '', content })
  }).join('')
}

function repositoryPreview(file) {
  if (!file) {
    return '<div class="repo-content-state">Selecciona un archivo para cargar su contenido.</div>'
  }

  if (file.media_type?.startsWith('image/')) {
    return previewImage({ mediaType: file.media_type, content: file.content, name: file.name })
  }

  if (file.is_binary) {
    return previewBinary({
      icon: icon('FileArchive', 34).outerHTML,
      mediaType: file.media_type || 'application/octet-stream',
      size: formatFileSize(file.size),
    })
  }

  if (file.media_type === 'text/markdown' || file.path?.toLowerCase().endsWith('.md')) {
    return previewMarkdown({ markdownHtml: renderMarkdownPreview(file.content || '') })
  }

  return previewCode({ content: file.content || '' })
}

function repositoryContentPanel(selection, api, selectedPath) {
  const key = repositoryKey(selection)
  const contentKey = selectedPath ? `${key}:${selectedPath}` : ''
  const file = contentKey ? state.repositoryFileContents[contentKey] : null
  const isLoading = contentKey && state.repositoryFileLoading === contentKey
  const error = contentKey ? state.repositoryFileErrors[contentKey] : ''

  if (!selectedPath) {
    return ''
  }

  if (isLoading) {
    return contentLoading({ loaderIcon: icon('LoaderCircle', 18).outerHTML, path: selectedPath })
  }

  if (error) {
    return contentError({ fileIcon: icon('FileText', 18).outerHTML, path: selectedPath, error })
  }

  return contentFile({
    icon: icon(fileIcon(file), 18).outerHTML,
    path: file?.path || selectedPath,
    size: formatFileSize(file?.size),
    mediaType: file?.media_type || 'archivo',
    previewHtml: repositoryPreview(file),
  })
}

export function apiRepositoryView(selection) {
  const api = findApi(selection)
  if (!api) {
    state.selectedApi = null
    return apiGrid(selection.route, [], 'API no encontrada')
  }

  const key = repositoryKey(selection)
  const files = state.repositoryFiles[key] || []
  const isLoading = state.repositoryLoading === key
  const loadError = state.repositoryErrors[key]
  const selectedPath = state.repositorySelectedFiles[key] || ''
  const entityType = selection.route === 'plantillas' ? 'api_plantilla' : 'api_especifica'

  return render({
    backIcon: icon('ArrowLeft', 17).outerHTML,
    routeIcon: icon(selection.route === 'plantillas' ? 'Boxes' : 'BriefcaseBusiness', 24).outerHTML,
    routeLabel: selection.route === 'plantillas' ? 'plantillas' : 'especificas',
    nombre: api.nombre,
    id: api.id,
    apiKind: selection.route === 'plantillas' ? 'plantilla' : 'especifica',
    deleteIcon: icon('Trash2', 16).outerHTML,
    commitIcon: icon('GitCommit', 15).outerHTML,
    shortCommit: shortCommit(api.id),
    descripcion: api.descripcion,
    tagsHtml: tags(nonStatusTags(api.tags)),
    tagManagerHtml: tagManager(entityType, api.id, api.tags),
    authUser: state.authUser || 'CRM',
    commitDescription: api.descripcion || 'Estructura completa del repositorio.',
    clockIcon: icon('Clock', 14).outerHTML,
    fileRowsHtml: repositoryFileRows(files, isLoading, loadError, selectedPath),
    contentPanelHtml: repositoryContentPanel(selection, api, selectedPath),
  })
}
