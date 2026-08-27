import type { MenuContext } from './MenuContext'
import type { MenuItem } from './MenuItem'
import { MenuTooltip } from './MenuTooltip'
import {applyEditorTheme} from '../../editor/AiEditorTheme'

/** 管理一组菜单项的挂载、状态更新、替换和销毁。 */
export class MenuBar {
  private readonly container: HTMLElement
  private readonly context: MenuContext
  private readonly tooltip: MenuTooltip
  private readonly onRemount: (() => void) | undefined
  private unsubscribeLocale: (() => void) | undefined
  private items: MenuItem[] = []

  /** 创建菜单栏并挂载初始项目。 */
  constructor(container: HTMLElement, context: MenuContext, items: MenuItem[] = [], onRemount?: () => void) {
    this.container = container
    this.context = context
    this.tooltip = new MenuTooltip(container)
    applyEditorTheme(this.container, context.editor)
    applyEditorTheme(this.tooltip.element, context.editor)
    this.onRemount = onRemount
    this.setItems(items)
    this.unsubscribeLocale = context.i18n.subscribe(() => {
      this.setItems([...this.items])
      this.onRemount?.()
    })
  }

  /** 返回副本，避免调用方绕过 setItems 修改内部数组。 */
  getItems(): readonly MenuItem[] { return [...this.items] }
  /** 按稳定 ID 查找菜单项。 */
  getItem(id: string): MenuItem | undefined { return this.items.find((item) => item.id === id) }

  /** 原子替换整组菜单，并在挂载前拒绝重复 ID。 */
  setItems(items: MenuItem[]): void {
    this.tooltip.close()
    const ids = new Set<string>()
    for (const item of items) {
      if (ids.has(item.id)) throw new Error(`Duplicate MenuItem id: "${item.id}"`)
      ids.add(item.id)
    }

    // 全新菜单集先挂到离线 Fragment。任一 render/update 失败时，旧菜单仍保持可用。
    const reusesMountedItem = items.some((item) => this.items.includes(item))
    if (!reusesMountedItem) {
      const fragment = this.container.ownerDocument.createDocumentFragment()
      const mounted: MenuItem[] = []
      try {
        for (const item of items) {
          item.mount(fragment, this.context)
          mounted.push(item)
        }
      } catch (error) {
        mounted.forEach((item) => item.destroy())
        throw error
      }
      this.items.forEach((item) => item.destroy())
      this.container.replaceChildren(fragment)
      this.items = [...items]
      return
    }

    // locale 切换会复用同一批实例；这些实例已验证可渲染，按原生命周期重挂载。
    this.items.forEach((item) => item.destroy())
    this.container.replaceChildren()
    this.items = [...items]
    this.items.forEach((item) => item.mount(this.container, this.context))
  }

  /** 将当前编辑器状态广播给所有菜单项。 */
  update(): void { this.items.forEach((item) => item.update(this.context)) }

  /** 销毁所有项目并清空容器。 */
  destroy(): void {
    this.unsubscribeLocale?.()
    this.unsubscribeLocale = undefined
    this.tooltip.destroy()
    this.items.forEach((item) => item.destroy())
    this.items = []
    this.container.replaceChildren()
  }
}
