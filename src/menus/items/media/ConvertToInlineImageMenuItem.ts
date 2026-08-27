import { WrapText } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 转换为行内图片菜单项，封装对应的 Tiptap 命令。 */
export class ConvertToInlineImageMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'convert-image-to-inline', label: 'Convert to inline image', icon: WrapText,
      execute: ({ editor }) => { editor.chain().focus().convertImageToInline().run() },
      isEnabled: ({ editor }) => editor.can().convertImageToInline(),
    })
  }
}
