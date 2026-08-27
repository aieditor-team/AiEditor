import {describe, expect, it, vi} from 'vitest'
import {getTextStatistics} from '../../src/editor/AiEditorTextStatistics'

describe('getTextStatistics', () => {
    it('按自然语言统计中英文词语', () => {
        expect(getTextStatistics('你好世界 hello world', 'zh-CN')).toEqual({words: 4, characters: 16})
    })

    it('按字素统计 emoji 和组合字符', () => {
        expect(getTextStatistics('👨‍👩‍👧‍👦 e\u0301', 'zh-CN')).toEqual({words: 1, characters: 3})
    })

    it('正确处理空白文本', () => {
        expect(getTextStatistics(' \n\t ')).toEqual({words: 0, characters: 0})
    })

    it('在 Intl.Segmenter 缺失时使用 Unicode 后备算法', () => {
        vi.stubGlobal('Intl', {...Intl, Segmenter: undefined})
        expect(getTextStatistics('中文 hello 👋')).toEqual({words: 3, characters: 10})
        vi.unstubAllGlobals()
    })
})
