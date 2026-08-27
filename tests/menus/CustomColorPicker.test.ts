import {describe, expect, it, vi} from 'vitest'
import {CustomColorPicker} from '../../src/menus/core/CustomColorPicker'

describe('CustomColorPicker', () => {
    it('复用统一的主次按钮样式并保留输入校验状态', () => {
        const picker = new CustomColorPicker({
            onApply: vi.fn(),
            onCancel: vi.fn(),
        })
        const cancel = picker.element.querySelector<HTMLButtonElement>('.aieditor__custom-color-cancel')
        const apply = picker.element.querySelector<HTMLButtonElement>('.aieditor__custom-color-apply')
        const hex = picker.element.querySelector<HTMLInputElement>('input[aria-label="Hex"]')

        expect(cancel?.classList.contains('aieditor__button--quiet')).toBe(true)
        expect(apply?.classList.contains('aieditor__button--primary')).toBe(true)
        expect(picker.element.querySelectorAll('.aieditor__custom-color-field input')).toHaveLength(5)

        hex!.value = 'invalid'
        hex!.dispatchEvent(new Event('input', {bubbles: true}))
        expect(hex?.getAttribute('aria-invalid')).toBe('true')
        expect(apply?.disabled).toBe(true)

        picker.destroy()
        expect(document.body.contains(picker.element)).toBe(false)
    })
})
