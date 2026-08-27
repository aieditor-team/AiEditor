import {afterEach, describe, expect, it, vi} from 'vitest'
import {Extension, Node as TiptapNode} from '@tiptap/core'
import {AiEditor} from '../../src/editor/AiEditor'
import {MenuItem} from '../../src/menus/core/MenuItem'
import type {MenuContext} from '../../src/menus/core/MenuContext'

const instances: AiEditor[] = []
afterEach(() => instances.splice(0).forEach((editor) => editor.destroy()))

function create(overrides: ConstructorParameters<typeof AiEditor>[0] = {} as never): AiEditor {
    const element = document.createElement('div')
    document.body.append(element)
    const editor = new AiEditor({
        element,
        content: '<h1>Title</h1><p>Hello 👋</p>',
        toolbar: {menus: []},
        bubbleMenu: false,
        highlightBlock: false,
        ...overrides,
    })
    instances.push(editor)
    return editor
}

describe('AiEditor', () => {
    it('默认按运行时 schema 清洗初始化 JSON，并汇总输出过滤警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        const editor = create({content: {
            type: 'doc',
            attrs: {docxId: 'document-1'},
            content: [{
                type: 'docxSection',
                attrs: {page: {width: 100}},
                content: [{
                    type: 'paragraph',
                    attrs: {documentRole: 'body', docxParagraph: {alignment: 'left'}},
                    content: [{
                        type: 'text',
                        text: '导入正文',
                        marks: [{type: 'bold'}, {type: 'docxTextStyle', attrs: {styleId: 'r1'}}],
                    }, {type: 'text', text: ''}],
                }],
            }],
        }})

        expect(editor.getText()).toBe('导入正文')
        expect(editor.getJSON()).toMatchObject({
            type: 'doc',
            content: [{
                type: 'paragraph',
                attrs: {documentRole: 'body'},
                content: [{type: 'text', text: '导入正文', marks: [{type: 'bold'}]}],
            }],
        })
        expect(JSON.stringify(editor.getJSON())).not.toContain('docx')
        expect(warn).toHaveBeenCalledTimes(1)
        expect(warn.mock.calls[0]?.[0]).toContain('nodes docxSection (1)')
        expect(warn.mock.calls[0]?.[0]).toContain('marks docxTextStyle (1)')
        expect(warn.mock.calls[0]?.[0]).toContain('empty text nodes text (1)')
    })

    it('运行时 setContent 清洗未知内容，并允许关闭 console 警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        const editor = create({contentSanitization: {warn: false}})

        editor.setContent({
            type: 'doc',
            content: [{
                type: 'pluginContainer',
                content: [{type: 'paragraph', content: [{type: 'text', text: '保留的内容'}]}],
            }],
        })

        expect(editor.getText()).toBe('保留的内容')
        expect(warn).not.toHaveBeenCalled()
    })

    it('允许完全关闭内容清洗', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        const editor = create({contentSanitization: false})

        editor.setContent({
            type: 'doc',
            attrs: {externalMetadata: '由 Tiptap 原始逻辑处理'},
            content: [{type: 'paragraph', content: [{type: 'text', text: '未执行 Core 清洗'}]}],
        })

        expect(editor.getText()).toBe('未执行 Core 清洗')
        expect(warn).not.toHaveBeenCalled()
    })

    it('未知原子节点被删除后生成合法的最小文档', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        const editor = create()

        editor.setContent({type: 'doc', content: [{type: 'unsupportedDocxObject', attrs: {id: 'shape-1'}}]})

        expect(editor.getJSON()).toMatchObject({type: 'doc', content: [{type: 'paragraph'}]})
        expect(warn.mock.calls[0]?.[0]).toContain('nodes unsupportedDocxObject (1)')
    })

    it('保留产品层已注册的节点及其合法属性', () => {
        const productNode = TiptapNode.create({
            name: 'productNode',
            group: 'block',
            atom: true,
            addAttributes: () => ({value: {default: null}}),
            parseHTML: () => [{tag: 'div[data-product-node]'}],
            renderHTML: ({HTMLAttributes}) => ['div', {...HTMLAttributes, 'data-product-node': ''}],
        })
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        const editor = create({
            productExtensions: [productNode],
            content: {
                type: 'doc',
                content: [{type: 'productNode', attrs: {value: 'official', unsupported: true}}],
            },
        })

        expect(editor.getJSON().content?.[0]).toMatchObject({type: 'productNode', attrs: {value: 'official'}})
        expect(warn).toHaveBeenCalledTimes(1)
        expect(warn.mock.calls[0]?.[0]).toContain('attributes unsupported (1)')
        expect(warn.mock.calls[0]?.[0]).not.toContain('nodes productNode')
    })

    it('允许产品层关闭本地历史记录以交给协作 UndoManager', () => {
        const normal = create()
        const collaborative = create({undoRedo: false})

        expect(normal.editor.extensionManager.extensions.some((extension) => extension.name === 'undoRedo')).toBe(true)
        expect(collaborative.editor.extensionManager.extensions.some((extension) => extension.name === 'undoRedo')).toBe(false)
    }, 15_000)

    it('允许协作产品显式跳过本地初始内容', () => {
        const editor = create({content: null})

        expect(editor.getText()).toBe('')
        expect(editor.getHTML()).toBe('<p></p>')
    })

    it('manages all product injection points through the core lifecycle', () => {
        class ProductMenuItem extends MenuItem {
            render(context: MenuContext): HTMLElement {
                const button = context.editor.view.dom.ownerDocument.createElement('button')
                button.textContent = 'Product action'
                return button
            }
        }
        const bubbleElement = document.createElement('div')
        const bubbleMenu = {
            element: bubbleElement,
            extension: Extension.create({name: 'productBubbleExtension'}),
            label: 'Product actions',
            mount: vi.fn(),
            update: vi.fn(),
            destroy: vi.fn(),
            getItems: vi.fn(() => []),
        }
        const surface = {mount: vi.fn(), update: vi.fn(), destroy: vi.fn()}
        const editor = create({
            productExtensions: [Extension.create({name: 'productExtension'})],
            productToolbarItems: [new ProductMenuItem('product-toolbar')],
            productBubbleMenus: [bubbleMenu],
            productSurfaces: [surface],
            toolbar: {menus: ['product-toolbar']},
            bubbleMenu: {items: []},
        })

        expect(editor.editor.extensionManager.extensions.map((extension) => extension.name)).toEqual(expect.arrayContaining([
            'productExtension', 'productBubbleExtension',
        ]))
        expect(editor.getMenuItems().map((item) => item.id)).toEqual(['product-toolbar'])
        expect(editor.root.querySelector('[data-menu-item="product-toolbar"]')?.textContent).toBe('Product action')
        expect(bubbleMenu.mount).toHaveBeenCalledOnce()
        expect(surface.mount).toHaveBeenCalledOnce()
        expect(surface.update).toHaveBeenCalled()

        editor.destroy()
        instances.pop()
        expect(bubbleMenu.destroy).toHaveBeenCalledOnce()
        expect(surface.destroy).toHaveBeenCalledOnce()
    }, 15_000)

    it('从 toolbar.menus 解析默认菜单 Key 和 Ribbon 分组边界', () => {
        let defaultIds: string[] = []
        const editor = create({
            toolbar: {
                style: 'ribbon',
                menus: (defaults) => {
                    defaultIds = defaults.map((item) => item.id)
                    return ['bold', '|', 'italic']
                },
            },
        })

        expect(defaultIds).toContain('bold')
        expect(editor.getMenuItems().map((item) => item.id)).toEqual([
            'bold', 'separator-custom-0', 'italic',
        ])
        expect(editor.getToolbarStyle()).toBe('ribbon')
    })

    it('初始化默认模板并提供内容、目录和状态 API', () => {
        const editor = create()
        expect(editor.getText()).toContain('Title')
        expect(editor.getHTML()).toContain('<h1>Title</h1>')
        expect(editor.getJSON().type).toBe('doc')
        expect(editor.getDocumentOutline()).toMatchObject([{text: 'Title', level: 1}])
        expect(document.querySelector('[data-aieditor-template="default"]')).not.toBeNull()
        expect(document.querySelector('[data-count]')?.textContent).toContain('字符')
    })

    it('默认启用并透传 TableOfContents 配置，目录 API 使用插件的稳定 ID 和状态', async () => {
        const onUpdate = vi.fn()
        const editor = create({
            tableOfContents: {
                getId: (text) => `section-${text.toLowerCase()}`,
                getIndex: () => 7,
                onUpdate,
            },
        })

        await vi.waitFor(() => expect(onUpdate).toHaveBeenCalled())
        const outline = editor.getDocumentOutline()
        expect(outline).toMatchObject([{
            id: 'section-title',
            text: 'Title',
            level: 1,
            originalLevel: 1,
            index: 7,
            isActive: true,
            isScrolledOver: true,
        }])
        expect(editor.getHTML()).toContain('data-toc-id="section-title"')
        expect(editor.editor.extensionManager.extensions.some((extension) => extension.name === 'tableOfContents')).toBe(true)
    })

    it('关闭 TableOfContents 后目录 API 回退到文档扫描', () => {
        const editor = create({tableOfContents: false})

        expect(editor.editor.extensionManager.extensions.some((extension) => extension.name === 'tableOfContents')).toBe(false)
        expect(editor.getDocumentOutline()).toMatchObject([{id: 'heading-0', text: 'Title', level: 1}])
        expect(editor.getHTML()).not.toContain('data-toc-id')
    })

    it('TableOfContents 的 anchorTypes 为空时不会回退生成 heading 目录', async () => {
        const onUpdate = vi.fn()
        const editor = create({tableOfContents: {anchorTypes: [], onUpdate}})

        await vi.waitFor(() => expect(onUpdate).toHaveBeenCalled())
        expect(editor.getDocumentOutline()).toEqual([])
    })

    it('文档位置变化后仍可通过旧目录项的稳定 ID 定位最新标题', async () => {
        const editor = create({tableOfContents: {getId: (text) => `section-${text.toLowerCase()}`}})
        await vi.waitFor(() => expect(editor.getDocumentOutline()[0]?.id).toBe('section-title'))
        const staleItem = editor.getDocumentOutline()[0]
        const oldPosition = staleItem.position.from

        editor.editor.commands.insertContentAt(0, '<p>Before</p>')
        await vi.waitFor(() => expect(editor.getDocumentOutline()[0]?.position.from).toBeGreaterThan(oldPosition))
        const currentItem = editor.getDocumentOutline()[0]
        const heading = editor.root.querySelector<HTMLElement>('h1')!
        const scrollIntoView = vi.spyOn(heading, 'scrollIntoView')

        expect(editor.scrollToDocumentOutline(staleItem)).toBe(true)
        expect(editor.editor.state.selection.from).toBe(currentItem.position.from + 1)
        expect(scrollIntoView).toHaveBeenCalledWith({block: 'center', inline: 'nearest'})
    })

    it('插件目录项对应的标题已删除时拒绝使用旧坐标定位', async () => {
        const editor = create({tableOfContents: {getId: () => 'section-title'}})
        await vi.waitFor(() => expect(editor.getDocumentOutline()[0]?.id).toBe('section-title'))
        const staleItem = editor.getDocumentOutline()[0]

        editor.setContent('<p>Title removed</p>')
        await vi.waitFor(() => expect(editor.getDocumentOutline()).toEqual([]))

        expect(editor.scrollToDocumentOutline(staleItem)).toBe(false)
    })

    it('动态切换内容、可编辑状态、语言、主题和工具栏配置', () => {
        const editor = create()
        editor.setContent('<p>新的内容</p>')
        editor.setEditable(false)
        editor.setLocale('en-US')
        editor.setTheme('dark')
        editor.setToolbarStyle('classic')
        editor.setToolbarSize('large')
        editor.setToolbarOverflow('scroll')
        editor.setToolbarSticky(false, 5)
        expect(editor.getText()).toBe('新的内容')
        expect(editor.isEditable()).toBe(false)
        expect(editor.getLocale()).toBe('en-US')
        expect(editor.getTheme()).toBe('dark')
        expect([editor.getToolbarStyle(), editor.getToolbarSize(), editor.getToolbarOverflow()]).toEqual([
            'classic', 'large', 'scroll',
        ])
        expect(editor.isToolbarSticky()).toBe(false)
    })

    it('把顶层代码块配置传递给默认扩展', () => {
        const editor = create({
            content: '<pre><code>const answer = 42</code></pre>',
            codeBlock: {
                actions: false,
                enableTabIndentation: false,
                tabSize: 6,
                languages: [{name: 'JavaScript / JSX', value: 'javascript', aliases: ['js', 'jsx']}],
            },
        })
        const extension = editor.editor.extensionManager.extensions.find((item) => item.name === 'codeBlock')

        expect(extension?.options).toMatchObject({
            actions: false,
            enableTabIndentation: false,
            tabSize: 6,
            languages: [{name: 'JavaScript / JSX', value: 'javascript', aliases: ['js', 'jsx']}],
        })
        expect(editor.root.querySelector('.aieditor__code-block-actions')).toBeNull()
    })

    it('把冻结的编辑器快照和取消信号传给 AI 服务', async () => {
        const generate = vi.fn(async () => ({text: 'result'}))
        const editor = create({ai: {provider: 'custom', generate}})
        editor.editor.commands.setTextSelection({from: 1, to: 6})
        const controller = new AbortController()
        await expect(editor.generateAI({prompt: 'test', scope: 'selection', signal: controller.signal}))
            .resolves.toEqual({text: 'result'})
        expect(generate).toHaveBeenCalledWith(
            expect.objectContaining({prompt: 'test', signal: controller.signal}),
            expect.objectContaining({selectedText: 'Title', selection: {from: 1, to: 6}, documentVersion: 0}),
        )
    })

    it('同一轮多个提案会在前一事务后自动重定位并可逐个应用', async () => {
        const first = {
            id: 'first', tool: 'replace_selection' as const, title: 'First', description: 'First',
            arguments: {text: 'T', _selection_from: 1, _selection_to: 6, _selection_text: 'Title'},
            documentVersion: 0, status: 'pending' as const,
        }
        const second = {
            id: 'second', tool: 'replace_selection' as const, title: 'Second', description: 'Second',
            arguments: {text: 'Hi', _selection_from: 8, _selection_to: 13, _selection_text: 'Hello'},
            documentVersion: 0, status: 'pending' as const,
        }
        const editor = create({ai: {provider: 'custom', generate: async () => ({text: '', toolProposals: [first, second]})}})
        await editor.generateAI({prompt: 'edit'})
        expect(editor.applyToolProposal(first)).toMatchObject({ok: true})
        expect(second.documentVersion).toBe(1)
        expect(second.arguments).toMatchObject({_selection_from: 4, _selection_to: 9})
        expect(editor.applyToolProposal(second)).toMatchObject({ok: true})
        expect(editor.getText()).toMatch(/^T\s+Hi 👋$/u)
    })

    it('触发 更新、焦点、失焦和销毁回调', () => {
        const onUpdate = vi.fn()
        const onFocus = vi.fn()
        const onBlur = vi.fn()
        const onDestroy = vi.fn()
        const editor = create({onUpdate, onFocus, onBlur, onDestroy})
        editor.setContent('<p>changed</p>', true)
        editor.editor.view.dom.dispatchEvent(new FocusEvent('focus', {bubbles: true}))
        editor.editor.view.dom.dispatchEvent(new FocusEvent('blur', {bubbles: true}))
        expect(onUpdate).toHaveBeenCalled()
        expect(onFocus).toHaveBeenCalled()
        expect(onBlur).toHaveBeenCalled()
        editor.destroy()
        instances.pop()
        expect(onDestroy).toHaveBeenCalledTimes(1)
    })

    it('阻止普通正文中的 Tab 失焦，并回调 Ctrl+S 和 Cmd+S 保存行为', () => {
        const onSave = vi.fn()
        const editor = create({onSave})
        const prose = editor.editor.view.dom

        const tabEvent = new KeyboardEvent('keydown', {key: 'Tab', bubbles: true, cancelable: true})
        prose.dispatchEvent(tabEvent)
        expect(tabEvent.defaultPrevented).toBe(true)
        expect(editor.getText()).toContain('\t')

        const ctrlSave = new KeyboardEvent('keydown', {
            key: 's', ctrlKey: true, bubbles: true, cancelable: true,
        })
        prose.dispatchEvent(ctrlSave)
        const metaSave = new KeyboardEvent('keydown', {
            key: 's', metaKey: true, bubbles: true, cancelable: true,
        })
        prose.dispatchEvent(metaSave)

        expect(ctrlSave.defaultPrevented).toBe(true)
        expect(metaSave.defaultPrevented).toBe(true)
        expect(onSave).toHaveBeenCalledTimes(2)
        expect(onSave).toHaveBeenNthCalledWith(1, editor.editor, ctrlSave)
        expect(onSave).toHaveBeenNthCalledWith(2, editor.editor, metaSave)
    })

    it('打印时为音视频创建占位并在 afterprint 后清理', () => {
        const editor = create()
        const prose = document.querySelector('.aieditor__prose')!
        const audio = document.createElement('audio')
        audio.src = 'https://example.com/a.mp3'
        prose.append(audio)
        const print = vi.spyOn(window, 'print').mockImplementation(() => undefined)
        editor.print()
        expect(print).toHaveBeenCalled()
        expect(document.querySelector('[data-print-media-type="audio"]')).not.toBeNull()
        window.dispatchEvent(new Event('afterprint'))
        expect(document.querySelector('[data-print-media-type="audio"]')).toBeNull()
    })

    it('在替换宿主内容前校验自定义模板槽位', () => {
        const element = document.createElement('div')
        const original = document.createElement('span')
        element.append(original)
        document.body.append(element)
        expect(() => new AiEditor({
            element,
            template: ({document: ownerDocument}) => {
                const root = ownerDocument.createElement('div')
                const shared = ownerDocument.createElement('div')
                root.append(shared)
                return {root, toolbar: shared, content: shared}
            },
        })).toThrow('distinct')
        expect(element.firstElementChild).toBe(original)
    })
})
