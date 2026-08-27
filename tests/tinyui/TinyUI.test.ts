import {describe, expect, it, vi} from 'vitest'
import {
    html,
    TinyUI,
    UIAttributeBinding,
    UIEventBinding,
    UIPropertyBinding,
    UITextBinding,
    UITemplate,
    type TinyUIComponent,
    type UIComponent,
} from '../../src/tinyui'

describe('TinyUI', () => {
    it('builds a UIView from focused binding classes', () => {
        const view = TinyUI.html(`
            <section title="{{ title }}">
                <span>{{ title }}</span>
                <input :disabled="busy">
                <button @click="click">Run</button>
            </section>
        `, {title: 'Assistant', busy: false, click: vi.fn()})

        expect(view.bindings.some((binding) => binding instanceof UITextBinding)).toBe(true)
        expect(view.bindings.some((binding) => binding instanceof UIAttributeBinding)).toBe(true)
        expect(view.bindings.some((binding) => binding instanceof UIPropertyBinding)).toBe(true)
        expect(view.bindings.some((binding) => binding instanceof UIEventBinding)).toBe(true)
    })

    it('keeps UITemplate independent from parsing and bindings', () => {
        const template = new UITemplate('<p>{{ message }}</p>', document)

        expect(template.source).toBe('<p>{{ message }}</p>')
        expect(template.root.textContent).toBe('{{ message }}')
    })

    it('updates only text and attribute bindings affected by a patch', () => {
        const state = {title: 'AI Assistant', message: 'Hello', count: 0}
        const view = html(`
            <section title="{{ title }}">
                <h3>{{ title }}</h3>
                <p>{{ message }}</p>
                <button>Count: {{ count }}</button>
            </section>
        `, state)
        const title = view.root.querySelector('h3')!
        const message = view.root.querySelector('p')!
        const button = view.root.querySelector('button')!
        const originalMessageText = message.firstChild

        view.update({count: 1})

        expect(title.textContent).toBe('AI Assistant')
        expect(message.firstChild).toBe(originalMessageText)
        expect(button.textContent).toContain('Count: 1')
        expect(view.root.title).toBe('AI Assistant')
    })

    it('does not write text, attributes, or properties when values are unchanged', () => {
        const view = html(`
            <section title="{{ value }}"><span>{{ value }}</span><input :value="value"></section>
        `, {value: 'Same'})
        const observer = new MutationObserver(() => {})
        observer.observe(view.root, {attributes: true, characterData: true, subtree: true})
        const input = view.root.querySelector('input')!
        let propertyWrites = 0
        Object.defineProperty(input, 'value', {
            configurable: true,
            get: () => 'Same',
            set: () => { propertyWrites += 1 },
        })

        view.update({value: 'Same'})

        expect(observer.takeRecords()).toEqual([])
        expect(propertyWrites).toBe(0)
        observer.disconnect()
    })

    it('binds properties, refs, events, and event modifiers', () => {
        const submit = vi.fn()
        const click = vi.fn()
        const state = {value: 'first', submit, click}
        const view = html(`
            <form @submit.prevent="submit">
                <input #input :value="value">
                <button type="button" @click.stop="click">Run</button>
            </form>
        `, state)
        const parentClick = vi.fn()
        view.root.addEventListener('click', parentClick)
        const input = view.refs.input as HTMLInputElement
        const button = view.root.querySelector('button')!

        expect(input.value).toBe('first')
        view.update({value: 'second'})
        expect(input.value).toBe('second')

        const clickEvent = new MouseEvent('click', {bubbles: true})
        button.dispatchEvent(clickEvent)
        expect(click).toHaveBeenCalledOnce()
        expect(parentClick).not.toHaveBeenCalled()

        const submitEvent = new Event('submit', {bubbles: true, cancelable: true})
        view.root.dispatchEvent(submitEvent)
        expect(submit).toHaveBeenCalledOnce()
        expect(submitEvent.defaultPrevented).toBe(true)
    })

    it('resolves camelCase DOM property names after HTML parsing lowercases attributes', () => {
        const view = html(`
            <section>
                <input :readOnly="readonly" :maxLength="maxLength">
                <button :tabIndex="tabIndex">Run</button>
            </section>
        `, {readonly: true, maxLength: 42, tabIndex: 3})
        const input = view.root.querySelector('input')!
        const button = view.root.querySelector('button')!

        expect(input.readOnly).toBe(true)
        expect(input.maxLength).toBe(42)
        expect(button.tabIndex).toBe(3)

        view.update({readonly: false, maxLength: 12, tabIndex: -1})
        expect(input.readOnly).toBe(false)
        expect(input.maxLength).toBe(12)
        expect(button.tabIndex).toBe(-1)
    })

    it('falls back to assigning custom DOM properties that do not exist on the prototype chain', () => {
        const view = html('<div :custom-state="value"></div>', {value: {ready: true}})
        expect((view.root as unknown as Record<string, unknown>)['custom-state']).toEqual({ready: true})
    })

    it('supports if and hidden directives', () => {
        const view = html(`
            <section>
                <p if="visible" #message>{{ message }}</p>
                <span hidden="collapsed">Details</span>
            </section>
        `, {visible: false, collapsed: false, message: 'Hello'})

        expect(view.root.querySelector('p')).toBeNull()
        expect(view.root.querySelector('span')!.hidden).toBe(false)

        view.update({visible: true, collapsed: true})
        expect(view.root.querySelector('p')?.textContent).toBe('Hello')
        expect(view.refs.message).toBe(view.root.querySelector('p'))
        expect(view.root.querySelector('span')!.hidden).toBe(true)

        view.update({visible: false})
        expect(view.root.querySelector('p')).toBeNull()
        expect(view.refs.message).toBeUndefined()
    })

    it('renders arrays with item and index locals', () => {
        const view = html(`
            <ul>
                <li each="item, index in items">{{ index }}: {{ item.name }} - {{ suffix }}</li>
            </ul>
        `, {items: [{name: 'One'}, {name: 'Two'}], suffix: 'ready'})

        expect(Array.from(view.root.querySelectorAll('li')).map((item) => item.textContent)).toEqual([
            '0: One - ready',
            '1: Two - ready',
        ])

        view.update({suffix: 'done'})
        expect(view.root.lastElementChild?.textContent).toBe('1: Two - done')

        view.update({items: [{name: 'Three'}]})
        expect(view.root.querySelectorAll('li')).toHaveLength(1)
        expect(view.root.textContent).toContain('0: Three - done')
    })

    it('renders registered components and updates bound props', () => {
        const Icon: TinyUIComponent<{icon: string}> = (props, context) => {
            const element = context.document.createElement('span')
            element.dataset.icon = String(props.name)
            return element
        }
        const view = html(`
            <div><Icon #icon :name="icon" /></div>
        `, {icon: 'send'}, {components: {Icon}})

        expect(view.refs.icon.dataset.icon).toBe('send')
        const previous = view.refs.icon
        view.update({icon: 'check'})
        expect(view.refs.icon.dataset.icon).toBe('check')
        expect(view.refs.icon).not.toBe(previous)
    })

    it('tracks and removes every node returned by a component fragment', () => {
        const Pair: TinyUIComponent = (_props, context) => {
            const fragment = context.document.createDocumentFragment()
            fragment.append(context.document.createElement('i'), context.document.createElement('b'))
            return fragment
        }
        const view = html('<div><Pair /></div>', {}, {components: {Pair}})

        expect(view.root.children).toHaveLength(2)
        view.destroy()
        expect(view.root.children).toHaveLength(0)
    })

    it('supports object components with a render method', () => {
        const Badge: UIComponent = {
            render(props, context) {
                const element = context.document.createElement('strong')
                element.textContent = String(props.label)
                return element
            },
        }
        const view = html('<div><Badge label="Ready" /></div>', {components: {Badge}})

        expect(view.root.textContent).toBe('Ready')
    })

    it('supports inline component registration, self-closing siblings, refs, and component events', () => {
        const clear = vi.fn()
        const send = vi.fn()
        const Icon: TinyUIComponent = (props, context) => {
            const icon = context.document.createElement('svg')
            icon.dataset.name = String(props.name)
            icon.dataset.size = String(props.size ?? '')
            return icon
        }
        const Messages: TinyUIComponent = (_props, context) => context.document.createElement('div')
        const Composer: TinyUIComponent = (props, context) => {
            const form = context.document.createElement('form')
            const input = context.document.createElement('input')
            input.placeholder = String(props.placeholder)
            form.append(input)
            return form
        }
        const view = html(`
            <section>
                <header>
                    <h3>AI Assistant</h3>
                    <button @click="clear"><Icon name="brush-cleaning" size="16" /></button>
                </header>
                <Messages #messages />
                <Composer placeholder="{{ placeholder }}" @submit.prevent="send" />
            </section>
        `, {
            placeholder: 'Ask about this document',
            clear,
            send,
            components: {Icon, Messages, Composer},
        })

        expect(view.root.querySelector('svg')?.dataset.name).toBe('brush-cleaning')
        expect(view.root.querySelector('svg')?.dataset.size).toBe('16')
        expect(view.refs.messages.tagName).toBe('DIV')
        expect(view.refs.messages.nextElementSibling?.tagName).toBe('FORM')
        expect(view.root.querySelector('input')?.placeholder).toBe('Ask about this document')

        view.root.querySelector('button')?.click()
        const submitEvent = new Event('submit', {bubbles: true, cancelable: true})
        view.root.querySelector('form')?.dispatchEvent(submitEvent)
        expect(clear).toHaveBeenCalledOnce()
        expect(send).toHaveBeenCalledOnce()
        expect(submitEvent.defaultPrevented).toBe(true)

        view.update({placeholder: 'Updated'})
        expect(view.root.querySelector('input')?.placeholder).toBe('Updated')
    })

    it('uses the current handler and cleans listeners and refs on destroy', () => {
        const first = vi.fn()
        const second = vi.fn()
        const state = {click: first}
        const view = html('<button #button @click="click">Run</button>', state)
        const button = view.root

        button.click()
        state.click = second
        view.update()
        button.click()
        expect(first).toHaveBeenCalledOnce()
        expect(second).toHaveBeenCalledOnce()

        view.destroy()
        button.click()
        expect(second).toHaveBeenCalledOnce()
        expect(view.refs.button).toBeUndefined()
    })

    it('rejects executable expressions', () => {
        expect(() => html('<p>{{ count + 1 }}</p>', {count: 1})).toThrow(
            'only supports property paths and literals',
        )
    })
})
