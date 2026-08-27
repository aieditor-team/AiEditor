import {describe, expect, it, vi} from 'vitest'
import {html} from '../../src/tinyui'

describe('TinyUI event bindings', () => {
    it('uses the event name as the implicit handler and applies once', () => {
        const click = vi.fn()
        const view = html('<button @click.once>Run</button>', {click})

        view.root.click()
        view.root.click()

        expect(click).toHaveBeenCalledOnce()
    })

    it('supports self and capture modifiers', () => {
        const calls: string[] = []
        const view = html(`
            <section @click.capture="capture" @click.self="self">
                <button @click="child">Run</button>
            </section>
        `, {
            capture: () => calls.push('capture'),
            self: () => calls.push('self'),
            child: () => calls.push('child'),
        })

        view.root.querySelector('button')!.click()
        expect(calls).toEqual(['capture', 'child'])

        view.root.dispatchEvent(new MouseEvent('click', {bubbles: true}))
        expect(calls).toEqual(['capture', 'child', 'capture', 'self'])
    })

    it('throws when an event handler does not resolve to a function', () => {
        const view = html('<button @click="handler">Run</button>', {handler: 'invalid'})
        const errors: Error[] = []
        const captureError = (event: ErrorEvent): void => {
            errors.push(event.error as Error)
            event.preventDefault()
        }
        window.addEventListener('error', captureError, {once: true})

        view.root.click()

        expect(errors[0]).toBeInstanceOf(TypeError)
        expect(errors[0].message).toContain('is not a function')
    })
})

describe('TinyUI structural directives', () => {
    it('updates bindings inside a mounted if branch and cleans its listeners when hidden', () => {
        const click = vi.fn()
        const view = html(`
            <section>
                <button if="visible" #action @click="click">{{ label }}</button>
            </section>
        `, {visible: true, label: 'First', click})
        const oldButton = view.refs.action

        view.update({label: 'Second'})
        expect(view.refs.action.textContent).toBe('Second')
        view.update({visible: false})
        oldButton.click()

        expect(click).not.toHaveBeenCalled()
        expect(view.refs.action).toBeUndefined()
    })

    it('supports null collections and the default $index local', () => {
        const view = html(`
            <ol><li each="item in items">{{ $index }}={{ item }}</li></ol>
        `, {items: null as string[] | null})

        expect(view.root.children).toHaveLength(0)
        view.update({items: ['A', 'B']})
        expect(Array.from(view.root.children).map((item) => item.textContent)).toEqual(['0=A', '1=B'])
        view.update({items: null})
        expect(view.root.children).toHaveLength(0)
    })

    it('cleans event listeners from replaced list entries', () => {
        const select = vi.fn()
        const view = html(`
            <ul><button each="item in items" @click="select">{{ item }}</button></ul>
        `, {items: ['A'], select})
        const oldButton = view.root.querySelector('button')!

        view.update({items: ['B']})
        oldButton.click()
        view.root.querySelector('button')!.click()

        expect(select).toHaveBeenCalledOnce()
    })

    it('destroys mounted if and each child runtimes with the parent view', () => {
        const click = vi.fn()
        const view = html(`
            <section>
                <button if="visible" #conditional @click="click">Conditional</button>
                <button each="item in items" @click="click">{{ item }}</button>
            </section>
        `, {visible: true, items: ['List'], click})
        const oldButtons = Array.from(view.root.querySelectorAll('button'))

        view.destroy()
        oldButtons.forEach((button) => button.click())

        expect(click).not.toHaveBeenCalled()
        expect(view.refs.conditional).toBeUndefined()
        expect(view.root.children).toHaveLength(0)
    })

    it.each([
        ['<ul><li each="item of items">{{ item }}</li></ul>', {items: []}, 'Invalid TinyUI each expression'],
        ['<ul><li each="item in items">{{ item }}</li></ul>', {items: 'invalid'}, 'must resolve to an array'],
    ])('rejects invalid list input', (template, context, message) => {
        expect(() => html(template, context)).toThrow(message)
    })
})

describe('TinyUI template errors', () => {
    it.each([
        ['<p if="visible">Content</p>', {visible: true}],
        ['<p each="item in items">Content</p>', {items: []}],
    ])('rejects structural directives on the root element', (template, context) => {
        expect(() => html(template, context)).toThrow('root elements cannot use if, each')
    })

    it('rejects a registered component as the root element', () => {
        const Root = (): HTMLElement => document.createElement('div')
        expect(() => html('<Root />', {components: {Root}})).toThrow(
            'root elements cannot use if, each, or a registered component',
        )
    })

    it('rejects empty event and ref names when the HTML parser preserves them', () => {
        expect(() => html('<button @="handler"></button>', {handler: vi.fn()})).toThrow(
            'event names cannot be empty',
        )
        expect(() => html('<div #></div>', {})).toThrow('ref names cannot be empty')
    })
})
