import { AlignRight } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 图片右对齐菜单项，封装对应的 Tiptap 命令。 */
export class AlignImageRightMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'image-align-right', label: 'Align image right', icon: AlignRight,
      execute: ({ editor }) => { editor.chain().focus().updateAttributes('image', { alignment: 'right' }).run() },
      isActive: ({ editor }) => editor.isActive('image') && editor.getAttributes('image').alignment === 'right',
      isEnabled: ({ editor }) => editor.isActive('image'),
    })
  }
}
