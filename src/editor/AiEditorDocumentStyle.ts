import {
    DOCUMENT_PAGE_FORMATS,
    type DocumentLength,
    type DocumentPageFormat,
    type DocumentPageFormatName,
    type DocumentPageHeaderFooter,
    type DocumentPageNumberOptions,
} from './DocumentPageTypes'

/** 内置文档视觉预设；预设只影响实例样式，不改写文档节点。 */
export type DocumentStylePreset = 'web' | 'word' | 'wps'
export type DocumentHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

/**
 * 正文和标题共享的字体、行高及颜色属性。
 * 这些值是编辑器实例的视觉默认值，不会主动写入每个 Tiptap 节点；用户通过工具栏设置的
 * 字体、字号、颜色和字距仍保存在节点的 textStyle mark 中，并覆盖这里的默认值。
 */
export interface DocumentTextStyle {
    /** CSS font-family，可包含按优先级排列的后备字体。 */
    fontFamily?: string
    /** CSS 字号，建议带 px/pt 单位；DOCX SDK 会按物理单位换算 half-point。 */
    fontSize?: string
    /** CSS 字重。数字和 normal/bold 均可。 */
    fontWeight?: string | number
    /** CSS 行高。无单位数字表示倍数，px/pt 表示固定距离，二者在 Word 中语义不同。 */
    lineHeight?: string | number
    /** CSS 字间距；用户显式设置时由 textStyle.letterSpacing 随文档保存。 */
    letterSpacing?: string
    /** 默认文字颜色。 */
    color?: string
    /** 默认文字背景色；与 Word 的离散高亮色不是同一概念。 */
    backgroundColor?: string
}

/** 普通段落的块级间距与对齐规则。 */
export interface DocumentParagraphStyle {
    /** 普通段落的段前视觉间距。 */
    marginTop?: string
    /** 普通段落的段后视觉间距。 */
    marginBottom?: string
    /** 默认首行缩进；用户工具栏设置的 indent 节点属性会覆盖它。 */
    textIndent?: string
    /** 默认水平对齐，如 left、center、right、justify。 */
    textAlign?: string
    /** 两端对齐时使用的 CSS text-justify 策略。 */
    textJustify?: string
}

/** 单个标题级别的完整样式，可供页面渲染器控制是否与后文保持同页。 */
export interface DocumentHeadingStyle extends DocumentTextStyle {
    marginTop?: string
    marginBottom?: string
    textTransform?: string
    breakAfter?: string
    textAlign?: string
    textIndent?: string
}

/** 文档主标题样式。 */
export interface DocumentTitleStyle extends DocumentHeadingStyle {}

/** 超链接在编辑区和导出 HTML 中使用的视觉规则。 */
export interface DocumentLinkStyle {
    color?: string
    textDecoration?: string
    textUnderlineOffset?: string
}

/** 有序、无序和任务列表共享的缩进与项目间距。 */
export interface DocumentListStyle {
    marginTop?: string
    marginBottom?: string
    paddingLeft?: string
    itemMarginTop?: string
    itemMarginBottom?: string
}

/** 引用块容器的边框、留白与文字风格。 */
export interface DocumentBlockquoteStyle {
    marginTop?: string
    marginBottom?: string
    padding?: string
    borderLeft?: string
    color?: string
    fontStyle?: string
}

/** 普通水平分隔线的文档级默认视觉。 */
export interface DocumentRuleStyle {
    marginTop?: string
    marginBottom?: string
    borderTop?: string
}

/**
 * 表格、单元格和表头的文档级默认视觉。
 * 列宽不在这里配置：用户拖拽后的宽度保存在 tableCell/tableHeader 的 colwidth 属性中，
 * Java SDK 会将其转换为 Word 的 tblGrid、tblW 和 tcW。
 */
export interface DocumentTableStyle {
    wrapperMargin?: string
    wrapperPadding?: string
    tableMargin?: string
    fontFamily?: string
    fontSize?: string
    lineHeight?: string | number
    cellPadding?: string
    borderColor?: string
    headerBackground?: string
    headerColor?: string
    headerFontWeight?: string | number
    cellParagraphTextAlign?: string
}

/** 块级及行内媒体的外边距和圆角规则。 */
export interface DocumentMediaStyle {
    blockMarginTop?: string
    blockMarginBottom?: string
    blockBorderRadius?: string
    inlineBorderRadius?: string
}

/** 页眉、页脚与页码等页面装饰文字的样式。 */
export interface DocumentPageChromeStyle {
    fontFamily?: string
    fontSize?: string
    lineHeight?: string | number
    color?: string
}

/** 对内置纸张规格进行局部覆盖的配置；尺寸可供页面视图和 DOCX 版式 profile 使用。 */
export interface DocumentPageFormatOptions {
    /** 业务侧纸张标识，不参与尺寸计算。 */
    id?: string
    /** 页面宽度，数字按 CSS px，字符串可使用 mm、in、pt 等单位。 */
    width?: DocumentLength
    /** 页面高度，单位规则与 width 相同。 */
    height?: DocumentLength
    /** 页面四边距局部覆盖；未填写的边继续使用当前预设值。 */
    margins?: Partial<DocumentPageFormat['margins']>
}

/** 文档预设附带的纸张、页眉页脚与页码配置。 */
export interface DocumentPageStyle {
    /** 内置纸张名称，或基于当前预设局部覆盖后的自定义纸张。 */
    format?: DocumentPageFormatName | DocumentPageFormatOptions
    /** 页眉内容距页面顶部的距离。 */
    headerTopMargin?: DocumentLength
    /** 页脚内容距页面底部的距离。 */
    footerBottomMargin?: DocumentLength
    /** 页面视图的纸张背景色，不会作为正文节点内容导出。 */
    paperColor?: string
    /** 页面视图页眉配置。 */
    header?: DocumentPageHeaderFooter
    /** 页面视图页脚配置。 */
    footer?: DocumentPageHeaderFooter
    /** 页码开关或位置、起始值、隐藏页等详细配置。 */
    pageNumbers?: boolean | DocumentPageNumberOptions
}

/** 页面版心网格，用字符数和行数反推字距与行距。 */
export interface DocumentGridOptions {
    /** 页面正文区域每行的全角字符数。 */
    charactersPerLine?: number
    /** 页面正文区域每页的正文行数。 */
    linesPerPage?: number
}

/**
 * 宿主可按区域覆盖的文档样式配置。所有对象都按字段与 preset 深度合并，未填写项继续
 * 使用预设值。此配置描述编辑视图的默认版式，不替代 Tiptap JSON 中用户显式设置的格式。
 */
export interface DocumentStyleOptions {
    /** 作为所有局部覆盖的基准预设，未提供时使用 web。 */
    preset?: DocumentStylePreset
    /** 面向 CSS 的样式标识，用于从内置预设派生的产品样式。 */
    styleName?: string
    body?: DocumentTextStyle
    paragraph?: DocumentParagraphStyle
    headings?: Partial<Record<DocumentHeadingLevel, DocumentHeadingStyle>>
    documentTitle?: DocumentTitleStyle
    link?: DocumentLinkStyle
    list?: DocumentListStyle
    blockquote?: DocumentBlockquoteStyle
    rule?: DocumentRuleStyle
    table?: DocumentTableStyle
    media?: DocumentMediaStyle
    pageChrome?: DocumentPageChromeStyle
    page?: DocumentPageStyle
    /** 由页面渲染器按正文区域宽高计算字符间距和行距。 */
    grid?: false | DocumentGridOptions
}

/** 既可直接选择预设，也可基于预设做局部覆盖。 */
export type DocumentStyleConfig = DocumentStylePreset | DocumentStyleOptions

/**
 * 完成默认值合并并深度冻结后的运行时样式。它可安全共享给页面渲染器、静态 HTML 和 SDK
 * 调用层读取，但不能再直接作为可变配置修改；需要派生时应使用 extendDocumentStyle。
 */
export interface ResolvedDocumentStyle {
    readonly preset: DocumentStylePreset
    readonly styleName: string
    readonly body: Required<DocumentTextStyle>
    readonly paragraph: Required<DocumentParagraphStyle>
    readonly headings: Readonly<Record<DocumentHeadingLevel, Readonly<Required<DocumentHeadingStyle>>>>
    readonly documentTitle: Readonly<Required<DocumentTitleStyle>>
    readonly link: Readonly<Required<DocumentLinkStyle>>
    readonly list: Readonly<Required<DocumentListStyle>>
    readonly blockquote: Readonly<Required<DocumentBlockquoteStyle>>
    readonly rule: Readonly<Required<DocumentRuleStyle>>
    readonly table: Readonly<Required<DocumentTableStyle>>
    readonly media: Readonly<Required<DocumentMediaStyle>>
    readonly pageChrome: Readonly<Required<DocumentPageChromeStyle>>
    readonly page: Readonly<{
        format: Readonly<DocumentPageFormat>
        headerTopMargin: DocumentLength
        footerBottomMargin: DocumentLength
        paperColor: string
        header: DocumentPageHeaderFooter
        footer: DocumentPageHeaderFooter
        pageNumbers: boolean | Readonly<DocumentPageNumberOptions>
    }>
    readonly grid: false | Readonly<Required<DocumentGridOptions>>
}

const HEADING_LEVELS: readonly DocumentHeadingLevel[] = [1, 2, 3, 4, 5, 6]

/** 用统一默认值创建标题级别，减少四套预设中的重复配置。 */
function heading(
    fontSize: string,
    marginTop: string,
    marginBottom: string,
    overrides: Partial<Required<DocumentHeadingStyle>> = {},
): Required<DocumentHeadingStyle> {
    return {
        fontFamily: "'Newsreader', Georgia, serif",
        fontSize,
        fontWeight: 600,
        lineHeight: 1.18,
        letterSpacing: 'normal',
        color: 'var(--aieditor-heading-ink)',
        backgroundColor: 'transparent',
        marginTop,
        marginBottom,
        textTransform: 'none',
        breakAfter: 'auto',
        textAlign: 'start',
        textIndent: '0',
        ...overrides,
    }
}

function documentTitle(
    style: Required<DocumentHeadingStyle>,
    overrides: Partial<Required<DocumentTitleStyle>> = {},
): Required<DocumentTitleStyle> {
    return {
        ...style,
        textAlign: 'center',
        textIndent: '0',
        ...overrides,
    }
}

const A4_PAGE = {
    id: 'A4', width: '210mm', height: '297mm',
    margins: {top: '25mm', right: '20mm', bottom: '25mm', left: '20mm'},
} as const
const WEB_EXTRAS = {
    link: {color: 'var(--aieditor-danger)', textDecoration: 'underline', textUnderlineOffset: '3px'},
    list: {marginTop: '14px', marginBottom: '22px', paddingLeft: '28px', itemMarginTop: '4px', itemMarginBottom: '4px'},
    blockquote: {
        marginTop: '28px',
        marginBottom: '28px',
        padding: '2px 0 2px 22px',
        borderLeft: '3px solid var(--aieditor-accent)',
        color: 'var(--aieditor-subtle-ink)',
        fontStyle: 'italic'
    },
    rule: {marginTop: '38px', marginBottom: '38px', borderTop: '1px solid var(--aieditor-line)'},
    table: {
        wrapperMargin: '28px 0 28px -16px',
        wrapperPadding: '16px 0 16px 16px',
        tableMargin: '28px 0',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontSize: '14px',
        lineHeight: 1.5,
        cellPadding: '10px 12px',
        borderColor: 'var(--aieditor-control-line)',
        headerBackground: 'var(--aieditor-surface)',
        headerColor: 'var(--aieditor-ink)',
        headerFontWeight: 600,
        cellParagraphTextAlign: 'left'
    },
    media: {blockMarginTop: '28px', blockMarginBottom: '28px', blockBorderRadius: '5px', inlineBorderRadius: '3px'},
    pageChrome: {
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: '12px',
        lineHeight: '18px',
        color: 'var(--aieditor-muted)'
    },
    page: {
        format: A4_PAGE,
        headerTopMargin: '12.5mm',
        footerBottomMargin: '12.5mm',
        paperColor: 'var(--aieditor-paper)',
        header: '',
        footer: '',
        pageNumbers: false
    },
} as const

function officeExtras(
    page: DocumentPageFormat,
    bodyFont: string,
    fontSize: string,
    lineHeight: string | number,
    spacing = '8pt',
    headerTopMargin: DocumentLength = '12.7mm',
    footerBottomMargin: DocumentLength = '12.7mm',
) {
    return {
        link: {color: 'var(--aieditor-word-link)', textDecoration: 'underline', textUnderlineOffset: 'auto'},
        list: {marginTop: '0', marginBottom: spacing, paddingLeft: '36pt', itemMarginTop: '0', itemMarginBottom: '0'},
        blockquote: {
            marginTop: '0',
            marginBottom: spacing,
            padding: '0 0 0 36pt',
            borderLeft: '0 solid transparent',
            color: 'var(--aieditor-document-color)',
            fontStyle: 'normal'
        },
        rule: {marginTop: '8pt', marginBottom: '8pt', borderTop: '1px solid var(--aieditor-word-rule)'},
        table: {
            // 16px 交互边缘容纳表格 Grip；等量负外边距保证正文表格位置和文档流高度不变。
            wrapperMargin: `-16px 0 ${spacing} -16px`,
            wrapperPadding: '16px 0 0 16px',
            tableMargin: `0 0 ${spacing}`,
            fontFamily: bodyFont,
            fontSize: 'var(--aieditor-document-font-size)',
            lineHeight: 'var(--aieditor-document-line-height)',
            cellPadding: '5pt 6pt',
            borderColor: 'var(--aieditor-word-table-line)',
            headerBackground: 'transparent',
            headerColor: 'var(--aieditor-document-color)',
            headerFontWeight: 700,
            cellParagraphTextAlign: 'left'
        },
        media: {blockMarginTop: '0', blockMarginBottom: spacing, blockBorderRadius: '0', inlineBorderRadius: '0'},
        pageChrome: {fontFamily: bodyFont, fontSize, lineHeight, color: 'var(--aieditor-muted)'},
        page: {
            format: page,
            headerTopMargin,
            footerBottomMargin,
            paperColor: 'var(--aieditor-paper)',
            header: '',
            footer: '',
            pageNumbers: false
        },
    }
}

const WEB_STYLE: ResolvedDocumentStyle = {
    preset: 'web',
    styleName: 'web',
    body: {
        fontFamily: "'Newsreader', Georgia, serif",
        fontSize: '19px',
        fontWeight: 400,
        lineHeight: 1.72,
        letterSpacing: 'normal',
        color: 'var(--aieditor-content-ink)',
        backgroundColor: 'var(--aieditor-paper)',
    },
    paragraph: {marginTop: '0', marginBottom: '18px', textIndent: '0', textAlign: 'start', textJustify: 'auto'},
    headings: {
        1: heading('42px', '0', '28px'),
        2: heading('27px', '44px', '14px'),
        3: heading('22px', '34px', '10px'),
        4: heading('19px', '30px', '9px'),
        5: heading('17px', '26px', '8px'),
        6: heading('15px', '24px', '8px', {
            color: 'var(--aieditor-muted)',
            textTransform: 'uppercase',
        }),
    },
    documentTitle: documentTitle(heading('42px', '0', '28px')),
    ...WEB_EXTRAS,
    grid: false,
}

const WORD_BODY_FONT = 'Aptos, Calibri, DengXian, "Microsoft YaHei", "PingFang SC", sans-serif'
const WORD_HEADING_FONT = '"Aptos Display", Aptos, "Calibri Light", "DengXian Light", DengXian, "Microsoft YaHei", "PingFang SC", sans-serif'
const WORD_STYLE: ResolvedDocumentStyle = {
    preset: 'word',
    styleName: 'word',
    body: {
        fontFamily: WORD_BODY_FONT,
        fontSize: '11pt',
        fontWeight: 400,
        lineHeight: 1.08,
        letterSpacing: '0pt',
        color: 'var(--aieditor-content-ink)',
        backgroundColor: 'var(--aieditor-paper)',
    },
    paragraph: {marginTop: '0', marginBottom: '8pt', textIndent: '0', textAlign: 'start', textJustify: 'auto'},
    headings: {
        1: heading('20pt', '12pt', '0', {
            fontFamily: WORD_HEADING_FONT,
            fontWeight: 300,
            lineHeight: 1.08,
            color: 'var(--aieditor-word-heading-ink)',
            breakAfter: 'avoid'
        }),
        2: heading('16pt', '10pt', '0', {
            fontFamily: WORD_HEADING_FONT,
            fontWeight: 300,
            lineHeight: 1.08,
            color: 'var(--aieditor-word-heading-ink)',
            breakAfter: 'avoid'
        }),
        3: heading('14pt', '8pt', '0', {
            fontFamily: WORD_HEADING_FONT,
            fontWeight: 400,
            lineHeight: 1.08,
            color: 'var(--aieditor-word-heading-ink)',
            breakAfter: 'avoid'
        }),
        4: heading('12pt', '8pt', '0', {
            fontFamily: WORD_BODY_FONT,
            fontWeight: 400,
            lineHeight: 1.08,
            color: 'var(--aieditor-word-heading-ink)',
            breakAfter: 'avoid'
        }),
        5: heading('11pt', '8pt', '0', {
            fontFamily: WORD_BODY_FONT,
            fontWeight: 400,
            lineHeight: 1.08,
            color: 'var(--aieditor-word-heading-ink)',
            breakAfter: 'avoid'
        }),
        6: heading('11pt', '8pt', '0', {
            fontFamily: WORD_BODY_FONT,
            fontWeight: 400,
            lineHeight: 1.08,
            color: 'var(--aieditor-word-heading-ink)',
            breakAfter: 'avoid'
        }),
    },
    documentTitle: documentTitle(heading('20pt', '12pt', '8pt', {
        fontFamily: WORD_HEADING_FONT,
        fontWeight: 300,
        lineHeight: 1.08,
        color: 'var(--aieditor-word-heading-ink)',
        breakAfter: 'avoid'
    })),
    ...officeExtras({
        id: 'word-a4',
        width: '210mm',
        height: '297mm',
        margins: {top: '25.4mm', right: '25.4mm', bottom: '25.4mm', left: '25.4mm'}
    }, WORD_BODY_FONT, '9pt', 1.08),
    grid: false,
}

const WPS_BODY_FONT = 'Calibri, SimSun, "Songti SC", serif'
const WPS_HEADING_FONT = '"Microsoft YaHei", SimHei, "Heiti SC", "PingFang SC", sans-serif'
const WPS_EXTRAS = officeExtras(
    {
        id: 'wps-12-zh-cn-a4',
        width: '210mm',
        height: '297mm',
        margins: {top: '25.4mm', right: '31.75mm', bottom: '25.4mm', left: '31.75mm'}
    },
    WPS_BODY_FONT,
    '10.5pt',
    '15.6pt',
    '0',
    '15mm',
    '17.5mm',
)
const WPS_STYLE: ResolvedDocumentStyle = {
    preset: 'wps',
    styleName: 'wps',
    body: {
        fontFamily: WPS_BODY_FONT,
        fontSize: '10.5pt',
        fontWeight: 400,
        lineHeight: '15.6pt',
        letterSpacing: '0pt',
        color: 'var(--aieditor-content-ink)',
        backgroundColor: 'var(--aieditor-paper)',
    },
    paragraph: {
        marginTop: '0',
        marginBottom: '0',
        textIndent: '0',
        textAlign: 'justify',
        textJustify: 'inter-ideograph'
    },
    headings: {
        1: heading('18pt', '5pt', '2.5pt', {
            fontFamily: WPS_HEADING_FONT,
            fontWeight: 700,
            lineHeight: 1.2,
            breakAfter: 'avoid'
        }),
        2: heading('16pt', '5pt', '2.5pt', {
            fontFamily: WPS_HEADING_FONT,
            fontWeight: 700,
            lineHeight: 1.2,
            breakAfter: 'avoid'
        }),
        3: heading('15pt', '5pt', '2.5pt', {
            fontFamily: WPS_HEADING_FONT,
            fontWeight: 700,
            lineHeight: 1.2,
            breakAfter: 'avoid'
        }),
        4: heading('14pt', '5pt', '2.5pt', {
            fontFamily: WPS_HEADING_FONT,
            fontWeight: 700,
            lineHeight: 1.2,
            breakAfter: 'avoid'
        }),
        5: heading('12pt', '5pt', '2.5pt', {
            fontFamily: WPS_HEADING_FONT,
            fontWeight: 700,
            lineHeight: 1.2,
            breakAfter: 'avoid'
        }),
        6: heading('12pt', '5pt', '2.5pt', {
            fontFamily: WPS_HEADING_FONT,
            fontWeight: 700,
            lineHeight: 1.2,
            breakAfter: 'avoid'
        }),
    },
    documentTitle: documentTitle(heading('18pt', '5pt', '2.5pt', {
        fontFamily: WPS_HEADING_FONT,
        fontWeight: 700,
        lineHeight: 1.2,
        breakAfter: 'avoid'
    })),
    ...WPS_EXTRAS,
    list: {marginTop: '0', marginBottom: '0', paddingLeft: '21pt', itemMarginTop: '0', itemMarginBottom: '0'},
    blockquote: {
        marginTop: '0',
        marginBottom: '0',
        padding: '0 0 0 21pt',
        borderLeft: '0 solid transparent',
        color: 'var(--aieditor-document-color)',
        fontStyle: 'normal'
    },
    table: {...WPS_EXTRAS.table, cellPadding: '0 5.4pt'},
    grid: false,
}

export const DOCUMENT_STYLE_PRESETS: Readonly<Record<DocumentStylePreset, ResolvedDocumentStyle>> = Object.freeze({
    web: freezeResolved(WEB_STYLE),
    word: freezeResolved(WORD_STYLE),
    wps: freezeResolved(WPS_STYLE),
})

/** 校验网格参数，避免除零或负行高进入 CSS calc。 */
function positiveInteger(value: number | undefined, fallback: number, name: string): number {
    if (value === undefined) return fallback
    if (!Number.isInteger(value) || value <= 0) throw new Error(`Document style ${name} must be a positive integer`)
    return value
}

/** 深度冻结所有嵌套配置，防止多个编辑器实例互相污染预设。 */
function freezeResolved(style: ResolvedDocumentStyle): ResolvedDocumentStyle {
    const headings = Object.fromEntries(HEADING_LEVELS.map((level) => [level, Object.freeze({...style.headings[level]})])) as unknown as ResolvedDocumentStyle['headings']
    return Object.freeze({
        ...style,
        body: Object.freeze({...style.body}),
        paragraph: Object.freeze({...style.paragraph}),
        headings: Object.freeze(headings),
        documentTitle: Object.freeze({...style.documentTitle}),
        link: Object.freeze({...style.link}),
        list: Object.freeze({...style.list}),
        blockquote: Object.freeze({...style.blockquote}),
        rule: Object.freeze({...style.rule}),
        table: Object.freeze({...style.table}),
        media: Object.freeze({...style.media}),
        pageChrome: Object.freeze({...style.pageChrome}),
        page: Object.freeze({
            ...style.page,
            format: Object.freeze({...style.page.format, margins: Object.freeze({...style.page.format.margins})}),
            pageNumbers: typeof style.page.pageNumbers === 'object'
                ? Object.freeze({
                    ...style.page.pageNumbers,
                    hiddenPages: style.page.pageNumbers.hiddenPages
                        ? Object.freeze([...style.page.pageNumbers.hiddenPages])
                        : undefined,
                })
                : style.page.pageNumbers,
        }),
        grid: style.grid === false ? false : Object.freeze({...style.grid}),
    })
}

/** 在保留基准页边距的前提下解析内置纸张或局部自定义规格。 */
function resolvePageFormat(base: Readonly<DocumentPageFormat>, value?: DocumentPageFormatName | DocumentPageFormatOptions): DocumentPageFormat {
    if (typeof value === 'string') return {...DOCUMENT_PAGE_FORMATS[value], margins: {...DOCUMENT_PAGE_FORMATS[value].margins}}
    return {
        id: value?.id ?? base.id,
        width: value?.width ?? base.width,
        height: value?.height ?? base.height,
        margins: {...base.margins, ...value?.margins},
    }
}

/** 合并页码配置，尤其保留未显式覆盖的隐藏页列表。 */
function resolvePageNumbers(
    base: ResolvedDocumentStyle['page']['pageNumbers'],
    value?: DocumentPageStyle['pageNumbers'],
): ResolvedDocumentStyle['page']['pageNumbers'] {
    if (value === undefined) return base
    if (typeof base === 'object' && typeof value === 'object') {
        return {
            ...base,
            ...value,
            hiddenPages: value.hiddenPages ?? base.hiddenPages,
        }
    }
    return value
}

/**
 * 把预设名称或局部配置解析为完整、不可变的运行时文档样式。
 * 合并以字段为粒度，尤其不会因为只覆盖一个标题级别而删除其他五级标题。
 */
export function resolveDocumentStyle(config: DocumentStyleConfig = 'web'): ResolvedDocumentStyle {
    const value = typeof config === 'string' ? {preset: config} : config
    const preset = value.preset ?? 'web'
    const base = DOCUMENT_STYLE_PRESETS[preset]
    if (!base) throw new Error(`Unsupported document style preset: "${String(preset)}"`)

    // 标题需要逐级合并，不能用一次浅合并替换整个 headings 对象。
    const headings = Object.fromEntries(HEADING_LEVELS.map((level) => [
        level,
        {...base.headings[level], ...value.headings?.[level]},
    ])) as unknown as ResolvedDocumentStyle['headings']
    // false 明确关闭网格；对象则在当前预设默认值基础上补全。
    const grid = value.grid === false
        ? false
        : value.grid
            ? {
                charactersPerLine: positiveInteger(value.grid.charactersPerLine, base.grid === false ? 42 : base.grid.charactersPerLine, 'charactersPerLine'),
                linesPerPage: positiveInteger(value.grid.linesPerPage, base.grid === false ? 36 : base.grid.linesPerPage, 'linesPerPage'),
            }
            : base.grid

    return freezeResolved({
        preset,
        styleName: value.styleName ?? base.styleName ?? preset,
        body: {...base.body, ...value.body},
        paragraph: {...base.paragraph, ...value.paragraph},
        headings,
        documentTitle: {...base.documentTitle, ...value.documentTitle},
        link: {...base.link, ...value.link},
        list: {...base.list, ...value.list},
        blockquote: {...base.blockquote, ...value.blockquote},
        rule: {...base.rule, ...value.rule},
        table: {...base.table, ...value.table},
        media: {...base.media, ...value.media},
        pageChrome: {...base.pageChrome, ...value.pageChrome},
        page: {
            format: resolvePageFormat(base.page.format, value.page?.format),
            headerTopMargin: value.page?.headerTopMargin ?? base.page.headerTopMargin,
            footerBottomMargin: value.page?.footerBottomMargin ?? base.page.footerBottomMargin,
            paperColor: value.page?.paperColor ?? base.page.paperColor,
            header: value.page?.header ?? base.page.header,
            footer: value.page?.footer ?? base.page.footer,
            pageNumbers: resolvePageNumbers(base.page.pageNumbers, value.page?.pageNumbers),
        },
        grid,
    })
}

/** 从内置预设或已有样式派生一个完整、只读的新样式，不修改基准对象。 */
export function extendDocumentStyle(
    base: DocumentStyleConfig | ResolvedDocumentStyle,
    overrides: Omit<DocumentStyleOptions, 'preset'>,
): ResolvedDocumentStyle {
    const source = resolveDocumentStyle(base)
    return resolveDocumentStyle({
        preset: source.preset,
        styleName: overrides.styleName ?? source.styleName,
        body: {...source.body, ...overrides.body},
        paragraph: {...source.paragraph, ...overrides.paragraph},
        headings: Object.fromEntries(HEADING_LEVELS.map((level) => [
            level, {...source.headings[level], ...overrides.headings?.[level]},
        ])),
        documentTitle: {...source.documentTitle, ...overrides.documentTitle},
        link: {...source.link, ...overrides.link},
        list: {...source.list, ...overrides.list},
        blockquote: {...source.blockquote, ...overrides.blockquote},
        rule: {...source.rule, ...overrides.rule},
        table: {...source.table, ...overrides.table},
        media: {...source.media, ...overrides.media},
        pageChrome: {...source.pageChrome, ...overrides.pageChrome},
        page: {
            format: resolvePageFormat(source.page.format, overrides.page?.format),
            headerTopMargin: overrides.page?.headerTopMargin ?? source.page.headerTopMargin,
            footerBottomMargin: overrides.page?.footerBottomMargin ?? source.page.footerBottomMargin,
            paperColor: overrides.page?.paperColor ?? source.page.paperColor,
            header: overrides.page?.header ?? source.page.header,
            footer: overrides.page?.footer ?? source.page.footer,
            pageNumbers: resolvePageNumbers(source.page.pageNumbers, overrides.page?.pageNumbers),
        },
        grid: overrides.grid ?? source.grid,
    })
}

export const DOCUMENT_STYLE_CSS_PROPERTIES = Object.freeze([
    '--aieditor-document-font-family',
    '--aieditor-document-font-size',
    '--aieditor-document-font-weight',
    '--aieditor-document-line-height',
    '--aieditor-document-letter-spacing',
    '--aieditor-document-color',
    '--aieditor-document-background-color',
    '--aieditor-document-paragraph-margin-top',
    '--aieditor-document-paragraph-margin-bottom',
    '--aieditor-document-paragraph-text-indent',
    '--aieditor-document-paragraph-text-align',
    '--aieditor-document-paragraph-text-justify',
    ...HEADING_LEVELS.flatMap((level) => [
        `--aieditor-document-h${level}-font-family`,
        `--aieditor-document-h${level}-font-size`,
        `--aieditor-document-h${level}-font-weight`,
        `--aieditor-document-h${level}-line-height`,
        `--aieditor-document-h${level}-letter-spacing`,
        `--aieditor-document-h${level}-color`,
        `--aieditor-document-h${level}-background-color`,
        `--aieditor-document-h${level}-margin-top`,
        `--aieditor-document-h${level}-margin-bottom`,
        `--aieditor-document-h${level}-text-transform`,
        `--aieditor-document-h${level}-break-after`,
        `--aieditor-document-h${level}-text-align`,
        `--aieditor-document-h${level}-text-indent`,
    ]),
    '--aieditor-document-title-font-family',
    '--aieditor-document-title-font-size',
    '--aieditor-document-title-font-weight',
    '--aieditor-document-title-line-height',
    '--aieditor-document-title-letter-spacing',
    '--aieditor-document-title-color',
    '--aieditor-document-title-background-color',
    '--aieditor-document-title-margin-top',
    '--aieditor-document-title-margin-bottom',
    '--aieditor-document-title-text-transform',
    '--aieditor-document-title-break-after',
    '--aieditor-document-title-text-align',
    '--aieditor-document-title-text-indent',
    '--aieditor-document-title-after-red-header-margin-top',
    '--aieditor-document-link-color',
    '--aieditor-document-link-decoration',
    '--aieditor-document-link-underline-offset',
    '--aieditor-document-list-margin-top',
    '--aieditor-document-list-margin-bottom',
    '--aieditor-document-list-padding-left',
    '--aieditor-document-list-item-margin-top',
    '--aieditor-document-list-item-margin-bottom',
    '--aieditor-document-blockquote-margin-top',
    '--aieditor-document-blockquote-margin-bottom',
    '--aieditor-document-blockquote-padding',
    '--aieditor-document-blockquote-border-left',
    '--aieditor-document-blockquote-color',
    '--aieditor-document-blockquote-font-style',
    '--aieditor-document-rule-margin-top',
    '--aieditor-document-rule-margin-bottom',
    '--aieditor-document-rule-border-top',
    '--aieditor-document-table-wrapper-margin',
    '--aieditor-document-table-wrapper-padding',
    '--aieditor-document-table-margin',
    '--aieditor-document-table-font-family',
    '--aieditor-document-table-font-size',
    '--aieditor-document-table-line-height',
    '--aieditor-document-table-cell-padding',
    '--aieditor-document-table-border-color',
    '--aieditor-document-table-header-background',
    '--aieditor-document-table-header-color',
    '--aieditor-document-table-header-font-weight',
    '--aieditor-document-table-cell-paragraph-text-align',
    '--aieditor-document-media-block-margin-top',
    '--aieditor-document-media-block-margin-bottom',
    '--aieditor-document-media-block-border-radius',
    '--aieditor-document-media-inline-border-radius',
    '--aieditor-document-page-chrome-font-family',
    '--aieditor-document-page-chrome-font-size',
    '--aieditor-document-page-chrome-line-height',
    '--aieditor-document-page-chrome-color',
    '--aieditor-document-paper-color',
    '--aieditor-document-red-header-font-family',
    '--aieditor-document-red-header-font-weight',
    '--aieditor-document-red-header-line-height',
    '--aieditor-document-red-header-color',
    '--aieditor-document-red-header-standard-font-size',
    '--aieditor-document-red-header-joint-font-size',
    '--aieditor-document-red-header-letter-font-size',
    '--aieditor-document-red-header-order-font-size',
    '--aieditor-document-red-header-minutes-font-size',
    '--aieditor-document-red-header-meta-font-family',
    '--aieditor-document-red-header-meta-font-size',
    '--aieditor-document-red-header-meta-line-height',
    '--aieditor-document-red-header-meta-margin-top',
    '--aieditor-document-red-header-flag-font-family',
    '--aieditor-document-red-header-flag-font-size',
    '--aieditor-document-red-header-flag-line-height',
    '--aieditor-document-red-header-section-margin-top',
    '--aieditor-document-red-header-section-margin-bottom',
    '--aieditor-document-red-header-section-padding-top',
    '--aieditor-document-red-header-separator-margin-top',
    '--aieditor-document-grid-letter-spacing',
    '--aieditor-document-grid-line-height',
])

function cssValue(value: string | number): string {
    return String(value)
}

/** 数字长度按像素输出，带单位字符串保持原样。 */
function cssLength(value: DocumentLength): string {
    return typeof value === 'number' ? `${value}px` : value
}

/**
 * 将解析后的文档样式写入当前编辑器实例，不修改 Tiptap 文档内容。
 * 实现只设置实例 root 上的 data 属性和 CSS 变量，因此同页多个编辑器可以使用不同预设；
 * 用户显式格式仍由节点属性/mark 保存，序列化后可交给 Java DOCX SDK 转换。
 */
export function applyDocumentStyle(root: HTMLElement, config: DocumentStyleConfig = 'web'): ResolvedDocumentStyle {
    const style = resolveDocumentStyle(config)
    root.dataset.documentStyle = style.styleName
    root.dataset.documentGrid = String(style.grid !== false)
    const variables: Record<string, string> = {
        '--aieditor-document-font-family': style.body.fontFamily,
        '--aieditor-document-font-size': style.body.fontSize,
        '--aieditor-document-font-weight': cssValue(style.body.fontWeight),
        '--aieditor-document-line-height': cssValue(style.body.lineHeight),
        '--aieditor-document-letter-spacing': style.body.letterSpacing,
        '--aieditor-document-color': style.body.color,
        '--aieditor-document-background-color': style.body.backgroundColor,
        '--aieditor-document-paragraph-margin-top': style.paragraph.marginTop,
        '--aieditor-document-paragraph-margin-bottom': style.paragraph.marginBottom,
        '--aieditor-document-paragraph-text-indent': style.paragraph.textIndent,
        '--aieditor-document-paragraph-text-align': style.paragraph.textAlign,
        '--aieditor-document-paragraph-text-justify': style.paragraph.textJustify,
        '--aieditor-document-link-color': style.link.color,
        '--aieditor-document-link-decoration': style.link.textDecoration,
        '--aieditor-document-link-underline-offset': style.link.textUnderlineOffset,
        '--aieditor-document-list-margin-top': style.list.marginTop,
        '--aieditor-document-list-margin-bottom': style.list.marginBottom,
        '--aieditor-document-list-padding-left': style.list.paddingLeft,
        '--aieditor-document-list-item-margin-top': style.list.itemMarginTop,
        '--aieditor-document-list-item-margin-bottom': style.list.itemMarginBottom,
        '--aieditor-document-blockquote-margin-top': style.blockquote.marginTop,
        '--aieditor-document-blockquote-margin-bottom': style.blockquote.marginBottom,
        '--aieditor-document-blockquote-padding': style.blockquote.padding,
        '--aieditor-document-blockquote-border-left': style.blockquote.borderLeft,
        '--aieditor-document-blockquote-color': style.blockquote.color,
        '--aieditor-document-blockquote-font-style': style.blockquote.fontStyle,
        '--aieditor-document-rule-margin-top': style.rule.marginTop,
        '--aieditor-document-rule-margin-bottom': style.rule.marginBottom,
        '--aieditor-document-rule-border-top': style.rule.borderTop,
        '--aieditor-document-table-wrapper-margin': style.table.wrapperMargin,
        '--aieditor-document-table-wrapper-padding': style.table.wrapperPadding,
        '--aieditor-document-table-margin': style.table.tableMargin,
        '--aieditor-document-table-font-family': style.table.fontFamily,
        '--aieditor-document-table-font-size': style.table.fontSize,
        '--aieditor-document-table-line-height': cssValue(style.table.lineHeight),
        '--aieditor-document-table-cell-padding': style.table.cellPadding,
        '--aieditor-document-table-border-color': style.table.borderColor,
        '--aieditor-document-table-header-background': style.table.headerBackground,
        '--aieditor-document-table-header-color': style.table.headerColor,
        '--aieditor-document-table-header-font-weight': cssValue(style.table.headerFontWeight),
        '--aieditor-document-table-cell-paragraph-text-align': style.table.cellParagraphTextAlign,
        '--aieditor-document-media-block-margin-top': style.media.blockMarginTop,
        '--aieditor-document-media-block-margin-bottom': style.media.blockMarginBottom,
        '--aieditor-document-media-block-border-radius': style.media.blockBorderRadius,
        '--aieditor-document-media-inline-border-radius': style.media.inlineBorderRadius,
        '--aieditor-document-page-chrome-font-family': style.pageChrome.fontFamily,
        '--aieditor-document-page-chrome-font-size': style.pageChrome.fontSize,
        '--aieditor-document-page-chrome-line-height': cssValue(style.pageChrome.lineHeight),
        '--aieditor-document-page-chrome-color': style.pageChrome.color,
        '--aieditor-document-paper-color': style.page.paperColor,
    }

    // 每个标题级别映射到独立变量，CSS 无需感知配置对象结构。
    for (const level of HEADING_LEVELS) {
        const current = style.headings[level]
        const prefix = `--aieditor-document-h${level}`
        variables[`${prefix}-font-family`] = current.fontFamily
        variables[`${prefix}-font-size`] = current.fontSize
        variables[`${prefix}-font-weight`] = cssValue(current.fontWeight)
        variables[`${prefix}-line-height`] = cssValue(current.lineHeight)
        variables[`${prefix}-letter-spacing`] = current.letterSpacing
        variables[`${prefix}-color`] = current.color
        variables[`${prefix}-background-color`] = current.backgroundColor
        variables[`${prefix}-margin-top`] = current.marginTop
        variables[`${prefix}-margin-bottom`] = current.marginBottom
        variables[`${prefix}-text-transform`] = current.textTransform
        variables[`${prefix}-break-after`] = current.breakAfter
        variables[`${prefix}-text-align`] = current.textAlign
        variables[`${prefix}-text-indent`] = current.textIndent
    }

    const title = style.documentTitle
    variables['--aieditor-document-title-font-family'] = title.fontFamily
    variables['--aieditor-document-title-font-size'] = title.fontSize
    variables['--aieditor-document-title-font-weight'] = cssValue(title.fontWeight)
    variables['--aieditor-document-title-line-height'] = cssValue(title.lineHeight)
    variables['--aieditor-document-title-letter-spacing'] = title.letterSpacing
    variables['--aieditor-document-title-color'] = title.color
    variables['--aieditor-document-title-background-color'] = title.backgroundColor
    variables['--aieditor-document-title-margin-top'] = title.marginTop
    variables['--aieditor-document-title-margin-bottom'] = title.marginBottom
    variables['--aieditor-document-title-text-transform'] = title.textTransform
    variables['--aieditor-document-title-break-after'] = title.breakAfter
    variables['--aieditor-document-title-text-align'] = title.textAlign
    variables['--aieditor-document-title-text-indent'] = title.textIndent

    if (style.grid) {
        // 版心宽高扣除页边距后，按目标字符数和行数反推出精确网格。
        const {width, height, margins} = style.page.format
        variables['--aieditor-document-grid-letter-spacing'] = `calc((${cssLength(width)} - ${cssLength(margins.left)} - ${cssLength(margins.right)}) / ${style.grid.charactersPerLine} - 1em)`
        variables['--aieditor-document-grid-line-height'] = `calc((${cssLength(height)} - ${cssLength(margins.top)} - ${cssLength(margins.bottom)}) / ${style.grid.linesPerPage})`
    }

    // 同时清理新配置不再提供的变量，避免切换预设后残留旧值。
    for (const property of DOCUMENT_STYLE_CSS_PROPERTIES) {
        const css = variables[property]
        if (css === undefined) root.style.removeProperty(property)
        else root.style.setProperty(property, css)
    }
    return style
}

/** 给离屏静态 HTML 渲染容器复制实例级文档样式。 */
export function copyDocumentStyle(source: HTMLElement, target: HTMLElement): void {
    target.dataset.documentStyle = source.dataset.documentStyle ?? 'web'
    target.dataset.documentGrid = source.dataset.documentGrid ?? 'false'
    for (const property of DOCUMENT_STYLE_CSS_PROPERTIES) {
        const value = source.style.getPropertyValue(property)
        if (value) target.style.setProperty(property, value)
    }
}
