import {describe, expect, it, vi} from 'vitest'
import {html, UITemplate, type TinyUIComponent} from '../../src/tinyui'

describe('TinyUI adversarial template and value handling', () => {
    it('supports a template without an explicit context', () => {
        const view = html('<div>Static</div>')
        expect(view.root.textContent).toBe('Static')
        expect(view.context).toEqual({})
    })

    it.each([
        '<div><Widget title="a > b" /><span>After</span></div>',
        "<div><Widget title='a > b' /><span>After</span></div>",
        '<div><WIDGET data-value="x/y"/><span>After</span></div>',
    ])('expands registered self-closing components without being confused by quoted characters', (source) => {
        const template = new UITemplate(source, document, ['Widget'])
        expect(Array.from(template.root.children).map((child) => child.localName)).toEqual(['widget', 'span'])
        expect(template.root.lastElementChild?.textContent).toBe('After')
    })

    it('writes interpolated values as text and attributes without creating injected DOM', () => {
        const payload = '"><img data-injected="true"><script>bad()</script>'
        const view = html('<section title="{{ payload }}"><p>{{ payload }}</p></section>', {payload})

        expect(view.root.title).toBe(payload)
        expect(view.root.querySelector('p')?.textContent).toBe(payload)
        expect(view.root.querySelector('[data-injected]')).toBeNull()
        expect(view.root.querySelector('script')).toBeNull()
    })

    it('renders falsy, numeric, object, and symbol values deterministically', () => {
        const view = html(`
            <div>{{ zero }}|{{ falsy }}|{{ nan }}|{{ object }}|{{ symbol }}</div>
        `, {zero: 0, falsy: false, nan: Number.NaN, object: {toString: () => 'object'}, symbol: Symbol('x')})

        expect(view.root.textContent).toBe('0|false|NaN|object|Symbol(x)')
    })

    it('leaves incomplete interpolation markers as literal text', () => {
        const view = html('<p>Before {{ missing after</p>', {})
        expect(view.root.textContent).toBe('Before {{ missing after')
        expect(view.bindings).toHaveLength(0)
    })

    it('keeps multiple views and their refs completely isolated', () => {
        const first = html('<button #action>{{ label }}</button>', {label: 'First'})
        const second = html('<button #action>{{ label }}</button>', {label: 'Second'})

        first.update({label: 'Updated'})
        first.destroy()

        expect(second.root.textContent).toBe('Second')
        expect(second.refs.action).toBe(second.root)
    })
})

describe('TinyUI adversarial event handling', () => {
    it.each([
        ['<button @click.unknown="click"></button>', 'Unknown TinyUI event modifier'],
        ['<button @click.once.once="click"></button>', 'cannot be repeated'],
        ['<button @click.passive.prevent="click"></button>', 'cannot be used together'],
    ])('rejects ambiguous event declarations', (template, message) => {
        expect(() => html(template, {click: vi.fn()})).toThrow(message)
    })

    it('does not consume self.once when the event originates from a child', () => {
        const click = vi.fn()
        const view = html('<div @click.self.once="click"><button>Child</button></div>', {click})

        view.root.querySelector('button')!.click()
        view.root.click()
        view.root.click()

        expect(click).toHaveBeenCalledOnce()
    })

    it('removes a once listener even when its handler throws', () => {
        const handler = vi.fn(() => { throw new Error('failed') })
        const errors: Error[] = []
        const captureError = (event: ErrorEvent): void => {
            errors.push(event.error as Error)
            event.preventDefault()
        }
        window.addEventListener('error', captureError)
        const view = html('<button @click.once="handler">Run</button>', {handler})

        view.root.click()
        view.root.click()
        window.removeEventListener('error', captureError)

        expect(handler).toHaveBeenCalledOnce()
        expect(errors).toHaveLength(1)
    })

    it('calls handlers with the current context as this', () => {
        const context = {
            count: 0,
            increment(this: {count: number}) {
                this.count += 1
            },
        }
        const view = html('<button @click="increment">Run</button>', context)

        view.root.click()
        expect(context.count).toBe(1)
    })

    it('does not accumulate listeners through repeated conditional toggles', () => {
        const click = vi.fn()
        const view = html('<div><button if="visible" @click="click">Run</button></div>', {
            visible: true,
            click,
        })

        for (let index = 0; index < 20; index += 1) {
            view.update({visible: false})
            view.update({visible: true})
        }
        view.root.querySelector('button')!.click()
        expect(click).toHaveBeenCalledOnce()
    })

    it('removes a capture listener when its conditional owner is destroyed', () => {
        const click = vi.fn()
        const view = html('<div><button if="visible" @click.capture="click">Run</button></div>', {
            visible: true,
            click,
        })
        const oldButton = view.root.querySelector('button')!

        view.update({visible: false})
        oldButton.click()

        expect(click).not.toHaveBeenCalled()
    })

    it('does not apply prevent or once when self rejects a child event', () => {
        const select = vi.fn()
        const view = html('<div @click.self.prevent.once="select"><button>Child</button></div>', {select})
        const childEvent = new MouseEvent('click', {bubbles: true, cancelable: true})

        view.root.querySelector('button')!.dispatchEvent(childEvent)
        expect(childEvent.defaultPrevented).toBe(false)
        view.root.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}))
        view.root.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true}))
        expect(select).toHaveBeenCalledOnce()
    })
})

describe('TinyUI adversarial list updates', () => {
    it('preserves the existing list when a later update is not an array', () => {
        const select = vi.fn()
        const context: {items: unknown, select: () => void} = {items: ['A', 'B'], select}
        const view = html('<div><button each="item in items" @click="select">{{ item }}</button></div>', context)
        const oldButtons = Array.from(view.root.querySelectorAll('button'))

        expect(() => view.update({items: 'invalid'})).toThrow('must resolve to an array')
        expect(Array.from(view.root.querySelectorAll('button')).map((item) => item.textContent)).toEqual(['A', 'B'])
        oldButtons[0].click()
        expect(select).toHaveBeenCalledOnce()
    })

    it('rolls back a partially built list when a child component throws', () => {
        let shouldThrow = false
        const Row: TinyUIComponent = (props, context) => {
            if (shouldThrow && props.value === 'bad') throw new Error('row failed')
            const row = context.document.createElement('span')
            row.textContent = String(props.value)
            return row
        }
        const view = html('<div><p each="item in items"><Row :value="item" /></p></div>', {
            items: ['stable'],
            components: {Row},
        })

        shouldThrow = true
        expect(() => view.update({items: ['new', 'bad']})).toThrow('row failed')
        expect(view.root.textContent).toBe('stable')

        shouldThrow = false
        view.update({items: ['recovered']})
        expect(view.root.textContent).toBe('recovered')
    })

    it('renders sparse array positions with stable indexes', () => {
        const items = new Array<string | undefined>(3)
        items[0] = 'A'
        items[2] = 'C'
        const view = html('<ol><li each="item in items">{{ $index }}={{ item }}</li></ol>', {items})

        expect(Array.from(view.root.children).map((item) => item.textContent)).toEqual(['0=A', '1=', '2=C'])
    })

    it('rejects colliding item and index aliases', () => {
        expect(() => html('<div><i each="item, item in items"></i></div>', {items: []})).toThrow(
            'item and index names must be different',
        )
        expect(() => html('<div><i each="$index in items"></i></div>', {items: []})).toThrow(
            'item and index names must be different',
        )
    })

    it('handles repeated medium-sized list replacements without stale DOM', () => {
        const view = html('<ul><li each="item in items">{{ item }}</li></ul>', {items: [] as number[]})

        for (let round = 0; round < 20; round += 1) {
            const items = Array.from({length: 120}, (_, index) => round * 1000 + index)
            view.update({items})
            expect(view.root.children).toHaveLength(120)
            expect(view.root.firstElementChild?.textContent).toBe(String(round * 1000))
            expect(view.root.lastElementChild?.textContent).toBe(String(round * 1000 + 119))
        }
    }, 10_000)

    it('keeps the previous list and refs when DOM insertion fails during commit', () => {
        const select = vi.fn()
        const first = {id: 1}
        const view = html(
            '<div><button each="item in items" #row @click="select">{{ item.id }}</button></div>',
            {items: [first], select},
        )
        const oldButton = view.root.firstElementChild as HTMLButtonElement
        const insert = vi.spyOn(view.root, 'insertBefore').mockImplementationOnce(() => {
            throw new Error('list insertion failed')
        })

        expect(() => view.update({items: [{id: 2}]})).toThrow('list insertion failed')
        expect(view.root.children).toHaveLength(1)
        expect(view.root.firstElementChild).toBe(oldButton)
        expect(view.refs.row).toBe(oldButton)
        oldButton.click()
        expect(select).toHaveBeenCalledOnce()

        view.update({items: [{id: 3}]})
        expect(view.root.textContent).toBe('3')
        insert.mockRestore()
    })

    it('reports a detached list anchor without deleting the previous entries', () => {
        const view = html('<div><span each="item in items" #row>{{ item }}</span></div>', {items: ['stable']})
        const oldRow = view.root.querySelector('span')!
        const anchor = Array.from(view.root.childNodes).find((node): node is Comment => (
            node.nodeType === Node.COMMENT_NODE && (node as Comment).data.startsWith('each:')
        ))!
        anchor.remove()

        expect(() => view.update({items: ['replacement']})).toThrow('each anchor is detached')
        expect(view.root.querySelector('span')).toBe(oldRow)
        expect(view.refs.row).toBe(oldRow)
    })

    it('recovers a reused prefix runtime after its update fails following an append commit', () => {
        const first = {id: 1}
        let failing = false
        const Cell: TinyUIComponent = (props, context) => {
            if (failing && props.item === first) throw new Error('reused entry failed')
            const cell = context.document.createElement('span')
            cell.textContent = `${String((props.item as {id: number}).id)}:${String(props.label)}`
            return cell
        }
        const view = html(`
            <div><article each="item in items"><Cell :item="item" :label="label" /></article></div>
        `, {items: [first], label: 'old', components: {Cell}})

        failing = true
        expect(() => view.update({items: [first, {id: 2}], label: 'new'})).toThrow('reused entry failed')
        expect(Array.from(view.root.querySelectorAll('span')).map((node) => node.textContent)).toEqual([
            '1:old',
            '2:new',
        ])

        failing = false
        view.update({label: 'new'})
        expect(Array.from(view.root.querySelectorAll('span')).map((node) => node.textContent)).toEqual([
            '1:new',
            '2:new',
        ])
    })

    it('documents the rebuilt suffix for an immutable middle insertion', () => {
        const render = vi.fn<TinyUIComponent>((props, context) => {
            const row = context.document.createElement('span')
            row.textContent = String((props.item as {id: string}).id)
            return row
        })
        const first = {id: 'A'}
        const second = {id: 'B'}
        const third = {id: 'C'}
        const view = html('<div><Row each="item in items" :item="item" /></div>', {
            items: [first, second, third],
            components: {Row: render},
        })
        const oldNodes = Array.from(view.root.children)

        view.update({items: [first, {id: 'X'}, second, third]})

        expect(view.root.children[0]).toBe(oldNodes[0])
        expect(view.root.children[1]).not.toBe(oldNodes[1])
        expect(Array.from(view.root.children).map((node) => node.textContent)).toEqual(['A', 'X', 'B', 'C'])
        expect(render).toHaveBeenCalledTimes(6)
    })
})

describe('TinyUI adversarial conditional updates', () => {
    it('rolls back a failed conditional mount without leaking DOM or refs', () => {
        let failing = true
        const Child: TinyUIComponent = (_props, context) => {
            if (failing) throw new Error('child failed')
            return context.document.createElement('span')
        }
        const view = html('<div><section if="visible" #conditional><Child /></section></div>', {
            visible: false,
            components: {Child},
        })

        expect(() => view.update({visible: true})).toThrow('child failed')
        expect(view.root.children).toHaveLength(0)
        expect(view.refs.conditional).toBeUndefined()

        failing = false
        view.update({visible: true})
        expect(view.root.querySelectorAll('section')).toHaveLength(1)
        expect(view.refs.conditional).toBe(view.root.querySelector('section'))
    })
})

describe('TinyUI adversarial component behavior', () => {
    it('keeps the previous component and can retry after render throws', () => {
        let failing = false
        const Panel: TinyUIComponent = (props, context) => {
            if (failing) throw new Error('render failed')
            const panel = context.document.createElement('span')
            panel.textContent = String(props.value)
            return panel
        }
        const view = html('<div><Panel :value="value" /></div>', {
            value: 'stable',
            components: {Panel},
        })

        failing = true
        expect(() => view.update({value: 'failed'})).toThrow('render failed')
        expect(view.root.textContent).toBe('stable')

        failing = false
        view.update({value: 'failed'})
        expect(view.root.textContent).toBe('failed')
    })

    it('supports refs and events on an SVG component root', () => {
        const click = vi.fn()
        const Icon: TinyUIComponent = (_props, context) => context.document.createElementNS(
            'http://www.w3.org/2000/svg',
            'svg',
        )
        const view = html('<div><Icon #icon @click="click" /></div>', {
            click,
            components: {Icon},
        })

        expect(view.refs.icon).toBeInstanceOf(SVGElement)
        view.refs.icon.dispatchEvent(new MouseEvent('click'))
        expect(click).toHaveBeenCalledOnce()
    })

    it('supports element refs from a separately supplied Document', () => {
        const isolatedDocument = document.implementation.createHTMLDocument('isolated')
        const Field: TinyUIComponent = (_props, context) => context.document.createElement('input')
        const view = html('<div><Field #field /></div>', {}, {
            document: isolatedDocument,
            components: {Field},
        })

        expect(view.refs.field.ownerDocument).toBe(isolatedDocument)
        expect(view.refs.field).toBe(view.root.firstElementChild)
    })

    it('removes previous output when a component transitions to null', () => {
        const Maybe: TinyUIComponent = (props, context) => {
            if (!props.visible) return null
            return context.document.createElement('span')
        }
        const view = html('<div><Maybe :visible="visible" /></div>', {
            visible: true,
            components: {Maybe},
        })

        view.update({visible: false})
        expect(view.root.children).toHaveLength(0)
    })

    it('preserves the previous event-capable root when a new result cannot receive events', () => {
        const click = vi.fn()
        const Widget: TinyUIComponent = (props, context) => {
            if (props.mode === 'text') return 'invalid event root'
            return context.document.createElement('button')
        }
        const view = html('<div><Widget :mode="mode" @click="click" /></div>', {
            mode: 'button',
            click,
            components: {Widget},
        })
        const oldButton = view.root.querySelector('button')!

        expect(() => view.update({mode: 'text'})).toThrow('must render an element')
        expect(view.root.querySelector('button')).toBe(oldButton)
        oldButton.click()
        expect(click).toHaveBeenCalledOnce()
    })

    it('keeps previous component DOM, ref, and listener when insertion fails during commit', () => {
        const click = vi.fn()
        const Widget: TinyUIComponent = (props, context) => {
            const button = context.document.createElement('button')
            button.textContent = String(props.value)
            return button
        }
        const view = html('<div><Widget :value="value" #widget @click="click" /></div>', {
            value: 'stable',
            click,
            components: {Widget},
        })
        const oldButton = view.root.firstElementChild as HTMLButtonElement
        const insert = vi.spyOn(view.root, 'insertBefore').mockImplementationOnce(() => {
            throw new Error('component insertion failed')
        })

        expect(() => view.update({value: 'failed'})).toThrow('component insertion failed')
        expect(view.root.firstElementChild).toBe(oldButton)
        expect(view.refs.widget).toBe(oldButton)
        oldButton.click()
        expect(click).toHaveBeenCalledOnce()

        view.update({value: 'recovered'})
        expect(view.root.textContent).toBe('recovered')
        insert.mockRestore()
    })

    it('reports a detached component anchor without deleting the previous output', () => {
        const Widget: TinyUIComponent = (props, context) => {
            const output = context.document.createElement('span')
            output.textContent = String(props.value)
            return output
        }
        const view = html('<div><Widget :value="value" #widget /></div>', {
            value: 'stable',
            components: {Widget},
        })
        const oldOutput = view.root.querySelector('span')!
        const anchor = Array.from(view.root.childNodes).find((node): node is Comment => (
            node.nodeType === Node.COMMENT_NODE && (node as Comment).data.startsWith('component:')
        ))!
        anchor.remove()

        expect(() => view.update({value: 'replacement'})).toThrow('anchor is detached')
        expect(view.root.querySelector('span')).toBe(oldOutput)
        expect(view.refs.widget).toBe(oldOutput)
    })

    it('rolls back candidate listeners and refs when event registration fails during commit', () => {
        const click = vi.fn()
        const Widget: TinyUIComponent = (props, context) => {
            const button = context.document.createElement('button')
            button.textContent = String(props.value)
            return button
        }
        const view = html(`
            <div><Widget :value="value" #widget @click="click" @commit-fail="click" /></div>
        `, {value: 'stable', click, components: {Widget}})
        const oldButton = view.root.firstElementChild as HTMLButtonElement
        const nativeAdd = Element.prototype.addEventListener
        const add = vi.spyOn(Element.prototype, 'addEventListener').mockImplementation(function (
            this: Element,
            type: string,
            listener: EventListenerOrEventListenerObject,
            options?: boolean | AddEventListenerOptions,
        ) {
            if (type === 'commit-fail') throw new Error('event registration failed')
            nativeAdd.call(this, type, listener, options)
        })
        try {
            expect(() => view.update({value: 'failed'})).toThrow('event registration failed')
            expect(view.root.firstElementChild).toBe(oldButton)
            expect(view.refs.widget).toBe(oldButton)
            oldButton.click()
            expect(click).toHaveBeenCalledOnce()
        } finally {
            add.mockRestore()
        }

        view.update({value: 'recovered'})
        expect(view.root.textContent).toBe('recovered')
    })

    it('cleans nodes, events, and ref ownership across fragment and node results', () => {
        const click = vi.fn()
        const Output: TinyUIComponent = (props, context) => {
            if (props.mode === 'node') {
                const section = context.document.createElement('section')
                section.textContent = 'node'
                return section
            }
            const fragment = context.document.createDocumentFragment()
            fragment.append('lead')
            const button = context.document.createElement('button')
            button.textContent = 'fragment'
            fragment.append(button, context.document.createElement('span'))
            return fragment
        }
        const view = html('<div><i #result></i><Output :mode="mode" #result @click="click" /></div>', {
            mode: 'fragment',
            click,
            components: {Output},
        })
        const oldButton = view.root.querySelector('button')!
        expect(view.refs.result).toBe(oldButton)

        view.update({mode: 'node'})
        expect(view.refs.result).toBe(view.root.querySelector('section'))
        oldButton.click()
        expect(click).not.toHaveBeenCalled()
    })

    it('restores an outer ref when a component transitions to null', () => {
        const Maybe: TinyUIComponent = (props, context) => (
            props.visible ? context.document.createElement('span') : null
        )
        const view = html('<div><i #result></i><Maybe :visible="visible" #result /></div>', {
            visible: true,
            components: {Maybe},
        })
        const outer = view.root.querySelector('i')!

        view.update({visible: false})

        expect(view.refs.result).toBe(outer)
    })

    it('keeps nested directives and components consistent through deterministic mixed updates', () => {
        const Item: TinyUIComponent = (props, context) => {
            const item = context.document.createElement('strong')
            item.textContent = String(props.value)
            return item
        }
        const view = html(`
            <main>
                <section if="visible">
                    <article each="group in groups">
                        <Item each="item in group.items" :value="item" />
                    </article>
                </section>
            </main>
        `, {
            visible: true,
            groups: [{items: [1, 2]}],
            components: {Item},
        })

        let seed = 7
        for (let round = 0; round < 40; round += 1) {
            seed = (seed * 48271) % 0x7fffffff
            const visible = seed % 4 !== 0
            const groups = Array.from({length: seed % 5}, (_, groupIndex) => ({
                items: Array.from({length: (seed + groupIndex) % 7}, (_, itemIndex) => (
                    `${round}:${groupIndex}:${itemIndex}`
                )),
            }))
            view.update({visible, groups})

            const expected = visible ? groups.flatMap((group) => group.items) : []
            expect(Array.from(view.root.querySelectorAll('strong')).map((item) => item.textContent)).toEqual(expected)
        }
    })

    it('binds interpolation, refs, and events on native SVG elements', () => {
        const select = vi.fn()
        const view = html(`
            <svg><text #label title="{{ title }}" @click="select">{{ label }}</text></svg>
        `, {title: 'first', label: 'A', select})
        const label = view.refs.label as SVGTextElement

        expect(label.namespaceURI).toBe('http://www.w3.org/2000/svg')
        view.update({title: 'second', label: 'B'})
        label.dispatchEvent(new MouseEvent('click', {bubbles: true}))

        expect(label.textContent).toBe('B')
        expect(label.getAttribute('title')).toBe('second')
        expect(select).toHaveBeenCalledOnce()
    })
})
