import {describe, expect, it, vi} from 'vitest'
import type {AiGenerateRequest} from '../../../src/ai'
import type {AiEditorProductContext} from '../../../src/editor/AiEditorProduct'
import {registerEditorTheme} from '../../../src/editor/AiEditorTheme'
import {AiSidebarItem} from '../../../src/features/sidebar'

interface EditorFixture {
    context: AiEditorProductContext
    selection: {from: number; to: number; empty: boolean}
}

function createFixture(selectedText = ''): EditorFixture {
    const editorDom = document.createElement('div')
    const selection = {
        from: selectedText ? 1 : 0,
        to: selectedText ? selectedText.length + 1 : 0,
        empty: !selectedText,
    }
    const editor = {
        view: {dom: editorDom},
        state: {
            selection,
            doc: {textBetween: vi.fn(() => selectedText)},
        },
        isEditable: true,
    } as unknown as AiEditorProductContext['editor']
    const root = document.createElement('div')
    const content = document.createElement('main')
    const sidebar = document.createElement('aside')
    root.append(content, sidebar)
    return {
        selection,
        context: {
            editor,
            i18n: {t: (value: string) => value} as AiEditorProductContext['i18n'],
            root,
            content,
            sidebar,
            uploader: undefined,
        },
    }
}

function createItem(generate = vi.fn(async () => ({text: 'Done'})), configured = true): AiSidebarItem {
    return new AiSidebarItem({
        generate,
        isConfigured: () => configured,
        applyToolProposal: () => ({ok: true, message: 'Applied'}),
    })
}

describe('AiSidebarItem TinyUI view', () => {
    it('mounts the existing accessible shell and Lucide components through TinyUI', () => {
        const {context} = createFixture()
        const host = document.createElement('div')
        const item = createItem()

        item.mountContent(context, host)

        const panel = host.querySelector<HTMLElement>('.aieditor__ai-chat--sidebar')!
        expect(panel.tagName).toBe('SECTION')
        expect(panel.id).toMatch(/^aieditor-ai-chat-\d+$/)
        expect(panel.getAttribute('role')).toBe('region')
        expect(panel.getAttribute('aria-label')).toBe('AI assistant')
        expect(panel.querySelector('[role="log"]')?.getAttribute('aria-live')).toBe('polite')
        expect(panel.querySelector('.aieditor__ai-chat-markdown')?.textContent).toContain('Welcome to AiEditor Assistant')
        expect(panel.querySelectorAll('.aieditor__ai-chat-header svg')).toHaveLength(1)
        expect(panel.querySelector('.aieditor__ai-chat-scope svg')).not.toBeNull()
        expect(panel.querySelector<HTMLButtonElement>('[aria-label="Scroll to latest message"]')?.hidden).toBe(true)
        expect(panel.querySelector<HTMLButtonElement>('[aria-label="Send message"]')?.disabled).toBe(true)
    })

    it('marks the panel with the editor theme so dark tokens override local defaults', () => {
        const {context} = createFixture()
        const host = document.createElement('div')
        const item = createItem()
        registerEditorTheme(context.editor, context.root, 'dark')

        item.mountContent(context, host)

        const panel = host.querySelector<HTMLElement>('.aieditor__ai-chat')!
        expect(panel.dataset.theme).toBe('dark')
        expect(panel.dataset.aieditorOwner).toMatch(/^aieditor-/)
        item.destroy()
    })

    it('updates composer availability and sends on Enter but not Shift+Enter', async () => {
        const generate = vi.fn(async () => ({text: 'TinyUI response'}))
        const {context} = createFixture()
        const host = document.createElement('div')
        const item = createItem(generate)
        item.mountContent(context, host)
        const input = host.querySelector('textarea')!
        const send = host.querySelector<HTMLButtonElement>('.aieditor__ai-chat-send')!

        input.value = 'Question'
        input.dispatchEvent(new Event('input', {bubbles: true}))
        expect(send.disabled).toBe(false)

        input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', shiftKey: true, bubbles: true}))
        expect(generate).not.toHaveBeenCalled()
        const enter = new KeyboardEvent('keydown', {key: 'Enter', bubbles: true, cancelable: true})
        input.dispatchEvent(enter)
        await vi.waitFor(() => expect(generate).toHaveBeenCalledOnce())
        await vi.waitFor(() => expect(host.textContent).toContain('TinyUI response'))

        expect(enter.defaultPrevented).toBe(true)
        expect(generate.mock.calls[0][0]).toMatchObject({prompt: 'Question', scope: 'document', stream: true})
        expect(input.value).toBe('')
        expect(send.disabled).toBe(true)
    })

    it('switches the TinyUI busy state to a stop action and aborts from form submit', async () => {
        let request: AiGenerateRequest | undefined
        const generate = vi.fn((value: AiGenerateRequest) => new Promise<{text: string}>((resolve, reject) => {
            request = value
            value.signal?.addEventListener('abort', () => reject(new DOMException('Stopped', 'AbortError')), {once: true})
            void resolve
        }))
        const {context} = createFixture()
        const host = document.createElement('div')
        const item = createItem(generate)
        item.mountContent(context, host)
        const input = host.querySelector('textarea')!
        const form = host.querySelector('form')!

        input.value = 'Long request'
        input.dispatchEvent(new Event('input', {bubbles: true}))
        form.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}))
        await vi.waitFor(() => expect(request).toBeDefined())

        const panel = host.querySelector<HTMLElement>('.aieditor__ai-chat')!
        const stop = host.querySelector<HTMLButtonElement>('.aieditor__ai-chat-send')!
        expect(panel.classList.contains('is-busy')).toBe(true)
        expect(panel.querySelector('[role="log"]')?.getAttribute('aria-busy')).toBe('true')
        expect(stop.getAttribute('aria-label')).toBe('Stop generating')
        expect(stop.disabled).toBe(false)

        form.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}))
        await vi.waitFor(() => expect(request?.signal?.aborted).toBe(true))
        await vi.waitFor(() => expect(panel.classList.contains('is-busy')).toBe(false))
        expect(host.textContent).toContain('Generation stopped')
    })

    it('disables an unconfigured composer while keeping the explanatory placeholder', () => {
        const {context} = createFixture()
        const host = document.createElement('div')
        createItem(vi.fn(), false).mountContent(context, host)

        expect(host.querySelector<HTMLTextAreaElement>('textarea')?.disabled).toBe(true)
        expect(host.querySelector<HTMLTextAreaElement>('textarea')?.placeholder).toBe('Configure an AI service to start chatting')
        expect(host.querySelector<HTMLSelectElement>('select')?.disabled).toBe(true)
        expect(host.querySelector<HTMLButtonElement>('.aieditor__ai-chat-send')?.disabled).toBe(true)
    })

    it('reacts to selection changes and falls back from an invalid selection scope', () => {
        const fixture = createFixture('selected text')
        const host = document.createElement('div')
        const item = createItem()
        item.mountContent(fixture.context, host)
        const select = host.querySelector('select')!
        const selection = select.querySelector<HTMLOptionElement>('option[value="selection"]')!
        expect(selection.disabled).toBe(false)

        select.value = 'selection'
        select.dispatchEvent(new Event('change', {bubbles: true}))
        fixture.selection.from = 0
        fixture.selection.to = 0
        fixture.selection.empty = true
        vi.mocked(fixture.context.editor.state.doc.textBetween).mockReturnValue('')
        item.updateContent(fixture.context)

        expect(selection.disabled).toBe(true)
        expect(select.value).toBe('document')
    })

    it('destroys TinyUI shell listeners and supports a clean remount', () => {
        const generate = vi.fn(async () => ({text: 'Done'}))
        const {context} = createFixture()
        const firstHost = document.createElement('div')
        const item = createItem(generate)
        item.mountContent(context, firstHost)
        const detachedForm = firstHost.querySelector('form')!
        const detachedInput = firstHost.querySelector('textarea')!
        detachedInput.value = 'Should not send'

        item.destroy()
        expect(firstHost.children).toHaveLength(0)
        detachedForm.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}))
        expect(generate).not.toHaveBeenCalled()

        const secondHost = document.createElement('div')
        item.mountContent(context, secondHost)
        expect(secondHost.querySelector('.aieditor__ai-chat')).not.toBeNull()
        item.destroy()
    })
})
