import tpl from './new-client-modal.html?raw'
import clientFieldsTpl from '../clients/client-form-fields.html?raw'
import { compile } from '../../templates/engine.js'
import { icon } from '../../lib/icons.js'
import { state } from '../../lib/state.js'

const render = compile(tpl)
const clientFields = compile(clientFieldsTpl)

export function newClientModal() {
  return render({
    closeIcon: icon('X', 18).outerHTML,
    formFields: clientFields(),
    error: state.newClientError,
    plusIcon: icon('Plus', 17).outerHTML,
  })
}
