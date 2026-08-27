import { createElement, type IconNode } from 'lucide'
import { FloatingDialog } from './FloatingDialog'
import type { MenuContext } from './MenuContext'
import { MenuItem } from './MenuItem'

let textInputMenuSequence = 0

export interface TextInputMenuItemOptions {
  id: string
  label: string
  dialogTitle: string
  inputLabel: string
  placeholder: string
  submitLabel: string
  icon: IconNode
  inputType?: 'text' | 'url'
  isActive?: (context: MenuContext) => boolean
  onSubmit: (context: MenuContext, value: string) => void
}

/** 用于数学公式、Mention 和媒体地址等插入操作的单字段对话框菜单项。 */
export class TextInputMenuItem extends MenuItem {
  private readonly options: TextInputMenuItemOptions
  private dialog: FloatingDialog | null = null
  private input: HTMLInputElement | null = null

  constructor(options: TextInputMenuItemOptions) {
    super(options.id)
    this.options = options
  }

  /** 创建按钮与 Portal dialog，并在提交时把输入值交给具体菜单项。 */
  render(context: MenuContext): HTMLElement {
    const translate = (value: string) => context.i18n.t(value)
    const sequence = ++textInputMenuSequence
    const headingId = `aieditor-${this.id}-heading-${sequence}`
    const inputId = `aieditor-${this.id}-input-${sequence}`
    const button = document.createElement('button')
    const form = document.createElement('form')
    const heading = document.createElement('h2')
    const field = document.createElement('div')
    const label = document.createElement('label')
    const input = document.createElement('input')
    const actions = document.createElement('div')
    const cancel = document.createElement('button')
    const apply = document.createElement('button')

    button.type = 'button'
    button.className = 'aieditor__tool'
    button.title = translate(this.options.label)
    button.setAttribute('aria-label', translate(this.options.label))
    button.append(createElement(this.options.icon, { 'aria-hidden': 'true' }))

    heading.id = headingId
    heading.textContent = translate(this.options.dialogTitle)
    form.className = 'aieditor__dialog-form'
    field.className = 'aieditor__dialog-field'
    label.htmlFor = inputId
    label.textContent = translate(this.options.inputLabel)
    input.id = inputId
    input.type = this.options.inputType ?? 'text'
    input.placeholder = translate(this.options.placeholder)
    input.required = true
    if (input.type === 'url') input.setAttribute('autocomplete', 'url')
    actions.className = 'aieditor__dialog-actions'
    cancel.type = 'submit'
    cancel.formNoValidate = true
    cancel.className = 'aieditor__button aieditor__button--quiet'
    cancel.value = 'cancel'
    cancel.textContent = translate('Cancel')
    apply.type = 'submit'
    apply.className = 'aieditor__button aieditor__button--primary'
    apply.value = 'apply'
    apply.textContent = translate(this.options.submitLabel)

    field.append(label, input)
    actions.append(cancel, apply)
    form.append(heading, field, actions)
    this.input = input
    this.dialog = new FloatingDialog(button, form, {
      labelledBy: headingId,
      initialFocus: input,
      onClose: (reason) => {
        const value = input.value.trim()
        if (reason === 'apply' && value) this.options.onSubmit(context, value)
      },
    })

    this.listen(button, 'mousedown', (event) => event.preventDefault())
    this.listen(button, 'click', () => this.dialog?.open ? this.dialog.close() : this.execute(context))
    return button
  }

  /** 清空并打开对话框；输入完成后由 close 事件统一处理提交。 */
  execute(_context: MenuContext): void {
    if (!this.dialog || !this.input || this.dialog.open) return
    this.input.value = ''
    this.dialog.show()
  }

  /** 同步按钮的 active 状态。 */
  update(context: MenuContext): void {
    const button = this.element as HTMLButtonElement | null
    if (!button || !this.options.isActive) return
    const active = this.options.isActive(context)
    button.classList.toggle('is-active', active)
    button.setAttribute('aria-pressed', String(active))
  }

  /** 关闭并移除对话框，同时解除菜单项事件监听。 */
  destroy(): void {
    this.dialog?.destroy()
    this.dialog = null
    this.input = null
    super.destroy()
  }
}
