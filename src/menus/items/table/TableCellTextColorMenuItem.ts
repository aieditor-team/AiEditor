import {Type} from 'lucide'
import {ColorPaletteMenuItem} from '../../core'
import {defaultStandardColors, defaultThemeColors} from '../text/ColorMenuItems'
import {canSetTableCellAttribute, getSelectedTableCellAttribute} from './table-cell-menu-utils'

/** 设置单元格继承文字颜色；文字自身显式颜色标记仍保持更高优先级。 */
export class TableCellTextColorMenuItem extends ColorPaletteMenuItem {
  constructor() {
    super({
      id: 'table-cell-text-color',
      label: 'Cell text color',
      paletteLabel: 'Cell text color palette',
      icon: Type,
      colors: defaultThemeColors,
      standardColors: defaultStandardColors,
      recentLimit: 8,
      getValue: ({editor}) => getSelectedTableCellAttribute(editor, 'color'),
      execute: ({editor}, value) => {
        editor.chain().focus().setTableCellTextColor(value || null).run()
      },
      isEnabled: ({editor}) => canSetTableCellAttribute(editor),
    })
  }
}
