import {describe, expect, it} from 'vitest'
import {UIResolver} from '../../src/tinyui'

describe('UIResolver', () => {
    const resolver = new UIResolver()

    it('resolves nested paths, missing values, and local shadowing', () => {
        const scope = {
            context: {user: {profile: {name: 'Context'}}, nullable: null},
            locals: {user: {profile: {name: 'Local'}}},
        }

        expect(resolver.resolve('user.profile.name', scope)).toBe('Local')
        expect(resolver.resolve('nullable.value', scope)).toBeUndefined()
        expect(resolver.resolve('missing.value', scope)).toBeUndefined()
        expect(resolver.dependency(' user.profile.name ')).toBe('user')
    })

    it.each([
        ['true', true],
        ['false', false],
        ['null', null],
        ['undefined', undefined],
        ['12', 12],
        ['-2.5', -2.5],
        ['.75', 0.75],
        ["'hello'", 'hello'],
        ['"world"', 'world'],
    ])('resolves the literal %s', (expression, expected) => {
        expect(resolver.resolve(expression, {context: {}, locals: {}})).toBe(expected)
    })

    it('compiles multiple interpolations and normalizes nullish values', () => {
        const source = '{{ greeting }}, {{ user.name }}! {{ missing }}'
        const interpolation = resolver.compileInterpolation(source)!
        const scope = {
            context: {greeting: 'Hello', user: {name: 'Michael'}, missing: null},
            locals: {},
        }

        expect(interpolation.dependencies).toEqual(new Set(['greeting', 'user', 'missing']))
        expect(interpolation.evaluate(scope)).toBe('Hello, Michael! ')
        expect(resolver.compileInterpolation(source)).toBe(interpolation)
        expect(resolver.compileInterpolation('plain text')).toBeUndefined()
        expect(resolver.compileInterpolation('plain text')).toBeUndefined()
    })

    it.each(['count + 1', 'items[0]', 'call()', '', 'foo?.bar']) (
        'rejects executable or unsupported expression %s',
        (expression) => {
            expect(() => resolver.assertExpression(expression)).toThrow(
                'only supports property paths and literals',
            )
        },
    )
})
