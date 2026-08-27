import type { MenuContext } from './MenuContext'
import { MenuItem } from './MenuItem'

/** 在 MenuBar 中渲染不可交互的视觉分隔线。 */
export class SeparatorMenuItem extends MenuItem {
  render(_context: MenuContext): HTMLElement {
    const separator = document.createElement('span')
    separator.className = 'aieditor__separator'
    separator.setAttribute('role', 'separator')
    separator.setAttribute('aria-orientation', 'vertical')
    separator.textContent = '|'
    return separator
  }
}
