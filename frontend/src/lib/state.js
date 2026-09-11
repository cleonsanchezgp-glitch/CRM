export const emptyData = {
  clientes: [],
  posibles: [],
  plantillas: [],
  especificas: [],
  facturas: [],
  contratos: [],
  tags: [],
}

export const state = {
  route: 'login',
  query: '',
  selectedClient: null,
  selectedApi: null,
  data: emptyData,
  apiOnline: false,
  authToken: sessionStorage.getItem('crm_auth_token') || '',
  authUser: sessionStorage.getItem('crm_auth_user') || '',
  authProvider: sessionStorage.getItem('crm_auth_provider') || 'local',
  authIdToken: sessionStorage.getItem('crm_auth_id_token') || '',
  loginError: '',
  actionError: '',
  showNewClientModal: false,
  newClientError: '',
  activeCreateModal: '',
  createModalError: '',
  repositoryFiles: {},
  repositoryOpenFolders: {},
  repositoryLoading: '',
  repositoryErrors: {},
  repositorySelectedFiles: {},
  repositoryFileContents: {},
  repositoryFileLoading: '',
  repositoryFileErrors: {},
  sidebarOpen: false,
  lastCommits: {},
  lastCommitLoading: {},
  lastCommitErrors: {},
}

export function clearSession() {
  state.authToken = ''
  state.authUser = ''
  state.authProvider = 'local'
  state.authIdToken = ''
  state.route = 'login'
  state.data = emptyData
  state.sidebarOpen = false
  state.lastCommits = {}
  state.lastCommitLoading = {}
  state.lastCommitErrors = {}
  state.actionError = ''
  sessionStorage.removeItem('crm_auth_token')
  sessionStorage.removeItem('crm_auth_user')
  sessionStorage.removeItem('crm_auth_provider')
  sessionStorage.removeItem('crm_auth_id_token')
}
