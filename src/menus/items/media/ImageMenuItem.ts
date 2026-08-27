import { createElement, ImagePlus } from 'lucide'
import { FloatingDialog, MenuItem, type MenuContext } from '../../core'
import type {Uploader} from '../../../uploader'
import {MediaUploadField} from '../../../features/upload/MediaUploadField'
import type {ImageDecoding, ImageLoading} from '../../../extensions/image/Image'
import type {ImageLinkTarget} from '../../../extensions/image/ImageLinkAttributes'

let imageMenuSequence = 0

export interface ImageMenuItemOptions {
  id?: string
  label?: string
  dialogTitle?: string
  urlLabel?: string
  altLabel?: string
  titleLabel?: string
  linkLabel?: string
  placeholder?: string
  defaultMode?: ImagePlacement
  uploader?: Uploader
}

export type ImagePlacement = 'block' | 'inline'

/** 使用同一表单插入或编辑块级、行内图片，并支持在两种布局间转换。 */
export class ImageMenuItem extends MenuItem {
  private readonly options: Required<Omit<ImageMenuItemOptions, 'uploader'>> & Pick<ImageMenuItemOptions, 'uploader'>
  private dialog: FloatingDialog | null = null
  private urlInput: HTMLInputElement | null = null
  private altInput: HTMLInputElement | null = null
  private titleInput: HTMLInputElement | null = null
  private hrefInput: HTMLInputElement | null = null
  private targetSelect: HTMLSelectElement | null = null
  private loadingSelect: HTMLSelectElement | null = null
  private decodingSelect: HTMLSelectElement | null = null
  private uploadField: MediaUploadField | null = null
  private modeButtons: HTMLButtonElement[] = []
  private mode: ImagePlacement

  constructor(options: ImageMenuItemOptions = {}) {
    super(options.id ?? 'image')
    this.options = {
      id: options.id ?? 'image',
      label: options.label ?? 'Insert image',
      dialogTitle: options.dialogTitle ?? 'Insert an image',
      urlLabel: options.urlLabel ?? 'Image URL',
      altLabel: options.altLabel ?? 'Alternative text',
      titleLabel: options.titleLabel ?? 'Title',
      linkLabel: options.linkLabel ?? 'Image link',
      placeholder: options.placeholder ?? 'https://example.com/image.jpg',
      defaultMode: options.defaultMode ?? 'block',
      uploader: options.uploader,
    }
    this.mode = this.options.defaultMode
  }

  /** 创建工具栏按钮和挂载到 body 的图片表单。 */
  render(context: MenuContext): HTMLElement {
    const translate = (value: string) => context.i18n.t(value)
    const sequence = ++imageMenuSequence
    const titleId = `aieditor-image-title-${sequence}`
    const urlId = `aieditor-image-url-${sequence}`
    const altId = `aieditor-image-alt-${sequence}`
    const imageTitleId = `aieditor-image-title-input-${sequence}`
    const hrefId = `aieditor-image-href-${sequence}`
    const button = document.createElement('button')
    const form = document.createElement('form')
    const title = document.createElement('h2')
    const modeField = document.createElement('div')
    const modeLabel = document.createElement('span')
    const modeControl = document.createElement('div')
    const urlField = this.createField(urlId, translate(this.options.urlLabel), 'url', translate(this.options.placeholder))
    const altField = this.createField(altId, translate(this.options.altLabel), 'text', translate('Describe the image'))
    const imageTitleField = this.createField(imageTitleId, translate(this.options.titleLabel), 'text', translate('Image tooltip'))
    // 图片链接允许站内相对地址和锚点，因此这里使用 text 而不是浏览器限制更强的 url 类型。
    const hrefField = this.createField(hrefId, translate(this.options.linkLabel), 'text', 'https://example.com')
    hrefField.input.setAttribute('autocomplete', 'url')
    const targetField = this.createSelectField(
      `aieditor-image-target-${sequence}`,
      translate('Open link in'),
      [['', translate('Same window')], ['_blank', translate('New window')]],
    )
    const loadingField = this.createSelectField(
      `aieditor-image-loading-${sequence}`,
      translate('Image loading'),
      [['', translate('Browser default')], ['lazy', translate('Lazy loading')], ['eager', translate('Eager loading')]],
    )
    const decodingField = this.createSelectField(
      `aieditor-image-decoding-${sequence}`,
      translate('Image decoding'),
      [['', translate('Browser default')], ['async', translate('Asynchronous')], ['sync', translate('Synchronous')], ['auto', translate('Automatic')]],
    )
    const actions = document.createElement('div')
    const cancel = document.createElement('button')
    const apply = document.createElement('button')

    button.type = 'button'
    button.className = 'aieditor__tool'
    button.title = translate(this.options.label)
    button.setAttribute('aria-label', translate(this.options.label))
    button.append(createElement(ImagePlus, { 'aria-hidden': 'true' }))

    form.className = 'aieditor__dialog-form'
    title.id = titleId
    title.textContent = translate(this.options.dialogTitle)
    modeField.className = 'aieditor__dialog-field aieditor__image-mode-field'
    modeLabel.className = 'aieditor__dialog-label'
    modeLabel.id = `aieditor-image-mode-${sequence}`
    modeLabel.textContent = translate('Image layout')
    modeControl.className = 'aieditor__segmented-control'
    modeControl.setAttribute('role', 'group')
    modeControl.setAttribute('aria-labelledby', modeLabel.id)
    this.modeButtons = (['block', 'inline'] as const).map((mode) => {
      const modeButton = document.createElement('button')
      modeButton.type = 'button'
      modeButton.className = 'aieditor__segmented-option'
      modeButton.dataset.imageMode = mode
      modeButton.textContent = translate(mode === 'block' ? 'Block image' : 'Inline image')
      modeButton.setAttribute('aria-pressed', 'false')
      modeControl.append(modeButton)
      return modeButton
    })
    modeField.append(modeLabel, modeControl)
    actions.className = 'aieditor__dialog-actions'

    cancel.type = 'submit'
    cancel.formNoValidate = true
    cancel.className = 'aieditor__button aieditor__button--quiet'
    cancel.value = 'cancel'
    cancel.textContent = translate('Cancel')
    apply.type = 'submit'
    apply.className = 'aieditor__button aieditor__button--primary'
    apply.value = 'apply'
    apply.textContent = translate('Insert image')

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
    form.append(
      title,
      ...(uploadField ? [uploadField.element] : []),
      urlField.container,
      altField.container,
      imageTitleField.container,
      hrefField.container,
      targetField.container,
      loadingField.container,
      decodingField.container,
      modeField,
      actions,
    )
    this.urlInput = urlField.input
    this.altInput = altField.input
    this.titleInput = imageTitleField.input
    this.hrefInput = hrefField.input
    this.targetSelect = targetField.select
    this.loadingSelect = loadingField.select
    this.decodingSelect = decodingField.select
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
    this.modeButtons.forEach((modeButton) => this.listen(modeButton, 'click', () => {
      this.setMode(modeButton.dataset.imageMode as ImagePlacement)
    }))
    return button
  }

  /** 打开表单；编辑已有图片时预填当前节点属性。 */
  execute(context: MenuContext): void {
    if (!this.dialog || !this.urlInput || !this.altInput || !this.titleInput || !this.hrefInput
      || !this.targetSelect || !this.loadingSelect || !this.decodingSelect || this.dialog.open) return
    const activeType = this.getActiveType(context)
    const attributes = activeType ? context.editor.getAttributes(activeType) : {}
    this.urlInput.value = attributes.src ?? ''
    this.altInput.value = attributes.alt ?? ''
    this.titleInput.value = attributes.title ?? ''
    this.hrefInput.value = attributes.href ?? ''
    this.targetSelect.value = attributes.target ?? ''
    this.loadingSelect.value = attributes.loading ?? ''
    this.decodingSelect.value = attributes.decoding ?? ''
    this.setMode(activeType === 'inlineImage' ? 'inline' : activeType === 'image' ? 'block' : this.options.defaultMode)
    this.uploadField?.reset()
    this.dialog.show()
  }

  /** 选中任一种图片节点时，都同步主按钮的激活状态。 */
  update(context: MenuContext): void {
    const button = this.element as HTMLButtonElement | null
    if (!button) return
    const active = Boolean(this.getActiveType(context))
    button.classList.toggle('is-active', active)
    button.setAttribute('aria-pressed', String(active))
  }

  /** 关闭并移除 dialog，防止编辑器销毁后留下 Portal。 */
  destroy(): void {
    this.dialog?.destroy()
    this.dialog = null
    this.urlInput = null
    this.altInput = null
    this.titleInput = null
    this.hrefInput = null
    this.targetSelect = null
    this.loadingSelect = null
    this.decodingSelect = null
    this.modeButtons = []
    this.uploadField?.destroy()
    this.uploadField = null
    super.destroy()
  }

  /** 根据当前选择更新已有图片或插入新图片。 */
  private applyImage({ editor }: MenuContext): void {
    const src = this.urlInput?.value.trim()
    if (!src) return
    const alt = this.altInput?.value.trim() ?? ''
    const attributes = {
      src,
      alt,
      title: this.titleInput?.value.trim() ?? '',
      href: this.hrefInput?.value.trim() || null,
      target: (this.hrefInput?.value.trim() && this.targetSelect?.value
        ? this.targetSelect.value
        : null) as ImageLinkTarget,
      loading: (this.loadingSelect?.value || null) as ImageLoading,
      decoding: (this.decodingSelect?.value || null) as ImageDecoding,
    }

    const activeType = this.getActiveType({editor})
    if (activeType === 'image' && this.mode === 'inline') {
      editor.chain().focus().updateImageAttributes(attributes).convertImageToInline().run()
    } else if (activeType === 'inlineImage' && this.mode === 'block') {
      editor.chain().focus().updateImageAttributes(attributes).convertInlineImageToBlock().run()
    } else if (activeType) {
      editor.chain().focus().updateImageAttributes(attributes).run()
    } else if (this.mode === 'inline') {
      editor.chain().focus().setInlineImage(attributes).run()
    } else {
      editor.chain().focus().setImageWithAttributes(attributes).run()
    }
  }

  private getActiveType({editor}: Pick<MenuContext, 'editor'>): 'image' | 'inlineImage' | undefined {
    if (editor.isActive('image')) return 'image'
    if (editor.isActive('inlineImage')) return 'inlineImage'
    return undefined
  }

  private setMode(mode: ImagePlacement): void {
    this.mode = mode
    this.modeButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.imageMode === mode))
    })
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

  /** 创建与项目基础表单样式一致的图片属性下拉字段。 */
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
}
