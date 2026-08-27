import { Quote } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 引用块菜单项，封装对应的 Tiptap 命令。 */
export class BlockquoteMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'blockquote', label: 'Quote', icon: Quote,
      execute: ({ editor }) => { editor.chain().focus().toggleBlockquote().run() },
      isActive: ({ editor }) => editor.isActive('blockquote'),
      isEnabled: ({ editor }) => editor.isEditable && editor.can().toggleBlockquote(),
    })
  }
}
