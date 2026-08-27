import {PanelLeft} from 'lucide'
import {ButtonMenuItem} from '../../core'

/** 在普通单元格与第一列表头之间切换。 */
export class ToggleTableHeaderColumnMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'table-toggle-header-column', label: 'Toggle header column', icon: PanelLeft,
      execute: ({editor}) => { editor.chain().focus().toggleHeaderColumn().run() },
      isEnabled: ({editor}) => editor.can().toggleHeaderColumn(),
    })
  }
}
