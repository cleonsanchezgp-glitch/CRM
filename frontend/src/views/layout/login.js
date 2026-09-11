import tpl from './login.html?raw'
import { compile } from '../../templates/engine.js'
import { icon } from '../../lib/icons.js'
import { state } from '../../lib/state.js'

const render = compile(tpl)

export function loginView() {
  return render({
    boxesIcon: icon('Boxes', 24).outerHTML,
    shieldIcon: icon('ShieldCheck', 34).outerHTML,
    loginIcon: icon('LogIn', 18).outerHTML,
    keyIcon: icon('KeyRound', 18).outerHTML,
    error: state.loginError,
    authProviderName: 'Keycloak',
    loginButtonText: 'Entrar con Keycloak',
    loginHelp: 'Las credenciales se validan contra el realm CRM de Keycloak.',
  })
}
