const EACH_RE = /\{\{#each\s+([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/
const IF_RE = /\{\{#if\s+(!?[\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/
const RAW_RE = /\{\{\{\s*([\w.@]+)\s*\}\}\}/g
const VAR_RE = /\{\{\s*([\w.@]+)\s*\}\}/g

function getPath(ctx, path) {
  if (path === 'this') return ctx.this
  return path.split('.').reduce((value, key) => (value == null ? undefined : value[key]), ctx)
}

export function escapeHtml(value) {
  if (value == null) return ''
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[char])
}

export function renderTemplate(template, ctx = {}) {
  let output = template
  let match

  while ((match = EACH_RE.exec(output))) {
    const [full, path, body] = match
    const [itemTpl, emptyTpl = ''] = body.split('{{else}}')
    const list = getPath(ctx, path)
    const items = Array.isArray(list) ? list : []
    const rendered = items.length
      ? items.map((item, index) => renderTemplate(itemTpl, {
          ...ctx,
          ...(item && typeof item === 'object' ? item : {}),
          this: item,
          '@index': index,
        })).join('')
      : renderTemplate(emptyTpl, ctx)
    output = output.slice(0, match.index) + rendered + output.slice(match.index + full.length)
  }

  while ((match = IF_RE.exec(output))) {
    const [full, rawPath, body] = match
    const negate = rawPath.startsWith('!')
    const path = negate ? rawPath.slice(1) : rawPath
    const [truthy, falsy = ''] = body.split('{{else}}')
    let value = getPath(ctx, path)
    if (negate) value = !value
    const rendered = renderTemplate(value ? truthy : falsy, ctx)
    output = output.slice(0, match.index) + rendered + output.slice(match.index + full.length)
  }

  output = output.replace(RAW_RE, (_, path) => {
    const value = getPath(ctx, path)
    return value == null ? '' : String(value)
  })

  output = output.replace(VAR_RE, (_, path) => escapeHtml(getPath(ctx, path)))

  return output
}

export function compile(template) {
  return (ctx = {}) => renderTemplate(template, ctx)
}
