import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom'
import {clampFloatingPosition, isFloatingAnchorVisible} from './FloatingPlacement'

let customColorPickerSequence = 0

interface RgbaColor {
  r: number
  g: number
  b: number
  a: number
}

interface HsvColor {
  h: number
  s: number
  v: number
}

export interface CustomColorPickerOptions {
  onApply: (value: string) => void
  onCancel: () => void
  translate?: (value: string) => string
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

/** 将更适合交互面板的 HSV 转换为 CSS 使用的 RGB。 */
function hsvToRgb({ h, s, v }: HsvColor): Pick<RgbaColor, 'r' | 'g' | 'b'> {
  const saturation = s / 100
  const brightness = v / 100
  const chroma = brightness * saturation
  const section = ((h % 360) + 360) % 360 / 60
  const intermediate = chroma * (1 - Math.abs(section % 2 - 1))
  const components = section < 1 ? [chroma, intermediate, 0]
    : section < 2 ? [intermediate, chroma, 0]
      : section < 3 ? [0, chroma, intermediate]
        : section < 4 ? [0, intermediate, chroma]
          : section < 5 ? [intermediate, 0, chroma]
            : [chroma, 0, intermediate]
  const match = brightness - chroma
  return {
    r: Math.round((components[0] + match) * 255),
    g: Math.round((components[1] + match) * 255),
    b: Math.round((components[2] + match) * 255),
  }
}

/** 将输入颜色转换为 HSV，以便同步色相与饱和度面板。 */
function rgbToHsv({ r, g, b }: Pick<RgbaColor, 'r' | 'g' | 'b'>): HsvColor {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const maximum = Math.max(red, green, blue)
  const minimum = Math.min(red, green, blue)
  const delta = maximum - minimum
  let hue = 0
  if (delta) {
    if (maximum === red) hue = 60 * (((green - blue) / delta) % 6)
    else if (maximum === green) hue = 60 * ((blue - red) / delta + 2)
    else hue = 60 * ((red - green) / delta + 4)
  }
  return {
    h: hue < 0 ? hue + 360 : hue,
    s: maximum ? delta / maximum * 100 : 0,
    v: maximum * 100,
  }
}

/** 解析三/六位 Hex 与 rgb/rgba；非法输入返回 null 而不是猜测。 */
function parseColor(value: string): RgbaColor | null {
  const hex = value.trim().match(/^#?([\da-f]{3}|[\da-f]{6})$/i)?.[1]
  if (hex) {
    const normalized = hex.length === 3 ? [...hex].map((digit) => digit + digit).join('') : hex
    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16),
      a: 100,
    }
  }
  const rgba = value.trim().match(/^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)(?:\s*,\s*(\d*(?:\.\d+)?))?\s*\)$/i)
  if (!rgba) return null
  return {
    r: clamp(Math.round(Number(rgba[1])), 0, 255),
    g: clamp(Math.round(Number(rgba[2])), 0, 255),
    b: clamp(Math.round(Number(rgba[3])), 0, 255),
    a: clamp(Math.round((rgba[4] === undefined ? 1 : Number(rgba[4])) * 100), 0, 100),
  }
}

/** 把 RGB 通道规范化为六位小写 Hex。 */
function toHex({ r, g, b }: Pick<RgbaColor, 'r' | 'g' | 'b'>): string {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

/** “更多颜色”浮层，负责精确选色及 Hex/RGBA 输入同步。 */
export class CustomColorPicker {
  readonly element: HTMLElement
  private readonly options: CustomColorPickerOptions
  private readonly events = new AbortController()
  private readonly saturationArea: HTMLElement
  private readonly saturationThumb: HTMLElement
  private readonly hueInput: HTMLInputElement
  private readonly alphaInput: HTMLInputElement
  private readonly preview: HTMLElement
  private readonly hexInput: HTMLInputElement
  private readonly channelInputs: Record<'r' | 'g' | 'b' | 'a', HTMLInputElement>
  private readonly applyButton: HTMLButtonElement
  private anchor: HTMLElement | null = null
  private stopAutoUpdate: (() => void) | undefined
  private hsv: HsvColor = { h: 0, s: 0, v: 0 }
  private alpha = 100

  constructor(options: CustomColorPickerOptions) {
    this.options = options
    const t = options.translate ?? ((value: string) => value)
    this.element = document.createElement('div')
    this.element.id = `aieditor-custom-color-picker-${++customColorPickerSequence}`
    this.element.className = 'aieditor__custom-color-picker'
    this.element.setAttribute('role', 'dialog')
    this.element.setAttribute('aria-label', t('More colors'))
    this.element.hidden = true

    this.saturationArea = document.createElement('div')
    this.saturationArea.className = 'aieditor__custom-color-saturation'
    this.saturationArea.tabIndex = 0
    this.saturationArea.setAttribute('role', 'slider')
    this.saturationArea.setAttribute('aria-label', t('Saturation and brightness'))
    this.saturationArea.setAttribute('aria-valuemin', '0')
    this.saturationArea.setAttribute('aria-valuemax', '100')
    this.saturationThumb = document.createElement('span')
    this.saturationThumb.className = 'aieditor__custom-color-saturation-thumb'
    this.saturationArea.append(this.saturationThumb)

    this.hueInput = this.createRange('Hue', 0, 360, 'aieditor__custom-color-range aieditor__custom-color-hue')
    this.alphaInput = this.createRange('Opacity', 0, 100, 'aieditor__custom-color-range aieditor__custom-color-alpha')
    this.preview = document.createElement('span')
    this.preview.className = 'aieditor__custom-color-preview'
    this.preview.setAttribute('aria-label', t('Color preview'))
    const sliders = document.createElement('div')
    sliders.className = 'aieditor__custom-color-sliders'
    sliders.append(this.hueInput, this.alphaInput)
    const controls = document.createElement('div')
    controls.className = 'aieditor__custom-color-controls'
    controls.append(sliders, this.preview)

    this.hexInput = this.createTextInput('Hex', 'text')
    this.hexInput.maxLength = 7
    this.hexInput.spellcheck = false
    const r = this.createTextInput('R', 'number', 255)
    const g = this.createTextInput('G', 'number', 255)
    const b = this.createTextInput('B', 'number', 255)
    const a = this.createTextInput('A', 'number', 100)
    this.channelInputs = { r, g, b, a }
    const fields = document.createElement('div')
    fields.className = 'aieditor__custom-color-fields'
    fields.append(
      this.wrapField('Hex', this.hexInput, true),
      this.wrapField('R', r),
      this.wrapField('G', g),
      this.wrapField('B', b),
      this.wrapField('A', a),
    )

    const cancel = document.createElement('button')
    cancel.type = 'button'
    cancel.className = 'aieditor__button aieditor__button--quiet aieditor__custom-color-cancel'
    cancel.textContent = t('Cancel')
    const apply = document.createElement('button')
    apply.type = 'button'
    apply.className = 'aieditor__button aieditor__button--primary aieditor__custom-color-apply'
    apply.textContent = t('Apply')
    this.applyButton = apply
    const actions = document.createElement('div')
    actions.className = 'aieditor__custom-color-actions'
    actions.append(cancel, apply)
    this.element.append(this.saturationArea, controls, fields, actions)
    document.body.append(this.element)

    this.listen(this.saturationArea, 'pointerdown', (event) => this.updateSaturationFromPointer(event))
    this.listen(this.saturationArea, 'pointermove', (event) => {
      if (event.buttons === 1) this.updateSaturationFromPointer(event)
    })
    this.listen(this.saturationArea, 'keydown', (event) => this.handleSaturationKeydown(event))
    this.listen(this.hueInput, 'input', () => {
      this.hsv.h = Number(this.hueInput.value)
      this.renderState()
    })
    this.listen(this.alphaInput, 'input', () => {
      this.alpha = Number(this.alphaInput.value)
      this.renderState()
    })
    this.listen(this.hexInput, 'input', () => this.applyHexInput())
    for (const input of Object.values(this.channelInputs)) this.listen(input, 'input', () => this.applyChannelInputs())
    this.listen(cancel, 'click', () => this.cancel())
    this.listen(apply, 'click', () => this.apply())
    this.listen(this.element, 'keydown', (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      this.cancel()
    })
  }

  /** 预先建立触发器与 Portal 的关系，使工具组能递归收集完整归属链。 */
  connect(anchor: HTMLElement): void {
    anchor.setAttribute('aria-haspopup', 'dialog')
    anchor.setAttribute('aria-controls', this.element.id)
    if (!anchor.hasAttribute('aria-expanded')) anchor.setAttribute('aria-expanded', 'false')
  }

  /** 从当前颜色初始化全部控件，并把面板锚定到调用按钮。 */
  open(anchor: HTMLElement, value: string): void {
    this.connect(anchor)
    const parsed = parseColor(value) ?? { r: 0, g: 0, b: 0, a: 100 }
    this.hsv = rgbToHsv(parsed)
    this.alpha = parsed.a
    this.anchor = anchor
    anchor.setAttribute('aria-expanded', 'true')
    const rect = anchor.getBoundingClientRect()
    Object.assign(this.element.style, { left: `${rect.right + 6}px`, top: `${rect.top}px` })
    this.element.hidden = false
    this.renderState()
    this.stopAutoUpdate?.()
    this.stopAutoUpdate = autoUpdate(anchor, this.element, () => this.updatePosition())
    this.saturationArea.focus()
  }

  /** 关闭面板、停止自动定位，并按需恢复触发器焦点。 */
  close(returnFocus = false): void {
    const anchor = this.anchor
    this.stopAutoUpdate?.()
    this.stopAutoUpdate = undefined
    this.element.hidden = true
    this.anchor = null
    anchor?.setAttribute('aria-expanded', 'false')
    if (returnFocus) anchor?.focus()
  }

  /** 供父级菜单的外部点击判断识别该 Portal。 */
  contains(target: Node): boolean {
    return this.element.contains(target)
  }

  /** 移除全局监听与挂载到 body 的面板。 */
  destroy(): void {
    this.close()
    this.events.abort()
    this.element.remove()
  }

  /** 创建带无障碍名称的数值滑块。 */
  private createRange(label: string, min: number, max: number, className: string): HTMLInputElement {
    const input = document.createElement('input')
    input.type = 'range'
    input.className = className
    input.min = String(min)
    input.max = String(max)
    input.setAttribute('aria-label', label)
    return input
  }

  /** 创建 Hex 或 RGBA 通道输入框。 */
  private createTextInput(label: string, type: 'text' | 'number', max?: number): HTMLInputElement {
    const input = document.createElement('input')
    input.type = type
    input.setAttribute('aria-label', label)
    if (type === 'number') {
      input.min = '0'
      input.max = String(max)
      input.inputMode = 'numeric'
    }
    return input
  }

  private wrapField(label: string, input: HTMLInputElement, wide = false): HTMLElement {
    const wrapper = document.createElement('label')
    wrapper.className = `aieditor__custom-color-field${wide ? ' aieditor__custom-color-field--wide' : ''}`
    const caption = document.createElement('span')
    caption.textContent = label
    wrapper.append(input, caption)
    return wrapper
  }

  private listen<K extends keyof HTMLElementEventMap>(target: HTMLElement, type: K, listener: (event: HTMLElementEventMap[K]) => void): void {
    target.addEventListener(type, listener as EventListener, { signal: this.events.signal })
  }

  /** 将二维指针位置映射为饱和度和明度百分比。 */
  private updateSaturationFromPointer(event: PointerEvent): void {
    event.preventDefault()
    this.saturationArea.setPointerCapture(event.pointerId)
    const rect = this.saturationArea.getBoundingClientRect()
    this.hsv.s = clamp((event.clientX - rect.left) / rect.width * 100, 0, 100)
    this.hsv.v = clamp(100 - (event.clientY - rect.top) / rect.height * 100, 0, 100)
    this.renderState()
  }

  /** 支持方向键微调，按住 Shift 时使用较大步进。 */
  private handleSaturationKeydown(event: KeyboardEvent): void {
    const largeStep = event.shiftKey ? 10 : 1
    if (event.key === 'ArrowLeft') this.hsv.s = clamp(this.hsv.s - largeStep, 0, 100)
    else if (event.key === 'ArrowRight') this.hsv.s = clamp(this.hsv.s + largeStep, 0, 100)
    else if (event.key === 'ArrowDown') this.hsv.v = clamp(this.hsv.v - largeStep, 0, 100)
    else if (event.key === 'ArrowUp') this.hsv.v = clamp(this.hsv.v + largeStep, 0, 100)
    else return
    event.preventDefault()
    this.renderState()
  }

  /** 校验 Hex 输入并反向同步全部颜色控件。 */
  private applyHexInput(): void {
    const parsed = parseColor(this.hexInput.value)
    if (!parsed) {
      this.hexInput.setAttribute('aria-invalid', 'true')
      this.applyButton.disabled = true
      return
    }
    this.hexInput.removeAttribute('aria-invalid')
    this.hsv = rgbToHsv(parsed)
    this.renderState()
  }

  /** 从 RGBA 通道输入重建内部 HSV 状态。 */
  private applyChannelInputs(): void {
    const rgb = {
      r: clamp(Number(this.channelInputs.r.value) || 0, 0, 255),
      g: clamp(Number(this.channelInputs.g.value) || 0, 0, 255),
      b: clamp(Number(this.channelInputs.b.value) || 0, 0, 255),
    }
    this.alpha = clamp(Number(this.channelInputs.a.value) || 0, 0, 100)
    this.hsv = rgbToHsv(rgb)
    this.renderState()
  }

  /** 从单一 HSV/Alpha 状态刷新滑块、预览和所有文本输入。 */
  private renderState(): void {
    const rgb = hsvToRgb(this.hsv)
    const hex = toHex(rgb)
    const alpha = this.alpha / 100
    const cssValue = alpha === 1 ? hex : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Number(alpha.toFixed(2))})`
    this.saturationArea.style.setProperty('--aieditor-custom-color-hue', `hsl(${this.hsv.h} 100% 50%)`)
    this.saturationThumb.style.left = `${this.hsv.s}%`
    this.saturationThumb.style.top = `${100 - this.hsv.v}%`
    this.saturationArea.setAttribute('aria-valuetext', `Saturation ${Math.round(this.hsv.s)}%, brightness ${Math.round(this.hsv.v)}%`)
    this.saturationArea.setAttribute('aria-valuenow', String(Math.round(this.hsv.s)))
    this.hueInput.value = String(Math.round(this.hsv.h))
    this.alphaInput.value = String(Math.round(this.alpha))
    this.alphaInput.style.setProperty('--aieditor-custom-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`)
    this.preview.style.setProperty('--aieditor-custom-color-value', cssValue)
    this.hexInput.value = hex
    this.hexInput.removeAttribute('aria-invalid')
    this.applyButton.disabled = false
    this.channelInputs.r.value = String(rgb.r)
    this.channelInputs.g.value = String(rgb.g)
    this.channelInputs.b.value = String(rgb.b)
    this.channelInputs.a.value = String(Math.round(this.alpha))
  }

  /** 输出 Hex 或带透明度的 rgba，并在回调前关闭面板。 */
  private apply(): void {
    const rgb = hsvToRgb(this.hsv)
    const alpha = this.alpha / 100
    const value = alpha === 1
      ? toHex(rgb)
      : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Number(alpha.toFixed(2))})`
    this.close()
    this.options.onApply(value)
  }

  /** 放弃当前临时颜色并把焦点交还触发器。 */
  private cancel(): void {
    this.close(true)
    this.options.onCancel()
  }

  /** 跟随可见锚点定位；锚点隐藏时主动关闭，避免孤立弹层。 */
  private async updatePosition(): Promise<void> {
    if (!this.anchor || this.element.hidden) return
    if (!isFloatingAnchorVisible(this.anchor)) {
      this.close()
      return
    }
    const { x, y } = await computePosition(this.anchor, this.element, {
      placement: 'right-start',
      strategy: 'fixed',
      middleware: [offset(10), flip({ fallbackPlacements: ['left-start', 'bottom-start', 'top-start'] }), shift({ padding: 8 })],
    })
    if (!this.anchor || this.element.hidden) return
    if (!isFloatingAnchorVisible(this.anchor)) {
      this.close()
      return
    }
    const position = clampFloatingPosition(this.element, x, y)
    Object.assign(this.element.style, { left: `${position.x}px`, top: `${position.y}px` })
  }
}
