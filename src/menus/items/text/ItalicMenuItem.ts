import { Italic } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 斜体菜单项，封装对应的 Tiptap 命令。 */
export class ItalicMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'italic', label: 'Italic', icon: Italic,
      execute: ({ editor }) => { editor.chain().focus().toggleItalic().run() },
      isActive: ({ editor }) => editor.isActive('italic'),
    })
  }
}
