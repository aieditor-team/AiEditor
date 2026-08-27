import {afterEach, describe, expect, it, vi} from 'vitest'
import {AiEditorI18n} from '../../../src/i18n/AiEditorI18n'
import {AiBubbleMenuItem} from '../../../src/features/bubble/AiBubbleMenuItem'
import {createTestEditor} from '../../helpers/editor'

const editors: ReturnType<typeof createTestEditor>[] = []
const items: AiBubbleMenuItem[] = []
afterEach(() => {
    items.splice(0).forEach((item) => item.destroy())
    editors.splice(0).forEach((editor) => editor.destroy())
})

function deferred<T>() {
    let resolve!: (value: T) => void
    const promise = new Promise<T>((done) => { resolve = done })
    return {promise, resolve}
}

async function flush(): Promise<void> {
    await Promise.resolve()
    await Promise.resolve()
}

describe('AiBubbleMenuItem', () => {
    it('销毁时取消请求且不再回写异步结果', async () => {
        const editor = createTestEditor('<p>hello</p>')
        editors.push(editor)
        editor.commands.setTextSelection({from: 1, to: 6})
        const pending = deferred<{text: string}>()
        let signal: AbortSignal | undefined
        const item = new AiBubbleMenuItem({
            isConfigured: () => true,
            generate: (request) => {
                signal = request.signal
                return pending.promise
            },
        })
        items.push(item)
        const container = document.createElement('div')
        item.mount(container, {editor, i18n: new AiEditorI18n()})
        container.querySelector<HTMLButtonElement>('button')!.click()
        document.querySelector<HTMLButtonElement>('[data-ai-action="improve"]')!.click()
        expect(signal?.aborted).toBe(false)
        item.destroy()
        pending.resolve({text: 'updated'})
        await flush()
        expect(signal?.aborted).toBe(true)
        expect(document.querySelector('.aieditor__ai-menu')).toBeNull()
        items.pop()
    })

    it('只读编辑器不会应用生成结果', async () => {
        const editor = createTestEditor('<p>hello</p>')
        editors.push(editor)
        editor.commands.setTextSelection({from: 1, to: 6})
        editor.setEditable(false)
        const item = new AiBubbleMenuItem({isConfigured: () => true, generate: async () => ({text: 'changed'})})
        items.push(item)
        const container = document.createElement('div')
        item.mount(container, {editor, i18n: new AiEditorI18n()})
        container.querySelector<HTMLButtonElement>('button')!.click()
        document.querySelector<HTMLButtonElement>('[data-ai-action="improve"]')!.click()
        await flush()
        const replace = [...document.querySelectorAll<HTMLButtonElement>('.aieditor__ai-decision')]
            .find((button) => button.textContent?.includes('替换'))
        replace?.click()
        expect(editor.getText()).toBe('hello')
        expect(document.querySelector('.aieditor__ai-hint')?.textContent).toContain('只读')
    })

    it('选区内容变化后拒绝应用旧结果', async () => {
        const editor = createTestEditor('<p>hello</p>')
        editors.push(editor)
        editor.commands.setTextSelection({from: 1, to: 6})
        const item = new AiBubbleMenuItem({isConfigured: () => true, generate: async () => ({text: 'changed'})})
        items.push(item)
        const container = document.createElement('div')
        item.mount(container, {editor, i18n: new AiEditorI18n()})
        container.querySelector<HTMLButtonElement>('button')!.click()
        document.querySelector<HTMLButtonElement>('[data-ai-action="improve"]')!.click()
        await flush()
        editor.commands.insertContentAt({from: 1, to: 6}, 'other')
        const replace = [...document.querySelectorAll<HTMLButtonElement>('.aieditor__ai-decision')]
            .find((button) => button.textContent?.includes('替换'))
        replace?.click()
        expect(editor.getText()).toBe('other')
        expect(document.querySelector('.aieditor__ai-hint')?.textContent).toContain('文档已发生变化')
    })
})
