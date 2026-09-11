import tpl from './tag.html?raw'
import { compile } from '../../templates/engine.js'

const tag = compile(tpl)

export function tags(values = []) {
  return values.map((t) => tag({ color: t.color || '#52493a', nombre: t.nombre })).join('')
}
