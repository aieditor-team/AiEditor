import { Braces } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 代码块菜单项，封装对应的 Tiptap 命令。 */
export class CodeBlockMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'code-block', label: 'Code block', icon: Braces,
      execute: ({ editor }) => { editor.chain().focus().toggleCodeBlock().run() },
      isActive: ({ editor }) => editor.isActive('codeBlock'),
    })
  }
}
