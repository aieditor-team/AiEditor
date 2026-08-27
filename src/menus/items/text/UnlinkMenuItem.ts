import { Unlink } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 移除链接菜单项，封装对应的 Tiptap 命令。 */
export class UnlinkMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'unlink', label: 'Remove link', icon: Unlink,
      execute: ({ editor }) => { editor.chain().focus().unsetLink().run() },
      isEnabled: ({ editor }) => editor.isActive('link'),
    })
  }
}
