import { Sigma } from 'lucide'
import { TextInputMenuItem } from '../../core'

/** 块级数学公式菜单项，封装对应的 Tiptap 命令。 */
export class BlockMathMenuItem extends TextInputMenuItem {
  constructor() {
    super({
      id: 'block-math', label: 'Insert block math', icon: Sigma,
      dialogTitle: 'Insert block math', inputLabel: 'LaTeX',
      placeholder: '\\int_0^1 x^2 \\, dx', submitLabel: 'Insert formula',
      onSubmit: ({ editor }, latex) => { editor.chain().focus().insertBlockMath({ latex }).run() },
      isActive: ({ editor }) => editor.isActive('blockMath'),
    })
  }
}
