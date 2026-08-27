import {Printer} from 'lucide'
import {ButtonMenuItem} from '../../core'

export interface PrintMenuItemOptions {
    /** 自定义打印入口；省略时调用浏览器原生打印。 */
    print?: () => void
}

/** 打开浏览器打印对话框。 */
export class PrintMenuItem extends ButtonMenuItem {
    constructor(options: PrintMenuItemOptions = {}) {
        super({
            id: 'print',
            label: 'Print',
            icon: Printer,
            execute: () => (options.print ?? (() => window.print()))(),
        })
    }
}
