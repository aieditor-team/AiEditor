import { AlignLeft } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 图片左对齐菜单项，封装对应的 Tiptap 命令。 */
export class AlignImageLeftMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'image-align-left', label: 'Align image left', icon: AlignLeft,
      execute: ({ editor }) => { editor.chain().focus().updateAttributes('image', { alignment: 'left' }).run() },
      isActive: ({ editor }) => editor.isActive('image') && editor.getAttributes('image').alignment === 'left',
      isEnabled: ({ editor }) => editor.isActive('image'),
    })
  }
}
