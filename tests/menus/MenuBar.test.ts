import {afterEach, describe, expect, it} from 'vitest'
import {AiEditorI18n} from '../../src/i18n/AiEditorI18n'
import {MenuBar} from '../../src/menus/core/MenuBar'
import {MenuItem} from '../../src/menus/core/MenuItem'
import type {MenuContext} from '../../src/menus/core/MenuContext'
import {createTestEditor} from '../helpers/editor'

class TestItem extends MenuItem {
    constructor(id: string, private readonly shouldThrow = false, private readonly createPortal = false) { super(id) }
    render(context: MenuContext): HTMLElement {
        if (this.createPortal) {
            const portal = context.editor.view.dom.ownerDocument.createElement('div')
            portal.dataset.testPortal = this.id
            context.editor.view.dom.ownerDocument.body.append(portal)
        }
        if (this.shouldThrow) throw new Error('render failed')
        const button = context.editor.view.dom.ownerDocument.createElement('button')
        button.textContent = this.id
        return button
    }
}

const editors: ReturnType<typeof createTestEditor>[] = []
const bars: MenuBar[] = []
afterEach(() => {
    bars.splice(0).forEach((bar) => bar.destroy())
    editors.splice(0).forEach((editor) => editor.destroy())
})

describe('MenuBar', () => {
    it('拒绝重复 ID', () => {
        const editor = createTestEditor()
        editors.push(editor)
        expect(() => new MenuBar(document.createElement('div'), {editor, i18n: new AiEditorI18n()}, [
            new TestItem('same'), new TestItem('same'),
        ])).toThrow('Duplicate')
    })

    it('新菜单渲染失败时保留原菜单', () => {
        const editor = createTestEditor()
        editors.push(editor)
        const container = document.createElement('div')
        const original = new TestItem('original')
        const bar = new MenuBar(container, {editor, i18n: new AiEditorI18n()}, [original])
        bars.push(bar)
        expect(() => bar.setItems([new TestItem('next'), new TestItem('broken', true, true)])).toThrow('render failed')
        expect(container.textContent).toBe('original')
        expect(bar.getItems()).toEqual([original])
        expect(document.querySelector('[data-test-portal="broken"]')).toBeNull()
    })

    it('替换和销毁菜单时清理 DOM', () => {
        const editor = createTestEditor()
        editors.push(editor)
        const container = document.createElement('div')
        const bar = new MenuBar(container, {editor, i18n: new AiEditorI18n()}, [new TestItem('a')])
        bars.push(bar)
        bar.setItems([new TestItem('b')])
        expect(container.textContent).toBe('b')
        bar.destroy()
        expect(container.childElementCount).toBe(0)
        bars.pop()
    })
})
