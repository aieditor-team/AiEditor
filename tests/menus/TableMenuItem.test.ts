import {describe, expect, it, vi} from 'vitest'
import {TableMenuItem} from '../../src/menus/items/table/TableMenuItem'

describe('TableMenuItem', () => {
    it('自定义行列入口使用与更多颜色一致的图标、标签和方向提示结构', () => {
        const item = new TableMenuItem()
        const context = {
            editor: {
                can: () => ({insertTable: () => true}),
                isActive: () => false,
            },
            i18n: {t: (value: string) => value},
        }
        const wrapper = item.render(context as never)
        const trigger = document.body.querySelector<HTMLButtonElement>('.aieditor__table-picker-custom-trigger')
        const children = trigger ? Array.from(trigger.children) : []

        expect(wrapper.querySelector('.aieditor__tool')).not.toBeNull()
        expect(trigger).not.toBeNull()
        expect(children).toHaveLength(3)
        expect(children[0]?.tagName.toLowerCase()).toBe('svg')
        expect(children[0]?.getAttribute('aria-hidden')).toBe('true')
        expect(children[1]?.tagName.toLowerCase()).toBe('span')
        expect(children[1]?.textContent).toBe('Custom rows and columns')
        expect(children[2]?.tagName.toLowerCase()).toBe('svg')
        expect(children[2]?.getAttribute('aria-hidden')).toBe('true')

        item.destroy()
        expect(document.body.querySelector('.aieditor__table-picker')).toBeNull()
        vi.restoreAllMocks()
    })
})
