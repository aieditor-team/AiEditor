import {afterEach, describe, expect, it, vi} from 'vitest'
import {FloatingDialog} from '../../src/menus/core/FloatingDialog'

const dialogs: FloatingDialog[] = []
afterEach(() => dialogs.splice(0).forEach((dialog) => dialog.destroy()))

describe('FloatingDialog', () => {
    it('显示、外部点击和 Escape 使用统一关闭生命周期', () => {
        const trigger = document.createElement('button')
        const form = document.createElement('form')
        const input = document.createElement('input')
        form.append(input)
        document.body.append(trigger)
        const onClose = vi.fn()
        const dialog = new FloatingDialog(trigger, form, {labelledBy: 'title', initialFocus: input, onClose})
        dialogs.push(dialog)
        dialog.show()
        expect(dialog.open).toBe(true)
        expect(trigger.getAttribute('aria-expanded')).toBe('true')
        dialog.element.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
        expect(dialog.open).toBe(false)
        expect(onClose).toHaveBeenCalledWith('cancel')
        dialog.show()
        document.documentElement.dispatchEvent(new MouseEvent('click', {bubbles: true}))
        expect(dialog.open).toBe(false)
    })
})
