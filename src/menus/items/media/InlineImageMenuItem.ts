import { createElement, Images } from 'lucide'
import { FloatingDialog, MenuItem, type MenuContext } from '../../core'
import type {Uploader} from '../../../uploader'
import {MediaUploadField} from '../../../features/upload/MediaUploadField'

let inlineImageMenuSequence = 0

export interface InlineImageMenuItemOptions {
  id?: string
  label?: string
  dialogTitle?: string
  urlLabel?: string
  altLabel?: string
  placeholder?: string
  uploader?: Uploader
}

/** 通过 URL 对话框插入或更新文本流中的行内图片。 */
export class InlineImageMenuItem extends MenuItem {
  private readonly options: Required<Omit<InlineImageMenuItemOptions, 'uploader'>> & Pick<InlineImageMenuItemOptions, 'uploader'>
  private dialog: FloatingDialog | null = null
  private urlInput: HTMLInputElement | null = null
  private altInput: HTMLInputElement | null = null
  private uploadField: MediaUploadField | null = null

  constructor(options: InlineImageMenuItemOptions = {}) {
    super(options.id ?? 'inline-image')
    this.options = {
      id: options.id ?? 'inline-image',
      label: options.label ?? 'Insert inline image',
      dialogTitle: options.dialogTitle ?? 'Insert an inline image',
      urlLabel: options.urlLabel ?? 'Image URL',
      altLabel: options.altLabel ?? 'Alternative text',
      placeholder: options.placeholder ?? 'https://example.com/image.jpg',
      uploader: options.uploader,
    }
  }

  /** 创建按钮和行内图片表单。 */
  render(context: MenuContext): HTMLElement {
    const translate = (value: string) => context.i18n.t(value)
    const sequence = ++inlineImageMenuSequence
    const titleId = `aieditor-inline-image-title-${sequence}`
    const urlId = `aieditor-inline-image-url-${sequence}`
    const altId = `aieditor-inline-image-alt-${sequence}`
    const button = document.createElement('button')
    const form = document.createElement('form')
    const title = document.createElement('h2')
    const urlField = this.createField(urlId, translate(this.options.urlLabel), 'url', translate(this.options.placeholder))
    const altField = this.createField(altId, translate(this.options.altLabel), 'text', translate('Describe the image'))
    const actions = document.createElement('div')
    const cancel = document.createElement('button')
    const apply = document.createElement('button')

    button.type = 'button'
    button.className = 'aieditor__tool'
    button.title = translate(this.options.label)
    button.setAttribute('aria-label', translate(this.options.label))
    button.append(createElement(Images, { 'aria-hidden': 'true' }))

    form.className = 'aieditor__dialog-form'
    title.id = titleId
    title.textContent = translate(this.options.dialogTitle)
    actions.className = 'aieditor__dialog-actions'
    cancel.type = 'submit'
    cancel.formNoValidate = true
    cancel.className = 'aieditor__button aieditor__button--quiet'
    cancel.value = 'cancel'
    cancel.textContent = translate('Cancel')
    apply.type = 'submit'
    apply.className = 'aieditor__button aieditor__button--primary'
    apply.value = 'apply'
    apply.textContent = translate('Insert inline image')

    const uploadField = this.options.uploader ? new MediaUploadField({
      uploader: this.options.uploader,
      type: 'image',
      translate,
      onUploaded: (result) => {
        urlField.input.value = result.url
        if (result.alt) altField.input.value = result.alt
      },
      onBusyChange: (busy) => { apply.disabled = busy },
    }) : null

    actions.append(cancel, apply)
    form.append(title, ...(uploadField ? [uploadField.element] : []), urlField.container, altField.container, actions)
    this.urlInput = urlField.input
    this.altInput = altField.input
    this.uploadField = uploadField
    this.dialog = new FloatingDialog(button, form, {
      labelledBy: titleId,
      initialFocus: urlField.input,
      onClose: (reason) => {
        uploadField?.cancel()
        if (reason === 'apply') this.applyImage(context)
      },
    })

    this.listen(button, 'mousedown', (event) => event.preventDefault())
    this.listen(button, 'click', () => this.dialog?.open ? this.dialog.close() : this.execute(context))
    return button
  }

  /** 打开表单，并在编辑模式下回填当前行内图片属性。 */
  execute(context: MenuContext): void {
    if (!this.dialog || !this.urlInput || !this.altInput || this.dialog.open) return
    const attributes = context.editor.getAttributes('inlineImage')
    this.urlInput.value = attributes.src ?? ''
    this.altInput.value = attributes.alt ?? ''
    this.uploadField?.reset()
    this.dialog.show()
  }

  /** 同步按钮的行内图片选中状态。 */
  update(context: MenuContext): void {
    const button = this.element as HTMLButtonElement | null
    if (!button) return
    const active = context.editor.isActive('inlineImage')
    button.classList.toggle('is-active', active)
    button.setAttribute('aria-pressed', String(active))
  }

  /** 关闭并移除 Portal dialog。 */
  destroy(): void {
    this.dialog?.destroy()
    this.dialog = null
    this.urlInput = null
    this.altInput = null
    this.uploadField?.destroy()
    this.uploadField = null
    super.destroy()
  }

  /** 更新已选节点或调用 setInlineImage 插入新节点。 */
  private applyImage({ editor }: MenuContext): void {
    const src = this.urlInput?.value.trim()
    if (!src) return
    const alt = this.altInput?.value.trim() ?? ''
    if (editor.isActive('inlineImage')) {
      editor.chain().focus().updateAttributes('inlineImage', { src, alt }).run()
    } else {
      editor.chain().focus().setInlineImage({ src, alt }).run()
    }
  }

  private createField(id: string, labelText: string, type: 'text' | 'url', placeholder: string) {
    const container = document.createElement('div')
    const label = document.createElement('label')
    const input = document.createElement('input')
    container.className = 'aieditor__dialog-field'
    label.htmlFor = id
    label.textContent = labelText
    input.id = id
    input.type = type
    input.placeholder = placeholder
    if (type === 'url') input.setAttribute('autocomplete', 'url')
    container.append(label, input)
    return { container, input }
  }
}
