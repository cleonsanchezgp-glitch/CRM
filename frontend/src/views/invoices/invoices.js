import tpl from './invoices.html?raw'
import rowTpl from './invoice-row.html?raw'
import { compile } from '../../templates/engine.js'
import { icon } from '../../lib/icons.js'
import { state } from '../../lib/state.js'

const render = compile(tpl)
const row = compile(rowTpl)

export function invoicesView(items = state.data.facturas) {
  return render({
    plusIcon: icon('Plus', 18).outerHTML,
    rowsHtml: items.map((invoice) => row({
      id: invoice.id,
      nombre_empresa: invoice.nombre_empresa,
      cif_cliente: invoice.cif_cliente,
      fecha: invoice.fecha,
      amount: `${Number(invoice.coste_facturacion).toLocaleString('es-ES')} EUR`,
      fileIcon: icon('FileArchive', 18).outerHTML,
    })).join('') || '<p class="p-6 text-[rgba(216,208,189,0.68)]">Sin registros.</p>',
  })
}
