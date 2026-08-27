import type {Editor, EditorEvents, Extensions, JSONContent} from '@tiptap/core'
import type {AiService, AiServiceConfig} from '../ai'
import type {AiEditorExtensionManager} from './runtime/AiEditorExtensionManager'
import type {TextIndentOptions} from '../extensions'
import type {MentionQuery} from '../extensions'
import type {UniqueIDOptions} from '../extensions'
import type {UndoRedoOptions} from '../extensions'
import type {CodeBlockConfig} from '../extensions'
import type {TableOfContentsOptions} from '../extensions'
import type {MathematicsOptions} from '../extensions'
import type {AiEditorLocale, AiEditorTranslations} from '../i18n'
import type {Uploader, UploaderOptions} from '../uploader'
import type {AiEditorTheme} from './AiEditorTheme'
import type {DocumentStyleConfig} from './AiEditorDocumentStyle'
import type {AiEditorTemplateFactory} from './AiEditorTemplate'
import type {
    EmojiMenuItemOptions,
    FontFamilyOption,
    FontSizeOption,
    HighlightBlockMenuOptions,
    LineHeightOption,
    LetterSpacingSetting,
    LinkMenuItemOptions,
    TextAlignmentOption,
    TextAlignMenuOptions,
    TextColorPaletteSetting,
} from '../menus'
import type {
    AiSidebarItemOptions,
    BlockDragMenuOptions,
    SidebarOptions,
    TextBubbleMenuOptions,
    ToolbarOptions,
} from '../features'
import type {AiEditorProductBubbleMenu, AiEditorProductExtensions, AiEditorProductSurface} from './AiEditorProduct'
import type {MenuItem} from '../menus/core'

export interface ContentSanitizationOptions {
    /** 发生过滤或节点展开时是否输出汇总 console 警告；默认为 true。 */
    warn?: boolean
}

export interface AiEditorOptions {
    element: string | HTMLElement
    /** 自定义 root、工具栏、编辑区、footer 及业务区域的 DOM 布局。 */
    template?: AiEditorTemplateFactory
    ai?: AiService | AiServiceConfig
    bubbleMenu?: false | TextBubbleMenuOptions
    /** AI Sidebar Item 配置；false 表示移除内置 AI 能力。 */
    aiChat?: false | Omit<AiSidebarItemOptions, 'generate' | 'isConfigured' | 'applyToolProposal'>
    /** 通用 Sidebar 布局及额外能力项配置。 */
    sidebar?: SidebarOptions
    /** 初始内容；null 表示不注入本地内容，供协作 Provider 从共享文档完成首轮渲染。 */
    content?: string | JSONContent | null
    /** 是否允许用户编辑；默认为 true，可通过 setEditable() 动态切换。 */
    editable?: boolean
    /** 编辑器视觉主题，默认为 light，可通过 setTheme() 动态切换。 */
    theme?: AiEditorTheme
    /**
     * 完整文档排版预设或局部覆盖，包含正文、块元素、媒体和页面格式；默认使用 web。
     * 该配置决定未显式格式化内容的编辑视图，用户操作产生的 lineHeight、indent、textStyle、
     * colwidth 等属性仍保存在 Tiptap JSON 中，可由 AIEditor DOCX SDK 原样导入导出。
     */
    documentStyle?: DocumentStyleConfig
    /** 是否以浏览器页面内全屏模式启动；不会触发系统级全屏。 */
    fullscreen?: boolean
    placeholder?: string
    locale?: AiEditorLocale
    /** 注册新语言或覆盖内置语言文案；未配置的键回退到英文源文案。 */
    translations?: AiEditorTranslations
    link?: LinkMenuItemOptions
    uploader?: false | Uploader | UploaderOptions
    fontFamilies?: false | FontFamilyOption[]
    fontSizes?: false | FontSizeOption[]
    letterSpacings?: false | LetterSpacingSetting
    lineHeights?: false | LineHeightOption[]
    textAlignments?: false | TextAlignmentOption[] | TextAlignMenuOptions
    fontColors?: false | TextColorPaletteSetting
    backgroundColors?: false | TextColorPaletteSetting
    highlightColors?: false | TextColorPaletteSetting
    highlightBlock?: false | HighlightBlockMenuOptions
    emoji?: false | EmojiMenuItemOptions
    /** 输入 @ 后查询提及候选项，支持同步数组或 Promise。 */
    onMentionQuery?: MentionQuery
    indentation?: false | Partial<TextIndentOptions>
    /** 代码块语言菜单、默认语言及 Tab 缩进配置。 */
    codeBlock?: CodeBlockConfig
    /** Tiptap 文档目录插件配置；默认启用，false 可关闭并让目录 API 回退到文档扫描。 */
    tableOfContents?: false | TableOfContentsOptions
    /** 块级节点唯一 ID；默认开启，false 关闭，也可覆盖节点类型、属性名和生成策略。 */
    uniqueId?: false | Partial<UniqueIDOptions>
    /** 本地撤销历史；实时协作模式应关闭并使用协作扩展提供的 Yjs UndoManager。 */
    undoRedo?: false | Partial<UndoRedoOptions>
    mathematics?: Partial<MathematicsOptions>
    /** 块拖拽菜单；支持块顺序调整和默认/自定义快速插入项。 */
    blockDragMenu?: false | BlockDragMenuOptions
    /** 产品扩展；在调用方扩展之前注册，以便产品能力先完成基础装配。 */
    productExtensions?: AiEditorProductExtensions
    /** 产品工具栏菜单项；追加到默认工具栏项目之后。 */
    productToolbarItems?: readonly MenuItem[]
    /** 产品气泡菜单 Surface；由核心生命周期统一挂载、刷新和销毁。 */
    productBubbleMenus?: readonly AiEditorProductBubbleMenu[]
    /** 产品界面 Surface；挂载在编辑区周围，并随编辑器状态刷新。 */
    productSurfaces?: readonly AiEditorProductSurface[]
    extensions?: Extensions
    extensionManager?: AiEditorExtensionManager
    toolbar?: ToolbarOptions
    /** 是否在初始化时检查内容是否符合当前 schema；开启后可通过 onContentError 处理错误。 */
    enableContentCheck?: boolean
    /** 未开启内容检查时，是否仍在遇到无效内容时触发 onContentError。 */
    emitContentError?: boolean
    /**
     * 按当前运行时 schema 清洗传入的 JSON 内容；默认开启。
     * 设置为 false 可恢复 Tiptap 原始处理，设置对象可独立控制警告输出。
     */
    contentSanitization?: false | ContentSanitizationOptions
    onBeforeCreate?: (editor: Editor) => void
    onCreate?: (editor: Editor) => void
    onMount?: (editor: Editor) => void
    onUnmount?: (editor: Editor) => void
    onContentError?: (
        editor: Editor,
        error: Error,
        disableCollaboration: EditorEvents['contentError']['disableCollaboration'],
    ) => void
    onUpdate?: (editor: Editor, transaction: EditorEvents['update']['transaction']) => void
    onSelectionUpdate?: (editor: Editor, transaction: EditorEvents['selectionUpdate']['transaction']) => void
    onTransaction?: (
        editor: Editor,
        transaction: EditorEvents['transaction']['transaction'],
        appendedTransactions: EditorEvents['transaction']['appendedTransactions'],
    ) => void
    onFocus?: (editor: Editor, event: FocusEvent, transaction: EditorEvents['focus']['transaction']) => void
    onBlur?: (editor: Editor, event: FocusEvent, transaction: EditorEvents['blur']['transaction']) => void
    /** 用户通过 Ctrl+S 或 Cmd+S 请求保存时触发；编辑器会阻止浏览器默认保存行为。 */
    onSave?: (editor: Editor, event: KeyboardEvent) => void
    onDestroy?: (editor: Editor) => void
    onPaste?: (editor: Editor, event: ClipboardEvent, slice: EditorEvents['paste']['slice']) => void
    onDrop?: (
        editor: Editor,
        event: DragEvent,
        slice: EditorEvents['drop']['slice'],
        moved: boolean,
    ) => void
    onDelete?: (editor: Editor, event: Omit<EditorEvents['delete'], 'editor'>) => void
}

/** AIEditor 的可实例化配置对象，同时保持对普通对象参数的结构化类型兼容。 */
export class AiEditorOptions {
    constructor(options: AiEditorOptions) {
        Object.assign(this, options)
    }
}
