import {afterEach, describe, expect, it, vi} from 'vitest'
import {AiEditorI18n} from '../../../src/i18n/AiEditorI18n'
import {SeparatorMenuItem} from '../../../src/menus/core/SeparatorMenuItem'
import {TextBubbleMenu} from '../../../src/features/bubble/TextBubbleMenu'
import {ToolbarMenuGroupItem} from '../../../src/menus/core/ToolbarMenuGroupItem'
import {createTestEditor} from '../../helpers/editor'

const editors: ReturnType<typeof createTestEditor>[] = []
const menus: TextBubbleMenu[] = []

afterEach(() => {
    menus.splice(0).forEach((menu) => menu.destroy())
    editors.splice(0).forEach((editor) => editor.destroy())
})

describe('TextBubbleMenu', () => {
    it('AI 可用时将 AI 操作放在普通文字气泡菜单第一项', () => {
        const ai = {
            generate: vi.fn(),
            isConfigured: () => true,
        }
        const menu = new TextBubbleMenu({}, ai)
        const editor = createTestEditor('<p>hello</p>')
        menus.push(menu)
        editors.push(editor)

        menu.mount(editor, new AiEditorI18n())

        expect(menu.getItems().map((item) => item.id).slice(0, 2)).toEqual(['bubble-ai', 'bold'])
    })

    it('items 显式配置的顺序和内容优先于 AI 默认顺序', () => {
        const ai = {
            generate: vi.fn(),
            isConfigured: () => true,
        }
        const menu = new TextBubbleMenu({
            items: ['italic', 'bubble-ai', 'bold'],
        }, ai)
        const editor = createTestEditor('<p>hello</p>')
        menus.push(menu)
        editors.push(editor)

        menu.mount(editor, new AiEditorI18n())

        expect(menu.getItems().map((item) => item.id)).toEqual(['italic', 'bubble-ai', 'bold'])
    })

    it('items 支持默认 Key、分隔符和声明式按钮', () => {
        const onClick = vi.fn()
        const menu = new TextBubbleMenu({
            items: ['bold', '|', {
                type: 'button',
                key: 'annotate-selection',
                label: '添加批注',
                text: '批注',
                onClick,
            }],
        })
        const editor = createTestEditor('<p>hello</p>')
        const i18n = new AiEditorI18n()
        menus.push(menu)
        editors.push(editor)

        menu.mount(editor, i18n)
        expect(menu.getItems().map((item) => item.id)).toEqual([
            'bold', 'separator-custom-0', 'annotate-selection',
        ])
        expect(menu.getItems()[1]).toBeInstanceOf(SeparatorMenuItem)

        menu.element.querySelector<HTMLButtonElement>('[data-menu-item="annotate-selection"]')?.click()
        expect(onClick).toHaveBeenCalledOnce()
        expect(onClick.mock.calls[0][0]).toMatchObject({editor, i18n})
        expect(onClick.mock.calls[0][0].event).toBeInstanceOf(MouseEvent)
    })

    it('回调形式可以返回包含嵌套组的 MenuItemConfig', () => {
        const menu = new TextBubbleMenu({
            items: (defaults) => [{
                type: 'group',
                key: 'text-format',
                label: '文字格式',
                items: [
                    defaults.find((item) => item.id === 'bold')!,
                    {
                        type: 'button',
                        key: 'custom-format',
                        label: '自定义格式',
                        onClick: () => undefined,
                    },
                ],
            }],
        })
        const editor = createTestEditor('<p>hello</p>')
        menus.push(menu)
        editors.push(editor)
        menu.mount(editor, new AiEditorI18n())

        expect(menu.getItems()).toHaveLength(1)
        expect(menu.getItems()[0]).toBeInstanceOf(ToolbarMenuGroupItem)
        expect(menu.getItems()[0].id).toBe('text-format')
        const trigger = menu.element.querySelector<HTMLButtonElement>('.aieditor__toolbar-menu-group-trigger')
        expect(trigger).not.toBeNull()
        expect(trigger?.disabled).toBe(false)
        expect(document.body.querySelectorAll('.aieditor__toolbar-menu-group-panel [data-menu-item]')).toHaveLength(2)
    })
})
