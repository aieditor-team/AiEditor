import { Pi } from 'lucide'
import { TextInputMenuItem } from '../../core'

/** 行内数学公式菜单项，封装对应的 Tiptap 命令。 */
export class InlineMathMenuItem extends TextInputMenuItem {
  constructor() {
    super({
      id: 'inline-math', label: 'Insert inline math', icon: Pi,
      dialogTitle: 'Insert inline math', inputLabel: 'LaTeX',
      placeholder: 'E = mc^2', submitLabel: 'Insert formula',
      onSubmit: ({ editor }, latex) => { editor.chain().focus().insertInlineMath({ latex }).run() },
      isActive: ({ editor }) => editor.isActive('inlineMath'),
    })
  }
}
