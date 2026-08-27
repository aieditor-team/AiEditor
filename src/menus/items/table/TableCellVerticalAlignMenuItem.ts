import {
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
} from 'lucide'
import {DropdownMenuItem} from '../../core'
import {canSetTableCellAttribute, getSelectedTableCellAttribute} from './table-cell-menu-utils'

/** 单元格垂直对齐下拉菜单，图标与文字提示保持可访问。 */
export class TableCellVerticalAlignMenuItem extends DropdownMenuItem {
  constructor() {
    super({
      id: 'table-cell-vertical-align',
      label: 'Cell vertical alignment',
      triggerIcon: AlignVerticalJustifyCenter,
      iconOnly: true,
      options: [
        {label: 'Align cell top', value: 'top', icon: AlignVerticalJustifyStart},
        {label: 'Align cell middle', value: 'middle', icon: AlignVerticalJustifyCenter},
        {label: 'Align cell bottom', value: 'bottom', icon: AlignVerticalJustifyEnd},
      ],
      getValue: ({editor}) => getSelectedTableCellAttribute(editor, 'verticalAlign') || 'top',
      execute: ({editor}, value) => {
        editor.chain().focus().setTableCellVerticalAlign(
          value === 'middle' || value === 'bottom' ? value : 'top',
        ).run()
      },
      isEnabled: ({editor}) => canSetTableCellAttribute(editor),
    })
  }
}
