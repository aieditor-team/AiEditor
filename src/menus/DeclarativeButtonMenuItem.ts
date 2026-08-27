import {createElement} from 'lucide'
import {MenuItem, type MenuContext, type MenuItemButtonConfig} from './core'

/** 将普通配置对象适配为可挂载到任意 MenuBar 的菜单按钮。 */
export class DeclarativeButtonMenuItem extends MenuItem {
    private readonly config: MenuItemButtonConfig

    constructor(config: MenuItemButtonConfig) {
        super(config.key)
        this.config = config
    }

    render(context: MenuContext): HTMLElement {
        const button = context.editor.view.dom.ownerDocument.createElement('button')
        button.type = 'button'
        button.className = 'aieditor__tool'
        const label = context.i18n.t(this.config.label)
        button.setAttribute('aria-label', label)
        button.title = context.i18n.t(this.config.tip ?? this.config.label)

        if (this.config.icon) {
            button.append(createElement(this.config.icon, {'aria-hidden': 'true'}))
        } else {
            button.classList.add('aieditor__tool--text')
            button.textContent = context.i18n.t(this.config.text ?? this.config.label)
        }

        this.listen(button, 'mousedown', (event) => event.preventDefault())
        this.listen(button, 'click', (event) => {
            if (!button.disabled) this.config.onClick({...context, event})
        })
        return button
    }

    update(context: MenuContext): void {
        const button = this.element as HTMLButtonElement | null
        if (!button) return
        const active = this.config.isActive?.(context) ?? false
        button.classList.toggle('is-active', active)
        button.disabled = !(this.config.isEnabled?.(context) ?? true)

        if (this.config.isActive) button.setAttribute('aria-pressed', String(active))
        else button.removeAttribute('aria-pressed')
    }
}
