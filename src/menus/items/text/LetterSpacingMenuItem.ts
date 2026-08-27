import {autoUpdate, computePosition, flip, offset, shift} from '@floating-ui/dom'
import {createElement, Minus, MoveHorizontal, Plus, type IconNode} from 'lucide'
import {clampFloatingPosition, MenuItem, resolveMenuFloatingOffset, resolveMenuFloatingPlacement, type MenuContext} from '../../core'

let letterSpacingSequence = 0

/** 离散字距选项，value 必须是可写入 CSS 的合法值。 */
export interface LetterSpacingOption {
    label: string
    /** 合法的 CSS letter-spacing；空字符串表示恢复默认字间距。 */
    value: string
}

/** 连续字距滑块的范围、步进与 CSS 单位配置。 */
export interface LetterSpacingSliderOptions {
    min?: number
    max?: number
    step?: number
    defaultValue?: number
    unit?: string
}

/** 数组使用离散档位，对象使用连续滑块。 */
export type LetterSpacingSetting = LetterSpacingOption[] | LetterSpacingSliderOptions

/** 兼容旧版数组配置；传入数组时 Slider 会吸附到这些离散档位。 */
export const defaultLetterSpacings: LetterSpacingOption[] = [
    {label: 'Default', value: ''},
    {label: 'Tight -0.5px', value: '-0.5px'},
    {label: '0.5px', value: '0.5px'},
    {label: '1px', value: '1px'},
    {label: '1.5px', value: '1.5px'},
    {label: '2px', value: '2px'},
    {label: '3px', value: '3px'},
    {label: '5px', value: '5px'},
]

export const defaultLetterSpacingSlider: Required<LetterSpacingSliderOptions> = {
    min: -5,
    max: 20,
    step: 0.5,
    defaultValue: 0,
    unit: 'px',
}

/** 使用横向 Slider 连续或按离散档位调整当前选区字间距。 */
/** 支持预设档位吸附和连续调整的字距菜单。 */
export class LetterSpacingMenuItem extends MenuItem {
    private readonly options: Required<LetterSpacingSliderOptions>
    private readonly values: LetterSpacingOption[] | undefined
    private trigger: HTMLButtonElement | null = null
    private panel: HTMLElement | null = null
    private input: HTMLInputElement | null = null
    private status: HTMLElement | null = null
    private stopAutoUpdate: (() => void) | undefined
    private translate: (value: string) => string = (value) => value

    constructor(setting: LetterSpacingSetting = defaultLetterSpacingSlider) {
        super('letter-spacing')
        if (Array.isArray(setting)) {
            if (!setting.length) throw new Error('LetterSpacingMenuItem requires at least one option')
            this.values = setting
            this.options = {min: 0, max: setting.length - 1, step: 1, defaultValue: 0, unit: ''}
            return
        }

        const min = Number.isFinite(setting.min) ? Number(setting.min) : defaultLetterSpacingSlider.min
        const max = Number.isFinite(setting.max) ? Number(setting.max) : defaultLetterSpacingSlider.max
        const step = Number.isFinite(setting.step) && Number(setting.step) > 0
            ? Number(setting.step)
            : defaultLetterSpacingSlider.step
        const defaultValue = Number.isFinite(setting.defaultValue)
            ? Number(setting.defaultValue)
            : defaultLetterSpacingSlider.defaultValue
        this.options = {
            min: Math.min(min, max),
            max: Math.max(min, max),
            step,
            defaultValue: Math.min(Math.max(defaultValue, Math.min(min, max)), Math.max(min, max)),
            unit: setting.unit ?? defaultLetterSpacingSlider.unit,
        }
    }

    /** 创建滑块面板、步进按钮和实时状态文本。 */
    render(context: MenuContext): HTMLElement {
        this.translate = (value) => context.i18n.t(value)
        const wrapper = document.createElement('div')
        const trigger = document.createElement('button')
        const panel = document.createElement('div')
        const heading = document.createElement('div')
        const label = document.createElement('span')
        const status = document.createElement('span')
        const controls = document.createElement('div')
        const decrease = this.createStepButton(this.translate('Decrease letter spacing'), Minus)
        const increase = this.createStepButton(this.translate('Increase letter spacing'), Plus)
        const input = document.createElement('input')
        const panelId = `aieditor-letter-spacing-${++letterSpacingSequence}`

        wrapper.className = 'aieditor__letter-spacing-menu'
        trigger.type = 'button'
        trigger.className = 'aieditor__tool'
        trigger.title = this.translate('Letter spacing')
        trigger.setAttribute('aria-label', this.translate('Letter spacing'))
        trigger.setAttribute('aria-haspopup', 'dialog')
        trigger.setAttribute('aria-expanded', 'false')
        trigger.setAttribute('aria-controls', panelId)
        trigger.append(createElement(MoveHorizontal, {'aria-hidden': 'true'}))

        panel.id = panelId
        panel.className = 'aieditor__letter-spacing-panel'
        panel.setAttribute('role', 'dialog')
        panel.setAttribute('aria-label', this.translate('Letter spacing'))
        panel.hidden = true
        heading.className = 'aieditor__letter-spacing-heading'
        label.textContent = this.translate('Letter spacing:')
        status.className = 'aieditor__letter-spacing-status'
        status.setAttribute('aria-live', 'polite')
        controls.className = 'aieditor__letter-spacing-controls'

        input.type = 'range'
        input.className = 'aieditor__letter-spacing-range'
        input.min = String(this.options.min)
        input.max = String(this.options.max)
        input.step = String(this.options.step)
        input.setAttribute('aria-label', this.translate('Letter spacing'))

        heading.append(label, status)
        controls.append(decrease, input, increase)
        panel.append(heading, controls)
        wrapper.append(trigger)
        document.body.append(panel)
        this.trigger = trigger
        this.panel = panel
        this.input = input
        this.status = status

        this.listen(trigger, 'mousedown', (event) => event.preventDefault())
        this.listen(trigger, 'click', () => panel.hidden ? this.open() : this.close())
        this.listen(trigger, 'keydown', (event) => {
            if (event.key !== 'ArrowDown') return
            event.preventDefault()
            this.open(true)
        })
        this.listen(input, 'input', () => this.applyValue(context, input.valueAsNumber))
        this.listen(decrease, 'click', () => this.stepValue(context, -1))
        this.listen(increase, 'click', () => this.stepValue(context, 1))
        this.listen(panel, 'keydown', (event) => this.handlePanelKeydown(event))
        this.listen(document.documentElement, 'click', (event) => {
            const target = event.target as Node | null
            if (target && !wrapper.contains(target) && !panel.contains(target)) this.close()
        })
        return wrapper
    }

    /** 将编辑器当前 CSS 字距反向映射为滑块值。 */
    update(context: MenuContext): void {
        if (!this.trigger || !this.input) return
        this.trigger.disabled = !context.editor.isEditable
        const cssValue = context.editor.getAttributes('textStyle').letterSpacing as string | null | undefined
        const value = this.getSliderValue(cssValue ?? '')
        this.input.value = String(value)
        this.updatePresentation(value)
    }

    /** 停止自动定位并移除 Portal。 */
    destroy(): void {
        this.close()
        this.panel?.remove()
        this.panel = null
        this.trigger = null
        this.input = null
        this.status = null
        super.destroy()
    }

    /** 创建增减字距的图标按钮。 */
    private createStepButton(label: string, icon: IconNode): HTMLButtonElement {
        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'aieditor__letter-spacing-step'
        button.title = label
        button.setAttribute('aria-label', label)
        button.append(createElement(icon, {'aria-hidden': 'true'}))
        return button
    }

    /** 把滑块值转换为 CSS，并通过扩展命令写回选区。 */
    private applyValue(context: MenuContext, sliderValue: number): void {
        if (!this.input) return
        const value = this.clamp(sliderValue)
        this.input.value = String(value)
        const cssValue = this.getCssValue(value)
        if (cssValue) context.editor.commands.setLetterSpacing(cssValue)
        else context.editor.commands.unsetLetterSpacing()
        this.updatePresentation(value)
    }

    /** 按一个步进调整当前值，同时复用滑块 input 事件路径。 */
    private stepValue(context: MenuContext, direction: -1 | 1): void {
        if (!this.input) return
        this.applyValue(context, this.input.valueAsNumber + (this.options.step * direction))
        this.input.focus()
    }

    /** 解析 CSS 字距；离散模式下返回最接近的档位索引。 */
    private getSliderValue(cssValue: string): number {
        if (this.values) {
            const exact = this.values.findIndex((option) => option.value === cssValue)
            if (exact >= 0) return exact
            const numeric = Number.parseFloat(cssValue)
            if (!Number.isFinite(numeric)) return this.options.defaultValue
            let nearest = 0
            this.values.forEach((option, index) => {
                const optionValue = Number.parseFloat(option.value)
                const nearestValue = Number.parseFloat(this.values?.[nearest]?.value ?? '')
                if (Number.isFinite(optionValue) && (!Number.isFinite(nearestValue)
                    || Math.abs(optionValue - numeric) < Math.abs(nearestValue - numeric))) nearest = index
            })
            return nearest
        }

        const numeric = Number.parseFloat(cssValue)
        return this.clamp(Number.isFinite(numeric) ? numeric : this.options.defaultValue)
    }

    /** 将滑块坐标转换为预设值或带单位的 CSS 值。 */
    private getCssValue(sliderValue: number): string {
        if (this.values) return this.values[Math.round(sliderValue)]?.value ?? ''
        if (Math.abs(sliderValue - this.options.defaultValue) < Number.EPSILON) return ''
        return `${this.formatNumber(sliderValue)}${this.options.unit}`
    }

    /** 同步滑块、可读状态和增减按钮边界状态。 */
    private updatePresentation(sliderValue: number): void {
        if (!this.input || !this.status) return
        const current = this.values?.[Math.round(sliderValue)]
        const cssValue = this.getCssValue(sliderValue)
        const defaultValue = this.values ? !cssValue : sliderValue === this.options.defaultValue
        const numeric = Number.parseFloat(cssValue)
        const state = current?.label ?? (defaultValue
            ? 'Normal'
            : `${Number.isFinite(numeric) && numeric < this.options.defaultValue ? 'Tight' : 'Expanded'} ${cssValue}`)
        const translatedState = this.translate(state)
        this.status.textContent = translatedState
        this.input.setAttribute('aria-valuetext', translatedState)
        const percent = this.options.max === this.options.min
            ? 0
            : ((sliderValue - this.options.min) / (this.options.max - this.options.min)) * 100
        this.input.style.setProperty('--aieditor-letter-spacing-progress', `${percent}%`)
    }

    private clamp(value: number): number {
        return Math.min(this.options.max, Math.max(this.options.min, value))
    }

    private formatNumber(value: number): string {
        return Number(value.toFixed(4)).toString()
    }

    /** 打开面板并按需聚焦滑块。 */
    private open(focusSlider = false): void {
        if (!this.trigger || !this.panel || this.trigger.disabled || !this.panel.hidden) return
        this.panel.hidden = false
        this.trigger.setAttribute('aria-expanded', 'true')
        this.stopAutoUpdate = autoUpdate(this.trigger, this.panel, () => this.updatePosition())
        if (focusSlider) this.input?.focus()
    }

    /** 关闭面板并停止锚点跟随。 */
    private close(returnFocus = false): void {
        if (!this.trigger || !this.panel) return
        this.stopAutoUpdate?.()
        this.stopAutoUpdate = undefined
        this.panel.hidden = true
        this.trigger.setAttribute('aria-expanded', 'false')
        if (returnFocus) this.trigger.focus()
    }

    /** 处理 Escape 和面板首尾焦点循环。 */
    private handlePanelKeydown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            event.preventDefault()
            this.close(true)
            return
        }
        if (event.key !== 'Tab' || !this.panel) return
        const items = [...this.panel.querySelectorAll<HTMLElement>('button, input')]
        const first = items[0]
        const last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first?.focus()
        }
    }

    /** 使用 Floating UI 定位面板并钳制到可视区域。 */
    private async updatePosition(): Promise<void> {
        if (!this.trigger || !this.panel || this.panel.hidden) return
        const {x, y} = await computePosition(this.trigger, this.panel, {
            placement: resolveMenuFloatingPlacement(this.trigger, 'bottom-start'),
            strategy: 'fixed',
            middleware: [offset(({placement}) => resolveMenuFloatingOffset(this.trigger!, placement)), flip(), shift({padding: 8})],
        })
        if (!this.panel || this.panel.hidden) return
        const position = clampFloatingPosition(this.panel, x, y)
        Object.assign(this.panel.style, {left: `${position.x}px`, top: `${position.y}px`})
    }
}
