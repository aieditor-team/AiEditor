import {describe, expect, it} from 'vitest'
import {clampInteger, parseArguments, requireEnum, requireInteger, requireString} from '../../src/ai/tools/core/tool-utils'

describe('tool utils', () => {
    it('只接受 JSON 对象参数', () => {
        expect(parseArguments('{"value":1}')).toEqual({value: 1})
        expect(parseArguments('')).toEqual({})
        for (const value of ['null', '[]', '{']) expect(() => parseArguments(value)).toThrow('JSON object')
    })

    it('严格读取字符串、整数和枚举', () => {
        expect(requireString({name: 'x'}, 'name')).toBe('x')
        expect(requireString({name: ''}, 'name', true)).toBe('')
        expect(requireInteger({count: 2}, 'count')).toBe(2)
        expect(requireEnum({mode: 'a'}, 'mode', ['a', 'b'])).toBe('a')
        expect(() => requireInteger({count: 1.5}, 'count')).toThrow()
        expect(() => requireEnum({mode: 'c'}, 'mode', ['a', 'b'])).toThrow()
    })

    it('限制可选整数范围并为无效值提供默认值', () => {
        expect(clampInteger(100, 5, 1, 10)).toBe(10)
        expect(clampInteger(-2, 5, 1, 10)).toBe(1)
        expect(clampInteger('3', 5, 1, 10)).toBe(5)
    })
})
