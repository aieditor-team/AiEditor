import {autoUpdate} from '@floating-ui/dom'
import type {Editor} from '@tiptap/core'
import {MenuBar} from '../../menus/core'
import {HighlightBlockMenuItem, type HighlightBlockMenuOptions} from '../../menus/items'
import type {AiEditorI18n} from '../../i18n'

/** 鼠标进入高亮块时，在块右上角显示上下文调色板入口。 */
export class HighlightBlockFloatingMenu {
    readonly element: HTMLElement
    private readonly item: HighlightBlockMenuItem
    private menuBar: MenuBar | undefined
    private editor: Editor | undefined
    private activeBlock: HTMLElement | null = null
    private activePosition: number | null = null
    private stopAutoUpdate: (() => void) | undefined
    private hideTimer: number | undefined

    constructor(options: HighlightBlockMenuOptions = {}) {
        this.element = document.createElement('div')
        this.element.className = 'aieditor__highlight-block-floating-menu'
        this.element.setAttribute('role', 'toolbar')
        this.element.setAttribute('aria-label', 'Highlight block colors')
        this.element.hidden = true
        this.item = new HighlightBlockMenuItem(options, 'floating', () => this.activePosition)
    }

    /** 将浮层挂到 body，并监听编辑区悬停与文档事务。 */
    mount(editor: Editor, i18n: AiEditorI18n): void {
        if (this.menuBar) throw new Error('HighlightBlockFloatingMenu is already mounted')
        this.editor = editor
        document.body.append(this.element)
        this.element.setAttribute('aria-label', i18n.t('Highlight block colors'))
        this.menuBar = new MenuBar(this.element, {editor, i18n}, [this.item])
        editor.view.dom.addEventListener('mouseover', this.handleMouseOver)
        editor.view.dom.addEventListener('mouseout', this.handleMouseOut)
        this.element.addEventListener('mouseenter', this.cancelHide)
        this.element.addEventListener('mouseleave', this.scheduleHide)
        editor.on('transaction', this.handleTransaction)
    }

    /** 切换只读时强制收起，避免保留不可操作的悬浮入口。 */
    setEditable(editable: boolean): void {
        if (!editable) this.hide(true)
    }

    /** 停止定位与延时任务，并释放编辑器和 DOM 上的全部监听器。 */
    destroy(): void {
        this.cancelHide()
        this.stopAutoUpdate?.()
        this.stopAutoUpdate = undefined
        if (this.editor) {
            this.editor.view.dom.removeEventListener('mouseover', this.handleMouseOver)
            this.editor.view.dom.removeEventListener('mouseout', this.handleMouseOut)
            this.editor.off('transaction', this.handleTransaction)
        }
        this.element.removeEventListener('mouseenter', this.cancelHide)
        this.element.removeEventListener('mouseleave', this.scheduleHide)
        this.menuBar?.destroy()
        this.menuBar = undefined
        this.editor = undefined
        this.activeBlock = null
        this.activePosition = null
        this.element.remove()
    }

    private readonly handleMouseOver = (event: MouseEvent): void => {
        if (!this.editor?.isEditable) return
        const target = event.target as Element | null
        const block = target?.closest<HTMLElement>('div[data-type="highlight-block"]') ?? null
        if (!block || !this.editor?.view.dom.contains(block)) return
        this.show(block)
    }

    private readonly handleMouseOut = (event: MouseEvent): void => {
        if (!this.activeBlock) return
        const related = event.relatedTarget as Node | null
        if (related && (this.activeBlock.contains(related) || this.element.contains(related))) return
        this.scheduleHide()
    }

    private readonly handleTransaction = (): void => {
        if (this.activePosition == null || !this.editor) return
        // 文档变化可能删除或映射掉悬停节点，位置失效时立即关闭浮层。
        if (this.editor.state.doc.nodeAt(this.activePosition)?.type.name !== 'highlightBlock') {
            this.hide(true)
            return
        }
        this.menuBar?.update()
    }

    /** 切换活动块时重建自动定位，重复进入同一块只刷新状态。 */
    private show(block: HTMLElement): void {
        this.cancelHide()
        if (!this.editor) return
        if (this.activeBlock !== block) {
            this.stopAutoUpdate?.()
            this.activeBlock = block
            this.activePosition = this.resolvePosition(block)
            this.stopAutoUpdate = autoUpdate(block, this.element, () => this.updatePosition())
        }
        this.element.hidden = false
        this.menuBar?.update()
        this.updatePosition()
    }

    private readonly scheduleHide = (): void => {
        this.cancelHide()
        this.hideTimer = window.setTimeout(() => this.hide(), 140)
    }

    private readonly cancelHide = (): void => {
        if (this.hideTimer !== undefined) window.clearTimeout(this.hideTimer)
        this.hideTimer = undefined
    }

    /** 子调色板打开时延迟普通隐藏；销毁或只读切换可强制关闭。 */
    private hide(force = false): void {
        if (!force && this.item.isOpen()) return
        this.cancelHide()
        this.stopAutoUpdate?.()
        this.stopAutoUpdate = undefined
        this.activeBlock = null
        this.activePosition = null
        this.element.hidden = true
    }

    /** 将 DOM 块映射回 ProseMirror 节点起点，并兼容 posAtDOM 的边界偏移。 */
    private resolvePosition(block: HTMLElement): number | null {
        if (!this.editor) return null
        const mapped = this.editor.view.posAtDOM(block, 0)
        for (const position of [mapped - 1, mapped]) {
            if (position >= 0 && this.editor.state.doc.nodeAt(position)?.type.name === 'highlightBlock') return position
        }
        return null
    }

    /** 将菜单放在块右上角，并限制在视口左右安全边距内。 */
    private updatePosition(): void {
        if (!this.activeBlock || this.element.hidden) return
        const blockRect = this.activeBlock.getBoundingClientRect()
        const menuRect = this.element.getBoundingClientRect()
        const left = Math.min(window.innerWidth - menuRect.width - 8, Math.max(8, blockRect.right - menuRect.width - 8))
        const top = Math.max(8, blockRect.top + 8)
        Object.assign(this.element.style, {left: `${left}px`, top: `${top}px`})
    }
}
