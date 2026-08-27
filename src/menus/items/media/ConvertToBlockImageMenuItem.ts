import {Square} from 'lucide'
import {ButtonMenuItem} from '../../core'

/** 转换为块级图片菜单项，封装对应的 Tiptap 命令。 */
export class ConvertToBlockImageMenuItem extends ButtonMenuItem {
    constructor() {
        super({
            id: 'convert-inline-image-to-block', label: 'Convert to block image', icon: Square,
            execute: ({editor}) => {
                editor.chain().focus().convertInlineImageToBlock().run()
            },
            isEnabled: ({editor}) => editor.can().convertInlineImageToBlock(),
        })
    }
}
