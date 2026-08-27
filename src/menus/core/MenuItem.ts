import type { MenuContext } from './MenuContext'
import {applyEditorTheme} from '../../editor/AiEditorTheme'

/**
 * 所有菜单项共享的生命周期抽象，包括工具栏、Bubble Menu 和 Floating Menu 中的项目。
 * 菜单项本身只关心渲染和命令，具体出现位置由 MenuBar/Surface 管理。
 */
export abstract class MenuItem {
  /** 菜单栏内唯一且稳定的标识。 */
  readonly id: string
  protected element: HTMLElement | null = null
  private events = new AbortController()

  /** 创建菜单项并校验标识，避免菜单更新时无法准确定位项目。 */
  constructor(id: string) {
    if (!id.trim()) throw new Error('MenuItem id cannot be empty')
    this.id = id
  }

  /** 将菜单项渲染到容器，并立即同步一次状态。 */
  mount(container: ParentNode, context: MenuContext): void {
    if (this.element) throw new Error(`MenuItem "${this.id}" is already mounted`)
    if (this.events.signal.aborted) this.events = new AbortController()

    const ownerDocument = context.editor.view.dom.ownerDocument
    const existingBodyChildren = new Set(ownerDocument.body.children)
    try {
      this.element = this.render(context)
      applyEditorTheme(this.element, context.editor)
      ownerDocument.body.querySelectorAll<HTMLElement>(':scope > *').forEach((element) => {
        if (!existingBodyChildren.has(element)) applyEditorTheme(element, context.editor)
      })
      this.element.dataset.menuItem = this.id
      container.append(this.element)
      this.update(context)
    } catch (error) {
      // render/update 失败时回收本轮同步创建的 Portal 和事件，避免留下不可见的半挂载菜单。
      ownerDocument.body.querySelectorAll<HTMLElement>(':scope > *').forEach((element) => {
        if (!existingBodyChildren.has(element)) element.remove()
      })
      this.events.abort()
      this.element?.remove()
      this.element = null
      throw error
    }
  }

  abstract render(context: MenuContext): HTMLElement

  /** 可选的执行入口；纯展示型菜单项无需实现。 */
  execute(_context: MenuContext, _value?: string): void {}

  /** 编辑器选择或事务变化后由 MenuBar 调用，用于刷新 active/disabled 状态。 */
  update(_context: MenuContext): void {}

  /** 返回菜单项根元素，供组合型菜单容器同步无障碍名称和状态。 */
  getElement(): HTMLElement | null { return this.element }

  /** 释放事件、移除 DOM，允许同一个实例在需要时重新挂载。 */
  destroy(): void {
    this.events.abort()
    this.element?.remove()
    this.element = null
  }

  /** 使用 AbortController 绑定事件，destroy 时可一次性解除所有监听器。 */
  protected listen<K extends keyof HTMLElementEventMap>(
    target: HTMLElement,
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void,
    options: AddEventListenerOptions = {},
  ): void {
    target.addEventListener(type, listener as EventListener, {...options, signal: this.events.signal})
  }
}
