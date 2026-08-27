import {createElement, Link, Pencil} from 'lucide'
import {FloatingDialog, MenuItem, type MenuContext} from '../../core'

let linkMenuSequence = 0

/** 链接 target 下拉框中的一个可选项。 */
export interface LinkTargetOption {
  label: string
  value: string
}

export const defaultLinkTargets: LinkTargetOption[] = [
  {label: 'Same window', value: '_self'},
  {label: 'New window', value: '_blank'},
  {label: 'Parent frame', value: '_parent'},
  {label: 'Top frame', value: '_top'},
]

/** 链接编辑菜单的文案、字段可见性和打开方式配置。 */
export interface LinkMenuItemOptions {
  id?: string
  label?: string
  dialogTitle?: string
  inputLabel?: string
  placeholder?: string
  showAlt?: boolean
  altLabel?: string
  altPlaceholder?: string
  targetLabel?: string
  targets?: false | LinkTargetOption[]
  defaultTarget?: string
  icon?: 'link' | 'edit'
  editLabel?: string
  actionsLabel?: string
  /** @deprecated 使用 editLabel 配置链接 Bubble Menu 的编辑按钮文案。 */
  setLabel?: string
  removeLabel?: string
  visitLabel?: string
}

type ResolvedLinkMenuItemOptions = Required<Omit<LinkMenuItemOptions, 'targets'>> & {
  targets: false | LinkTargetOption[]
}

/** 为当前选区设置或更新链接地址、Alt 和打开方式。 */
export class LinkMenuItem extends MenuItem {
  private readonly options: ResolvedLinkMenuItemOptions
  private dialog: FloatingDialog | null = null
  private hrefInput: HTMLInputElement | null = null
  private altInput: HTMLInputElement | null = null
  private targetSelect: HTMLSelectElement | null = null

  constructor(options: LinkMenuItemOptions = {}) {
    super(options.id ?? 'link')
    const targets = options.targets ?? defaultLinkTargets
    if (targets !== false && !targets.length) throw new Error('LinkMenuItem targets cannot be empty')
    const defaultTarget = targets === false
      ? ''
      : options.defaultTarget && targets.some((target) => target.value === options.defaultTarget)
        ? options.defaultTarget
        : targets.find((target) => target.value === '_blank')?.value ?? targets[0].value
    this.options = {
      id: options.id ?? 'link',
      label: options.label ?? 'Add link',
      dialogTitle: options.dialogTitle ?? 'Add a link',
      inputLabel: options.inputLabel ?? 'URL',
      placeholder: options.placeholder ?? 'https://example.com',
      showAlt: options.showAlt ?? true,
      altLabel: options.altLabel ?? 'Alternative text',
      altPlaceholder: options.altPlaceholder ?? 'Describe the link',
      targetLabel: options.targetLabel ?? 'Open link in',
      targets,
      defaultTarget,
      icon: options.icon ?? 'link',
      editLabel: options.editLabel ?? options.setLabel ?? 'Edit link',
      actionsLabel: options.actionsLabel ?? 'Link actions',
      setLabel: options.setLabel ?? 'Set link',
      removeLabel: options.removeLabel ?? 'Remove link',
      visitLabel: options.visitLabel ?? 'Visit link',
    }
  }

  /** 创建工具栏按钮及其复用的浮动表单，并建立表单字段引用。 */
  render(context: MenuContext): HTMLElement {
    const translate = (value: string) => context.i18n.t(value)
    const sequence = ++linkMenuSequence
    const editorTitleId = `aieditor-link-title-${sequence}`
    const button = document.createElement('button')
    const form = document.createElement('form')
    const title = document.createElement('h2')
    const hrefField = this.createInputField(`aieditor-link-url-${sequence}`, translate(this.options.inputLabel), 'url', translate(this.options.placeholder))
    const altField = this.options.showAlt
      ? this.createInputField(`aieditor-link-alt-${sequence}`, translate(this.options.altLabel), 'text', translate(this.options.altPlaceholder))
      : null
    const targetField = this.options.targets === false
      ? null
      : this.createTargetField(`aieditor-link-target-${sequence}`, translate, this.options.targets)
    const actions = document.createElement('div')
    const cancel = document.createElement('button')
    const apply = document.createElement('button')

    button.type = 'button'
    button.className = 'aieditor__tool'
    button.title = translate(this.options.label)
    button.setAttribute('aria-label', translate(this.options.label))
    button.append(createElement(this.options.icon === 'edit' ? Pencil : Link, {'aria-hidden': 'true'}))
    form.className = 'aieditor__dialog-form'
    title.id = editorTitleId
    title.textContent = translate(this.options.dialogTitle)
    hrefField.input.required = true
    actions.className = 'aieditor__dialog-actions'
    cancel.type = 'submit'
    cancel.formNoValidate = true
    cancel.className = 'aieditor__button aieditor__button--quiet'
    cancel.value = 'cancel'
    cancel.textContent = translate('Cancel')
    apply.type = 'submit'
    apply.className = 'aieditor__button aieditor__button--primary'
    apply.value = 'apply'
    apply.textContent = translate('Apply link')

    actions.append(cancel, apply)
    form.append(title, hrefField.container)
    if (altField) form.append(altField.container)
    if (targetField) form.append(targetField.container)
    form.append(actions)
    this.hrefInput = hrefField.input
    this.altInput = altField?.input ?? null
    this.targetSelect = targetField?.select ?? null
    this.dialog = new FloatingDialog(button, form, {
      labelledBy: editorTitleId,
      initialFocus: hrefField.input,
      onClose: (reason) => {
        if (reason === 'apply') this.applyLink(context)
      },
    })

    this.listen(button, 'mousedown', (event) => event.preventDefault())
    this.listen(button, 'click', () => this.dialog?.open ? this.dialog.close() : this.execute(context))
    return button
  }

  /** 从当前链接 mark 回填表单；新建链接时使用配置的默认 target。 */
  execute(context: MenuContext): void {
    if (!this.dialog || !this.hrefInput || this.dialog.open) return
    const attributes = context.editor.getAttributes('link')
    this.hrefInput.value = attributes.href ?? ''
    if (this.altInput) this.altInput.value = attributes.alt ?? ''
    if (this.targetSelect) {
      const target = attributes.target ?? this.options.defaultTarget
      this.targetSelect.value = this.options.targets !== false && this.options.targets.some((option) => option.value === target)
        ? target
        : this.options.defaultTarget
    }
    this.dialog.show()
  }

  /** 根据当前选区和只读状态同步按钮状态。 */
  update(context: MenuContext): void {
    const button = this.element as HTMLButtonElement | null
    if (!button) return
    const active = context.editor.isActive('link')
    button.classList.toggle('is-active', active)
    button.setAttribute('aria-pressed', String(active))
    button.disabled = !context.editor.isEditable
  }

  /** 销毁挂载到 body 的对话框及其事件监听，避免菜单重建后残留浮层。 */
  destroy(): void {
    this.dialog?.destroy()
    this.dialog = null
    this.hrefInput = null
    this.altInput = null
    this.targetSelect = null
    super.destroy()
  }

  /** 将表单值写入完整链接 mark；新窗口链接自动补充安全 rel。 */
  private applyLink({editor}: MenuContext): void {
    const href = this.hrefInput?.value.trim()
    if (!href) return
    const alt = this.altInput?.value.trim() || null
    const target = this.targetSelect?.value || null
    const rel = target === '_blank' ? 'noopener noreferrer' : null
    editor.chain()
      .focus()
      .extendMarkRange('link')
      .setLink({href, target, rel})
      .updateAttributes('link', {alt})
      .run()
  }

  /** 创建带显式 label 关联的文本字段。 */
  private createInputField(id: string, labelText: string, type: 'text' | 'url', placeholder: string) {
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
    return {container, input}
  }

  /** 按配置构造链接打开方式下拉框。 */
  private createTargetField(
    id: string,
    translate: (value: string) => string,
    targets: LinkTargetOption[],
  ): {container: HTMLElement; select: HTMLSelectElement} {
    const container = document.createElement('div')
    const label = document.createElement('label')
    const select = document.createElement('select')
    container.className = 'aieditor__dialog-field'
    label.htmlFor = id
    label.textContent = translate(this.options.targetLabel)
    select.id = id
    targets.forEach((target) => {
      const option = document.createElement('option')
      option.value = target.value
      option.textContent = translate(target.label)
      select.append(option)
    })
    container.append(label, select)
    return {container, select}
  }
}
