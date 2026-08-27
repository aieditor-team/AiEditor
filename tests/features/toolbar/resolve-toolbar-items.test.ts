import {afterEach, describe, expect, it, vi} from 'vitest'
import {Sparkles} from 'lucide'
import {AiEditorI18n} from '../../../src/i18n/AiEditorI18n'
import {MenuItem} from '../../../src/menus/core/MenuItem'
import type {MenuContext} from '../../../src/menus/core/MenuContext'
import {SeparatorMenuItem} from '../../../src/menus/core/SeparatorMenuItem'
import {resolveToolbarItems} from '../../../src/features/toolbar/resolve-toolbar-items'
import {ToolbarMenuGroupItem} from '../../../src/menus/core/ToolbarMenuGroupItem'
import {createTestEditor} from '../../helpers/editor'

class TestItem extends MenuItem {
    render(_context: MenuContext): HTMLElement {
        return document.createElement('button')
    }
}

afterEach(() => vi.restoreAllMocks())

describe('resolveToolbarItems', () => {
    it('按照字符串顺序解析默认菜单并保留自定义实例', () => {
        const defaults = [new TestItem('first'), new TestItem('second')]
        const custom = new TestItem('custom')

        expect(resolveToolbarItems(['second', custom, 'first'], defaults)).toEqual([
            defaults[1],
            custom,
            defaults[0],
        ])
    })

    it('将每个 | 解析成具有唯一 ID 的分隔线', () => {
        const items = resolveToolbarItems(['|', new TestItem('separator-custom-1'), '|'], [])

        expect(items[0]).toBeInstanceOf(SeparatorMenuItem)
        expect(items[2]).toBeInstanceOf(SeparatorMenuItem)
        expect(items.map((item) => item.id)).toEqual([
            'separator-custom-0',
            'separator-custom-1',
            'separator-custom-2',
        ])
    })

    it('警告并跳过不存在的菜单 key', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        const available = new TestItem('available')

        expect(resolveToolbarItems(['missing', 'available'], [available])).toEqual([available])
        expect(warn).toHaveBeenCalledWith('[AiEditor] Unknown menu key: missing')
    })

    it('递归解析内联菜单组中的 key、自定义实例和子菜单组', () => {
        const bold = new TestItem('bold')
        const custom = new TestItem('custom')
        const items = resolveToolbarItems([{
            key: 'format',
            label: '格式',
            items: ['bold', {
                key: 'more-format',
                items: [custom],
            }],
        }], [bold])
        const group = items[0] as ToolbarMenuGroupItem
        const groupOptions = group as unknown as {options: {items: MenuItem[]}}
        const childGroup = groupOptions.options.items[1] as ToolbarMenuGroupItem
        const childOptions = childGroup as unknown as {options: {items: MenuItem[]}}

        expect(group).toBeInstanceOf(ToolbarMenuGroupItem)
        expect(group.id).toBe('format')
        expect(groupOptions.options.items[0]).toBe(bold)
        expect(childGroup.id).toBe('more-format')
        expect(childOptions.options.items).toEqual([custom])
    })

    it('解析并挂载声明式按钮，向点击回调传入事件和编辑器上下文', () => {
        const onClick = vi.fn()
        let active = true
        let enabled = true
        const [item] = resolveToolbarItems([{
            type: 'button',
            key: 'custom-action',
            label: '自定义操作',
            tip: '执行自定义操作',
            text: '操作',
            onClick,
            isActive: () => active,
            isEnabled: () => enabled,
        }], [])
        const editor = createTestEditor()
        const i18n = new AiEditorI18n()
        const container = document.createElement('div')

        item.mount(container, {editor, i18n})
        const button = container.querySelector('button') as HTMLButtonElement
        expect(button.textContent).toBe('操作')
        expect(button.title).toBe('执行自定义操作')
        expect(button.getAttribute('aria-label')).toBe('自定义操作')
        expect(button.getAttribute('aria-pressed')).toBe('true')

        button.click()
        expect(onClick).toHaveBeenCalledOnce()
        expect(onClick.mock.calls[0][0]).toMatchObject({editor, i18n})
        expect(onClick.mock.calls[0][0].event).toBeInstanceOf(MouseEvent)

        active = false
        enabled = false
        item.update({editor, i18n})
        expect(button.getAttribute('aria-pressed')).toBe('false')
        expect(button.disabled).toBe(true)
        button.click()
        expect(onClick).toHaveBeenCalledOnce()

        item.destroy()
        editor.destroy()
    })

    it('声明式按钮支持 Lucide 图标，并可嵌套在显式菜单组中', () => {
        const [group] = resolveToolbarItems([{
            type: 'group',
            key: 'custom-group',
            label: '自定义',
            items: [{
                type: 'button',
                key: 'custom-action',
                label: '自定义操作',
                icon: Sparkles,
                onClick: () => undefined,
            }],
        }], []) as ToolbarMenuGroupItem[]
        const groupOptions = group as unknown as {options: {items: MenuItem[]}}
        const editor = createTestEditor()
        const container = document.createElement('div')

        groupOptions.options.items[0].mount(container, {editor, i18n: new AiEditorI18n()})
        expect(container.querySelector('svg')).not.toBeNull()
        expect(container.querySelector('.aieditor__tool--text')).toBeNull()

        groupOptions.options.items[0].destroy()
        editor.destroy()
    })

    it('为无效的 JavaScript 声明式对象提供明确错误', () => {
        expect(() => resolveToolbarItems([{key: 'missing-shape'}] as never, []))
            .toThrow('expected type "button" or a group with an "items" array')
        expect(() => resolveToolbarItems([{
            type: 'button', key: 'missing-click', label: 'Missing click',
        }] as never, [])).toThrow('button "onClick" must be a function')
        expect(() => resolveToolbarItems([{
            type: 'button', key: 'raw-svg', label: 'Raw SVG', icon: '<svg></svg>', onClick: () => undefined,
        }] as never, [])).toThrow('button "icon" must be a Lucide IconNode')
        expect(() => resolveToolbarItems([{
            type: 'group', key: 'invalid-items', items: 'bold',
        }] as never, [])).toThrow('group "items" must be an array')
        expect(() => resolveToolbarItems([{
            type: 'unknown', key: 'unknown', items: [],
        }] as never, [])).toThrow('unsupported type "unknown"')
    })

    it('拒绝在配置树中重复使用同一个菜单或菜单组 ID', () => {
        const bold = new TestItem('bold')

        expect(() => resolveToolbarItems([
            'bold',
            {key: 'format', items: ['bold']},
        ], [bold])).toThrow('Duplicate menu key or id: "bold"')

        expect(() => resolveToolbarItems([
            {type: 'button', key: 'custom', label: 'Custom', onClick: () => undefined},
            {type: 'button', key: 'custom', label: 'Custom again', onClick: () => undefined},
        ], [])).toThrow('Duplicate menu key or id: "custom"')
    })
})
