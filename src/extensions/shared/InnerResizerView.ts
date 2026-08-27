import type { NodeViewRenderer, NodeViewRendererProps } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { NodeView } from '@tiptap/pm/view'
import {NodeSelection} from '@tiptap/pm/state'
import {appendBlockBoundaryControls} from './BlockBoundaryControls'

export interface InnerResizerViewOptions {
  /** 可缩放到的最小像素宽度，默认 120。 */
  minWidth?: number
  /** 用于缩放手柄无障碍名称的媒体类型文本。 */
  label?: string
  /** 创建真正承载图片、音频或视频的内部元素。 */
  onInit: (view: InnerResizerView) => HTMLElement
  /** 节点属性变化后同步内部媒体元素。 */
  onUpdate?: (view: InnerResizerView, element: HTMLElement) => void
  /** 允许具体媒体声明应由 NodeView 消费的原生事件。 */
  stopEvent?: (event: Event, view: InnerResizerView) => boolean
  /** 原生媒体控件被按下时，是否同步建立 ProseMirror 节点选区。 */
  selectOnPointerDown?: boolean
}

/** 图片、音频和视频共享的 ProseMirror NodeView，负责媒体缩放和属性持久化。 */
export class InnerResizerView implements NodeView {
  readonly dom: HTMLElement
  private nodeValue: ProseMirrorNode
  private readonly props: NodeViewRendererProps
  private readonly options: Required<Pick<InnerResizerViewOptions, 'minWidth'>> & InnerResizerViewOptions
  private readonly contentElement: HTMLElement
  private readonly events = new AbortController()
  private activePointer: number | undefined
  private startX = 0
  private startWidth = 0
  private resizeDirection: 'left' | 'right' | undefined
  private positionFrame = 0
  private readonly removeBoundaryControls: () => void

  /** 适配 Tiptap NodeViewRenderer 所需的工厂签名。 */
  static create(options: InnerResizerViewOptions): NodeViewRenderer {
    return (props) => new InnerResizerView(props, options)
  }

  /** 创建媒体容器、内容元素和左右两个可访问的缩放手柄。 */
  constructor(props: NodeViewRendererProps, options: InnerResizerViewOptions) {
    this.props = props
    this.nodeValue = props.node
    this.options = { minWidth: options.minWidth ?? 120, ...options }
    this.dom = document.createElement('div')
    this.dom.className = 'ProseMirror-inner-resizer'
    this.dom.dataset.type = props.node.type.name
    this.dom.contentEditable = 'false'
    this.dom.draggable = true
    this.contentElement = options.onInit(this)
    if (options.selectOnPointerDown) {
      this.contentElement.addEventListener('pointerdown', this.selectNodeFromMedia, {signal: this.events.signal})
    }
    this.dom.append(this.contentElement)
    this.createHandle('left')
    this.createHandle('right')
    this.removeBoundaryControls = appendBlockBoundaryControls(this.dom, props.editor.view, () => {
      const position = props.getPos()
      return typeof position === 'number' ? {position, nodeSize: this.nodeValue.nodeSize} : undefined
    })
    this.syncNode()
  }

  /** 当前最新的 ProseMirror 节点快照。 */
  get node(): ProseMirrorNode { return this.nodeValue }
  /** Tiptap 为 NodeView 合并后的 HTML 属性。 */
  get HTMLAttributes(): Record<string, unknown> { return this.props.HTMLAttributes }
  /** 创建该 NodeView 的编辑器实例。 */
  get editor() { return this.props.editor }

  /** 仅接受同类型节点更新，并将最新属性同步给内部元素。 */
  update(node: ProseMirrorNode): boolean {
    if (node.type !== this.nodeValue.type) return false
    this.nodeValue = node
    this.syncNode()
    this.options.onUpdate?.(this, this.contentElement)
    return true
  }

  /** 同步 ProseMirror 节点选中的视觉状态。 */
  selectNode(): void { this.dom.classList.add('ProseMirror-selectednode') }
  /** 移除 ProseMirror 节点选中的视觉状态。 */
  deselectNode(): void { this.dom.classList.remove('ProseMirror-selectednode') }

  /** 拦截缩放手柄及媒体原生控件事件，其余事件继续交给 ProseMirror。 */
  stopEvent(event: Event): boolean {
    const isResizeHandle = event.target instanceof Element && Boolean(event.target.closest('[data-resize-handle]'))
    return isResizeHandle || (this.options.stopEvent?.(event, this) ?? false)
  }

  /** 内部媒体和缩放控件不属于文档内容，DOM 变化无需触发 ProseMirror 重解析。 */
  ignoreMutation(): boolean { return true }

  /** 原生媒体控件会拦截 ProseMirror 事件，因此在不阻止播放的前提下主动建立节点选区。 */
  private readonly selectNodeFromMedia = (): void => {
    if (!this.props.editor.isEditable) return
    const position = this.props.getPos()
    if (typeof position !== 'number') return
    const selection = NodeSelection.create(this.props.editor.state.doc, position)
    this.props.editor.view.dispatch(this.props.editor.state.tr.setSelection(selection))
  }

  /** 结束可能仍在进行的拖拽并移除全局监听。 */
  destroy(): void {
    this.cleanupResizeListeners()
    document.body.classList.remove('aieditor-is-resizing-media')
    this.events.abort()
    this.removeBoundaryControls()
    cancelAnimationFrame(this.positionFrame)
    this.dom.remove()
  }

  /** 创建支持 Pointer 和键盘操作的单侧缩放手柄。 */
  private createHandle(direction: 'left' | 'right'): void {
    const handle = document.createElement('span')
    handle.className = direction === 'left' ? 'ProseMirror-lresizer' : 'ProseMirror-rresizer'
    handle.dataset.resizeHandle = direction
    handle.setAttribute('role', 'separator')
    handle.setAttribute('aria-orientation', 'vertical')
    handle.setAttribute('aria-label', `Resize ${this.options.label ?? this.nodeValue.type.name} from ${direction}`)
    handle.tabIndex = 0
    handle.contentEditable = 'false'
    handle.addEventListener('pointerdown', (event) => this.startResize(event, direction), {
      signal: this.events.signal,
    })
    handle.addEventListener('keydown', (event) => this.resizeWithKeyboard(event, direction), {
      signal: this.events.signal,
    })
    this.dom.append(handle)
  }

  /** 记录拖拽起点，并在 window 上追踪指针直到释放。 */
  private startResize(event: PointerEvent, direction: 'left' | 'right'): void {
    if (event.button !== 0 || !this.props.editor.isEditable) return
    event.preventDefault()
    event.stopPropagation()
    this.activePointer = event.pointerId
    this.resizeDirection = direction
    this.startX = event.clientX
    this.startWidth = this.dom.getBoundingClientRect().width
    this.dom.classList.add('is-resizing')
    document.body.classList.add('aieditor-is-resizing-media')
    this.cleanupResizeListeners()
    window.addEventListener('pointermove', this.resize)
    window.addEventListener('pointerup', this.finishResize)
    window.addEventListener('pointercancel', this.finishResize)
  }

  /** 拖拽期间只更新 DOM，避免每个 pointermove 都创建编辑器事务。 */
  private readonly resize = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointer || !this.resizeDirection) return
    const delta = this.resizeDirection === 'right'
      ? event.clientX - this.startX
      : this.startX - event.clientX
    const multiplier = this.nodeValue.attrs.alignment === 'center' ? 2 : 1
    const maximum = this.dom.parentElement?.clientWidth ?? Number.POSITIVE_INFINITY
    const width = Math.min(maximum, Math.max(this.options.minWidth, this.startWidth + delta * multiplier))
    this.dom.style.width = `${Math.round(width)}px`
    this.scheduleFloatingMenuUpdate()
  }

  /** 指针释放后将最终宽度写回节点，并恢复全局状态。 */
  private readonly finishResize = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointer) return
    this.activePointer = undefined
    this.resizeDirection = undefined
    this.dom.classList.remove('is-resizing')
    document.body.classList.remove('aieditor-is-resizing-media')
    this.cleanupResizeListeners()
    this.persistWidth(Math.round(this.dom.getBoundingClientRect().width))
  }

  /** 使用当前 NodeView 位置把宽度持久化到 ProseMirror 文档。 */
  private persistWidth(width: number): void {
    if (!this.props.editor.isEditable) return
    const position = this.props.getPos()
    if (typeof position !== 'number') return
    const transaction = this.props.editor.state.tr.setNodeMarkup(position, undefined, {
      ...this.nodeValue.attrs,
      width,
    })
    this.props.editor.view.dispatch(transaction)
  }

  /** 根据节点属性同步容器宽度和对齐数据属性。 */
  private syncNode(): void {
    const width = this.nodeValue.attrs.width
    const alignment = this.nodeValue.attrs.alignment ?? 'center'
    this.dom.style.width = typeof width === 'number'
      ? `${width}px`
      : typeof width === 'string' && width ? width : 'fit-content'
    this.dom.dataset.resized = String(Boolean(width))
    this.dom.dataset.alignment = alignment
  }

  /** 使用方向键按固定步长缩放，Shift 将步长扩大到 50px。 */
  private resizeWithKeyboard(event: KeyboardEvent, direction: 'left' | 'right'): void {
    if (!this.props.editor.isEditable || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return
    event.preventDefault()
    const amount = event.shiftKey ? 50 : 10
    const grows = direction === 'right' ? event.key === 'ArrowRight' : event.key === 'ArrowLeft'
    const maximum = this.dom.parentElement?.clientWidth ?? Number.POSITIVE_INFINITY
    const width = Math.min(
      maximum,
      Math.max(this.options.minWidth, this.dom.getBoundingClientRect().width + (grows ? amount : -amount)),
    )
    this.dom.style.width = `${Math.round(width)}px`
    this.persistWidth(Math.round(width))
  }

  /** 下一帧通知 Floating Menu 重新计算媒体菜单位置。 */
  private scheduleFloatingMenuUpdate(): void {
    cancelAnimationFrame(this.positionFrame)
    this.positionFrame = requestAnimationFrame(() => {
      this.props.editor.commands.updateFloatingMenuPosition()
    })
  }

  /** 幂等清理拖拽期间注册在 window 上的监听器。 */
  private cleanupResizeListeners(): void {
    window.removeEventListener('pointermove', this.resize)
    window.removeEventListener('pointerup', this.finishResize)
    window.removeEventListener('pointercancel', this.finishResize)
  }
}
