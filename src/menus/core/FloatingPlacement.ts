import type {Placement} from '@floating-ui/dom'

/** Portal 弹层只应跟随仍处于可见 DOM 链中的锚点。 */
export function isFloatingAnchorVisible(anchor: HTMLElement): boolean {
  if (!anchor.isConnected || anchor.closest('[hidden]')) return false
  const style = window.getComputedStyle(anchor)
  return style.display !== 'none' && style.visibility !== 'hidden' && anchor.getClientRects().length > 0
}

/** 工具组内的浮层按子菜单定位；普通工具栏继续从按钮下方展开。 */
export function resolveMenuFloatingPlacement(anchor: HTMLElement, fallback: Placement): Placement {
  const parentPanel = anchor.closest<HTMLElement>('[data-toolbar-submenu-placement]')
  if (!parentPanel && !anchor.closest('[data-toolbar-menu-group-item]')) return fallback
  return parentPanel?.dataset.toolbarSubmenuPlacement === 'left-start' ? 'left-start' : 'right-start'
}

/** 子菜单以父面板边缘为基准留出间距，避免按内部按钮定位时压住父层边框。 */
export function resolveMenuFloatingOffset(anchor: HTMLElement, placement: Placement, fallback = 6): number {
  const parentPanel = anchor.closest<HTMLElement>('[data-toolbar-submenu-placement]')
  if (!parentPanel) return fallback
  const anchorRect = anchor.getBoundingClientRect()
  const panelRect = parentPanel.getBoundingClientRect()
  if (placement.startsWith('left')) return Math.max(fallback, anchorRect.left - panelRect.left + fallback)
  if (placement.startsWith('right')) return Math.max(fallback, panelRect.right - anchorRect.right + fallback)
  return fallback
}

/** 对 Floating UI 的结果做最终视口钳制，覆盖两侧空间都不足的窄屏场景。 */
export function clampFloatingPosition(
    floating: HTMLElement,
    x: number,
    y: number,
    padding = 8,
): { x: number, y: number } {
    const maxX = Math.max(padding, window.innerWidth - floating.offsetWidth - padding)
    const maxY = Math.max(padding, window.innerHeight - floating.offsetHeight - padding)
    return {
        x: Math.min(Math.max(padding, x), maxX),
        y: Math.min(Math.max(padding, y), maxY),
    }
}
