import {autoUpdate, computePosition, offset, shift} from '@floating-ui/dom'

let menuTooltipSequence = 0

/** 为 MenuBar 内带 title 的控件提供统一、可键盘访问的悬浮提示。 */
export class MenuTooltip {
    readonly element: HTMLElement
    private readonly container: HTMLElement
    private readonly events = new AbortController()
    private target: HTMLElement | null = null
    private showTimer: number | undefined
    private stopAutoUpdate: (() => void) | undefined
    private previousDescribedBy: string | null = null

    constructor(container: HTMLElement) {
        this.container = container
        this.element = document.createElement('div')
        this.element.id = `aieditor-menu-tooltip-${++menuTooltipSequence}`
        this.element.className = 'aieditor__menu-tooltip'
        this.element.setAttribute('role', 'tooltip')
        this.element.hidden = true
        document.body.append(this.element)

        container.addEventListener('mouseover', this.handleMouseOver, {signal: this.events.signal})
        container.addEventListener('mouseout', this.handleMouseOut, {signal: this.events.signal})
        container.addEventListener('focusin', this.handleFocusIn, {signal: this.events.signal})
        container.addEventListener('focusout', this.handleFocusOut, {signal: this.events.signal})
        container.addEventListener('click', () => this.close(), {signal: this.events.signal})
        container.addEventListener('keydown', this.handleKeydown, {signal: this.events.signal})
    }

    /** 菜单重建前关闭提示，避免目标节点被移除后 Portal 残留。 */
    close(): void {
        this.cancelShow()
        this.stopAutoUpdate?.()
        this.stopAutoUpdate = undefined
        if (this.target) {
            if (this.previousDescribedBy) this.target.setAttribute('aria-describedby', this.previousDescribedBy)
            else this.target.removeAttribute('aria-describedby')
        }
        this.previousDescribedBy = null
        this.target = null
        this.element.hidden = true
    }

    /** 销毁 Portal，并把被临时移除的原生 title 恢复给工具按钮。 */
    destroy(): void {
        this.close()
        this.events.abort()
        this.container.querySelectorAll<HTMLElement>('[data-aieditor-tooltip]').forEach((target) => {
            if (!target.hasAttribute('title')) target.title = target.dataset.aieditorTooltip ?? ''
            delete target.dataset.aieditorTooltip
        })
        this.element.remove()
    }

    private readonly handleMouseOver = (event: MouseEvent): void => {
        const target = this.resolveTarget(event.target)
        if (!target || target === this.target) return
        this.schedule(target, 180)
    }

    private readonly handleMouseOut = (event: MouseEvent): void => {
        const target = this.resolveTarget(event.target)
        if (!target) return
        const related = event.relatedTarget as Node | null
        if (related && target.contains(related)) return
        this.close()
    }

    private readonly handleFocusIn = (event: FocusEvent): void => {
        const target = this.resolveTarget(event.target)
        if (target) this.schedule(target, 100)
    }

    private readonly handleFocusOut = (event: FocusEvent): void => {
        if (this.resolveTarget(event.target)) this.close()
    }

    private readonly handleKeydown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') this.close()
    }

    /** 暂存原生 title 以避免双重提示，并延迟显示自定义 Tooltip。 */
    private schedule(target: HTMLElement, delay: number): void {
        this.close()
        const title = target.getAttribute('title')
        if (title) {
            target.dataset.aieditorTooltip = title
            target.removeAttribute('title')
        }
        if (!this.getLabel(target)) return
        this.showTimer = window.setTimeout(() => this.open(target), delay)
    }

    /** 打开提示、合并 aria-describedby，并开始追踪目标位置。 */
    private open(target: HTMLElement): void {
        this.cancelShow()
        if (!target.isConnected || !this.container.contains(target)) return
        const label = this.getLabel(target)
        if (!label) return
        this.target = target
        this.element.textContent = label
        this.element.hidden = false
        this.previousDescribedBy = target.getAttribute('aria-describedby')
        const describedBy = [this.previousDescribedBy, this.element.id].filter(Boolean).join(' ')
        target.setAttribute('aria-describedby', describedBy)
        this.stopAutoUpdate = autoUpdate(target, this.element, () => this.updatePosition())
        this.updatePosition()
    }

    /** 从委托事件目标向上查找当前 MenuBar 内可提示的按钮。 */
    private resolveTarget(value: EventTarget | null): HTMLElement | null {
        const element = value instanceof Element ? value : null
        const target = element?.closest<HTMLElement>('button[title], button[data-aieditor-tooltip], [role="button"][title], [role="button"][data-aieditor-tooltip]') ?? null
        return target && this.container.contains(target) ? target : null
    }

    /** 按暂存 title、原生 title、aria-label 的优先级解析提示文案。 */
    private getLabel(target: HTMLElement): string {
        return target.dataset.aieditorTooltip?.trim()
            || target.getAttribute('title')?.trim()
            || target.getAttribute('aria-label')?.trim()
            || ''
    }

    /** 取消尚未触发的延时显示任务。 */
    private cancelShow(): void {
        if (this.showTimer !== undefined) window.clearTimeout(this.showTimer)
        this.showTimer = undefined
    }

    /** 将提示固定在目标上方，并在视口边缘自动平移。 */
    private async updatePosition(): Promise<void> {
        if (!this.target || this.element.hidden) return
        const {x, y} = await computePosition(this.target, this.element, {
            placement: 'top',
            strategy: 'fixed',
            middleware: [offset(8), shift({padding: 6})],
        })
        if (!this.target || this.element.hidden) return
        Object.assign(this.element.style, {left: `${x}px`, top: `${y}px`})
    }
}
