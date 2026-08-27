import {TableCell as TTableCell, type TableCellOptions as TTableCellOptions} from '@tiptap/extension-table'
import {
    normalizeTableCellColor,
    normalizeTableCellVerticalAlign,
    tableCellStyleAttributes,
    type TableCellVerticalAlign,
} from './TableCellAttributes'

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        tableCellStyle: {
            setTableCellBackgroundColor: (color: string | null) => ReturnType
            setTableCellTextColor: (color: string | null) => ReturnType
            setTableCellVerticalAlign: (alignment: TableCellVerticalAlign | null) => ReturnType
        }
    }
}

/** 普通表格单元格节点，增加背景色、文字颜色和垂直对齐能力。 */
export type TableCellOptions = TTableCellOptions
export const TableCell = TTableCell.extend<TableCellOptions>({
    addAttributes() {
        return {...this.parent?.(), ...tableCellStyleAttributes()}
    },

    /** 对外只暴露经过校验的样式命令，内部复用 Tiptap 对 CellSelection 的批量更新。 */
    addCommands() {
        return {
            setTableCellBackgroundColor: (color) => ({commands}) => commands.setCellAttribute(
                'backgroundColor',
                normalizeTableCellColor(color),
            ),
            setTableCellTextColor: (color) => ({commands}) => commands.setCellAttribute(
                'color',
                normalizeTableCellColor(color),
            ),
            setTableCellVerticalAlign: (alignment) => ({commands}) => commands.setCellAttribute(
                'verticalAlign',
                normalizeTableCellVerticalAlign(alignment),
            ),
        }
    },
})
