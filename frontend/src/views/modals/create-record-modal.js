import tpl from './create-record-modal.html?raw'
import posibleExtraTpl from './fields/posible-extra-fields.html?raw'
import apiFieldsTpl from './fields/api-fields.html?raw'
import invoiceFieldsTpl from './fields/invoice-fields.html?raw'
import invoiceOptionTpl from './fields/invoice-client-option.html?raw'
import clientFieldsTpl from '../clients/client-form-fields.html?raw'
import { compile } from '../../templates/engine.js'
import { icon } from '../../lib/icons.js'
import { state } from '../../lib/state.js'

const render = compile(tpl)
const clientFields = compile(clientFieldsTpl)
const posibleExtraFields = compile(posibleExtraTpl)
const apiFields = compile(apiFieldsTpl)
const invoiceFields = compile(invoiceFieldsTpl)
const invoiceClientOption = compile(invoiceOptionTpl)

function createModalConfig(type) {
  if (type === 'cliente') {
    return { kicker: 'Nuevo registro', title: 'Crear cliente', submit: 'Crear cliente', body: clientFields() }
  }
  if (type === 'posible') {
    return {
      kicker: 'Nuevo registro',
      title: 'Crear posible cliente',
      submit: 'Crear posible cliente',
      body: clientFields() + posibleExtraFields(),
    }
  }
  if (type === 'api_plantilla' || type === 'api_especifica') {
    return {
      kicker: 'Nueva API',
      title: type === 'api_plantilla' ? 'Crear API plantilla' : 'Crear API especifica',
      submit: type === 'api_plantilla' ? 'Crear API plantilla' : 'Crear API especifica',
      body: apiFields({
        idPlaceholder: type === 'api_plantilla' ? 'TPL-WEBHOOK-001' : 'API-ACME-001',
        namePlaceholder: type === 'api_plantilla' ? 'Plantilla Webhook' : 'Conector ERP Acme',
      }),
    }
  }
  if (type === 'factura') {
    return {
      kicker: 'Nuevo documento',
      title: 'Crear factura',
      submit: 'Crear factura',
      body: invoiceFields({
        clientOptionsHtml: state.data.clientes.map((client) => invoiceClientOption({
          cif: client.cif,
          nombre_empresa: client.nombre_empresa,
        })).join(''),
      }),
    }
  }
  return null
}

export function createRecordModal(type) {
  const config = createModalConfig(type)
  if (!config) return ''
  return render({
    kicker: config.kicker,
    title: config.title,
    closeIcon: icon('X', 18).outerHTML,
    type,
    body: config.body,
    error: state.createModalError,
    plusIcon: icon('Plus', 17).outerHTML,
    submit: config.submit,
  })
}
