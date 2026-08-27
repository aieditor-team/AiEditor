import {PaintBucket} from 'lucide'
import {ColorPaletteMenuItem} from '../../core'
import {defaultStandardColors, defaultThemeColors} from '../text/ColorMenuItems'
import {canSetTableCellAttribute, getSelectedTableCellAttribute} from './table-cell-menu-utils'

/** 为当前单元格、行、列或多单元格选择设置统一背景色。 */
export class TableCellBackgroundColorMenuItem extends ColorPaletteMenuItem {
  constructor() {
    super({
      id: 'table-cell-background-color',
      label: 'Cell background color',
      paletteLabel: 'Cell background color palette',
      icon: PaintBucket,
      colors: defaultThemeColors,
      standardColors: defaultStandardColors,
      recentLimit: 8,
      getValue: ({editor}) => getSelectedTableCellAttribute(editor, 'backgroundColor'),
      execute: ({editor}, value) => {
        editor.chain().focus().setTableCellBackgroundColor(value || null).run()
      },
      isEnabled: ({editor}) => canSetTableCellAttribute(editor),
    })
  }
}
