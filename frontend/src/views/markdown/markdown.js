import { escapeHtml } from '../../templates/engine.js'

export function renderMarkdownPreview(content) {
  const lines = String(content).split(/\r?\n/)
  let inList = false
  const html = []

  for (const line of lines) {
    const trimmed = line.trim()
    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/)
    const listItem = trimmed.match(/^[-*]\s+(.+)$/)

    if (!listItem && inList) {
      html.push('</ul>')
      inList = false
    }

    if (!trimmed) {
      html.push('<p class="repo-markdown-gap"></p>')
    } else if (heading) {
      const level = heading[1].length
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`)
    } else if (listItem) {
      if (!inList) {
        html.push('<ul>')
        inList = true
      }
      html.push(`<li>${inlineMarkdown(listItem[1])}</li>`)
    } else {
      html.push(`<p>${inlineMarkdown(trimmed)}</p>`)
    }
  }

  if (inList) html.push('</ul>')
  return html.join('')
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
}
