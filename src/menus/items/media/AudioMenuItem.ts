import { AudioLines, createElement } from 'lucide'
import { FloatingDialog, MenuItem, type MenuContext } from '../../core'
import type {Uploader} from '../../../uploader'
import {MediaUploadField} from '../../../features/upload/MediaUploadField'

let audioMenuSequence = 0

export interface AudioMenuItemOptions {
  id?: string
  label?: string
  dialogTitle?: string
  placeholder?: string
  uploader?: Uploader
}

/** 使用 URL 和标题表单插入或编辑音频节点。 */
export class AudioMenuItem extends MenuItem {
  private readonly options: Required<Omit<AudioMenuItemOptions, 'uploader'>> & Pick<AudioMenuItemOptions, 'uploader'>
  private dialog: FloatingDialog | null = null
  private urlInput: HTMLInputElement | null = null
  private titleInput: HTMLInputElement | null = null
  private uploadField: MediaUploadField | null = null

  constructor(options: AudioMenuItemOptions = {}) {
    super(options.id ?? 'audio')
    this.options = {
      id: options.id ?? 'audio',
      label: options.label ?? 'Insert audio',
      dialogTitle: options.dialogTitle ?? 'Insert audio',
      placeholder: options.placeholder ?? 'https://example.com/audio.mp3',
      uploader: options.uploader,
    }
  }

  /** 创建音频按钮及其 Portal dialog。 */
  render(context: MenuContext): HTMLElement {
    const translate = (value: string) => context.i18n.t(value)
    const sequence = ++audioMenuSequence
    const button = document.createElement('button')
    const form = document.createElement('form')
    const heading = document.createElement('h2')
    const urlField = this.createField(`aieditor-audio-url-${sequence}`, translate('Audio URL'), 'url', translate(this.options.placeholder))
    const titleField = this.createField(`aieditor-audio-title-${sequence}`, translate('Title'), 'text', translate('Describe the audio'))
    const actions = document.createElement('div')
    const cancel = document.createElement('button')
    const apply = document.createElement('button')

    button.type = 'button'
    button.className = 'aieditor__tool'
    button.title = translate(this.options.label)
    button.setAttribute('aria-label', translate(this.options.label))
    button.append(createElement(AudioLines, { 'aria-hidden': 'true' }))

    heading.id = `aieditor-audio-heading-${sequence}`
    heading.textContent = translate(this.options.dialogTitle)
    form.className = 'aieditor__dialog-form'
    urlField.input.required = true
    actions.className = 'aieditor__dialog-actions'
    cancel.type = 'submit'
    cancel.formNoValidate = true
    cancel.className = 'aieditor__button aieditor__button--quiet'
    cancel.value = 'cancel'
    cancel.textContent = translate('Cancel')
    apply.type = 'submit'
    apply.className = 'aieditor__button aieditor__button--primary'
    apply.value = 'apply'
    apply.textContent = translate('Insert audio')

    const uploadField = this.options.uploader ? new MediaUploadField({
      uploader: this.options.uploader,
      type: 'audio',
      translate,
      onUploaded: (result, file) => {
        urlField.input.value = result.url
        titleField.input.value = result.title ?? file.name
      },
      onBusyChange: (busy) => { apply.disabled = busy },
    }) : null

    actions.append(cancel, apply)
    form.append(heading, ...(uploadField ? [uploadField.element] : []), urlField.container, titleField.container, actions)
    this.urlInput = urlField.input
    this.titleInput = titleField.input
    this.uploadField = uploadField
    this.dialog = new FloatingDialog(button, form, {
      labelledBy: heading.id,
      initialFocus: urlField.input,
      onClose: (reason) => {
        uploadField?.cancel()
        if (reason === 'apply') this.applyAudio(context)
      },
    })

    this.listen(button, 'mousedown', (event) => event.preventDefault())
    this.listen(button, 'click', () => this.dialog?.open ? this.dialog.close() : this.execute(context))
    return button
  }

  /** 打开表单并在选中音频时预填节点属性。 */
  execute(context: MenuContext): void {
    if (!this.dialog || !this.urlInput || !this.titleInput || this.dialog.open) return
    const attributes = context.editor.isActive('audio') ? context.editor.getAttributes('audio') : {}
    this.urlInput.value = attributes.src ?? ''
    this.titleInput.value = attributes.title ?? ''
    this.uploadField?.reset()
    this.dialog.show()
  }

  /** 同步音频节点选中状态。 */
  update(context: MenuContext): void {
    const button = this.element as HTMLButtonElement | null
    if (!button) return
    const active = context.editor.isActive('audio')
    button.classList.toggle('is-active', active)
    button.setAttribute('aria-pressed', String(active))
  }

  /** 销毁对话框和引用。 */
  destroy(): void {
    this.dialog?.destroy()
    this.dialog = null
    this.urlInput = null
    this.titleInput = null
    this.uploadField?.destroy()
    this.uploadField = null
    super.destroy()
  }

  /** 更新选中音频或插入新音频。 */
  private applyAudio({ editor }: MenuContext): void {
    const src = this.urlInput?.value.trim()
    if (!src) return
    const title = this.titleInput?.value.trim() || null
    if (editor.isActive('audio')) editor.chain().focus().updateAttributes('audio', { src, title }).run()
    else editor.chain().focus().setAudio({ src, title: title ?? undefined }).run()
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
