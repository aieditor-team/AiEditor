/** 文档样式和导出版式配置共用的纸张与页面装饰基础类型。 */
export type DocumentPageFormatName = 'A3' | 'A4' | 'A5' | 'Letter' | 'Legal' | 'Tabloid'
export type DocumentLength = number | `${number}${'px' | 'mm' | 'cm' | 'in' | 'pt'}`
export type DocumentPageHeaderFooter = string
export type DocumentPageNumberPosition =
    | `${'top' | 'bottom'}-${'left' | 'center' | 'right' | 'inner' | 'outer'}`
export type DocumentPageNumberFormat = 'plain' | 'dash'

export interface DocumentPageMargins {
    readonly top: DocumentLength
    readonly right: DocumentLength
    readonly bottom: DocumentLength
    readonly left: DocumentLength
}

export interface DocumentPageFormat {
    readonly id: string
    readonly width: DocumentLength
    readonly height: DocumentLength
    readonly margins: DocumentPageMargins
}

export interface DocumentPageNumberOptions {
    position?: DocumentPageNumberPosition
    showOnFirstPage?: boolean
    showPageCount?: boolean
    format?: DocumentPageNumberFormat
    offsetFromContent?: DocumentLength
    sideInset?: DocumentLength
    hiddenPages?: readonly number[]
}

const format = (
    id: DocumentPageFormatName,
    width: number,
    height: number,
    margins: DocumentPageMargins,
): Readonly<DocumentPageFormat> => Object.freeze({id, width: `${width}mm`, height: `${height}mm`, margins: Object.freeze(margins)})

export const DOCUMENT_PAGE_FORMATS: Readonly<Record<DocumentPageFormatName, Readonly<DocumentPageFormat>>> = Object.freeze({
    A3: format('A3', 297, 420, {top: '25mm', right: '25mm', bottom: '25mm', left: '25mm'}),
    A4: format('A4', 210, 297, {top: '25.4mm', right: '25.4mm', bottom: '25.4mm', left: '25.4mm'}),
    A5: format('A5', 148, 210, {top: '19mm', right: '19mm', bottom: '19mm', left: '19mm'}),
    Letter: format('Letter', 215.9, 279.4, {top: '25.4mm', right: '25.4mm', bottom: '25.4mm', left: '25.4mm'}),
    Legal: format('Legal', 215.9, 355.6, {top: '25.4mm', right: '25.4mm', bottom: '25.4mm', left: '25.4mm'}),
    Tabloid: format('Tabloid', 279.4, 431.8, {top: '25.4mm', right: '25.4mm', bottom: '25.4mm', left: '25.4mm'}),
})
