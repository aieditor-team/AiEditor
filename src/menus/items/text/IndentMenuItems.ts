import {IndentDecrease, IndentIncrease} from 'lucide'
import {ButtonMenuItem} from '../../core'

/** 减少当前段落或标题的首行缩进层级。 */
export class DecreaseIndentMenuItem extends ButtonMenuItem {
    constructor() {
        super({
            id: 'decrease-indent',
            label: 'Decrease first-line indent',
            icon: IndentDecrease,
            execute: ({editor}) => {
                editor.chain().focus().decreaseIndent().run()
            },
            isEnabled: ({editor}) => editor.isEditable && editor.can().decreaseIndent(),
        })
    }
}

/** 增加当前段落或标题的首行缩进层级。 */
export class IncreaseIndentMenuItem extends ButtonMenuItem {
    constructor() {
        super({
            id: 'increase-indent',
            label: 'Increase first-line indent',
            icon: IndentIncrease,
            execute: ({editor}) => {
                editor.chain().focus().increaseIndent().run()
            },
            isEnabled: ({editor}) => editor.isEditable && editor.can().increaseIndent(),
        })
    }
}
