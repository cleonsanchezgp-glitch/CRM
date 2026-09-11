const AUTH_MODE = import.meta.env.VITE_AUTH_MODE || 'keycloak'
const KEYCLOAK_URL = (import.meta.env.VITE_KEYCLOAK_URL || 'http://127.0.0.1:8081').replace(/\/+$/, '')
const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'crm'
const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'crm-frontend'

const FLOW_STATE_KEY = 'crm_keycloak_flow_state'
const FLOW_VERIFIER_KEY = 'crm_keycloak_code_verifier'
const FLOW_NONCE_KEY = 'crm_keycloak_nonce'

export function keycloakEnabled() {
  return AUTH_MODE === 'keycloak' || AUTH_MODE === 'hybrid'
}

export function localLoginEnabled() {
  return AUTH_MODE !== 'keycloak'
}

export function keycloakOnly() {
  return AUTH_MODE === 'keycloak'
}

export async function loginWithKeycloakPassword(usuario, contrasenya) {
  const response = await fetch(`${realmUrl()}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: KEYCLOAK_CLIENT_ID,
      scope: 'openid profile email',
      username: usuario,
      password: contrasenya,
    }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error_description || 'Usuario o contrasenya no validos en Keycloak')
  }

  const tokens = await response.json()
  const claims = parseJwt(tokens.access_token)
  return {
    token: tokens.access_token,
    idToken: tokens.id_token || '',
    usuario: claims.preferred_username || claims.email || claims.sub || usuario,
    provider: 'keycloak',
  }
}

export async function startKeycloakLogin() {
  const state = randomString(32)
  const nonce = randomString(32)
  const verifier = randomString(64)
  const challenge = await codeChallenge(verifier)

  sessionStorage.setItem(FLOW_STATE_KEY, state)
  sessionStorage.setItem(FLOW_VERIFIER_KEY, verifier)
  sessionStorage.setItem(FLOW_NONCE_KEY, nonce)

  const params = new URLSearchParams({
    client_id: KEYCLOAK_CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: 'openid profile email',
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  window.location.assign(`${realmUrl()}/protocol/openid-connect/auth?${params}`)
}

export async function completeKeycloakLogin() {
  if (!keycloakEnabled()) return null

  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const returnedState = params.get('state')
  if (!code) return null

  const expectedState = sessionStorage.getItem(FLOW_STATE_KEY)
  const verifier = sessionStorage.getItem(FLOW_VERIFIER_KEY)
  if (!expectedState || !verifier || returnedState !== expectedState) {
    clearKeycloakFlow()
    throw new Error('No se pudo validar la respuesta de Keycloak')
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: KEYCLOAK_CLIENT_ID,
    code,
    redirect_uri: redirectUri(),
    code_verifier: verifier,
  })

  const response = await fetch(`${realmUrl()}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  clearKeycloakFlow()
  window.history.replaceState({}, document.title, redirectUri())

  if (!response.ok) {
    throw new Error('Keycloak no pudo completar el inicio de sesion')
  }

  const tokens = await response.json()
  const claims = parseJwt(tokens.access_token)
  return {
    token: tokens.access_token,
    idToken: tokens.id_token || '',
    usuario: claims.preferred_username || claims.email || claims.sub || 'Keycloak',
    provider: 'keycloak',
  }
}

export function keycloakLogoutUrl(idToken) {
  if (!keycloakEnabled()) return ''
  const params = new URLSearchParams({
    client_id: KEYCLOAK_CLIENT_ID,
    post_logout_redirect_uri: redirectUri(),
  })
  if (idToken) params.set('id_token_hint', idToken)
  return `${realmUrl()}/protocol/openid-connect/logout?${params}`
}

function realmUrl() {
  return `${KEYCLOAK_URL}/realms/${encodeURIComponent(KEYCLOAK_REALM)}`
}

function redirectUri() {
  return `${window.location.origin}${window.location.pathname}`
}

function clearKeycloakFlow() {
  sessionStorage.removeItem(FLOW_STATE_KEY)
  sessionStorage.removeItem(FLOW_VERIFIER_KEY)
  sessionStorage.removeItem(FLOW_NONCE_KEY)
}

function randomString(length) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return base64Url(bytes)
}

async function codeChallenge(verifier) {
  const bytes = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return base64Url(new Uint8Array(digest))
}

function base64Url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function parseJwt(token) {
  const [, payload] = token.split('.')
  if (!payload) return {}
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  return JSON.parse(atob(padded))
}
