import {createElement, Image as ImageIcon} from 'lucide'
import {FloatingDialog, MenuItem, type MenuContext} from '../../core'
import {getActiveImageType} from './image-menu-utils'
import type {ImageDecoding, ImageLoading} from '../../../extensions/image/Image'

let imagePropertiesSequence = 0

/** 编辑所选块级或行内图片的替代文本、标题和显示尺寸。 */
export class ImagePropertiesMenuItem extends MenuItem {
  private dialog: FloatingDialog | null = null
  private altInput: HTMLInputElement | null = null
  private titleInput: HTMLInputElement | null = null
  private widthSelect: HTMLSelectElement | null = null
  private loadingSelect: HTMLSelectElement | null = null
  private decodingSelect: HTMLSelectElement | null = null

  constructor() {
    super('image-properties')
  }

  /** 创建属性表单，并保留字段引用供打开和提交阶段复用。 */
  render(context: MenuContext): HTMLElement {
    const translate = (value: string) => context.i18n.t(value)
    const sequence = ++imagePropertiesSequence
    const headingId = `aieditor-image-properties-title-${sequence}`
    const button = document.createElement('button')
    const form = document.createElement('form')
    const heading = document.createElement('h2')
    const alt = this.createInput(`aieditor-image-properties-alt-${sequence}`, translate('Alternative text'))
    const title = this.createInput(`aieditor-image-properties-title-input-${sequence}`, translate('Title'))
    const width = this.createWidthField(`aieditor-image-properties-width-${sequence}`, translate)
    const loading = this.createSelectField(`aieditor-image-properties-loading-${sequence}`, translate('Image loading'), [
      ['', translate('Browser default')], ['lazy', translate('Lazy loading')], ['eager', translate('Eager loading')],
    ])
    const decoding = this.createSelectField(`aieditor-image-properties-decoding-${sequence}`, translate('Image decoding'), [
      ['', translate('Browser default')], ['async', translate('Asynchronous')],
      ['sync', translate('Synchronous')], ['auto', translate('Automatic')],
    ])
    const actions = document.createElement('div')
    const cancel = document.createElement('button')
    const apply = document.createElement('button')

    button.type = 'button'
    button.className = 'aieditor__tool'
    button.title = translate('Image properties')
    button.setAttribute('aria-label', translate('Image properties'))
    button.append(createElement(ImageIcon, {'aria-hidden': 'true'}))
    heading.id = headingId
    heading.textContent = translate('Image properties')
    form.className = 'aieditor__dialog-form'
    actions.className = 'aieditor__dialog-actions'
    cancel.type = 'submit'
    cancel.formNoValidate = true
    cancel.className = 'aieditor__button aieditor__button--quiet'
    cancel.value = 'cancel'
    cancel.textContent = translate('Cancel')
    apply.type = 'submit'
    apply.className = 'aieditor__button aieditor__button--primary'
    apply.value = 'apply'
    apply.textContent = translate('Apply')
    actions.append(cancel, apply)
    form.append(heading, alt.container, title.container, width.container, loading.container, decoding.container, actions)

    this.altInput = alt.input
    this.titleInput = title.input
    this.widthSelect = width.select
    this.loadingSelect = loading.select
    this.decodingSelect = decoding.select
    this.dialog = new FloatingDialog(button, form, {
      labelledBy: headingId,
      initialFocus: alt.input,
      onClose: (reason) => {
        if (reason === 'apply') this.applyProperties(context)
      },
    })
    this.listen(button, 'mousedown', (event) => event.preventDefault())
    this.listen(button, 'click', () => this.dialog?.open ? this.dialog.close() : this.execute(context))
    return button
  }

  /** 从当前图片属性回填表单，并将非预设宽度归入自动选项。 */
  execute({editor}: MenuContext): void {
    if (!this.dialog || !this.altInput || !this.titleInput || !this.widthSelect
      || !this.loadingSelect || !this.decodingSelect || this.dialog.open) return
    const type = getActiveImageType(editor)
    if (!type) return
    const attributes = editor.getAttributes(type)
    this.altInput.value = attributes.alt ?? ''
    this.titleInput.value = attributes.title ?? ''
    const width = String(attributes.width ?? '')
    this.widthSelect.value = ['30%', '50%', '75%', '100%'].includes(width) ? width : 'keep'
    this.loadingSelect.value = attributes.loading ?? ''
    this.decodingSelect.value = attributes.decoding ?? ''
    this.dialog.show()
  }

  /** 仅在可编辑且选中图片节点时允许使用。 */
  update({editor}: MenuContext): void {
    const button = this.element as HTMLButtonElement | null
    if (button) button.disabled = !getActiveImageType(editor)
  }

  /** 销毁表单浮层并清除节点引用。 */
  destroy(): void {
    this.dialog?.destroy()
    this.dialog = null
    this.altInput = null
    this.titleInput = null
    this.widthSelect = null
    this.loadingSelect = null
    this.decodingSelect = null
    super.destroy()
  }

  /** 更新替代文本、标题与加载策略；宽度由预设选项转换为节点属性。 */
  private applyProperties({editor}: MenuContext): void {
    const type = getActiveImageType(editor)
    if (!type || !this.altInput || !this.titleInput || !this.widthSelect
      || !this.loadingSelect || !this.decodingSelect) return
    const width = this.widthSelect.value
    editor.chain().focus().updateImageAttributes({
      alt: this.altInput.value.trim(),
      title: this.titleInput.value.trim(),
      loading: (this.loadingSelect.value || null) as ImageLoading,
      decoding: (this.decodingSelect.value || null) as ImageDecoding,
      ...(width === 'keep' ? {} : {width: width === 'original' ? null : width}),
    }).run()
  }

  /** 创建加载、解码等枚举属性字段，避免把无效值写进图片 HTML。 */
  private createSelectField(id: string, labelText: string, options: Array<[string, string]>) {
    const container = document.createElement('div')
    const label = document.createElement('label')
    const select = document.createElement('select')
    container.className = 'aieditor__dialog-field'
    label.htmlFor = id
    label.textContent = labelText
    select.id = id
    options.forEach(([value, text]) => {
      const option = document.createElement('option')
      option.value = value
      option.textContent = text
      select.append(option)
    })
    container.append(label, select)
    return {container, select}
  }

  /** 创建通用的图片文本属性字段。 */
  private createInput(id: string, labelText: string) {
    const container = document.createElement('div')
    const label = document.createElement('label')
    const input = document.createElement('input')
    container.className = 'aieditor__dialog-field'
    label.htmlFor = id
    label.textContent = labelText
    input.id = id
    input.type = 'text'
    container.append(label, input)
    return {container, input}
  }

  /** 创建有限宽度预设，避免用户输入不可解析的 CSS 长度。 */
  private createWidthField(id: string, translate: (value: string) => string) {
    const container = document.createElement('div')
    const label = document.createElement('label')
    const select = document.createElement('select')
    container.className = 'aieditor__dialog-field'
    label.htmlFor = id
    label.textContent = translate('Image size')
    select.id = id
    ;[
      ['keep', translate('Keep current size')],
      ['original', translate('Original size')],
      ['30%', '30%'],
      ['50%', '50%'],
      ['75%', '75%'],
      ['100%', '100%'],
    ].forEach(([value, text]) => {
      const option = document.createElement('option')
      option.value = value
      option.textContent = text
      select.append(option)
    })
    container.append(label, select)
    return {container, select}
  }
}
