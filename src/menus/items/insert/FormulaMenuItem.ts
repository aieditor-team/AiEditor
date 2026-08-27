import {createElement, Sigma} from 'lucide'
import {FloatingDialog, MenuItem, type MenuContext} from '../../core'

/** 数学公式在行内文本流或独立块中的放置方式。 */
export type FormulaPlacement = 'inline' | 'block'

/** 公式菜单的默认放置方式及可覆盖文案。 */
export interface FormulaMenuItemOptions {
  defaultMode?: FormulaPlacement
}

let formulaMenuSequence = 0

/** 在同一弹窗中插入行内或块级 LaTeX 公式。 */
export class FormulaMenuItem extends MenuItem {
  private readonly defaultMode: FormulaPlacement
  private dialog: FloatingDialog | null = null
  private input: HTMLTextAreaElement | null = null
  private mode: FormulaPlacement
  private modeButtons: HTMLButtonElement[] = []

  constructor(options: FormulaMenuItemOptions = {}) {
    super('formula')
    this.defaultMode = options.defaultMode ?? 'inline'
    this.mode = this.defaultMode
  }

  /** 构建公式输入、模式切换和提交按钮组成的浮动表单。 */
  render(context: MenuContext): HTMLElement {
    const translate = (value: string) => context.i18n.t(value)
    const sequence = ++formulaMenuSequence
    const titleId = `aieditor-formula-title-${sequence}`
    const modeLabelId = `aieditor-formula-mode-${sequence}`
    const inputId = `aieditor-formula-input-${sequence}`
    const button = document.createElement('button')
    const form = document.createElement('form')
    const title = document.createElement('h2')
    const modeField = document.createElement('div')
    const modeLabel = document.createElement('span')
    const modeControl = document.createElement('div')
    const inputField = document.createElement('div')
    const inputLabel = document.createElement('label')
    const input = document.createElement('textarea')
    const actions = document.createElement('div')
    const cancel = document.createElement('button')
    const apply = document.createElement('button')

    button.type = 'button'
    button.className = 'aieditor__tool'
    button.title = translate('Insert formula')
    button.setAttribute('aria-label', translate('Insert formula'))
    button.append(createElement(Sigma, {'aria-hidden': 'true'}))

    form.className = 'aieditor__dialog-form'
    title.id = titleId
    title.textContent = translate('Insert formula')
    modeField.className = 'aieditor__dialog-field'
    modeLabel.id = modeLabelId
    modeLabel.className = 'aieditor__dialog-label'
    modeLabel.textContent = translate('Formula layout')
    modeControl.className = 'aieditor__segmented-control'
    modeControl.setAttribute('role', 'group')
    modeControl.setAttribute('aria-labelledby', modeLabelId)
    this.modeButtons = (['inline', 'block'] as const).map((mode) => {
      const modeButton = document.createElement('button')
      modeButton.type = 'button'
      modeButton.className = 'aieditor__segmented-option'
      modeButton.dataset.formulaMode = mode
      modeButton.textContent = translate(mode === 'inline' ? 'Inline formula' : 'Block formula')
      modeButton.setAttribute('aria-pressed', 'false')
      modeControl.append(modeButton)
      return modeButton
    })
    modeField.append(modeLabel, modeControl)

    inputField.className = 'aieditor__dialog-field'
    inputLabel.htmlFor = inputId
    inputLabel.textContent = 'LaTeX'
    input.id = inputId
    input.className = 'aieditor__math-input'
    input.rows = 5
    input.spellcheck = false
    input.placeholder = 'E = mc^2'
    input.required = true
    inputField.append(inputLabel, input)

    actions.className = 'aieditor__dialog-actions'
    cancel.type = 'submit'
    cancel.formNoValidate = true
    cancel.className = 'aieditor__button aieditor__button--quiet'
    cancel.value = 'cancel'
    cancel.textContent = translate('Cancel')
    apply.type = 'submit'
    apply.className = 'aieditor__button aieditor__button--primary'
    apply.value = 'apply'
    apply.textContent = translate('Insert formula')
    actions.append(cancel, apply)
    form.append(title, modeField, inputField, actions)

    this.input = input
    this.dialog = new FloatingDialog(button, form, {
      labelledBy: titleId,
      initialFocus: input,
      onClose: (reason) => {
        const latex = input.value.trim()
        if (reason === 'apply' && latex) this.insertFormula(context, latex)
      },
    })

    this.listen(button, 'mousedown', (event) => event.preventDefault())
    this.listen(button, 'click', () => this.dialog?.open ? this.dialog.close() : this.execute(context))
    this.modeButtons.forEach((modeButton) => this.listen(modeButton, 'click', () => {
      this.setMode(modeButton.dataset.formulaMode as FormulaPlacement)
    }))
    return button
  }

  /** 每次打开时清空上次输入并恢复配置的默认公式模式。 */
  execute(context: MenuContext): void {
    if (!this.dialog || !this.input || this.dialog.open) return
    this.input.value = ''
    this.setMode(context.editor.isActive('blockMath')
      ? 'block'
      : context.editor.isActive('inlineMath') ? 'inline' : this.defaultMode)
    this.dialog.show()
  }

  /** 只读状态下禁止打开公式插入对话框。 */
  update(context: MenuContext): void {
    const button = this.element as HTMLButtonElement | null
    if (!button) return
    const active = context.editor.isActive('inlineMath') || context.editor.isActive('blockMath')
    button.classList.toggle('is-active', active)
    button.setAttribute('aria-pressed', String(active))
  }

  /** 销毁对话框并解除对输入框和模式按钮的引用。 */
  destroy(): void {
    this.dialog?.destroy()
    this.dialog = null
    this.input = null
    this.modeButtons = []
    super.destroy()
  }

  /** 根据当前模式调用对应的 Tiptap 数学节点命令。 */
  private insertFormula({editor}: MenuContext, latex: string): void {
    if (this.mode === 'block') editor.chain().focus().insertBlockMath({latex}).run()
    else editor.chain().focus().insertInlineMath({latex}).run()
  }

  /** 切换模式并同步分段按钮的选中和无障碍状态。 */
  private setMode(mode: FormulaPlacement): void {
    this.mode = mode
    this.modeButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.formulaMode === mode))
    })
  }
}
