import { createElement, Video } from 'lucide'
import { FloatingDialog, MenuItem, type MenuContext } from '../../core'
import type {Uploader} from '../../../uploader'
import {MediaUploadField} from '../../../features/upload/MediaUploadField'

let videoMenuSequence = 0

export interface VideoMenuItemOptions {
  id?: string
  label?: string
  dialogTitle?: string
  placeholder?: string
  uploader?: Uploader
}

export type VideoSourceType = 'video' | 'youtube' | 'twitch'

/** 根据常见视频地址识别对应节点；其他地址交给原生 video 处理。 */
export function detectVideoSourceType(src: string): VideoSourceType {
  try {
    const hostname = new URL(src, 'https://aieditor.local').hostname.toLowerCase()
    if (hostname === 'youtu.be' || /(^|\.)youtube(-nocookie)?\.com$/.test(hostname)) return 'youtube'
    if (hostname === 'twitch.tv' || hostname.endsWith('.twitch.tv')) return 'twitch'
  } catch {
    // 输入框会继续按原生视频地址处理，由浏览器负责最终加载校验。
  }
  return 'video'
}

/** 使用 URL、标题和海报表单插入或编辑视频节点。 */
export class VideoMenuItem extends MenuItem {
  private readonly options: Required<Omit<VideoMenuItemOptions, 'uploader'>> & Pick<VideoMenuItemOptions, 'uploader'>
  private dialog: FloatingDialog | null = null
  private urlInput: HTMLInputElement | null = null
  private posterInput: HTMLInputElement | null = null
  private titleInput: HTMLInputElement | null = null
  private nativeFields: HTMLElement[] = []
  private uploadField: MediaUploadField | null = null

  constructor(options: VideoMenuItemOptions = {}) {
    super(options.id ?? 'video')
    this.options = {
      id: options.id ?? 'video',
      label: options.label ?? 'Insert video',
      dialogTitle: options.dialogTitle ?? 'Insert video',
      placeholder: options.placeholder ?? 'https://example.com/video.mp4',
      uploader: options.uploader,
    }
  }

  /** 创建视频按钮及其 Portal dialog。 */
  render(context: MenuContext): HTMLElement {
    const translate = (value: string) => context.i18n.t(value)
    const sequence = ++videoMenuSequence
    const button = document.createElement('button')
    const form = document.createElement('form')
    const heading = document.createElement('h2')
    const urlField = this.createField(`aieditor-video-url-${sequence}`, translate('Video URL'), 'url', translate(this.options.placeholder))
    const sourceHint = document.createElement('p')
    const posterField = this.createField(`aieditor-video-poster-${sequence}`, translate('Poster URL'), 'url', 'https://example.com/poster.jpg')
    const titleField = this.createField(`aieditor-video-title-${sequence}`, translate('Title'), 'text', translate('Describe the video'))
    const actions = document.createElement('div')
    const cancel = document.createElement('button')
    const apply = document.createElement('button')

    button.type = 'button'
    button.className = 'aieditor__tool'
    button.title = translate(this.options.label)
    button.setAttribute('aria-label', translate(this.options.label))
    button.append(createElement(Video, { 'aria-hidden': 'true' }))

    heading.id = `aieditor-video-heading-${sequence}`
    heading.textContent = translate(this.options.dialogTitle)
    form.className = 'aieditor__dialog-form'
    sourceHint.className = 'aieditor__dialog-hint'
    sourceHint.textContent = translate('Supports video files, YouTube and Twitch URLs.')
    urlField.container.append(sourceHint)
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
    apply.textContent = translate('Insert video')

    const uploadField = this.options.uploader ? new MediaUploadField({
      uploader: this.options.uploader,
      type: 'video',
      translate,
      onUploaded: (result) => {
        urlField.input.value = result.url
        if (result.poster) posterField.input.value = result.poster
        if (result.title) titleField.input.value = result.title
        this.updateSourceFields(result.url)
      },
      onBusyChange: (busy) => { apply.disabled = busy },
    }) : null

    actions.append(cancel, apply)
    form.append(heading, ...(uploadField ? [uploadField.element] : []), urlField.container, posterField.container, titleField.container, actions)
    this.urlInput = urlField.input
    this.posterInput = posterField.input
    this.titleInput = titleField.input
    this.nativeFields = [posterField.container, titleField.container]
    this.uploadField = uploadField
    this.dialog = new FloatingDialog(button, form, {
      labelledBy: heading.id,
      initialFocus: urlField.input,
      onClose: (reason) => {
        uploadField?.cancel()
        if (reason === 'apply') this.applyVideo(context)
      },
    })

    this.listen(button, 'mousedown', (event) => event.preventDefault())
    this.listen(button, 'click', () => this.dialog?.open ? this.dialog.close() : this.execute(context))
    this.listen(urlField.input, 'input', () => this.updateSourceFields(urlField.input.value))
    return button
  }

  /** 打开表单并在选中视频时预填节点属性。 */
  execute(context: MenuContext): void {
    if (!this.dialog || !this.urlInput || !this.posterInput || !this.titleInput || this.dialog.open) return
    const activeType = this.getActiveType(context)
    const attributes = activeType ? context.editor.getAttributes(activeType) : {}
    this.urlInput.value = attributes.src ?? ''
    this.posterInput.value = attributes.poster ?? ''
    this.titleInput.value = attributes.title ?? ''
    this.uploadField?.reset()
    this.updateSourceFields(this.urlInput.value)
    this.dialog.show()
  }

  /** 同步视频节点选中状态。 */
  update(context: MenuContext): void {
    const button = this.element as HTMLButtonElement | null
    if (!button) return
    const active = Boolean(this.getActiveType(context))
    button.classList.toggle('is-active', active)
    button.setAttribute('aria-pressed', String(active))
  }

  /** 销毁对话框和输入引用。 */
  destroy(): void {
    this.dialog?.destroy()
    this.dialog = null
    this.urlInput = null
    this.posterInput = null
    this.titleInput = null
    this.nativeFields = []
    this.uploadField?.destroy()
    this.uploadField = null
    super.destroy()
  }

  /** 更新选中视频或插入新视频。 */
  private applyVideo({ editor }: MenuContext): void {
    const src = this.urlInput?.value.trim()
    if (!src) return
    const poster = this.posterInput?.value.trim() || null
    const title = this.titleInput?.value.trim() || null
    const sourceType = detectVideoSourceType(src)
    const activeType = this.getActiveType({editor})
    if (activeType === sourceType) {
      const attributes = sourceType === 'video' ? {src, poster, title} : {src}
      editor.chain().focus().updateAttributes(sourceType, attributes).run()
    } else if (sourceType === 'youtube') {
      editor.chain().focus().setYoutubeVideo({src}).run()
    } else if (sourceType === 'twitch') {
      editor.chain().focus().setTwitchVideo({src}).run()
    } else {
      editor.chain().focus().setVideo({src, poster: poster ?? undefined, title: title ?? undefined}).run()
    }
  }

  private getActiveType({editor}: Pick<MenuContext, 'editor'>): VideoSourceType | undefined {
    return (['video', 'youtube', 'twitch'] as const).find((type) => editor.isActive(type))
  }

  private updateSourceFields(src: string): void {
    const nativeVideo = detectVideoSourceType(src) === 'video'
    this.nativeFields.forEach((field) => { field.hidden = !nativeVideo })
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
