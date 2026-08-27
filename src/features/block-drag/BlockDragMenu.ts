import type {Editor} from '@tiptap/core'
import {createElement, GripVertical, Plus, type IconNode} from 'lucide'
import {NodeSelection, Plugin, PluginKey, TextSelection} from '@tiptap/pm/state'
import {DOMParser} from '@tiptap/pm/model'
import type {EditorView} from '@tiptap/pm/view'
import type {JSONContent} from '@tiptap/core'
import type {AiEditorI18n} from '../../i18n'
import {MenuBar, MenuItem, type MenuItemConfig} from '../../menus/core'
import {resolveMenuItems} from '../../menus/resolve-menu-items'
import {toolbarMenuGroupPortalContains} from '../../menus/core/ToolbarMenuGroupLifecycle'
import {TextStyleMenuItem, UnderlineMenuItem} from '../../menus/items'
import {BulletListToggleMenuItem} from '../../menus/items/blocks'
import {HorizontalRuleMenuItem} from '../../menus/items/insert'
import {AttachmentMenuItem, ImageMenuItem, VideoMenuItem} from '../../menus/items/media'
import {TableMenuItem} from '../../menus/items/table'
import type {Uploader} from '../../uploader'

export interface BlockQuickInsertItem {
    id: string
    label: string
    icon?: IconNode
    content: string | JSONContent | ((editor: Editor) => string | JSONContent)
}

export type BlockQuickInsertConfig = MenuItemConfig | BlockQuickInsertItem

export interface BlockQuickInsertMenuConfig {
    key: string
    label?: string
}

export type BlockQuickInsertMenusConfig =
    | readonly (BlockQuickInsertConfig | BlockQuickInsertMenuConfig)[]
    | ((defaults: MenuItem[]) => readonly (BlockQuickInsertConfig | BlockQuickInsertMenuConfig)[])

export interface BlockDragMenuOptions {
    enabled?: boolean
    /** 与 ToolbarMenusConfig 使用相同协议，并额外兼容 {id, label, content} 内容项。 */
    quickInsert?: BlockQuickInsertMenusConfig
}

export const defaultBlockQuickInsertItems: MenuItemConfig[] = [
    'text-style', 'bullet-list', 'table', 'image', 'attachment', 'video', 'underline', 'horizontal-rule',
]

function createBlockMenuDefaults(uploader?: Uploader): MenuItem[] {
    return [
        new TextStyleMenuItem(), new BulletListToggleMenuItem(), new TableMenuItem(),
        new ImageMenuItem({uploader}), new AttachmentMenuItem({uploader}), new VideoMenuItem({uploader}),
        new UnderlineMenuItem(), new HorizontalRuleMenuItem(),
    ]
}

function directBlockAt(view: EditorView, target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof HTMLElement)) return null
    const prose = view.dom
    let block: HTMLElement | null = target
    while (block && block.parentElement !== prose) block = block.parentElement
    if (block?.parentElement !== prose || block.classList.contains('ProseMirror-widget')) return null
    return block
}

function dropBlockAt(view: EditorView, clientX: number, clientY: number, excludedIndex: number | null): HTMLElement | null {
    const direct = directBlockAt(view, document.elementFromPoint(clientX, clientY))
    if (direct && blockPosition(view, direct)?.index !== excludedIndex) return direct

    let previous: HTMLElement | null = null
    for (const child of view.dom.children) {
        if (!(child instanceof HTMLElement) || child.classList.contains('ProseMirror-widget')) continue
        if (blockPosition(view, child)?.index === excludedIndex) continue
        const rect = child.getBoundingClientRect()
        if (clientY < rect.top) return previous ?? child
        previous = child
    }
    return previous
}

function blockControlTop(block: HTMLElement, controlHeight: number): number {
    const productAnchor = block.matches('[data-block-drag-anchor]')
        ? block
        : block.querySelector<HTMLElement>('[data-block-drag-anchor]')
    if (productAnchor && productAnchor.dataset.blockDragAnchor !== 'line') {
        return productAnchor.getBoundingClientRect().top + 2
    }
    const textAnchor = productAnchor ?? (block.matches('table, [data-type="table"]') || block.querySelector(':scope > table')
        ? block.querySelector<HTMLElement>('th p, td p')
        ?? block.querySelector<HTMLElement>('tr:not(.ProseMirror-widget) th, tr:not(.ProseMirror-widget) td')
        : block.matches('ul, ol, blockquote')
            ? block.querySelector<HTMLElement>('li p, li, p')
            : block.matches('p, h1, h2, h3, h4, h5, h6')
                ? block
                : null)
    if (!textAnchor) return block.getBoundingClientRect().top + 2

    const rect = textAnchor.getBoundingClientRect()
    const lineHeight = Number.parseFloat(getComputedStyle(textAnchor).lineHeight)
    if (!Number.isFinite(lineHeight) || lineHeight <= 0) return rect.top + 2
    return rect.top + (Math.min(lineHeight, rect.height || lineHeight) - controlHeight) / 2
}

function decorateQuickMenuItems(container: HTMLElement): void {
    container.querySelectorAll<HTMLElement>(':scope > [data-menu-item]').forEach((element) => {
        if (element.classList.contains('aieditor__separator')) return
        element.dataset.toolbarMenuGroupItem = ''
        const command = element.matches('button')
            ? element as HTMLButtonElement
            : element.querySelector<HTMLButtonElement>('button')
        if (!command) return
        const title = command.getAttribute('title')
        const labelText = command.getAttribute('aria-label') ?? title ?? command.textContent?.trim() ?? ''
        command.classList.add('aieditor__toolbar-menu-group-command')
        command.setAttribute('role', 'menuitem')
        command.removeAttribute('title')
        if (command.querySelector('.aieditor__toolbar-menu-group-trigger-label, .aieditor__toolbar-menu-group-command-label')) return
        command.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) node.remove()
        })
        const label = command.ownerDocument.createElement('span')
        label.className = 'aieditor__toolbar-menu-group-command-label'
        label.textContent = labelText
        const chevron = command.querySelector('.aieditor__menu-chevron')
        if (chevron) chevron.before(label)
        else command.append(label)
    })
}

function blockPosition(view: EditorView, block: HTMLElement): { from: number; index: number; nodeSize: number } | null {
    let domPosition: number
    try {
        domPosition = view.posAtDOM(block, 0)
    } catch {
        return null
    }
    const resolved = view.state.doc.resolve(Math.max(0, Math.min(domPosition, view.state.doc.content.size)))
    const index = resolved.index(0)
    if (index < 0 || index >= view.state.doc.childCount) return null
    let from = 0
    for (let i = 0; i < index; i += 1) from += view.state.doc.child(i).nodeSize
    const node = view.state.doc.child(index)
    return {from, index, nodeSize: node.nodeSize}
}

export function moveBlock(view: EditorView, sourceIndex: number, targetIndex: number): void {
    if (sourceIndex === targetIndex || sourceIndex < 0 || targetIndex < 0) return
    const source = view.state.doc.child(sourceIndex)
    let sourceFrom = 0
    for (let i = 0; i < sourceIndex; i += 1) sourceFrom += view.state.doc.child(i).nodeSize
    const removed = view.state.tr.delete(sourceFrom, sourceFrom + source.nodeSize)
    let insertAt = 0
    // 放到某个块上时，源块应插入到目标块之后。源块位于目标块下方时，删除源块不会改变目标索引，
    // 因此插入位置需要加一；源块位于目标块上方时，删除操作已经使目标索引左移。
    const insertIndex = sourceIndex < targetIndex ? targetIndex : targetIndex + 1
    for (let i = 0; i < insertIndex; i += 1) insertAt += removed.doc.child(i).nodeSize
    view.dispatch(removed.insert(insertAt, source))
}

function insertQuickContent(view: EditorView, position: number, content: string | JSONContent): void {
    if (typeof content === 'string') {
        const wrapper = document.createElement('div')
        wrapper.innerHTML = content
        const parsed = DOMParser.fromSchema(view.state.schema).parse(wrapper)
        view.dispatch(view.state.tr.replaceWith(position, position, parsed.content))
        return
    }
    const node = view.state.schema.nodeFromJSON(content)
    view.dispatch(view.state.tr.insert(position, node))
}

export const BlockDragMenu = new PluginKey('blockDragMenu')

export function createBlockDragMenuPlugin(
    editor: Editor,
    i18nOrOptions: AiEditorI18n | BlockDragMenuOptions = {},
    uploader?: Uploader,
    providedOptions: BlockDragMenuOptions = {},
    providedDefaults?: MenuItem[],
): Plugin {
    const hasI18n = typeof i18nOrOptions === 'object' && 't' in i18nOrOptions
    const i18n = (hasI18n ? i18nOrOptions : {t: (value: string) => value, subscribe: () => undefined}) as AiEditorI18n
    const options = (hasI18n ? providedOptions : i18nOrOptions) as BlockDragMenuOptions
    const defaults = providedDefaults ?? createBlockMenuDefaults(uploader)
    const quickInsertConfig = options.quickInsert ?? defaultBlockQuickInsertItems
    const quickInsert = typeof quickInsertConfig === 'function'
        ? quickInsertConfig(defaults)
        : quickInsertConfig
    return new Plugin({
        key: BlockDragMenu,
        view: (view) => {
            if (options.enabled === false) return {
                destroy: () => {
                }
            }
            const host = view.dom.parentElement ?? view.dom
            const handle = document.createElement('div')
            const quick = document.createElement('div')
            let activeBlock: HTMLElement | null = null
            let draggingIndex: number | null = null
            let pointerDragId: number | null = null
            let pointerTarget: HTMLElement | null = null
            let mouseDragging = false
            let hideTimer: number | undefined
            handle.className = 'aieditor__block-drag-handle'
            handle.draggable = true
            handle.append(createElement(GripVertical, {'aria-hidden': 'true'}))
            handle.setAttribute('role', 'button')
            handle.setAttribute('aria-label', 'Move block')
            handle.setAttribute('aria-grabbed', 'false')
            quick.className = 'aieditor__toolbar-menu-group-panel aieditor__block-quick-insert'
            quick.setAttribute('role', 'menu')
            quick.hidden = true
            const labelOverrides = new Map<string, string>()
            const menuConfigs = quickInsert.map((item): MenuItemConfig => {
                if (item && typeof item === 'object' && 'content' in item) {
                    const legacy = item as BlockQuickInsertItem
                    return new class extends MenuItem {
                        constructor() {
                            super(legacy.id)
                        }

                        render(): HTMLElement {
                            const button = document.createElement('button')
                            button.type = 'button'
                            button.dataset.blockQuickInsert = legacy.id
                            button.setAttribute('role', 'menuitem')
                            if (legacy.icon) button.append(createElement(legacy.icon, {'aria-hidden': 'true'}))
                            button.append(document.createTextNode(legacy.label))
                            this.listen(button, 'click', () => {
                                if (!activeBlock) return
                                const position = blockPosition(view, activeBlock)
                                if (!position) return
                                const content = typeof legacy.content === 'function'
                                    ? legacy.content(editor)
                                    : legacy.content
                                insertQuickContent(view, position.from, content)
                                quick.hidden = true
                            })
                            return button
                        }
                    }()
                }
                if (item === 'paragraph' || item === 'heading') return 'text-style' as MenuItemConfig
                if (item && typeof item === 'object' && 'key' in item && !('type' in item) && !('items' in item)) {
                    if (typeof item.label === 'string') labelOverrides.set(item.key, item.label)
                    return item.key
                }
                return item as MenuItemConfig
            })
                .filter((item) => {
                    if (typeof item !== 'string') return true
                    const commands = editor.commands as Record<string, unknown>
                    const required: Record<string, string> = {
                        'text-style': 'setParagraph', 'bullet-list': 'toggleBulletList', table: 'insertTable',
                        image: 'setImage', attachment: 'setAttachment', video: 'setVideo',
                        underline: 'toggleUnderline', 'horizontal-rule': 'setHorizontalRule',
                    }
                    return !required[item] || typeof commands[required[item]] === 'function'
                })
            const resolvedItems = resolveMenuItems(menuConfigs, defaults)
            const itemHost = document.createElement('div')
            itemHost.className = 'aieditor__block-quick-menu-items'
            const quickMenu = new MenuBar(itemHost, {editor, i18n}, resolvedItems)
            decorateQuickMenuItems(itemHost)
            labelOverrides.forEach((label, key) => {
                const item = quickMenu.getItem(key)
                item?.getElement()?.setAttribute('aria-label', label)
                item?.getElement()?.setAttribute('title', label)
            })
            quick.append(itemHost)
            const plus = document.createElement('button')
            plus.type = 'button'
            plus.className = 'aieditor__block-quick-trigger'
            plus.setAttribute('aria-label', 'Insert block')
            plus.append(createElement(Plus, {'aria-hidden': 'true'}))
            plus.addEventListener('click', (event) => {
                event.preventDefault()
                event.stopPropagation()
                if (activeBlock) {
                    const position = blockPosition(view, activeBlock)
                    if (position) {
                        const selection = TextSelection.near(view.state.doc.resolve(position.from), 1)
                        view.dispatch(view.state.tr.setSelection(selection))
                        view.dom.focus({preventScroll: true})
                    }
                }
                quick.hidden = !quick.hidden
            })
            const onQuickClick = (event: MouseEvent): void => {
                const scrollTop = host.scrollTop
                const scrollLeft = host.scrollLeft
                const command = event.target instanceof Element
                    ? event.target.closest<HTMLButtonElement>('button')
                    : null
                requestAnimationFrame(() => {
                    host.scrollTop = scrollTop
                    host.scrollLeft = scrollLeft
                    if (command && !command.hasAttribute('aria-haspopup')) quick.hidden = true
                })
            }
            quick.addEventListener('click', onQuickClick, true)
            const controls = document.createElement('div')
            controls.className = 'aieditor__block-drag-menu'
            controls.append(plus, handle, quick)
            controls.hidden = true
            host.append(controls)

            const isQuickMenuPortalTarget = (target: Node): boolean =>
                [...quick.querySelectorAll<HTMLElement>('[aria-controls]')].some((control) => {
                    const panelId = control.getAttribute('aria-controls')
                    if (!panelId) return false
                    const panel = control.ownerDocument.getElementById(panelId)
                    return Boolean(panel?.contains(target) || toolbarMenuGroupPortalContains(panelId, target))
                })
            const onDocumentClick = (event: MouseEvent): void => {
                if (quick.hidden || !(event.target instanceof Node)) return
                if (controls.contains(event.target) || isQuickMenuPortalTarget(event.target)) return
                quick.hidden = true
            }
            document.addEventListener('click', onDocumentClick, true)

            const syncEditable = (): void => {
                const editable = editor.isEditable
                if (!editable) {
                    controls.hidden = true
                    quick.hidden = true
                    activeBlock = null
                }
                controls.setAttribute('aria-hidden', String(!editable))
                handle.draggable = editable
            }
            syncEditable()

            const cancelHide = (): void => {
                if (hideTimer !== undefined) window.clearTimeout(hideTimer)
                hideTimer = undefined
            }
            const hide = (): void => {
                cancelHide()
                controls.hidden = true
                quick.hidden = true
                activeBlock = null
            }
            const scheduleHide = (): void => {
                if (!quick.hidden) return
                cancelHide()
                hideTimer = window.setTimeout(hide, 180)
            }

            const place = (block: HTMLElement): void => {
                cancelHide()
                // 未定位的绝对定位控件可能暂时产生滚动条并使居中的文档 Surface 偏移。
                // 先在中性位置显示控件，确保后续测量都基于稳定的内容几何尺寸。
                if (controls.hidden) {
                    controls.style.left = '6px'
                    controls.style.top = '0px'
                    controls.hidden = false
                }
                const hostRect = host.getBoundingClientRect()
                const proseRect = view.dom.getBoundingClientRect()
                const proseStyle = getComputedStyle(view.dom)
                const proseScale = view.dom.offsetWidth > 0 ? proseRect.width / view.dom.offsetWidth : 1
                const contentLeft = proseRect.left
                    + (view.dom.clientLeft + (Number.parseFloat(proseStyle.paddingLeft) || 0)) * proseScale
                // 在页面内容边缘保留稳定的间隔。居中或右对齐的媒体不能把块控件拉入页面内部。
                const left = contentLeft - hostRect.left + host.scrollLeft - controls.offsetWidth - 4
                controls.style.left = `${Math.max(6, left)}px`
                controls.style.top = `${blockControlTop(block, controls.offsetHeight) - hostRect.top + host.scrollTop}px`
                activeBlock = block
            }
            const onMove = (event: MouseEvent): void => {
                if (!quick.hidden) return
                const block = directBlockAt(view, event.target)
                if (block && block !== controls && !controls.contains(event.target as Node)) place(block)
            }
            const onLeave = (event: MouseEvent): void => {
                if (!host.contains(event.relatedTarget as Node)) scheduleHide()
            }
            const onDragStart = (event: DragEvent): void => {
                if (!activeBlock) return
                const position = blockPosition(view, activeBlock)
                if (!position || !event.dataTransfer) return
                draggingIndex = position.index
                mouseDragging = false
                view.focus()
                const selection = NodeSelection.create(view.state.doc, position.from)
                view.dispatch(view.state.tr.setSelection(selection))
                // 块移动由本插件负责。保留 ProseMirror 的拖拽 slice 会让其 drop 处理器先插入副本，
                // 然后我们的 dragend 兜底逻辑再移动源块，尤其容易在扩展装饰间隙中产生重复内容。
                view.dragging = null
                event.dataTransfer.clearData()
                event.dataTransfer.setData('application/x-aieditor-block', 'move')
                event.dataTransfer.setData('text/plain', selection.node.textContent)
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setDragImage(activeBlock, 0, 0)
                view.dom.classList.add('aieditor__block-dragging')
            }
            const onDragEnd = (): void => {
                draggingIndex = null
                handle.setAttribute('aria-grabbed', 'false')
                view.dom.classList.remove('aieditor__block-dragging')
            }
            const clearPointerTarget = (): void => {
                pointerTarget?.classList.remove('aieditor__block-drop-target')
                pointerTarget = null
            }
            const onPointerDown = (event: PointerEvent): void => {
                if (event.pointerType !== 'touch' || !editor.isEditable || event.button !== 0 || !activeBlock) return
                const position = blockPosition(view, activeBlock)
                if (!position) return
                event.preventDefault()
                pointerDragId = event.pointerId
                draggingIndex = position.index
                handle.setAttribute('aria-grabbed', 'true')
                handle.setPointerCapture?.(event.pointerId)
                view.dom.classList.add('aieditor__block-dragging')
            }
            const onPointerMove = (event: PointerEvent): void => {
                if (pointerDragId !== event.pointerId) return
                event.preventDefault()
                clearPointerTarget()
                const block = dropBlockAt(view, event.clientX, event.clientY, draggingIndex)
                if (block && blockPosition(view, block)?.index !== draggingIndex) {
                    pointerTarget = block
                    pointerTarget.classList.add('aieditor__block-drop-target')
                }
            }
            const onPointerUp = (event: PointerEvent): void => {
                if (pointerDragId !== event.pointerId) return
                event.preventDefault()
                const target = pointerTarget ?? dropBlockAt(view, event.clientX, event.clientY, draggingIndex)
                const targetPosition = target && blockPosition(view, target)
                if (draggingIndex !== null && targetPosition) moveBlock(view, draggingIndex, targetPosition.index)
                clearPointerTarget()
                pointerDragId = null
                onDragEnd()
            }
            const updateDropTarget = (clientX: number, clientY: number): void => {
                clearPointerTarget()
                const block = dropBlockAt(view, clientX, clientY, draggingIndex)
                if (block && blockPosition(view, block)?.index !== draggingIndex) {
                    pointerTarget = block
                    pointerTarget.classList.add('aieditor__block-drop-target')
                }
            }
            const onNativeDrag = (event: DragEvent): void => {
                if (draggingIndex === null || event.clientX === 0 && event.clientY === 0) return
                updateDropTarget(event.clientX, event.clientY)
            }
            const onNativeDrop = (event: DragEvent): void => {
                if (draggingIndex === null) return
                event.preventDefault()
                event.stopImmediatePropagation()
                updateDropTarget(event.clientX, event.clientY)
                const sourceIndex = draggingIndex
                const targetPosition = pointerTarget && blockPosition(view, pointerTarget)
                draggingIndex = null
                clearPointerTarget()
                view.dragging = null
                onDragEnd()
                if (targetPosition) moveBlock(view, sourceIndex, targetPosition.index)
            }
            const onNativeDragEnd = (): void => {
                clearPointerTarget()
                view.dragging = null
                onDragEnd()
            }
            const onMouseDown = (event: MouseEvent): void => {
                if (!editor.isEditable || event.button !== 0 || !activeBlock) return
                const position = blockPosition(view, activeBlock)
                if (!position) return
                mouseDragging = true
                draggingIndex = position.index
                handle.setAttribute('aria-grabbed', 'true')
                view.dom.classList.add('aieditor__block-dragging')
            }
            const onDocumentMouseMove = (event: MouseEvent): void => {
                if (mouseDragging) updateDropTarget(event.clientX, event.clientY)
            }
            const onDocumentMouseUp = (event: MouseEvent): void => {
                if (!mouseDragging) return
                updateDropTarget(event.clientX, event.clientY)
                const targetPosition = pointerTarget && blockPosition(view, pointerTarget)
                if (draggingIndex !== null && targetPosition) moveBlock(view, draggingIndex, targetPosition.index)
                mouseDragging = false
                clearPointerTarget()
                onDragEnd()
            }
            view.dom.addEventListener('mousemove', onMove)
            view.dom.addEventListener('mouseleave', onLeave)
            controls.addEventListener('mouseenter', cancelHide)
            controls.addEventListener('mouseleave', scheduleHide)
            handle.addEventListener('dragstart', onDragStart)
            handle.addEventListener('drag', onNativeDrag)
            handle.addEventListener('dragend', onNativeDragEnd)
            view.dom.addEventListener('drop', onNativeDrop, true)
            handle.addEventListener('pointerdown', onPointerDown)
            document.addEventListener('pointermove', onPointerMove)
            document.addEventListener('pointerup', onPointerUp)
            document.addEventListener('pointercancel', onPointerUp)
            handle.addEventListener('mousedown', onMouseDown)
            document.addEventListener('mousemove', onDocumentMouseMove)
            document.addEventListener('mouseup', onDocumentMouseUp)
            return {
                destroy: () => {
                    view.dom.removeEventListener('mousemove', onMove)
                    view.dom.removeEventListener('mouseleave', onLeave)
                    handle.removeEventListener('dragstart', onDragStart)
                    handle.removeEventListener('pointerdown', onPointerDown)
                    handle.removeEventListener('drag', onNativeDrag)
                    handle.removeEventListener('dragend', onNativeDragEnd)
                    view.dom.removeEventListener('drop', onNativeDrop, true)
                    document.removeEventListener('pointermove', onPointerMove)
                    document.removeEventListener('pointerup', onPointerUp)
                    document.removeEventListener('pointercancel', onPointerUp)
                    handle.removeEventListener('mousedown', onMouseDown)
                    document.removeEventListener('mousemove', onDocumentMouseMove)
                    document.removeEventListener('mouseup', onDocumentMouseUp)
                    document.removeEventListener('click', onDocumentClick, true)
                    controls.removeEventListener('mouseenter', cancelHide)
                    controls.removeEventListener('mouseleave', scheduleHide)
                    quick.removeEventListener('click', onQuickClick, true)
                    cancelHide()
                    quickMenu.destroy()
                    controls.remove()
                }, update: () => {
                    syncEditable()
                    quickMenu.update()
                }
            }
        },
    })
}
