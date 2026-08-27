import { TableRow as TTableRow, type TableRowOptions as TTableRowOptions } from '@tiptap/extension-table'

export const TABLE_ROW_MIN_HEIGHT = 32
const TABLE_ROW_MAX_HEIGHT = 2000

/** 统一校验来自命令、JSON 和 HTML 的表格行高。 */
export function normalizeTableRowHeight(value: unknown): number | null {
    const parsed = typeof value === 'string'
        ? Number.parseFloat(value)
        : typeof value === 'number' ? value : Number.NaN
    if (!Number.isFinite(parsed) || parsed <= 0) return null
    return Math.max(TABLE_ROW_MIN_HEIGHT, Math.min(TABLE_ROW_MAX_HEIGHT, Math.round(parsed)))
}

/** 表格行节点，约束其子节点为普通单元格或表头单元格。 */
export type TableRowOptions = TTableRowOptions
export const TableRow = TTableRow.extend<TableRowOptions>({
    addAttributes() {
        return {
            ...this.parent?.(),
            rowHeight: {
                default: null,
                parseHTML: (element) => normalizeTableRowHeight(
                    element.style.height || element.getAttribute('height'),
                ),
                renderHTML: (attributes) => {
                    const height = normalizeTableRowHeight(attributes.rowHeight)
                    return height ? {style: `height: ${height}px`} : {}
                },
            },
        }
    },
})
