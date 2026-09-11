import { state } from './state.js'
import { render } from '../main.js'
import { fetchLastCommit } from './api.js'

export async function loadLastCommit(api) {
  if (!api?.id) return
  if (state.lastCommits[api.id] || state.lastCommitLoading[api.id] || state.lastCommitErrors[api.id]) return

  if (!api.url) {
    state.lastCommitErrors[api.id] = 'Sin URL de GitHub registrada.'
    render()
    return
  }

  state.lastCommitLoading[api.id] = true
  state.lastCommitErrors[api.id] = ''

  try {
    state.lastCommits[api.id] = await fetchLastCommit(api)
  } catch (error) {
    state.lastCommitErrors[api.id] = error.message
  } finally {
    delete state.lastCommitLoading[api.id]
    render()
  }
}
