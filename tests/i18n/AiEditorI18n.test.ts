import {describe, expect, it, vi} from 'vitest'
import {AiEditorI18n} from '../../src/i18n/AiEditorI18n'

describe('AiEditorI18n', () => {
    it('合并自定义翻译并回退源文案', () => {
        const i18n = new AiEditorI18n('zh-CN', {'zh-CN': {Bold: '粗体'}})
        expect(i18n.t('Bold')).toBe('粗体')
        expect(i18n.t('Unknown source')).toBe('Unknown source')
    })

    it('只在 locale 真正变化时通知订阅者', () => {
        const i18n = new AiEditorI18n()
        const listener = vi.fn()
        const unsubscribe = i18n.subscribe(listener)
        i18n.setLocale('zh-CN')
        i18n.setLocale('en-US')
        unsubscribe()
        i18n.setLocale('zh-CN')
        expect(listener).toHaveBeenCalledTimes(1)
    })
})
