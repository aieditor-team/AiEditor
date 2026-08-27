import {createElement, Paperclip} from 'lucide'
import {FloatingDialog, MenuItem, type MenuContext} from '../../core'
import type {Uploader} from '../../../uploader'
import {MediaUploadField} from '../../../features/upload/MediaUploadField'

let attachmentMenuSequence = 0

/** 可选注入上传器；未提供时菜单仍支持手工填写 URL。 */
export interface AttachmentMenuItemOptions {
  uploader?: Uploader
}

/** 通过上传或 URL 插入可下载附件。 */
export class AttachmentMenuItem extends MenuItem {
  private readonly uploader?: Uploader
  private dialog: FloatingDialog | null = null
  private urlInput: HTMLInputElement | null = null
  private nameInput: HTMLInputElement | null = null
  private size: number | null = null
  private mimeType: string | null = null
  private uploadField: MediaUploadField | null = null

  constructor(options: AttachmentMenuItemOptions = {}) {
    super('attachment')
    this.uploader = options.uploader
  }

  /** 创建 URL/文件名表单，并在配置上传器时加入共用上传字段。 */
  render(context: MenuContext): HTMLElement {
    const translate = (value: string) => context.i18n.t(value)
    const sequence = ++attachmentMenuSequence
    const button = document.createElement('button')
    const form = document.createElement('form')
    const heading = document.createElement('h2')
    const urlField = this.createField(`aieditor-attachment-url-${sequence}`, translate('Attachment URL'), 'url')
    const nameField = this.createField(`aieditor-attachment-name-${sequence}`, translate('File name'), 'text')
    const actions = document.createElement('div')
    const cancel = document.createElement('button')
    const apply = document.createElement('button')

    button.type = 'button'
    button.className = 'aieditor__tool'
    button.title = translate('Insert attachment')
    button.setAttribute('aria-label', translate('Insert attachment'))
    button.append(createElement(Paperclip, {'aria-hidden': 'true'}))
    form.className = 'aieditor__dialog-form'
    heading.id = `aieditor-attachment-heading-${sequence}`
    heading.textContent = translate('Insert attachment')
    urlField.input.required = true
    nameField.input.required = true
    actions.className = 'aieditor__dialog-actions'
    cancel.type = 'submit'
    cancel.formNoValidate = true
    cancel.className = 'aieditor__button aieditor__button--quiet'
    cancel.value = 'cancel'
    cancel.textContent = translate('Cancel')
    apply.type = 'submit'
    apply.className = 'aieditor__button aieditor__button--primary'
    apply.value = 'apply'
    apply.textContent = translate('Insert attachment')

    const uploadField = this.uploader ? new MediaUploadField({
      uploader: this.uploader,
      type: 'attachment',
      translate,
      onUploaded: (result, file) => {
        // 上传返回值优先，浏览器 File 元数据作为缺省值补齐节点信息。
        urlField.input.value = result.url
        nameField.input.value = result.name ?? result.title ?? file.name
        this.size = result.size ?? file.size
        this.mimeType = result.mimeType ?? file.type ?? null
      },
      onBusyChange: (busy) => { apply.disabled = busy },
    }) : null

    actions.append(cancel, apply)
    form.append(heading, ...(uploadField ? [uploadField.element] : []), urlField.container, nameField.container, actions)
    this.urlInput = urlField.input
    this.nameInput = nameField.input
    this.uploadField = uploadField
    this.dialog = new FloatingDialog(button, form, {
      labelledBy: heading.id,
      initialFocus: urlField.input,
      onClose: (reason) => {
        uploadField?.cancel()
        if (reason === 'apply') this.applyAttachment(context)
      },
    })
    this.listen(button, 'mousedown', (event) => event.preventDefault())
    this.listen(button, 'click', () => this.dialog?.open ? this.dialog.close() : this.execute())
    return button
  }

  /** 每次打开都重置上次上传元数据，防止手工 URL 继承旧文件大小。 */
  execute(): void {
    if (!this.dialog || !this.urlInput || !this.nameInput || this.dialog.open) return
    this.urlInput.value = ''
    this.nameInput.value = ''
    this.size = null
    this.mimeType = null
    this.uploadField?.reset()
    this.dialog.show()
  }

  /** 同时销毁浮层与可能仍在上传的字段。 */
  destroy(): void {
    this.dialog?.destroy()
    this.uploadField?.destroy()
    this.dialog = null
    this.uploadField = null
    this.urlInput = null
    this.nameInput = null
    super.destroy()
  }

  /** 校验必填字段后插入原子附件节点。 */
  private applyAttachment({editor}: MenuContext): void {
    const url = this.urlInput?.value.trim()
    const name = this.nameInput?.value.trim()
    if (!url || !name) return
    editor.chain().focus().setAttachment({url, name, size: this.size, mimeType: this.mimeType}).run()
  }

  /** 创建带可访问标签的通用文本字段。 */
  private createField(id: string, labelText: string, type: 'text' | 'url') {
    const container = document.createElement('div')
    const label = document.createElement('label')
    const input = document.createElement('input')
    container.className = 'aieditor__dialog-field'
    label.htmlFor = id
    label.textContent = labelText
    input.id = id
    input.type = type
    if (type === 'url') input.setAttribute('autocomplete', 'url')
    container.append(label, input)
    return {container, input}
  }
}
