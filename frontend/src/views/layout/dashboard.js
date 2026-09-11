import tpl from './dashboard.html?raw'
import metricTpl from './metric-card.html?raw'
import projectCardTpl from './project-progress-card.html?raw'
import emptyStateTpl from '../shared/empty-state.html?raw'
import { compile } from '../../templates/engine.js'
import { icon } from '../../lib/icons.js'
import { state } from '../../lib/state.js'
import { countByStatus, currentStatusTag } from '../../lib/status.js'
import { formatDate } from '../../lib/format.js'
import { loadLastCommit } from '../../lib/commits.js'

const render = compile(tpl)
const metric = compile(metricTpl)
const projectCard = compile(projectCardTpl)

function commitInfo(api) {
  const commit = state.lastCommits[api.id]
  const error = state.lastCommitErrors[api.id]
  const loading = state.lastCommitLoading[api.id]

  if (commit) {
    return {
      commitClass: '',
      commitText: commit.message.split('\n')[0],
      commitMeta: `${commit.author || 'GitHub'}${commit.date ? ` · ${formatDate(commit.date)}` : ''}`,
    }
  }
  if (error) return { commitClass: 'project-progress-commit-error', commitText: error, commitMeta: '' }
  if (loading) return { commitClass: 'project-progress-commit-loading', commitText: 'Cargando ultimo commit...', commitMeta: '' }
  return { commitClass: 'project-progress-commit-loading', commitText: 'Cargando ultimo commit...', commitMeta: '' }
}

export function dashboardView() {
  const clientesCount = (state.data.clientes || []).length
  const plantillasCount = (state.data.plantillas || []).length
  const especificas = state.data.especificas || []
  const proyectosActivos = especificas.filter((item) => currentStatusTag(item.tags)?.nombre === 'En curso')
  const proyectosFinalizados = countByStatus(especificas, 'Finalizado')

  const metricsHtml = [
    metric({ icon: icon('Building2', 20).outerHTML, label: 'Clientes', value: clientesCount }),
    metric({ icon: icon('Boxes', 20).outerHTML, label: 'APIs plantilla', value: plantillasCount }),
    metric({ icon: icon('BriefcaseBusiness', 20).outerHTML, label: 'Proyectos activos', value: proyectosActivos.length }),
    metric({ icon: icon('ShieldCheck', 20).outerHTML, label: 'Proyectos finalizados', value: proyectosFinalizados }),
  ].join('')

  proyectosActivos.forEach((api) => loadLastCommit(api))

  const projectsInProgressHtml = proyectosActivos.map((api) => projectCard({
    route: 'especificas',
    id: api.id,
    nombre: api.nombre,
    arrowIcon: icon('ArrowUpRight', 16).outerHTML,
    ...commitInfo(api),
  })).join('') || emptyStateTpl

  return render({ metricsHtml, projectsInProgressHtml })
}
