import {SquareDashed} from 'lucide'
import {ButtonMenuItem} from '../../core'

/** 在普通单元格与语义化表头单元格之间切换。 */
export class ToggleTableHeaderCellMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'table-toggle-header-cell', label: 'Toggle header cell', icon: SquareDashed,
      execute: ({editor}) => { editor.chain().focus().toggleHeaderCell().run() },
      isActive: ({editor}) => editor.isActive('tableHeader'),
      isEnabled: ({editor}) => editor.can().toggleHeaderCell(),
    })
  }
}
