import {describe, expect, it, vi} from 'vitest'
import {html, type TinyUIComponent} from '../../src/tinyui'

describe('TinyUI components', () => {
    it('passes static, interpolated, and property props with cloned children', () => {
        const render = vi.fn<TinyUIComponent>((props, context) => {
            const output = context.document.createElement('output')
            output.dataset.static = String(props.label)
            output.dataset.message = String(props.message)
            output.dataset.count = String(props.count)
            output.append(context.children)
            return output
        })
        const view = html(`
            <div><Panel label="Fixed" message="Hello {{ name }}" :count="count"><b>Child</b></Panel></div>
        `, {name: 'Michael', count: 2, components: {Panel: render}})
        const output = view.root.querySelector('output')!

        expect(output.dataset).toMatchObject({static: 'Fixed', message: 'Hello Michael', count: '2'})
        expect(output.querySelector('b')?.textContent).toBe('Child')
    })

    it('skips rendering when bound props are unchanged', () => {
        const render = vi.fn<TinyUIComponent>((props, context) => {
            const element = context.document.createElement('span')
            element.textContent = String(props.name)
            return element
        })
        const view = html('<div><Name :name="name" /></div>', {
            name: 'Same',
            unrelated: 0,
            components: {Name: render},
        })

        view.update({unrelated: 1})
        view.update({name: 'Same'})
        expect(render).toHaveBeenCalledOnce()

        view.update({name: 'Changed'})
        expect(render).toHaveBeenCalledTimes(2)
        expect(view.root.textContent).toBe('Changed')
    })

    it('supports text, number, and empty component results', () => {
        const Text = (): string => 'Text'
        const NumberValue = (): number => 7
        const Empty = (): null => null
        const view = html('<div><Text /><NumberValue /><Empty /><span>End</span></div>', {
            components: {Text, NumberValue, Empty},
        })

        expect(view.root.textContent).toBe('Text7End')
    })

    it('destroys a nested UIView returned by a component', () => {
        const click = vi.fn()
        let childButton: HTMLButtonElement | undefined
        const Child: TinyUIComponent = () => {
            const child = html('<button @click="click">Child</button>', {click})
            childButton = child.root as HTMLButtonElement
            return child
        }
        const parent = html('<div><Child /></div>', {components: {Child}})

        childButton!.click()
        parent.destroy()
        childButton!.click()

        expect(click).toHaveBeenCalledOnce()
    })

    it('cleans component root events when dynamic props replace the root', () => {
        const submit = vi.fn()
        const Form: TinyUIComponent = (props, context) => {
            const form = context.document.createElement('form')
            form.dataset.version = String(props.version)
            return form
        }
        const view = html('<div><Form #form :version="version" @submit="submit" /></div>', {
            version: 1,
            submit,
            components: {Form},
        })
        const oldForm = view.refs.form

        view.update({version: 2})
        oldForm.dispatchEvent(new Event('submit'))
        view.refs.form.dispatchEvent(new Event('submit'))

        expect(submit).toHaveBeenCalledOnce()
        expect(view.refs.form.dataset.version).toBe('2')
    })

    it('requires an element result when a component declares events', () => {
        const Text = (): string => 'Text'
        expect(() => html('<div><Text @click="click" /></div>', {
            click: vi.fn(),
            components: {Text},
        })).toThrow('must render an element to receive events')
    })

    it('lets explicit options override inline component registrations', () => {
        const Inline = (): HTMLElement => document.createElement('i')
        const Override = (): HTMLElement => document.createElement('b')
        const view = html('<div><Mark /></div>', {components: {Mark: Inline}}, {
            components: {Mark: Override},
        })

        expect(view.root.firstElementChild?.tagName).toBe('B')
    })

    it('uses the supplied Document for template and component DOM', () => {
        const isolatedDocument = document.implementation.createHTMLDocument('TinyUI')
        const Item: TinyUIComponent = (_props, context) => context.document.createElement('span')
        const view = html('<div><Item /></div>', {}, {
            document: isolatedDocument,
            components: {Item},
        })

        expect(view.root.ownerDocument).toBe(isolatedDocument)
        expect(view.root.firstElementChild?.ownerDocument).toBe(isolatedDocument)
    })
})
