import {createElement, Maximize2, Minimize2} from 'lucide'
import {MenuItem, type MenuContext} from '../../core'

export interface FullscreenMenuItemOptions {
    isFullscreen: () => boolean
    toggleFullscreen: () => void
}

/** 在浏览器页面内切换编辑器的视口全屏状态，不调用原生 Fullscreen API。 */
export class FullscreenMenuItem extends MenuItem {
    private readonly options: FullscreenMenuItemOptions
    private renderedFullscreen: boolean | undefined

    constructor(options: FullscreenMenuItemOptions) {
        super('fullscreen')
        this.options = options
    }

    render(_context: MenuContext): HTMLElement {
        const button = document.createElement('button')
        // MenuItem 可在工具栏重建时复用；新 DOM 必须重新同步一次图标。
        this.renderedFullscreen = undefined
        button.type = 'button'
        button.className = 'aieditor__tool'
        this.listen(button, 'mousedown', (event) => event.preventDefault())
        this.listen(button, 'click', () => this.options.toggleFullscreen())
        return button
    }

    update(context: MenuContext): void {
        const button = this.element as HTMLButtonElement | null
        if (!button) return
        const fullscreen = this.options.isFullscreen()
        const label = context.i18n.t(fullscreen ? 'Exit fullscreen' : 'Fullscreen')
        button.title = label
        button.setAttribute('aria-label', label)
        button.setAttribute('aria-pressed', String(fullscreen))
        if (fullscreen === this.renderedFullscreen) return
        button.replaceChildren(createElement(fullscreen ? Minimize2 : Maximize2, {'aria-hidden': 'true'}))
        this.renderedFullscreen = fullscreen
    }
}
