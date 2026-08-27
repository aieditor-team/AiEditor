import { AlignCenter } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 图片居中菜单项，封装对应的 Tiptap 命令。 */
export class AlignImageCenterMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'image-align-center', label: 'Align image center', icon: AlignCenter,
      execute: ({ editor }) => { editor.chain().focus().updateAttributes('image', { alignment: 'center' }).run() },
      isActive: ({ editor }) => editor.isActive('image') && editor.getAttributes('image').alignment === 'center',
      isEnabled: ({ editor }) => editor.isActive('image'),
    })
  }
}
