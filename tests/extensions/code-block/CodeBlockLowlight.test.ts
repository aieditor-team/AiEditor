import {Editor} from '@tiptap/core'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import {common, createLowlight} from 'lowlight'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {copyCodeText} from '../../../src/extensions/code-block/CodeBlockView'
import {
    CodeBlockLowlight,
    createCodeBlockLanguageOptions,
    normalizeCodeBlockLanguage,
    type CodeBlockLanguageOption,
} from '../../../src/extensions/code-block/CodeBlockLowlight'

const editors: Editor[] = []

interface TestEditorOptions {
    actions?: boolean
    content?: string
    editable?: boolean
    languages?: CodeBlockLanguageOption[]
    enableTabIndentation?: boolean
    tabSize?: number
}

function createEditor(options: TestEditorOptions = {}): Editor {
    const element = document.createElement('div')
    document.body.append(element)
    const translations: Record<string, string> = {
        'Copy code': '复制代码',
        'Copied': '已复制',
        'Could not copy code': '无法复制代码',
        'Code block actions': '代码块操作',
        'Code language': '代码语言',
        'Auto': '自动识别',
        'Plain Text': '纯文本',
    }
    const editor = new Editor({
        element,
        extensions: [
            Document,
            Paragraph,
            Text,
            CodeBlockLowlight.configure({
                lowlight: createLowlight(common),
                actions: options.actions ?? true,
                languages: options.languages ?? null,
                enableTabIndentation: options.enableTabIndentation ?? true,
                tabSize: options.tabSize ?? 2,
                HTMLAttributes: {class: 'project-code-block', 'data-source': 'test'},
                translate: (value) => translations[value] ?? value,
            }),
        ],
        editable: options.editable ?? true,
        content: options.content ?? '<pre><code class="language-js">const answer = 42</code></pre>',
    })
    editors.push(editor)
    return editor
}

afterEach(() => {
    editors.splice(0).forEach((editor) => editor.destroy())
    Object.defineProperty(window.navigator, 'clipboard', {value: undefined, configurable: true})
})

describe('CodeBlockLowlight actions', () => {
    it('复制纯代码并显示短暂成功状态', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined)
        Object.defineProperty(window.navigator, 'clipboard', {value: {writeText}, configurable: true})
        createEditor()
        const copy = document.querySelector<HTMLButtonElement>('[data-code-block-action="copy"]')!
        copy.click()
        await vi.waitFor(() => expect(copy.title).toBe('已复制'))
        expect(writeText).toHaveBeenCalledWith('const answer = 42')
        expect(copy.getAttribute('aria-label')).toBe('已复制')
    })

    it('复制失败时提供可读错误状态', async () => {
        Object.defineProperty(window.navigator, 'clipboard', {
            value: {writeText: vi.fn().mockRejectedValue(new Error('denied'))},
            configurable: true,
        })
        createEditor()
        const copy = document.querySelector<HTMLButtonElement>('[data-code-block-action="copy"]')!
        copy.click()
        await vi.waitFor(() => expect(copy.title).toBe('无法复制代码'))
    })

    it('没有 Clipboard API 时使用 execCommand 回退并清理临时节点', async () => {
        const execCommand = vi.fn().mockReturnValue(true)
        Object.defineProperty(document, 'execCommand', {value: execCommand, configurable: true})
        await copyCodeText('fallback code', document)
        expect(execCommand).toHaveBeenCalledWith('copy')
        expect(document.querySelector('textarea')).toBeNull()
    })

    it('保留语言和自定义属性，导出 HTML 不包含操作按钮', () => {
        const editor = createEditor()
        const pre = document.querySelector('.aieditor__code-block pre')
        expect(pre?.classList.contains('project-code-block')).toBe(true)
        expect(pre?.getAttribute('data-source')).toBe('test')
        expect(document.querySelector('.aieditor__code-block code')?.classList.contains('language-js')).toBe(true)
        expect(document.querySelector('.aieditor__code-block code .hljs-keyword')?.textContent).toBe('const')
        expect(document.querySelector('[data-code-block-action="select"]')).toBeNull()
        expect(editor.getHTML()).toContain('class="project-code-block"')
        expect(editor.getHTML()).not.toContain('code-block-action')
    })

    it('列出 lowlight 已注册语言，并立即切换代码块语言', () => {
        const editor = createEditor()
        const trigger = document.querySelector<HTMLButtonElement>('[data-code-block-action="language"]')!
        trigger.click()

        const menu = document.querySelector<HTMLElement>('.aieditor__code-language-menu')!
        const options = [...menu.querySelectorAll<HTMLButtonElement>('[data-code-language-value]')]
        expect(menu.hidden).toBe(false)
        expect(trigger.getAttribute('aria-expanded')).toBe('true')
        expect(options).toHaveLength(createLowlight(common).listLanguages().length + 1)
        expect(options[0].textContent).toBe('自动识别')
        expect(options.find((option) => option.dataset.codeLanguageValue === 'plaintext')?.textContent).toBe('纯文本')

        options.find((option) => option.dataset.codeLanguageValue === 'python')!.click()
        expect(editor.getAttributes('codeBlock').language).toBe('python')
        expect(document.querySelector('code')?.classList.contains('language-python')).toBe(true)
        expect(trigger.textContent).toContain('Python')
        expect(menu.hidden).toBe(true)
        expect(editor.getHTML()).toContain('language-python')
    })

    it('允许恢复自动识别，并支持 Escape 关闭语言菜单', () => {
        const editor = createEditor()
        const trigger = document.querySelector<HTMLButtonElement>('[data-code-block-action="language"]')!
        trigger.click()
        const menu = document.querySelector<HTMLElement>('.aieditor__code-language-menu')!
        menu.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
        expect(menu.hidden).toBe(true)
        expect(document.activeElement).toBe(trigger)

        trigger.click()
        menu.querySelector<HTMLButtonElement>('[data-code-language-value=""]')!.click()
        expect(editor.getAttributes('codeBlock').language).toBeNull()
        expect(trigger.textContent).toContain('自动识别')
    })

    it('点击代码块语言控件之外的区域时关闭菜单', () => {
        createEditor()
        const trigger = document.querySelector<HTMLButtonElement>('[data-code-block-action="language"]')!
        const menu = document.querySelector<HTMLElement>('.aieditor__code-language-menu')!
        trigger.click()
        document.body.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true}))
        expect(menu.hidden).toBe(true)
        expect(trigger.getAttribute('aria-expanded')).toBe('false')
    })

    it('允许自定义扩展关闭内置操作区', () => {
        createEditor({actions: false})
        expect(document.querySelector('.aieditor__code-block-actions')).toBeNull()
        expect(document.querySelector('pre > code')?.textContent).toBe('const answer = 42')
        expect(document.querySelectorAll('.aieditor__block-boundary-button')).toHaveLength(2)
    })

    it('可以从代码块上方和下方快速插入空段落并移动光标', () => {
        const editor = createEditor()
        const before = document.querySelector<HTMLButtonElement>('[data-block-boundary-direction="before"]')!
        const after = document.querySelector<HTMLButtonElement>('[data-block-boundary-direction="after"]')!

        expect(before.getAttribute('aria-label')).toBe('Insert paragraph above')
        expect(after.getAttribute('aria-label')).toBe('Insert paragraph below')

        before.click()
        expect(editor.getJSON().content?.map((node) => node.type)).toEqual(['paragraph', 'codeBlock'])
        expect(editor.state.selection.from).toBe(1)

        after.click()
        expect(editor.getJSON().content?.map((node) => node.type)).toEqual(['paragraph', 'codeBlock', 'paragraph'])
        expect(editor.state.selection.from).toBe(editor.state.doc.content.size - 1)
    })

    it('只读状态下边界按钮不会修改代码块前后的文档', () => {
        const editor = createEditor({editable: false})
        const original = editor.getJSON()

        document.querySelectorAll<HTMLButtonElement>('.aieditor__block-boundary-button').forEach((button) => button.click())

        expect(editor.getJSON()).toEqual(original)
    })

    it('只读状态保留复制按钮，但禁止打开语言菜单和修改语言', () => {
        const editor = createEditor({editable: false})
        const trigger = document.querySelector<HTMLButtonElement>('[data-code-block-action="language"]')!
        const menu = document.querySelector<HTMLElement>('.aieditor__code-language-menu')!

        expect(trigger.disabled).toBe(true)
        expect(document.querySelector('[data-code-block-action="copy"]')).not.toBeNull()
        trigger.click()
        expect(menu.hidden).toBe(true)
        expect(editor.getAttributes('codeBlock').language).toBe('js')
    })

    it('动态切换只读状态时同步语言按钮，并关闭已经展开的菜单', async () => {
        const editor = createEditor()
        const trigger = document.querySelector<HTMLButtonElement>('[data-code-block-action="language"]')!
        const menu = document.querySelector<HTMLElement>('.aieditor__code-language-menu')!
        trigger.click()
        expect(menu.hidden).toBe(false)

        editor.setEditable(false, false)

        await vi.waitFor(() => expect(trigger.disabled).toBe(true))
        expect(menu.hidden).toBe(true)
    })
})

describe('CodeBlockLowlight editing', () => {
    it('将选中的连续段落合并为一个保留换行的代码块', () => {
        const editor = createEditor({content: '<p>alpha</p><p>beta</p><p>gamma</p>'})
        editor.commands.setTextSelection({from: 1, to: editor.state.doc.content.size - 1})

        expect(editor.commands.toggleCodeBlock()).toBe(true)
        expect(editor.getJSON().content).toEqual([{
            type: 'codeBlock',
            attrs: {language: null},
            content: [{type: 'text', text: 'alpha\nbeta\ngamma'}],
        }])
    })

    it('选区中包含非段落块时不执行合并', () => {
        const editor = createEditor({content: '<p>alpha</p><pre><code>beta</code></pre>'})
        editor.commands.setTextSelection({from: 1, to: editor.state.doc.content.size - 1})

        expect(editor.commands.toggleCodeBlock()).toBe(true)
        expect(editor.getJSON().content).toHaveLength(2)
        expect(editor.state.doc.textContent).toBe('alphabeta')
    })

    it('合并部分选中的首尾段落，同时保留选区外文本', () => {
        const editor = createEditor({content: '<p>alpha</p><p>beta</p><p>gamma</p>'})
        editor.commands.setTextSelection({from: 3, to: 17})

        expect(editor.commands.toggleCodeBlock()).toBe(true)
        expect(editor.state.doc.textContent).toBe('alpha\nbeta\ngamma')
        expect(editor.getJSON().content?.map((node) => node.type)).toEqual(['paragraph', 'codeBlock', 'paragraph'])
        expect(editor.getJSON().content?.[1]?.content?.[0]?.text).toBe('pha\nbeta\ngam')
    })

    it('默认使用两个空格处理 Tab，并可通过配置修改宽度', () => {
        const editor = createEditor({content: '<pre><code>answer</code></pre>', tabSize: 3})
        editor.commands.setTextSelection(1)
        const handled = editor.view.someProp('handleKeyDown', handler => handler(
            editor.view,
            new KeyboardEvent('keydown', {key: 'Tab', code: 'Tab', bubbles: true}),
        ))

        expect(handled).toBe(true)
        expect(editor.state.doc.firstChild?.textContent).toBe('   answer')

        const reversed = editor.view.someProp('handleKeyDown', handler => handler(
            editor.view,
            new KeyboardEvent('keydown', {key: 'Tab', code: 'Tab', shiftKey: true, bubbles: true}),
        ))
        expect(reversed).toBe(true)
        expect(editor.state.doc.firstChild?.textContent).toBe('answer')
    })

    it('允许显式关闭代码块 Tab 缩进', () => {
        const editor = createEditor({content: '<pre><code>answer</code></pre>', enableTabIndentation: false})
        editor.commands.setTextSelection(1)
        const handled = editor.view.someProp('handleKeyDown', handler => handler(
            editor.view,
            new KeyboardEvent('keydown', {key: 'Tab', code: 'Tab', bubbles: true}),
        ))

        expect(handled).toBeFalsy()
        expect(editor.state.doc.firstChild?.textContent).toBe('answer')
    })

    it.each([
        ['···js ', 'javascript'],
        ['～～～py ', 'python'],
        ['```ts ', 'typescript'],
    ])('输入围栏 %s 时创建并规范化代码块语言', (input, language) => {
        const editor = createEditor({content: '<p></p>'})
        const position = 1
        editor.commands.setTextSelection(position)
        const handled = editor.view.someProp('handleTextInput', handler => handler(
            editor.view,
            position,
            position,
            input,
        ))

        expect(handled).toBe(true)
        expect(editor.getAttributes('codeBlock').language).toBe(language)
    })

    it('支持自定义语言名称、顺序和输入别名', () => {
        const languages = [
            {name: 'TypeScript / TSX', value: 'typescript', aliases: ['ts', 'tsx']},
            {name: '纯文本文件', value: 'plaintext', aliases: ['txt']},
        ]
        createEditor({languages})

        const options = [...document.querySelectorAll<HTMLElement>('[data-code-language-value]')]
        expect(options.map((option) => option.textContent)).toEqual(['自动识别', 'TypeScript / TSX', '纯文本文件'])
        expect(normalizeCodeBlockLanguage('TSX', languages)).toBe('typescript')
        expect(normalizeCodeBlockLanguage('unknown', languages)).toBeNull()
    })

    it('自动生成的常用语言配置包含稳定名称和别名', () => {
        const languages = createCodeBlockLanguageOptions(createLowlight(common).listLanguages())
        expect(languages.find((language) => language.value === 'cpp')?.name).toBe('C++')
        expect(normalizeCodeBlockLanguage('HTML', languages)).toBe('xml')
        expect(normalizeCodeBlockLanguage('auto', languages)).toBeNull()
    })
})
