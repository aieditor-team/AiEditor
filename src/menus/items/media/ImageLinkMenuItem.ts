import {createElement, Link2} from 'lucide'
import {FloatingDialog, MenuItem, type MenuContext} from '../../core'
import {getActiveImageType} from './image-menu-utils'

let imageLinkSequence = 0

/** 为所选块级或行内图片设置、更新或移除跳转链接，并维护 target 对应的安全 rel。 */
export class ImageLinkMenuItem extends MenuItem {
  private dialog: FloatingDialog | null = null
  private hrefInput: HTMLInputElement | null = null
  private targetSelect: HTMLSelectElement | null = null
  private removeButton: HTMLButtonElement | null = null

  constructor() {
    super('image-link')
  }

  /** 创建图片链接编辑表单；移除按钮与普通取消/应用动作分开处理。 */
  render(context: MenuContext): HTMLElement {
    const translate = (value: string) => context.i18n.t(value)
    const sequence = ++imageLinkSequence
    const headingId = `aieditor-image-link-title-${sequence}`
    const hrefId = `aieditor-image-link-href-${sequence}`
    const targetId = `aieditor-image-link-target-${sequence}`
    const button = document.createElement('button')
    const form = document.createElement('form')
    const heading = document.createElement('h2')
    const hrefField = document.createElement('div')
    const hrefLabel = document.createElement('label')
    const hrefInput = document.createElement('input')
    const targetField = document.createElement('div')
    const targetLabel = document.createElement('label')
    const targetSelect = document.createElement('select')
    const actions = document.createElement('div')
    const remove = document.createElement('button')
    const cancel = document.createElement('button')
    const apply = document.createElement('button')

    button.type = 'button'
    button.className = 'aieditor__tool'
    button.title = translate('Image link')
    button.setAttribute('aria-label', translate('Image link'))
    button.append(createElement(Link2, {'aria-hidden': 'true'}))
    heading.id = headingId
    heading.textContent = translate('Image link')
    form.className = 'aieditor__dialog-form'
    hrefField.className = 'aieditor__dialog-field'
    hrefLabel.htmlFor = hrefId
    hrefLabel.textContent = translate('URL')
    hrefInput.id = hrefId
    hrefInput.type = 'url'
    hrefInput.placeholder = 'https://example.com'
    hrefInput.setAttribute('autocomplete', 'url')
    hrefField.append(hrefLabel, hrefInput)
    targetField.className = 'aieditor__dialog-field'
    targetLabel.htmlFor = targetId
    targetLabel.textContent = translate('Open link in')
    targetSelect.id = targetId
    ;[
      ['', translate('Same window')],
      ['_blank', translate('New window')],
    ].forEach(([value, text]) => {
      const option = document.createElement('option')
      option.value = value
      option.textContent = text
      targetSelect.append(option)
    })
    targetField.append(targetLabel, targetSelect)
    actions.className = 'aieditor__dialog-actions aieditor__dialog-actions--split'
    remove.type = 'button'
    remove.className = 'aieditor__button aieditor__button--quiet'
    remove.textContent = translate('Remove image link')
    cancel.type = 'submit'
    cancel.formNoValidate = true
    cancel.className = 'aieditor__button aieditor__button--quiet'
    cancel.value = 'cancel'
    cancel.textContent = translate('Cancel')
    apply.type = 'submit'
    apply.className = 'aieditor__button aieditor__button--primary'
    apply.value = 'apply'
    apply.textContent = translate('Apply')
    const trailingActions = document.createElement('span')
    trailingActions.className = 'aieditor__dialog-actions-group'
    trailingActions.append(cancel, apply)
    actions.append(remove, trailingActions)
    form.append(heading, hrefField, targetField, actions)

    this.hrefInput = hrefInput
    this.targetSelect = targetSelect
    this.removeButton = remove
    this.dialog = new FloatingDialog(button, form, {
      labelledBy: headingId,
      initialFocus: hrefInput,
      onClose: (reason) => {
        if (reason === 'apply') this.applyLink(context)
      },
    })
    this.listen(button, 'mousedown', (event) => event.preventDefault())
    this.listen(button, 'click', () => this.dialog?.open ? this.dialog.close() : this.execute(context))
    this.listen(remove, 'click', () => this.removeLink(context))
    return button
  }

  /** 从当前图片节点属性回填链接字段，并按有无链接显示移除动作。 */
  execute({editor}: MenuContext): void {
    if (!this.dialog || !this.hrefInput || !this.targetSelect || !this.removeButton || this.dialog.open) return
    const type = getActiveImageType(editor)
    if (!type) return
    const attributes = editor.getAttributes(type)
    this.hrefInput.value = attributes.href ?? ''
    this.targetSelect.value = attributes.target ?? ''
    this.removeButton.disabled = !attributes.href
    this.dialog.show()
  }

  /** 仅在可编辑且选中图片节点时允许使用。 */
  update({editor}: MenuContext): void {
    const button = this.element as HTMLButtonElement | null
    if (!button) return
    const type = getActiveImageType(editor)
    const active = Boolean(type && editor.getAttributes(type).href)
    button.disabled = !type
    button.classList.toggle('is-active', active)
    button.setAttribute('aria-pressed', String(active))
  }

  /** 释放浮层与所有缓存 DOM 引用。 */
  destroy(): void {
    this.dialog?.destroy()
    this.dialog = null
    this.hrefInput = null
    this.targetSelect = null
    this.removeButton = null
    super.destroy()
  }

  /** 把表单值合并进图片节点属性，保留其余媒体属性。 */
  private applyLink({editor}: MenuContext): void {
    const type = getActiveImageType(editor)
    if (!type || !this.hrefInput || !this.targetSelect) return
    const href = this.hrefInput.value.trim()
    if (href) {
      editor.chain().focus().setImageLink({
        href,
        target: this.targetSelect.value === '_blank' ? '_blank' : null,
      }).run()
    } else {
      editor.chain().focus().unsetImageLink().run()
    }
  }

  /** 仅清除图片链接相关属性，不影响图片本身。 */
  private removeLink({editor}: MenuContext): void {
    const type = getActiveImageType(editor)
    if (!type) return
    this.dialog?.close('cancel', false)
    editor.chain().focus().unsetImageLink().run()
  }
}
