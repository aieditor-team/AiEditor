import {Subscript, Superscript} from 'lucide'
import {ButtonMenuItem} from '../../core'

/** 切换上标；扩展命令会先移除互斥的下标。 */
export class SuperscriptMenuItem extends ButtonMenuItem {
    constructor() {
        super({
            id: 'superscript',
            label: 'Superscript',
            icon: Superscript,
            execute: ({editor}) => {
                editor.chain().focus().toggleSuperscript().run()
            },
            isActive: ({editor}) => editor.isActive('superscript'),
            isEnabled: ({editor}) => editor.isEditable && editor.can().toggleSuperscript(),
        })
    }
}

/** 切换下标；扩展命令会先移除互斥的上标。 */
export class SubscriptMenuItem extends ButtonMenuItem {
    constructor() {
        super({
            id: 'subscript',
            label: 'Subscript',
            icon: Subscript,
            execute: ({editor}) => {
                editor.chain().focus().toggleSubscript().run()
            },
            isActive: ({editor}) => editor.isActive('subscript'),
            isEnabled: ({editor}) => editor.isEditable && editor.can().toggleSubscript(),
        })
    }
}
