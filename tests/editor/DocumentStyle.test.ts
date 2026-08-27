import {describe, expect, it} from 'vitest'
import {
    applyDocumentStyle,
    copyDocumentStyle,
    DOCUMENT_STYLE_CSS_PROPERTIES,
    extendDocumentStyle,
    resolveDocumentStyle,
} from '../../src/editor/AiEditorDocumentStyle'

describe('document style', () => {
    it('逐层合并预设并返回深度不可变结果', () => {
        const style = resolveDocumentStyle({
            preset: 'word',
            styleName: 'custom-contract',
            body: {fontSize: '18px'},
            headings: {2: {color: 'red'}},
            grid: {charactersPerLine: 40, linesPerPage: 30},
        })
        expect(style.body.fontSize).toBe('18px')
        expect(style.headings[2].color).toBe('red')
        expect(style.headings[1].fontSize).toBeTruthy()
        expect(style.grid).toEqual({charactersPerLine: 40, linesPerPage: 30})
        expect(style.styleName).toBe('custom-contract')
        expect(Object.isFrozen(style)).toBe(true)
        expect(Object.isFrozen(style.headings[2])).toBe(true)
    })

    it('验证预设、网格和页面尺寸边界', () => {
        expect(() => resolveDocumentStyle('missing' as never)).toThrow('Unsupported')
        expect(() => resolveDocumentStyle({preset: 'web', grid: {charactersPerLine: 0}})).toThrow('positive integer')
        expect(() => resolveDocumentStyle({preset: 'web', page: {format: 'Missing' as never}})).toThrow()
    })

    it('从完整样式继续派生且不修改源对象', () => {
        const source = resolveDocumentStyle({preset: 'web', body: {color: 'black'}})
        const derived = extendDocumentStyle(source, {body: {color: 'blue'}, grid: false})
        expect(source.body.color).toBe('black')
        expect(derived.body.color).toBe('blue')
        expect(derived.grid).toBe(false)
    })

    it('应用并复制文档 CSS 变量', () => {
        const source = document.createElement('div')
        const target = document.createElement('div')
        const resolved = applyDocumentStyle(source, {preset: 'web', body: {color: 'rgb(1, 2, 3)'}})
        expect(source.dataset.documentStyle).toBe('web')
        expect(resolved.body.color).toBe('rgb(1, 2, 3)')
        copyDocumentStyle(source, target)
        expect(target.dataset.documentStyle).toBe('web')
        expect(DOCUMENT_STYLE_CSS_PROPERTIES.some((property) => target.style.getPropertyValue(property))).toBe(true)
    })
})
