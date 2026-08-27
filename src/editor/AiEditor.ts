import {Editor, type JSONContent} from '@tiptap/core'
import type {Schema} from '@tiptap/pm/model'
import {Mapping} from '@tiptap/pm/transform'
import {
    applyEditorToolProposal as applyToolProposal,
    createAiService,
    rebaseEditorToolProposal,
    type AiEditorToolApplyResult,
    type AiEditorToolProposal,
    type AiGenerateRequest,
    type AiGenerateResult,
    type AiService,
    type AiServiceConfig
} from '../ai'
import {type MenuItem, type MenuItemConfig} from '../menus/core'
import {
    LinkBubbleMenu,
    TextBubbleMenu,
} from '../features/bubble'
import {
    HighlightBlockFloatingMenu,
    ImageAlignmentFloatingMenu,
    InlineImageFloatingMenu,
    MediaAlignmentFloatingMenu,
    TableFloatingMenu,
} from '../features/floating'
import {
    createDefaultToolbarItems,
    resolveToolbarItems,
    ToolbarMenu,
    type ToolbarOverflow,
    type ToolbarStyle,
    type ToolbarSize,
} from '../features/toolbar'
import {AiSidebarItem, SidebarSurface} from '../features/sidebar'
import {AiEditorExtensionManager} from './runtime/AiEditorExtensionManager'
import type {AiEditorOptions, ContentSanitizationOptions} from './AiEditorOptions'
import {
    formatContentSanitizationWarning,
    sanitizeContentForSchema,
} from './AiEditorContentSanitizer'
import type {AiEditorProductBubbleMenu, AiEditorProductContext, AiEditorProductSurface} from './AiEditorProduct'
import {
    createDocumentOutline,
    createDocumentOutlineFromTableOfContents,
    type DocumentOutlineItem,
} from './AiEditorDocumentOutline'
import type {
    AiEditorTemplateContext,
    AiEditorTemplateFactory,
    AiEditorTemplateSlots,
} from './AiEditorTemplate'
import {
    applyDocumentStyle,
    type DocumentStyleConfig,
    type ResolvedDocumentStyle,
} from './AiEditorDocumentStyle'
import {
    assertAiEditorTheme,
    getEditorTheme,
    registerEditorTheme,
    setEditorTheme,
    type AiEditorTheme,
} from './AiEditorTheme'
import {AiEditorI18n, type AiEditorLocale} from '../i18n'
import {Uploader} from '../uploader'
import {createStyledHTML} from './StyledHTML'
import {getTextStatistics} from './AiEditorTextStatistics'
import {createBlockDragMenuPlugin} from '../features/block-drag/BlockDragMenu'

/**
 * AiEditor 的主编排类。
 * 负责创建 Tiptap、注册扩展、装配多个菜单 Surface，并把 AI 服务桥接到编辑器上下文。
 */
export class AiEditor {
    readonly editor: Editor
    readonly extensionManager: AiEditorExtensionManager
    readonly i18n: AiEditorI18n
    readonly uploader: Uploader | undefined
    private documentStyle: ResolvedDocumentStyle
    private readonly root: HTMLElement
    private readonly toolbarElement: HTMLElement
    private readonly countElement: HTMLElement | null
    private readonly templateDestroy: (() => void) | undefined
    private readonly imageAlignmentMenu: ImageAlignmentFloatingMenu
    private readonly mediaAlignmentMenu: MediaAlignmentFloatingMenu
    private readonly highlightBlockMenu: HighlightBlockFloatingMenu | undefined
    private readonly inlineImageMenu: InlineImageFloatingMenu
    private readonly tableMenu: TableFloatingMenu
    private readonly textBubbleMenu: TextBubbleMenu | undefined
    private readonly linkBubbleMenu: LinkBubbleMenu | undefined
    private readonly productBubbleMenus: readonly AiEditorProductBubbleMenu[]
    private readonly productSurfaces: readonly AiEditorProductSurface[]
    private productContext: AiEditorProductContext | undefined
    private aiService: AiService | undefined
    private toolbarMenu: ToolbarMenu | undefined
    private fullscreen = false
    private documentVersion = 0
    private tableOfContentsReady = false
    private readonly pendingToolProposals = new Set<AiEditorToolProposal>()
    private lastDocumentMapping: Mapping | undefined
    private readonly usesDefaultPlaceholder: boolean
    private readonly contentSanitization: false | ContentSanitizationOptions
    private readonly handleFullscreenKeydown = (event: KeyboardEvent): void => {
        if (event.key !== 'Escape' || !this.fullscreen) return
        const target = event.target
        if (target instanceof HTMLElement && target.closest(
            '.aieditor__dropdown-panel, .aieditor__color-panel, .aieditor__emoji-panel, .aieditor__dialog, .aieditor__ai-menu, .aieditor__ai-chat',
        )) return
        if (this.root.ownerDocument.querySelector(
            '.aieditor__dropdown-panel:not([hidden]), .aieditor__color-panel:not([hidden]), .aieditor__emoji-panel:not([hidden]), .aieditor__dialog:not([hidden]), .aieditor__ai-menu:not([hidden]), .aieditor__ai-chat:not([hidden]), .aieditor__prose.is-format-painter-active',
        )) return
        event.preventDefault()
        this.setFullscreen(false)
    }

    /** 初始化挂载节点、编辑器扩展、菜单和内容同步回调。 */
    constructor(options: AiEditorOptions) {
        const theme = options.theme ?? 'light'
        assertAiEditorTheme(theme)
        this.i18n = new AiEditorI18n(options.locale ?? 'zh-CN', options.translations)
        this.uploader = options.uploader
            ? options.uploader instanceof Uploader ? options.uploader : new Uploader(options.uploader)
            : undefined
        this.usesDefaultPlaceholder = options.placeholder === undefined
        this.contentSanitization = options.contentSanitization === false
            ? false
            : options.contentSanitization ?? {}
        const target = typeof options.element === 'string'
            ? document.querySelector<HTMLElement>(options.element)
            : options.element

        if (!target) throw new Error(`AiEditor could not find mount element: ${String(options.element)}`)

        const template = this.resolveTemplate(target, options.template)
        target.replaceChildren(template.root)

        this.root = template.root
        this.toolbarElement = template.toolbar
        this.templateDestroy = template.destroy
        this.root.lang = this.i18n.getLocale()
        this.root.dataset.editable = String(options.editable ?? true)
        this.root.dataset.theme = theme
        this.documentStyle = applyDocumentStyle(this.root, options.documentStyle)
        this.countElement = template.count ?? null
        this.imageAlignmentMenu = new ImageAlignmentFloatingMenu()
        this.mediaAlignmentMenu = new MediaAlignmentFloatingMenu()
        this.highlightBlockMenu = options.highlightBlock === false
            ? undefined
            : new HighlightBlockFloatingMenu(options.highlightBlock)
        this.inlineImageMenu = new InlineImageFloatingMenu()
        this.tableMenu = new TableFloatingMenu()
        this.extensionManager = options.extensionManager ?? new AiEditorExtensionManager()
        this.textBubbleMenu = options.bubbleMenu === false
            ? undefined
            : new TextBubbleMenu(options.bubbleMenu, {
                generate: (request) => this.generateAI(request),
                isConfigured: () => Boolean(this.aiService),
            }, options.link)
        this.linkBubbleMenu = options.bubbleMenu === false
            ? undefined
            : new LinkBubbleMenu(options.link)
        this.productBubbleMenus = options.bubbleMenu === false ? [] : options.productBubbleMenus ?? []
        this.aiService = options.ai ? createAiService(options.ai) : undefined
        const aiSidebarItem = options.aiChat === false ? undefined : new AiSidebarItem({
            ...options.aiChat,
            generate: (request) => this.generateAI(request),
            isConfigured: () => Boolean(this.aiService),
            applyToolProposal: (proposal) => this.applyToolProposal(proposal),
        })
        const sidebarItems = [
            ...(aiSidebarItem ? [aiSidebarItem] : []),
            ...(options.sidebar?.items ?? []),
        ]
        const sidebar = sidebarItems.length ? new SidebarSurface({
            ...options.sidebar,
            items: sidebarItems,
        }) : undefined
        this.productSurfaces = [
            ...(sidebar ? [sidebar] : []),
            ...(options.productSurfaces ?? []),
        ]
        const tableOfContentsOnUpdate = options.tableOfContents === false
            ? undefined
            : options.tableOfContents?.onUpdate

        const initialContent = options.content === undefined ? '<p></p>' : options.content

        this.editor = new Editor({
            element: template.content,
            editable: options.editable ?? true,
            extensions: this.extensionManager.createExtensions({
                placeholder: options.placeholder ?? this.i18n.t('Start writing...'),
                menuExtensions: [
                    ...(this.textBubbleMenu ? [this.textBubbleMenu.extension] : []),
                    ...(this.linkBubbleMenu ? [this.linkBubbleMenu.extension] : []),
                    ...this.productBubbleMenus.map((menu) => menu.extension),
                    this.imageAlignmentMenu.extension,
                    this.mediaAlignmentMenu.extension,
                    this.inlineImageMenu.extension,
                    this.tableMenu.extension,
                ],
                extensions: options.extensions,
                productExtensions: options.productExtensions,
                indentation: options.indentation,
                codeBlock: options.codeBlock,
                tableOfContents: options.tableOfContents === false ? false : {
                    ...options.tableOfContents,
                    onUpdate: (data, isCreate) => {
                        this.tableOfContentsReady = true
                        tableOfContentsOnUpdate?.(data, isCreate)
                    },
                },
                uploader: this.uploader,
                onMentionQuery: options.onMentionQuery,
                translate: (value) => this.i18n.t(value),
                uniqueId: options.uniqueId,
                undoRedo: options.undoRedo,
                mathematics: options.mathematics,
            }),
            content: initialContent,
            editorProps: {
                attributes: {
                    class: 'aieditor__prose',
                    'aria-label': this.i18n.t('Rich text editor'),
                    'aria-readonly': String(options.editable === false),
                },
                handleKeyDown: (_view, event) => {
                    if (event.key.toLowerCase() === 's' && (event.ctrlKey || event.metaKey) && !event.altKey) {
                        event.preventDefault()
                        options.onSave?.(this.editor, event)
                        return true
                    }
                    if (event.key !== 'Tab') return false

                    // 代码块、列表和表格各自拥有 Tab 快捷键；交给对应扩展处理，避免覆盖缩进或单元格导航。
                    const hasContextualTabBehavior = this.editor.isActive('codeBlock')
                        || this.editor.isActive('listItem')
                        || this.editor.isActive('taskItem')
                        || this.editor.isActive('tableCell')
                        || this.editor.isActive('tableHeader')
                    if (hasContextualTabBehavior) return false

                    // 普通正文沿用 Word/WPS 的行为插入制表符，不执行浏览器的焦点切换。
                    event.preventDefault()
                    this.editor.view.dispatch(this.editor.state.tr.insertText('\t'))
                    return true
                },
            },
            enableContentCheck: options.enableContentCheck ?? false,
            emitContentError: options.emitContentError ?? false,
            onBeforeCreate: ({editor}) => {
                // 此时正式 schema 已创建、文档尚未解析。直接更新待解析内容可以覆盖初始化
                // JSON，又不会为了预计算 schema 而重复初始化产品扩展和 ProseMirror 插件。
                if (editor.options.content && typeof editor.options.content !== 'string') {
                    editor.options.content = this.sanitizeContent(
                        editor.options.content as JSONContent,
                        editor.schema,
                    )
                }
                options.onBeforeCreate?.(editor)
            },
            onCreate: ({editor}) => {
                this.refreshUI()
                options.onCreate?.(editor)
            },
            onMount: ({editor}) => options.onMount?.(editor),
            onUnmount: ({editor}) => options.onUnmount?.(editor),
            ...(options.onContentError ? {
                onContentError: ({editor, error, disableCollaboration}) => {
                    options.onContentError?.(editor, error, disableCollaboration)
                },
            } : {}),
            onSelectionUpdate: ({editor, transaction}) => {
                this.refreshUI()
                options.onSelectionUpdate?.(editor, transaction)
            },
            onTransaction: ({editor, transaction, appendedTransactions}) => {
                // 版本只在文档真正变化时递增；纯选区变化不应使 AI 提案失效。
                const documentTransactions = [transaction, ...appendedTransactions]
                    .filter((current) => current.docChanged)
                if (documentTransactions.length) {
                    this.documentVersion += 1
                    const mapping = new Mapping()
                    documentTransactions.forEach((current) => mapping.appendMapping(current.mapping))
                    this.lastDocumentMapping = mapping
                }
                this.refreshUI()
                options.onTransaction?.(editor, transaction, appendedTransactions)
            },
            onUpdate: ({editor, transaction}) => options.onUpdate?.(editor, transaction),
            onFocus: ({editor, event, transaction}) => options.onFocus?.(editor, event, transaction),
            onBlur: ({editor, event, transaction}) => options.onBlur?.(editor, event, transaction),
            onDestroy: () => options.onDestroy?.(this.editor),
            onPaste: (event, slice) => options.onPaste?.(this.editor, event, slice),
            onDrop: (event, slice, moved) => options.onDrop?.(this.editor, event, slice, moved),
            onDelete: ({editor, ...event}) => options.onDelete?.(editor, event),
        })
        registerEditorTheme(this.editor, this.root, theme)

        const createToolbarDefaults = (): MenuItem[] => [
            ...createDefaultToolbarItems(
            options.fontFamilies,
            options.fontSizes,
            options.letterSpacings,
            options.lineHeights,
            options.textAlignments,
            options.fontColors,
            options.backgroundColors,
            options.highlightColors,
            options.indentation !== false,
            options.highlightBlock,
            this.uploader,
            options.link,
            options.emoji,
            {
                isFullscreen: () => this.isFullscreen(),
                toggleFullscreen: () => this.toggleFullscreen(),
            },
                {print: () => this.print()},
            ),
            ...(options.productToolbarItems ?? []),
        ]
        if (options.blockDragMenu !== false) {
            this.editor.registerPlugin(createBlockDragMenuPlugin(
                this.editor,
                this.i18n,
                this.uploader,
                options.blockDragMenu ?? {},
                createToolbarDefaults(),
            ))
        }
        const defaults = createToolbarDefaults()
        // menus 回调接收的是本次实例专属数组，避免多个编辑器共享可变菜单对象。
        const configuredMenus = options.toolbar?.menus
        const configuredItems = typeof configuredMenus === 'function'
            ? configuredMenus(defaults)
            : configuredMenus ?? defaults
        const items = resolveToolbarItems(configuredItems, defaults)

        this.toolbarMenu = new ToolbarMenu(this.toolbarElement, items, options.toolbar, defaults)
        this.toolbarMenu.mount(this.editor, this.i18n)
        this.imageAlignmentMenu.mount(this.editor, this.i18n)
        this.mediaAlignmentMenu.mount(this.editor, this.i18n)
        this.highlightBlockMenu?.mount(this.editor, this.i18n)
        this.inlineImageMenu.mount(this.editor, this.i18n)
        this.tableMenu.mount(this.editor, this.i18n)
        this.textBubbleMenu?.mount(this.editor, this.i18n)
        this.linkBubbleMenu?.mount(this.editor, this.i18n)
        this.productBubbleMenus.forEach((menu) => menu.mount(this.editor, this.i18n))
        this.productContext = {
            editor: this.editor,
            i18n: this.i18n,
            root: this.root,
            content: template.content,
            sidebar: template.sidebar,
            uploader: this.uploader,
        }
        this.productSurfaces.forEach((surface) => surface.mount(this.productContext!))

        this.setFullscreen(options.fullscreen ?? false)
        this.refreshUI()
    }

    /** 导出当前文档 HTML。 */
    getHTML(): string {
        return this.editor.getHTML()
    }

    /** 导出已将静态展示样式写入各节点 style 属性的 HTML。 */
    getStyledHTML(): string {
        return createStyledHTML(this.editor.getHTML(), this.root, this.editor.view.dom)
    }

    /** 导出当前文档 JSON。 */
    getJSON(): JSONContent {
        return this.editor.getJSON()
    }

    /** 导出当前文档纯文本。 */
    getText(): string {
        return this.editor.getText()
    }

    /** 返回当前标题生成的层级目录快照；插件启用时同时包含稳定 ID、索引和滚动状态。 */
    getDocumentOutline(): DocumentOutlineItem[] {
        const content = this.editor.storage.tableOfContents?.content
        // 扩展的 onCreate 晚于 Editor 构造函数返回；首轮 storage 尚为空时保留同步 API 的旧行为。
        if (this.tableOfContentsReady && Array.isArray(content)) {
            return createDocumentOutlineFromTableOfContents(content)
        }
        return createDocumentOutline(this.editor.state.doc)
    }

    /** 将选区和编辑区滚动到目录项或目录位置；位置无效时返回 false。 */
    scrollToDocumentOutline(target: DocumentOutlineItem | DocumentOutlineItem['position'] | number): boolean {
        const anchor = typeof target === 'object' && 'id' in target
            ? this.editor.storage.tableOfContents?.content.find((item) => item.id === target.id)
            : undefined
        // 带插件索引的目录项已经被删除时，不使用可能已指向其他内容的旧坐标。
        if (typeof target === 'object' && 'id' in target && target.index !== undefined && !anchor) return false
        const from = anchor?.pos ?? (typeof target === 'number'
            ? target
            : 'position' in target ? target.position.from : target.from)
        const maximum = this.editor.state.doc.content.size
        if (!Number.isInteger(from) || from < 0 || from > maximum) return false
        const selectionPosition = Math.min(from + 1, maximum)
        const positioned = this.editor.chain().setTextSelection(selectionPosition).scrollIntoView().run()
        if (!positioned) return false
        const node = anchor?.dom ?? this.editor.view.nodeDOM(from)
        const element = node instanceof HTMLElement ? node : node?.parentElement
        element?.scrollIntoView({block: 'center', inline: 'nearest'})
        return true
    }

    /** 返回工具栏菜单项的只读快照。 */
    getMenuItems(): readonly MenuItem[] {
        return this.toolbarMenu?.getItems() ?? []
    }

    /** 返回选区 Bubble Menu 菜单项的只读快照。 */
    getBubbleMenuItems(): readonly MenuItem[] {
        return [
            ...(this.textBubbleMenu?.getItems() ?? []),
            ...(this.linkBubbleMenu?.getItems() ?? []),
            ...this.productBubbleMenus.flatMap((menu) => menu.getItems()),
        ]
    }


    /** 读取当前 AI 服务实例。 */
    getAIService(): AiService | undefined {
        return this.aiService
    }

    /** 在运行时替换 AI 服务；传 undefined 可以关闭 AI 请求。 */
    setAIService(ai?: AiService | AiServiceConfig): void {
        this.aiService = ai ? createAiService(ai) : undefined
    }

    /**
     * 以当前编辑器快照调用 AI 服务。
     * 选区坐标和文档版本在请求开始时冻结，保证异步服务获得一致上下文。
     */
    async generateAI(request: AiGenerateRequest): Promise<AiGenerateResult> {
        if (!this.aiService) throw new Error('AiEditor AI service is not configured')

        const {from, to} = this.editor.state.selection
        const result = await this.aiService.generate(request, {
            editor: this.editor,
            html: this.editor.getHTML(),
            text: this.editor.getText(),
            selectedText: this.editor.state.doc.textBetween(from, to, '\n'),
            selection: {from, to},
            documentVersion: this.documentVersion,
        })
        result.toolProposals?.forEach((proposal) => {
            if (proposal.status === 'pending') this.pendingToolProposals.add(proposal)
        })
        return result
    }

    /** 交由默认 Tool Registry 校验并应用一个已审批的修改提案。 */
    applyToolProposal(proposal: AiEditorToolProposal): AiEditorToolApplyResult {
        if (!this.editor.isEditable) return {ok: false, message: this.i18n.t('Editor is read-only.')}
        const proposalVersion = proposal.documentVersion
        this.lastDocumentMapping = undefined
        const result = applyToolProposal(this.editor, this.documentVersion, proposal)
        if (!result.ok) return result

        this.pendingToolProposals.delete(proposal)
        const mapping = this.lastDocumentMapping
        if (mapping) {
            this.pendingToolProposals.forEach((pending) => {
                if (pending.status === 'pending' && pending.documentVersion === proposalVersion) {
                    rebaseEditorToolProposal(pending, mapping, this.documentVersion)
                }
            })
        }
        return result
    }

    /** 替换全文内容；默认不触发外部 onUpdate，避免初始化/恢复内容造成误保存。 */
    setContent(content: string | JSONContent, emitUpdate = false): void {
        const sanitized = typeof content === 'string'
            ? content
            : this.sanitizeContent(content, this.editor.schema)
        this.editor.commands.setContent(sanitized, {emitUpdate})
    }

    /** JSON 输入只在开关启用时按当前运行时 schema 清洗；HTML 继续交给 DOMParser。 */
    private sanitizeContent(content: JSONContent, schema: Schema): JSONContent {
        if (this.contentSanitization === false) return content
        const result = sanitizeContentForSchema(content, schema)
        if (result.issues.length && this.contentSanitization.warn !== false) {
            console.warn(formatContentSanitizationWarning(result.issues), result.issues)
        }
        return result.content
    }

    /** 动态替换工具栏菜单。 */
    setMenuItems(items: readonly MenuItemConfig[]): void {
        this.toolbarMenu?.setItems(items)
    }

    /** 返回当前顶部工具栏风格。 */
    getToolbarStyle(): ToolbarStyle {
        return this.toolbarMenu?.getStyle() ?? 'compact'
    }

    /** 在运行时切换 classic、compact 或 WPS 式 ribbon 工具栏。 */
    setToolbarStyle(style: ToolbarStyle): void {
        this.toolbarMenu?.setStyle(style)
    }

    /** 返回当前工具栏控件尺寸。 */
    getToolbarSize(): ToolbarSize {
        return this.toolbarMenu?.getSize() ?? 'default'
    }

    /** 在小、默认、大三档之间切换工具栏控件尺寸。 */
    setToolbarSize(size: ToolbarSize): void {
        this.toolbarMenu?.setSize(size)
    }

    /** 返回工具栏宽度不足时的布局策略。 */
    getToolbarOverflow(): ToolbarOverflow {
        return this.toolbarMenu?.getOverflow() ?? 'wrap'
    }

    /** 切换自动换行、单行滚动或自动折叠到“更多”菜单。 */
    setToolbarOverflow(overflow: ToolbarOverflow): void {
        this.toolbarMenu?.setOverflow(overflow)
    }

    /** 返回顶部工具栏是否在滚动时吸附于浏览器视口顶部。 */
    isToolbarSticky(): boolean {
        return this.toolbarMenu?.isSticky() ?? false
    }

    /** 开启或关闭工具栏吸附；offset 用于避让宿主页面的固定头部。 */
    setToolbarSticky(sticky: boolean, offset?: number): void {
        this.toolbarMenu?.setSticky(sticky, offset)
    }

    /** 返回编辑器是否占满当前浏览器页面视口。 */
    isFullscreen(): boolean {
        return this.fullscreen
    }

    /** 切换网页内全屏模式；不会调用浏览器或操作系统的原生全屏 API。 */
    setFullscreen(fullscreen: boolean): void {
        if (this.fullscreen === fullscreen) return
        this.fullscreen = fullscreen
        this.root.dataset.fullscreen = String(fullscreen)
        const document = this.root.ownerDocument
        if (fullscreen) document.addEventListener('keydown', this.handleFullscreenKeydown, true)
        else document.removeEventListener('keydown', this.handleFullscreenKeydown, true)
        document.body.classList.toggle(
            'aieditor-page-fullscreen',
            Boolean(document.querySelector('.aieditor[data-fullscreen="true"]')),
        )
        this.toolbarMenu?.update()
    }

    /** 在普通布局和网页内全屏布局之间切换。 */
    toggleFullscreen(): void {
        this.setFullscreen(!this.fullscreen)
    }

    /** 仅打印当前编辑器的文档正文，并使用浏览器原生打印设置。 */
    print(): void {
        const document = this.root.ownerDocument
        const window = document.defaultView ?? globalThis.window
        const mediaPlaceholders = this.createPrintMediaPlaceholders()
        const cleanup = (): void => {
            mediaPlaceholders.forEach((placeholder) => placeholder.remove())
            delete this.root.dataset.printing
            document.body.classList.toggle(
                'aieditor-page-printing',
                Boolean(document.querySelector('.aieditor[data-printing="true"]')),
            )
        }

        this.root.dataset.printing = 'true'
        document.body.classList.add('aieditor-page-printing')
        window.addEventListener('afterprint', cleanup, {once: true})
        try {
            window.print()
        } catch (error) {
            window.removeEventListener('afterprint', cleanup)
            cleanup()
            throw error
        }
    }

    /** 为无法可靠输出到纸面的原生播放器创建临时打印说明。 */
    private createPrintMediaPlaceholders(): HTMLElement[] {
        const document = this.root.ownerDocument
        const placeholders: HTMLElement[] = []
        const mediaElements = this.root.querySelectorAll<HTMLAudioElement | HTMLVideoElement>(
            '.aieditor__prose audio, .aieditor__prose video',
        )
        mediaElements.forEach((media) => {
            const type = media instanceof HTMLAudioElement ? 'Audio' : 'Video'
            const placeholder = document.createElement('div')
            const typeLabel = document.createElement('strong')
            const title = media.title.trim()
            const source = media.currentSrc || media.getAttribute('src')?.trim() || ''

            placeholder.className = 'aieditor__print-media-placeholder'
            placeholder.dataset.printMediaType = type.toLowerCase()
            placeholder.setAttribute('aria-label', this.i18n.t(`${type} print placeholder`))
            typeLabel.textContent = this.i18n.t(type)
            placeholder.append(typeLabel)

            if (title) {
                const titleLabel = document.createElement('span')
                titleLabel.textContent = title
                placeholder.append(titleLabel)
            }
            if (source) {
                const sourceLabel = document.createElement('small')
                sourceLabel.textContent = source
                placeholder.append(sourceLabel)
            }

            media.insertAdjacentElement('afterend', placeholder)
            placeholders.push(placeholder)
        })
        return placeholders
    }

    /** 动态切换当前编辑器实例的界面语言，不修改文档内容。 */
    setLocale(locale: AiEditorLocale): void {
        this.i18n.setLocale(locale)
        this.root.lang = locale
        if (this.usesDefaultPlaceholder) {
            const placeholder = this.editor.extensionManager.extensions.find((extension) => extension.name === 'placeholder')
            if (placeholder) placeholder.options.placeholder = this.i18n.t('Start writing...')
            this.editor.view.dispatch(this.editor.state.tr)
        }
        this.refreshUI()
    }

    getLocale(): AiEditorLocale {
        return this.i18n.getLocale()
    }

    /** 动态切换当前编辑器及其 Portal 浮层的亮色或暗色主题。 */
    setTheme(theme: AiEditorTheme): void {
        assertAiEditorTheme(theme)
        setEditorTheme(this.editor, theme)
    }

    /** 返回当前编辑器主题。 */
    getTheme(): AiEditorTheme {
        return getEditorTheme(this.editor)
    }

    /**
     * 切换文档排版预设或自定义样式。
     * 此操作不会改写现有 Tiptap 节点；显式字体、字号、行高、缩进和表格列宽继续覆盖预设。
     */
    setDocumentStyle(config: DocumentStyleConfig): void {
        this.documentStyle = applyDocumentStyle(this.root, config)
    }

    /** 返回当前解析并冻结的文档排版配置；调用方应使用 extendDocumentStyle 派生新配置。 */
    getDocumentStyle(): Readonly<ResolvedDocumentStyle> {
        return this.documentStyle
    }

    /** 动态切换编辑/只读模式；不会修改文档内容，也不会触发 onUpdate。 */
    setEditable(editable: boolean): void {
        if (this.editor.isEditable === editable) {
            this.syncEditableState(editable)
            return
        }
        this.editor.setEditable(editable, false)
        this.syncEditableState(editable)
        if (!editable && this.toolbarMenu) {
            // 重挂工具栏可关闭 Portal 弹窗，并取消菜单内仍在进行的上传操作。
            this.toolbarMenu.setItems([...this.toolbarMenu.getItems()])
        }
        this.highlightBlockMenu?.setEditable(editable)
        this.editor.view.dispatch(this.editor.state.tr)
        this.refreshUI()
    }

    /** 返回当前用户是否可以编辑文档。 */
    isEditable(): boolean {
        return this.editor.isEditable
    }

    /** 清空文档并产生一次更新事务。 */
    clear(): void {
        this.editor.commands.clearContent(true)
    }

    /** 将编辑器聚焦到文档开头或末尾。 */
    focus(position: 'start' | 'end' = 'end'): void {
        this.editor.commands.focus(position)
    }

    /** 按 Surface、编辑器和 DOM 的依赖顺序释放全部资源。 */
    destroy(): void {
        const document = this.root.ownerDocument
        this.pendingToolProposals.clear()
        this.setFullscreen(false)
        this.root.querySelectorAll('.aieditor__print-media-placeholder').forEach((element) => element.remove())
        delete this.root.dataset.printing
        document.body.classList.toggle(
            'aieditor-page-printing',
            Boolean(document.querySelector('.aieditor[data-printing="true"]')),
        )
        this.toolbarMenu?.destroy()
        this.toolbarMenu = undefined
        this.imageAlignmentMenu.destroy()
        this.mediaAlignmentMenu.destroy()
        this.highlightBlockMenu?.destroy()
        this.inlineImageMenu.destroy()
        this.tableMenu.destroy()
        this.textBubbleMenu?.destroy()
        this.linkBubbleMenu?.destroy()
        this.productBubbleMenus.forEach((menu) => menu.destroy())
        this.productSurfaces.forEach((surface) => surface.destroy())
        this.productContext = undefined
        this.editor.destroy()
        try {
            this.templateDestroy?.()
        } finally {
            this.root.remove()
        }
    }

    /** 创建默认模板或校验并规范化宿主提供的自定义模板。 */
    private resolveTemplate(target: HTMLElement, factory?: AiEditorTemplateFactory): AiEditorTemplateSlots {
        const context: AiEditorTemplateContext = {
            document: target.ownerDocument,
            locale: this.i18n.getLocale(),
            t: (value) => this.i18n.t(value),
        }
        const template = factory ? factory(context) : this.createDefaultTemplate(context)
        const HTMLElementConstructor = target.ownerDocument.defaultView?.HTMLElement ?? HTMLElement
        if (!template || typeof template !== 'object') {
            throw new Error('AiEditor template factory must return template slots')
        }
        if (
            !(template.root instanceof HTMLElementConstructor)
            || !(template.toolbar instanceof HTMLElementConstructor)
            || !(template.content instanceof HTMLElementConstructor)
            || (template.sidebar !== undefined && !(template.sidebar instanceof HTMLElementConstructor))
            || (template.footer !== undefined && !(template.footer instanceof HTMLElementConstructor))
            || (template.count !== undefined && !(template.count instanceof HTMLElementConstructor))
        ) {
            throw new Error('AiEditor template slots must be HTMLElements')
        }
        if (template.destroy !== undefined && typeof template.destroy !== 'function') {
            throw new Error('AiEditor template destroy must be a function')
        }
        const slots = [template.root, template.toolbar, template.content, template.sidebar, template.footer, template.count]
            .filter((element): element is HTMLElement => Boolean(element))
        if (template.root === target) {
            throw new Error('AiEditor template root must be a child of the mount element, not the mount element itself')
        }
        if (new Set(slots).size !== slots.length) {
            throw new Error('AiEditor template slots must reference distinct elements')
        }
        if (slots.slice(1).some((element) => !template.root.contains(element))) {
            throw new Error('AiEditor template root must contain every toolbar, content, footer, and count slot')
        }

        template.root.classList.add('aieditor')
        template.root.dataset.aieditorTemplate = factory ? 'custom' : 'default'
        template.toolbar.classList.add('aieditor__toolbar')
        template.toolbar.setAttribute('role', 'toolbar')
        template.toolbar.setAttribute('aria-label', this.i18n.t('Formatting tools'))
        template.content.classList.add('aieditor__content')
        template.sidebar?.classList.add('aieditor__sidebar')
        template.footer?.classList.add('aieditor__footer')
        if (template.count) template.count.dataset.count = ''
        return template
    }

    /** 返回与旧版本结构一致的默认区域。 */
    private createDefaultTemplate(context: AiEditorTemplateContext): AiEditorTemplateSlots {
        const root = context.document.createElement('div')
        const toolbar = context.document.createElement('div')
        const content = context.document.createElement('div')
        const sidebar = context.document.createElement('aside')
        const footer = context.document.createElement('footer')
        const editorType = context.document.createElement('span')
        const count = context.document.createElement('span')

        editorType.dataset.editorType = ''
        editorType.textContent = context.t('Rich text')
        count.textContent = '0 words · 0 characters'
        footer.append(editorType, count)
        root.append(toolbar, content, sidebar, footer)
        return {root, toolbar, content, sidebar, footer, count}
    }

    /** 在选区或事务变化后刷新菜单和底部字数统计。 */
    private refreshUI(): void {
        if (!this.editor) return
        this.localizeEditorControls()
        this.toolbarMenu?.update()
        this.textBubbleMenu?.update()
        this.linkBubbleMenu?.update()
        this.productBubbleMenus.forEach((menu) => menu.update())
        if (this.productContext) {
            this.productSurfaces.forEach((surface) => surface.update(this.productContext!))
        }

        const text = this.editor.getText().trim()
        // 使用自然语言分段，避免把整段中文算作一个词或把 emoji 算作两个字符。
        const {words, characters} = getTextStatistics(text, this.i18n.getLocale())
        const wordLabel = this.i18n.t(words === 1 ? 'word' : 'words')
        if (this.countElement) {
            this.countElement.textContent = `${words} ${wordLabel} · ${characters} ${this.i18n.t('characters')}`
        }
        const editorType = this.root.querySelector<HTMLElement>('[data-editor-type]')
        if (editorType) editorType.textContent = this.i18n.t('Rich text')
    }

    /** 翻译菜单 Surface 之外由 NodeView / Decoration 创建的辅助控件。 */
    private localizeEditorControls(): void {
        this.toolbarElement.setAttribute('aria-label', this.i18n.t('Formatting tools'))
        this.editor.view.dom.setAttribute('aria-label', this.i18n.t('Rich text editor'))
        this.imageAlignmentMenu.element.setAttribute('aria-label', this.i18n.t('Image alignment'))
        this.mediaAlignmentMenu.element.setAttribute('aria-label', this.i18n.t('Media alignment'))
        this.inlineImageMenu.element.setAttribute('aria-label', this.i18n.t('Inline image'))
        this.tableMenu.element.setAttribute('aria-label', this.i18n.t('Table operations'))
        this.textBubbleMenu?.element.setAttribute('aria-label', this.i18n.t('Text formatting'))
        if (this.linkBubbleMenu) {
            this.linkBubbleMenu.element.setAttribute('aria-label', this.i18n.t(this.linkBubbleMenu.label))
        }
        this.productBubbleMenus.forEach((menu) => {
            if (menu.label) menu.element.setAttribute('aria-label', this.i18n.t(menu.label))
        })
        this.highlightBlockMenu?.element.setAttribute('aria-label', this.i18n.t('Highlight block colors'))

        this.editor.view.dom.querySelectorAll<HTMLElement>('[data-table-grip-kind]').forEach((grip) => {
            const kind = grip.dataset.tableGripKind
            const index = Number(grip.dataset.tableGripIndex ?? 0) + 1
            const source = kind === 'table' ? 'Select table' : `Select ${kind}`
            const label = kind === 'table' ? this.i18n.t(source) : `${this.i18n.t(source)} ${index}`
            grip.setAttribute('aria-label', label)
            grip.title = label
        })

        this.editor.view.dom.querySelectorAll<HTMLElement>('[data-resize-handle]').forEach((handle) => {
            const type = handle.closest<HTMLElement>('[data-type]')?.dataset.type
            const direction = handle.dataset.resizeHandle
            if (type && direction) handle.setAttribute('aria-label', this.i18n.t(`Resize ${type} from ${direction}`))
        })

        this.editor.view.dom.querySelectorAll<HTMLElement>('[data-code-language-label]').forEach((label) => {
            label.textContent = this.i18n.t(label.dataset.codeLanguageLabel ?? '')
        })
        this.editor.view.dom.querySelectorAll<HTMLElement>('[data-code-block-action]').forEach((button) => {
            const source = button.dataset.codeBlockAction === 'language' ? 'Code language' : 'Copy code'
            const label = this.i18n.t(source)
            const language = button.querySelector<HTMLElement>('.aieditor__code-language-value')?.textContent
            button.title = language ? `${label}: ${language}` : label
            button.setAttribute('aria-label', button.title)
        })
        this.editor.view.dom.querySelectorAll<HTMLElement>('.aieditor__code-block-actions').forEach((group) => {
            group.setAttribute('aria-label', this.i18n.t('Code block actions'))
        })
        this.editor.view.dom.querySelectorAll<HTMLElement>('.aieditor__code-language-menu').forEach((menu) => {
            menu.setAttribute('aria-label', this.i18n.t('Code language'))
        })

        this.editor.view.dom.querySelectorAll<HTMLElement>('[data-block-boundary-direction]').forEach((button) => {
            const source = button.dataset.blockBoundaryDirection === 'before'
                ? 'Insert paragraph above'
                : 'Insert paragraph below'
            const label = this.i18n.t(source)
            button.title = label
            button.setAttribute('aria-label', label)
        })
    }

    private syncEditableState(editable: boolean): void {
        this.root.dataset.editable = String(editable)
        this.editor.view.dom.setAttribute('aria-readonly', String(!editable))
        this.toolbarElement.setAttribute('aria-hidden', String(!editable))
    }
}
