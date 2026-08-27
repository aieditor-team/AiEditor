import type {Attributes} from '@tiptap/core'

export type TableCellVerticalAlign = 'top' | 'middle' | 'bottom'

/**
 * 单元格只持久化适合整格继承的视觉属性。
 * 字体、字号、粗斜体继续由 textStyle 和 mark 管理，避免出现两套格式来源。
 */
export interface TableCellStyleAttributes {
    /** 单元格背景色；序列化到 tableCell/tableHeader attrs，DOCX 对应 w:shd。 */
    backgroundColor: string | null
    /** 整格默认文字颜色；具体文本上的 textStyle.color 优先。 */
    color: string | null
    /** 单元格内容的垂直对齐；DOCX 对应 w:vAlign。 */
    verticalAlign: TableCellVerticalAlign | null
}

/** 接受常用 CSS 颜色格式，同时拒绝可拼接其他声明或加载外部资源的值。 */
export function normalizeTableCellColor(value: unknown): string | null {
    if (typeof value !== 'string') return null
    const color = value.trim()
    if (!color) return null
    if (/[;{}<>]/.test(color) || /(?:url|expression|var)\s*\(/i.test(color)) return null
    if (/^#[\da-f]{3,4}(?:[\da-f]{3,4})?$/i.test(color)) return color.toLowerCase()
    if (/^(?:rgb|rgba|hsl|hsla)\([\d\s.,%+\-/]+\)$/i.test(color)) return color
    if (/^[a-z]+$/i.test(color)) return color.toLowerCase()
    return null
}

/** 未知垂直对齐值恢复为文档样式定义的默认值。 */
export function normalizeTableCellVerticalAlign(value: unknown): TableCellVerticalAlign | null {
    return value === 'top' || value === 'middle' || value === 'bottom' ? value : null
}

/** TableCell 与 TableHeader 共用同一份 schema 属性，保证 td/th 转换时样式不丢失。 */
export function tableCellStyleAttributes(): Attributes {
    return {
        backgroundColor: {
            default: null,
            parseHTML: (element) => normalizeTableCellColor(element.style.backgroundColor),
            renderHTML: (attributes) => {
                const value = normalizeTableCellColor(attributes.backgroundColor)
                return value ? {style: `background-color: ${value}`} : {}
            },
        },
        color: {
            default: null,
            parseHTML: (element) => normalizeTableCellColor(element.style.color),
            renderHTML: (attributes) => {
                const value = normalizeTableCellColor(attributes.color)
                return value ? {style: `color: ${value}`} : {}
            },
        },
        verticalAlign: {
            default: null,
            parseHTML: (element) => normalizeTableCellVerticalAlign(element.style.verticalAlign),
            renderHTML: (attributes) => {
                const value = normalizeTableCellVerticalAlign(attributes.verticalAlign)
                return value ? {style: `vertical-align: ${value}`} : {}
            },
        },
    }
}
