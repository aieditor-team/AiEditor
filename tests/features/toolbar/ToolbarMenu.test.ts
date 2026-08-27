import {afterEach, describe, expect, it} from 'vitest'
import {AiEditorI18n} from '../../../src/i18n/AiEditorI18n'
import {MenuItem} from '../../../src/menus/core/MenuItem'
import type {MenuContext} from '../../../src/menus/core/MenuContext'
import {ToolbarMenu} from '../../../src/features/toolbar/ToolbarMenu'
import {resolveToolbarItems} from '../../../src/features/toolbar/resolve-toolbar-items'
import {createTestEditor} from '../../helpers/editor'

class ToolItem extends MenuItem {
    render(context: MenuContext): HTMLElement {
        const button = context.editor.view.dom.ownerDocument.createElement('button')
        button.setAttribute('aria-label', this.id)
        return button
    }
}

const editors: ReturnType<typeof createTestEditor>[] = []
const toolbars: ToolbarMenu[] = []
afterEach(() => {
    toolbars.splice(0).forEach((toolbar) => toolbar.destroy())
    editors.splice(0).forEach((editor) => editor.destroy())
})

function mount(): {toolbar: ToolbarMenu; container: HTMLElement} {
    const editor = createTestEditor()
    editors.push(editor)
    const container = document.createElement('div')
    document.body.append(container)
    const items = [new ToolItem('a'), new ToolItem('b'), new ToolItem('c')]
    const toolbar = new ToolbarMenu(container, items, {}, items)
    toolbar.mount(editor, new AiEditorI18n())
    toolbars.push(toolbar)
    return {toolbar, container}
}

describe('ToolbarMenu', () => {
    it('校验风格、大小、溢出和 sticky 参数', () => {
        const {toolbar, container} = mount()
        toolbar.setStyle('classic')
        toolbar.setSize('large')
        toolbar.setOverflow('scroll')
        toolbar.setSticky(true, 12)
        expect(container.dataset).toMatchObject({
            toolbarStyle: 'classic',
            toolbarSize: 'large',
            toolbarOverflow: 'scroll',
            toolbarSticky: 'true',
        })
        expect(container.style.getPropertyValue('--aieditor-toolbar-sticky-offset')).toBe('12px')
        expect(() => toolbar.setStyle('invalid' as never)).toThrow('Unsupported')
        expect(() => toolbar.setSize('invalid' as never)).toThrow('Unsupported')
        expect(() => toolbar.setOverflow('invalid' as never)).toThrow('Unsupported')
        expect(() => toolbar.setSticky(true, -1)).toThrow('non-negative')
    })

    it('运行时 setItems 接受字符串、自定义实例和递归菜单组', () => {
        const {toolbar, container} = mount()
        const custom = new ToolItem('custom')

        toolbar.setItems([
            'c',
            {
                key: 'format',
                label: 'Format',
                items: [
                    'a',
                    {key: 'more-format', label: 'More format', items: [custom]},
                ],
            },
        ])

        expect(container.querySelectorAll(':scope > [data-menu-item]')).toHaveLength(2)
        expect(container.querySelector('[data-menu-item="c"]')).not.toBeNull()
        expect(container.querySelector('[data-menu-item="format"]')).not.toBeNull()
        expect(document.body.querySelector('[aria-label="More format"]')).not.toBeNull()
    })

    it('Ribbon 使用分隔符生成无标题分组并隐藏分隔符', () => {
        const editor = createTestEditor()
        editors.push(editor)
        const container = document.createElement('div')
        document.body.append(container)
        const defaults = [new ToolItem('a'), new ToolItem('b'), new ToolItem('c')]
        const items = resolveToolbarItems(['a', 'b', '|', 'c'], defaults)
        const toolbar = new ToolbarMenu(container, items, {style: 'ribbon'}, defaults)
        toolbar.mount(editor, new AiEditorI18n())
        toolbars.push(toolbar)

        const groups = container.querySelectorAll(':scope > .aieditor__toolbar-group')
        expect(groups).toHaveLength(2)
        expect(groups[0].querySelectorAll('[data-menu-item]')).toHaveLength(2)
        expect(groups[1].querySelector('[data-menu-item="c"]')).not.toBeNull()
        expect(container.querySelector('.aieditor__toolbar-group-label')).toBeNull()
        const separator = container.querySelector<HTMLElement>(':scope > .aieditor__separator')
        expect(separator?.hidden).toBe(true)
        expect(separator?.getAttribute('aria-hidden')).toBe('true')
    })

    it('Ribbon 忽略开头、结尾和连续分隔符，不生成空分组', () => {
        const editor = createTestEditor()
        editors.push(editor)
        const container = document.createElement('div')
        document.body.append(container)
        const defaults = [new ToolItem('a'), new ToolItem('b')]
        const items = resolveToolbarItems(['|', '|', 'a', '|', '|', 'b', '|'], defaults)
        const toolbar = new ToolbarMenu(container, items, {style: 'ribbon'}, defaults)
        toolbar.mount(editor, new AiEditorI18n())
        toolbars.push(toolbar)

        const groups = [...container.querySelectorAll(':scope > .aieditor__toolbar-group')]
        expect(groups).toHaveLength(2)
        expect(groups.map((group) => group.querySelectorAll('[data-menu-item]').length)).toEqual([1, 1])
        expect(container.querySelectorAll(':scope > .aieditor__separator')).toHaveLength(5)
    })

    it('在 Ribbon 与普通样式之间切换时恢复原顺序和分隔符', () => {
        const editor = createTestEditor()
        editors.push(editor)
        const container = document.createElement('div')
        document.body.append(container)
        const defaults = [new ToolItem('a'), new ToolItem('b')]
        const items = resolveToolbarItems(['a', '|', 'b'], defaults)
        const toolbar = new ToolbarMenu(container, items, {style: 'ribbon'}, defaults)
        toolbar.mount(editor, new AiEditorI18n())
        toolbars.push(toolbar)

        toolbar.setStyle('classic')
        expect([...container.children].map((element) => (element as HTMLElement).dataset.menuItem)).toEqual([
            'a', 'separator-custom-0', 'b',
        ])
        expect(container.querySelector<HTMLElement>('.aieditor__separator')?.hidden).toBe(false)
        expect(container.querySelector('.aieditor__toolbar-group')).toBeNull()

        toolbar.setStyle('compact')
        expect(container.querySelector<HTMLElement>('.aieditor__separator')?.hidden).toBe(false)
        expect(container.querySelector('.aieditor__toolbar-group')).toBeNull()

        toolbar.setStyle('ribbon')
        expect(container.querySelectorAll(':scope > .aieditor__toolbar-group')).toHaveLength(2)
        expect(container.querySelector<HTMLElement>(':scope > .aieditor__separator')?.hidden).toBe(true)
    })
})
