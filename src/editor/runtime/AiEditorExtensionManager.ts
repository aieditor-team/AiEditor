import type {Extensions} from '@tiptap/core'
import {Selection} from '@tiptap/extensions/selection'
import {common, createLowlight} from 'lowlight'
import {
    Blockquote,
    Bold,
    BulletList,
    Code,
    Document,
    Dropcursor,
    Gapcursor,
    HardBreak,
    Heading,
    HorizontalRule,
    Italic,
    Link,
    ListItem,
    ListKeymap,
    OrderedList,
    Paragraph,
    Strike,
    Text,
    TrailingNode,
    Underline,
    UniqueID,
    DEFAULT_UNIQUE_ID_TYPES,
    UndoRedo,
} from '../../extensions'
import type {UniqueIDOptions} from '../../extensions'
import type {UndoRedoOptions} from '../../extensions'
import {
    Audio,
    Attachment,
    BackgroundColor,
    CodeBlockLowlight,
    type CodeBlockConfig,
    Color,
    Details,
    DetailsContent,
    DetailsSummary,
    Emoji,
    FontFamily,
    FontSize,
    FormatPainter,
    Highlight,
    HighlightBlock,
    Image,
    InlineImage,
    LineHeight,
    LetterSpacing,
    Mathematics, type MathematicsOptions,
    Mention,
    createMentionSuggestion,
    Placeholder,
    TaskItem,
    TaskList,
    TableOfContents,
    type TableOfContentsOptions,
    Subscript,
    Superscript,
    TextAlign,
    TextIndent,
    TextStyle,
    Twitch,
    Video,
    Youtube,
} from '../../extensions'
import {Table, TableCell, TableHeader, TableRow} from '../../extensions/table'
import type {MentionQuery, TextIndentOptions} from '../../extensions'
import {MediaDropUpload} from '../../features/upload'
import type {Uploader} from '../../uploader'

const lowlight = createLowlight(common)

export interface AiEditorExtensionContext {
    placeholder?: string
    /** 由菜单 Surface 创建的实例化扩展。 */
    menuExtensions?: Extensions
    /** 产品扩展在调用方扩展之前注册。 */
    productExtensions?: Extensions
    /** 调用方扩展最后注册，以保留覆盖默认行为的能力。 */
    extensions?: Extensions
    /** 首行缩进扩展配置；false 仅隐藏默认菜单，扩展仍使用默认配置。 */
    indentation?: false | Partial<TextIndentOptions>
    /** 代码块语言菜单、默认语言和缩进行为。 */
    codeBlock?: CodeBlockConfig
    /** 文档目录扩展；默认启用，false 关闭，也可传入 Tiptap TableOfContents 配置。 */
    tableOfContents?: false | TableOfContentsOptions
    /** 配置后启用图片、音频、视频和附件的拖放/粘贴上传。 */
    uploader?: Uploader
    /** 输入 @ 后用于查询提及候选项。 */
    onMentionQuery?: MentionQuery
    translate?: (value: string) => string
    /** 块级节点唯一 ID；false 关闭，传入对象可覆盖默认节点类型及生成策略。 */
    uniqueId?: false | Partial<UniqueIDOptions>
    /** 本地历史记录；协作编辑器应设为 false，改由 Yjs UndoManager 管理。 */
    undoRedo?: false | Partial<UndoRedoOptions>
    /** LaTeX 输入分隔符、纯文本输出及 KaTeX 配置。 */
    mathematics?: Partial<MathematicsOptions>
}

/** 集中管理 AIEditor 的默认扩展、配置及稳定注册顺序。 */
export class AiEditorExtensionManager {
    createExtensions(context: AiEditorExtensionContext = {}): Extensions {
        return [
            Document,
            Text,
            Paragraph,
            ...(context.uniqueId === false ? [] : [UniqueID.configure({
                types: [...DEFAULT_UNIQUE_ID_TYPES],
                ...context.uniqueId,
            })]),
            Selection.configure({className: 'aieditor__selection'}),
            Blockquote,
            Bold,
            BulletList,
            Code,
            Dropcursor,
            Gapcursor,
            HardBreak,
            Heading.configure({levels: [1, 2, 3, 4, 5, 6]}),
            ...(context.tableOfContents === false ? [] : [TableOfContents.configure(context.tableOfContents ?? {})]),
            ...(context.undoRedo === false ? [] : [UndoRedo.configure(context.undoRedo ?? {})]),
            HorizontalRule,
            Italic,
            ListItem,
            ListKeymap,
            Link.configure({openOnClick: false, autolink: true, defaultProtocol: 'https'}),
            OrderedList,
            Strike,
            Underline,
            TrailingNode,
            CodeBlockLowlight.configure({
                lowlight,
                HTMLAttributes: {class: 'hljs'},
                translate: context.translate ?? ((value) => value),
                ...context.codeBlock,
            }),
            Placeholder.configure({placeholder: context.placeholder ?? 'Start writing...'}),
            Details.configure({persist: true}),
            DetailsSummary,
            DetailsContent,
            Emoji.configure({enableEmoticons: true}),
            TextStyle,
            Color,
            BackgroundColor,
            FontFamily,
            FontSize,
            LetterSpacing,
            Highlight.configure({multicolor: true}),
            HighlightBlock,
            Subscript,
            Superscript,
            FormatPainter,
            LineHeight,
            TextIndent.configure(context.indentation || {}),
            Mathematics.configure({katexOptions: {throwOnError: false}, translate: context.translate, ...context.mathematics}),
            Mention.configure({
                HTMLAttributes: {class: 'aieditor-mention'},
                ...(context.onMentionQuery ? {
                    suggestion: createMentionSuggestion(
                        context.onMentionQuery,
                        context.translate ?? ((value) => value),
                    ),
                } : {}),
            }),
            TaskList,
            TaskItem.configure({nested: true}),
            Youtube.configure({nocookie: true, HTMLAttributes: {class: 'aieditor-embed'}}),
            Twitch.configure({
                parent: window.location.hostname || 'localhost',
                HTMLAttributes: {class: 'aieditor-embed'},
            }),
            ...(context.uploader ? [MediaDropUpload.configure({
                uploader: context.uploader,
                translate: context.translate ?? ((value) => value),
            })] : []),
            Image.configure({
                inline: false,
                allowBase64: false,
                HTMLAttributes: {'data-image-type': 'block'},
            }),
            InlineImage.configure({
                inline: true,
                allowBase64: false,
                HTMLAttributes: {'data-image-type': 'inline'},
            }),
            Audio,
            Video,
            Attachment,
            Table.configure({
                resizable: true,
                cellMinWidth: 80,
                allowTableNodeSelection: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            TextAlign.configure({types: ['heading', 'paragraph']}),
            ...(context.productExtensions ?? []),
            ...(context.menuExtensions ?? []),
            ...(context.extensions ?? []),
        ]
    }
}
