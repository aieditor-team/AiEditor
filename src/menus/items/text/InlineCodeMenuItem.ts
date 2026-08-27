import { Code } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 行内代码菜单项，封装对应的 Tiptap 命令。 */
export class InlineCodeMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'code', label: 'Inline code', icon: Code,
      execute: ({ editor }) => { editor.chain().focus().toggleCode().run() },
      isActive: ({ editor }) => editor.isActive('code'),
    })
  }
}
