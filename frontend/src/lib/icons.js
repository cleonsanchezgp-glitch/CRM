import { createElement, icons } from 'lucide'

export const icon = (name, size = 18) => createElement(icons[name] || icons.FileText, { width: size, height: size, 'stroke-width': 2 })
