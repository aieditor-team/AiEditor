import {TableHeader as TTableHeader, type TableHeaderOptions as TTableHeaderOptions} from '@tiptap/extension-table'
import {tableCellStyleAttributes} from './TableCellAttributes'

/** 表头单元格与普通单元格共享视觉属性，td/th 相互转换时不会丢失格式。 */
export type TableHeaderOptions = TTableHeaderOptions
export const TableHeader = TTableHeader.extend<TableHeaderOptions>({
    addAttributes() {
        return {...this.parent?.(), ...tableCellStyleAttributes()}
    },
})
