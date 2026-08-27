import {describe, expect, it, vi} from 'vitest'
import {
    html,
    UIBinding,
    UIPropertyBinding,
    UIResolver,
    type TinyUIComponent,
    type TinyUIView,
    type UIComponent,
} from '../../src/tinyui'
import {UIRuntime} from '../../src/tinyui/core/UIRuntime'
import {UIRefRegistry} from '../../src/tinyui/core/UIRefRegistry'
import {UIUpdateQueue} from '../../src/tinyui/core/UIUpdateQueue'

class IndexedBinding extends UIBinding {
    readonly dependencies: ReadonlySet<string>
    readonly update = vi.fn<(changed: ReadonlySet<string> | null) => void>()

    constructor(...dependencies: string[]) {
        super()
        this.dependencies = new Set(dependencies)
    }
}

class DynamicallyFilteredBinding extends IndexedBinding {
    readonly shouldUpdate = vi.fn((changed: ReadonlySet<string> | null) => (
        changed === null || changed.has('virtual')
    ))
}

class CountedBinding extends UIBinding {
    readonly dependencies: ReadonlySet<string>
    updates = 0

    constructor(dependency: string) {
        super()
        this.dependencies = new Set([dependency])
    }

    update(): void {
        this.updates += 1
    }
}

describe('TinyUI compiled caches and dependency index', () => {
    it('caches normalized expression accessors and reuses them across scopes', () => {
        const resolver = new UIResolver()
        const first = resolver.compileExpression(' user.profile.name ')
        const second = resolver.compileExpression('user.profile.name')

        expect(second).toBe(first)
        expect(first.dependencies).toEqual(new Set(['user']))
        expect(first.evaluate({context: {user: {profile: {name: 'Context'}}}, locals: {}})).toBe('Context')
        expect(first.evaluate({context: {}, locals: {user: {profile: {name: 'Local'}}}})).toBe('Local')
    })

    it('updates bindings directly from dependency buckets without scanning unrelated bindings', () => {
        const runtime = new UIRuntime({first: 1, second: 2}, {}, {}, {})
        const first = new IndexedBinding('first')
        const second = new IndexedBinding('second')
        runtime.add(first)
        runtime.add(second)
        first.update.mockClear()
        second.update.mockClear()

        runtime.update(new Set(['first']))

        expect(first.update).toHaveBeenCalledOnce()
        expect(second.update).not.toHaveBeenCalled()
    })

    it('selects one dependency bucket from five thousand bindings', () => {
        const runtime = new UIRuntime({}, {}, {}, {})
        const bindings = Array.from({length: 5_000}, (_, index) => new CountedBinding(`key${index}`))
        bindings.forEach((binding) => runtime.add(binding))

        runtime.update(new Set(['key4321']))

        expect(bindings[4321].updates).toBe(2)
        expect(bindings.reduce((total, binding) => total + binding.updates, 0)).toBe(5_001)
    })

    it('deduplicates a binding selected by multiple changed dependencies', () => {
        const runtime = new UIRuntime({first: 1, second: 2}, {}, {}, {})
        const binding = new IndexedBinding('first', 'second')
        runtime.add(binding)
        binding.update.mockClear()

        runtime.update(new Set(['first', 'second']))

        expect(binding.update).toHaveBeenCalledOnce()
    })

    it('recovers bindings skipped after a previous update queue failure', () => {
        const runtime = new UIRuntime({value: 1, unrelated: 0}, {}, {}, {})
        let failing = false
        const first = new IndexedBinding('value')
        const aborted = new IndexedBinding('value')
        first.update.mockImplementation(() => {
            if (failing) throw new Error('binding failed')
        })
        runtime.add(first)
        runtime.add(aborted)
        first.update.mockClear()
        aborted.update.mockClear()

        failing = true
        expect(() => runtime.update(new Set(['value']))).toThrow('binding failed')
        expect(aborted.update).not.toHaveBeenCalled()

        failing = false
        runtime.update(new Set(['unrelated']))
        expect(first.update).toHaveBeenCalledOnce()
        expect(aborted.update).toHaveBeenCalledOnce()
        expect(aborted.update).toHaveBeenLastCalledWith(null)
    })

    it('preserves custom shouldUpdate filters outside the indexed built-in path', () => {
        const runtime = new UIRuntime({value: 1}, {}, {}, {})
        const binding = new DynamicallyFilteredBinding()
        runtime.add(binding)
        binding.update.mockClear()

        runtime.update(new Set(['unrelated']))
        expect(binding.update).not.toHaveBeenCalled()
        runtime.update(new Set(['virtual']))
        expect(binding.update).toHaveBeenCalledOnce()

        runtime.update(null)
        expect(binding.update).toHaveBeenCalledTimes(2)
        expect(runtime.resolve('value')).toBe(1)
    })

    it('defers already selected bindings when a dynamic filter throws during scheduling', () => {
        const runtime = new UIRuntime({value: 1}, {}, {}, {})
        const selected = new IndexedBinding('value')
        const dynamic = new DynamicallyFilteredBinding()
        let failing = true
        dynamic.shouldUpdate.mockImplementation((changed) => {
            if (failing && changed?.has('value')) throw new Error('filter failed')
            return changed === null || changed.has('virtual')
        })
        runtime.add(selected)
        runtime.add(dynamic)
        selected.update.mockClear()

        expect(() => runtime.update(new Set(['value']))).toThrow('filter failed')
        expect(selected.update).not.toHaveBeenCalled()

        failing = false
        runtime.update(new Set(['unrelated']))
        expect(selected.update).toHaveBeenCalledOnce()
        expect(selected.update).toHaveBeenLastCalledWith(null)
    })

    it('resolves case-insensitive own DOM properties before consulting the prototype cache', () => {
        const element = document.createElement('div')
        let assigned: unknown
        Object.defineProperty(element, 'CustomState', {
            configurable: true,
            set: (value) => { assigned = value },
        })
        const runtime = new UIRuntime({value: {ready: true}}, {}, {}, {})
        const binding = new UIPropertyBinding(element, 'customstate', 'value', runtime)

        binding.update()

        expect(assigned).toEqual({ready: true})
    })

    it('caches unknown property fallbacks without hiding later own properties', () => {
        const runtime = new UIRuntime({value: 1}, {}, {}, {})
        const first = document.createElement('div')
        const second = document.createElement('div')
        new UIPropertyBinding(first, 'cache-probe', 'value', runtime).update()
        new UIPropertyBinding(second, 'cache-probe', 'value', runtime).update()
        expect((second as unknown as Record<string, unknown>)['cache-probe']).toBe(1)

        let assigned: unknown
        Object.defineProperty(second, 'CacheProbe', {set: (value) => { assigned = value }})
        new UIPropertyBinding(second, 'cacheprobe', 'value', runtime).update()
        expect(assigned).toBe(1)
    })

    it('retries the same DOM property value after a custom setter throws', () => {
        const runtime = new UIRuntime({value: 'same'}, {}, {}, {})
        const element = document.createElement('div')
        let failing = true
        const setter = vi.fn(() => {
            if (failing) throw new Error('setter failed')
        })
        Object.defineProperty(element, 'customValue', {configurable: true, set: setter})
        const binding = new UIPropertyBinding(element, 'customValue', 'value', runtime)

        expect(() => binding.update()).toThrow('setter failed')
        failing = false
        binding.update()

        expect(setter).toHaveBeenCalledTimes(2)
    })

    it('retries interpolation conversion after a value toString throws', () => {
        let failing = false
        const value = {
            toString() {
                if (failing) throw new Error('conversion failed')
                return 'converted'
            },
        }
        const view = html('<p>{{ value }}</p>', {value})

        failing = true
        expect(() => view.update({value})).toThrow('conversion failed')
        expect(view.root.textContent).toBe('converted')

        failing = false
        view.update({value})
        expect(view.root.textContent).toBe('converted')
    })
})

describe('TinyUI update queue recovery', () => {
    it('preserves the remaining recovery tail when a recovery task fails again', () => {
        const queue = new UIUpdateQueue()
        const first = new IndexedBinding('value')
        const second = new IndexedBinding('value')
        const third = new IndexedBinding('value')
        const newlySelected = new IndexedBinding('other')
        let failFirst = true
        let failSecond = true
        first.update.mockImplementation(() => {
            if (failFirst) throw new Error('first failed')
        })
        second.update.mockImplementation(() => {
            if (failSecond) throw new Error('second failed')
        })
        queue.enqueue(first)
        queue.enqueue(second)
        queue.enqueue(third)

        expect(() => queue.flush(new Set(['value']))).toThrow('first failed')
        queue.enqueue(third)
        queue.enqueue(newlySelected)
        expect(() => queue.flush(new Set(['other']))).toThrow('second failed')

        failFirst = false
        failSecond = false
        queue.flush(new Set(['unrelated']))
        expect(third.update).toHaveBeenCalledOnce()
        expect(third.update).toHaveBeenLastCalledWith(null)
        expect(newlySelected.update).toHaveBeenCalledOnce()
        expect(newlySelected.update).toHaveBeenLastCalledWith(null)
    })

    it('drops pending recovery work when the queue is cleared', () => {
        const queue = new UIUpdateQueue()
        const failing = new IndexedBinding('value')
        const skipped = new IndexedBinding('value')
        failing.update.mockImplementation(() => { throw new Error('failed') })
        queue.enqueue(failing)
        queue.enqueue(skipped)
        expect(() => queue.flush(new Set(['value']))).toThrow('failed')

        queue.clear()
        queue.flush(null)
        expect(skipped.update).not.toHaveBeenCalled()
    })
})

describe('TinyUI incremental lists', () => {
    it('reuses a large immutable prefix and renders only appended entries', () => {
        const render = vi.fn<TinyUIComponent>((props, context) => {
            const row = context.document.createElement('li')
            row.textContent = String(props.item)
            return row
        })
        const items = Array.from({length: 200}, (_, index) => ({id: index}))
        const view = html('<ul><Row each="item in items" :item="item" /></ul>', {
            items,
            components: {Row: render},
        })
        const originalNodes = Array.from(view.root.children)
        expect(render).toHaveBeenCalledTimes(200)

        const appended = {id: 200}
        view.update({items: [...items, appended]})

        expect(render).toHaveBeenCalledTimes(201)
        expect(Array.from(view.root.children).slice(0, 200)).toEqual(originalNodes)
        expect(view.root.children).toHaveLength(201)

        view.update({items: [...items, appended]})
        expect(render).toHaveBeenCalledTimes(201)
        expect(Array.from(view.root.children).slice(0, 200)).toEqual(originalNodes)
    })

    it('rebuilds the changed suffix and destroys only removed entry listeners', () => {
        const select = vi.fn()
        const first = {name: 'first'}
        const second = {name: 'second'}
        const view = html(`
            <div><button each="item in items" @click="select">{{ item.name }}</button></div>
        `, {items: [first, second], select})
        const oldFirst = view.root.children[0] as HTMLButtonElement
        const oldSecond = view.root.children[1] as HTMLButtonElement

        view.update({items: [first, {name: 'replacement'}]})

        expect(view.root.children[0]).toBe(oldFirst)
        expect(view.root.children[1]).not.toBe(oldSecond)
        oldFirst.click()
        oldSecond.click()
        ;(view.root.children[1] as HTMLButtonElement).click()
        expect(select).toHaveBeenCalledTimes(2)
    })

    it('keeps the old list when compiling an appended suffix fails', () => {
        let fail = false
        const Row: TinyUIComponent = (props, context) => {
            if (fail && props.item === 'bad') throw new Error('append failed')
            const row = context.document.createElement('span')
            row.textContent = String(props.item)
            return row
        }
        const stable = {name: 'stable'}
        const view = html('<div><Row each="item in items" :item="item" /></div>', {
            items: [stable],
            components: {Row},
        })
        const oldNode = view.root.firstElementChild

        fail = true
        expect(() => view.update({items: [stable, 'bad']})).toThrow('append failed')
        expect(view.root.querySelectorAll('span')).toHaveLength(1)
        expect(view.root.firstElementChild).toBe(oldNode)
    })

    it('restores refs after a failed suffix and fully refreshes reused entries on retry', () => {
        let fail = false
        const Row: TinyUIComponent = (props, context) => {
            if (fail && props.item === 'bad') throw new Error('combined append failed')
            const value = context.document.createElement('b')
            value.textContent = String(props.item)
            return value
        }
        const stable = {id: 1}
        const view = html(`
            <div>
                <article each="item in items" #row>
                    <span>{{ label }}</span><Row :item="item" />
                </article>
            </div>
        `, {items: [stable] as unknown[], label: 'old', components: {Row}})
        const oldArticle = view.root.querySelector('article')!
        expect(view.refs.row).toBe(oldArticle)

        fail = true
        expect(() => view.update({items: [stable, 'good', 'bad'], label: 'new'})).toThrow(
            'combined append failed',
        )
        expect(view.root.querySelectorAll('article')).toHaveLength(1)
        expect(view.root.querySelector('span')?.textContent).toBe('old')
        expect(view.refs.row).toBe(oldArticle)

        fail = false
        view.update({items: [stable, 'good']})
        expect(view.root.querySelectorAll('article')).toHaveLength(2)
        expect(view.root.querySelector('span')?.textContent).toBe('new')
        expect(view.root.querySelector('article')).toBe(oldArticle)
    })

    it('repairs old entries on the next unrelated patch after invalid collection input', () => {
        const context: {items: unknown, label: string, unrelated: number} = {
            items: ['stable'],
            label: 'old',
            unrelated: 0,
        }
        const view = html(
            '<div><span each="item in items">{{ item }}:{{ label }}</span></div>',
            context,
        )

        expect(() => view.update({items: 'invalid', label: 'new'})).toThrow('must resolve to an array')
        expect(view.root.textContent).toBe('stable:old')

        view.update({unrelated: 1})
        expect(view.root.textContent).toBe('stable:new')
    })

    it('reuses a shortened prefix and destroys listeners owned by the removed tail', () => {
        const select = vi.fn()
        const first = {id: 1}
        const second = {id: 2}
        const view = html(
            '<div><button each="item in items" @click="select">{{ item.id }}</button></div>',
            {items: [first, second], select},
        )
        const firstButton = view.root.children[0] as HTMLButtonElement
        const removedButton = view.root.children[1] as HTMLButtonElement

        view.update({items: [first]})

        expect(view.root.children).toHaveLength(1)
        expect(view.root.firstElementChild).toBe(firstButton)
        firstButton.click()
        removedButton.click()
        expect(select).toHaveBeenCalledOnce()
    })

    it('restores the last surviving list ref when a newer entry is removed', () => {
        const first = {id: 1}
        const second = {id: 2}
        const view = html('<div><button each="item in items" #row>{{ item.id }}</button></div>', {
            items: [first, second],
        })
        const firstButton = view.root.children[0]
        const secondButton = view.root.children[1]
        expect(view.refs.row).toBe(secondButton)

        view.update({items: [first]})

        expect(view.refs.row).toBe(firstButton)
    })

    it('uses Object.is semantics for NaN and signed zero prefix reuse', () => {
        const view = html('<div><span each="item in items">{{ item }}</span></div>', {
            items: [Number.NaN, -0],
        })
        const nanNode = view.root.children[0]
        const negativeZeroNode = view.root.children[1]

        view.update({items: [Number.NaN, 0]})

        expect(view.root.children[0]).toBe(nanNode)
        expect(view.root.children[1]).not.toBe(negativeZeroNode)
    })

    it('keeps the old list when an array proxy throws while reading its length', () => {
        const view = html('<div><span each="item in items">{{ item }}</span></div>', {items: ['stable']})
        const oldNode = view.root.firstElementChild
        const failing = new Proxy(['broken'], {
            get(target, property, receiver) {
                if (property === 'length') throw new Error('length failed')
                return Reflect.get(target, property, receiver)
            },
        })

        expect(() => view.update({items: failing})).toThrow('length failed')
        expect(view.root.firstElementChild).toBe(oldNode)
        expect(view.root.textContent).toBe('stable')

        view.update({items: ['recovered']})
        expect(view.root.textContent).toBe('recovered')
    })

    it('preserves explicit refresh behavior for a mutated array reference', () => {
        const item = {name: 'before'}
        const items = [item]
        const view = html('<div><span each="item in items">{{ item.name }}</span></div>', {items})
        const oldNode = view.root.firstElementChild

        item.name = 'after'
        view.update({items})

        expect(view.root.textContent).toBe('after')
        expect(view.root.firstElementChild).not.toBe(oldNode)
    })
})

describe('TinyUI component state dependencies', () => {
    it('updates an object component when its declared context.state dependency changes', () => {
        const render = vi.fn<UIComponent<{theme: string, unrelated: number}>['render']>((_props, context) => {
            const output = context.document.createElement('output')
            output.textContent = context.state.theme
            return output
        })
        const Theme: UIComponent<{theme: string, unrelated: number}> = {
            dependencies: ['theme'],
            render,
        }
        const view = html('<div><Theme /></div>', {theme: 'light', unrelated: 0}, {components: {Theme}})

        view.update({unrelated: 1})
        expect(render).toHaveBeenCalledOnce()

        view.update({theme: 'light'})
        expect(render).toHaveBeenCalledOnce()

        view.update({theme: 'dark'})
        expect(render).toHaveBeenCalledTimes(2)
        expect(view.root.textContent).toBe('dark')
    })

    it('supports declared dependencies on function components', () => {
        const render = Object.assign(
            vi.fn<TinyUIComponent<{status: string}>>((_props, context) => context.state.status),
            {dependencies: ['status'] as const},
        )
        const view = html('<div><Status /></div>', {status: 'idle'}, {components: {Status: render}})

        view.update({status: 'ready'})

        expect(render).toHaveBeenCalledTimes(2)
        expect(view.root.textContent).toBe('ready')
    })

    it('tracks nested declarations by top-level state key and rejects literal dependencies', () => {
        const User: UIComponent<{user: {name: string}}> = {
            dependencies: ['user.name'],
            render: (_props, context) => context.state.user.name,
        }
        const view = html('<div><User /></div>', {user: {name: 'first'}}, {components: {User}})
        view.update({user: {name: 'second'}})
        expect(view.root.textContent).toBe('second')

        const Invalid: UIComponent = {dependencies: ['true'], render: () => null}
        expect(() => html('<div><Invalid /></div>', {}, {components: {Invalid}})).toThrow(
            'component dependencies must be property paths',
        )
    })

    it('rejects an invalid runtime result before replacing the previous component DOM', () => {
        const Widget: TinyUIComponent<{value: string}> = (props, context) => {
            if (props.value === 'invalid') return {} as never
            const output = context.document.createElement('span')
            output.textContent = String(props.value)
            return output
        }
        const view = html('<div><Widget :value="value" /></div>', {value: 'stable'}, {components: {Widget}})
        const stable = view.root.firstElementChild

        expect(() => view.update({value: 'invalid'})).toThrow('invalid render result')
        expect(view.root.firstElementChild).toBe(stable)
        expect(view.root.textContent).toBe('stable')

        view.update({value: 'recovered'})
        expect(view.root.textContent).toBe('recovered')
    })

    it('keeps bindings and DOM stable when a component reuses the same node', () => {
        const node = document.createElement('button')
        const click = vi.fn()
        const Stable: TinyUIComponent<{value: string, click: () => void}> = (props) => {
            node.textContent = String(props.value)
            return node
        }
        const remove = vi.spyOn(node, 'removeEventListener')
        const view = html('<div><Stable :value="value" @click="click" /></div>', {
            value: 'first',
            click,
        }, {components: {Stable}})

        view.update({value: 'second'})
        node.click()

        expect(view.root.firstElementChild).toBe(node)
        expect(node.textContent).toBe('second')
        expect(remove).not.toHaveBeenCalled()
        expect(click).toHaveBeenCalledOnce()
        remove.mockRestore()
    })

    it('does not destroy a nested UIView returned repeatedly by the same component', () => {
        const child = html('<span>{{ value }}</span>', {value: 'initial'})
        const StableView: TinyUIComponent<{value: string}> = (props) => {
            child.update({value: String(props.value)})
            return child
        }
        const parent = html('<div><StableView :value="value" /></div>', {value: 'first'}, {
            components: {StableView},
        })

        parent.update({value: 'second'})
        parent.update({value: 'third'})

        expect(parent.root.textContent).toBe('third')
        expect(() => child.update({value: 'still-active'})).not.toThrow()
        expect(parent.root.textContent).toBe('still-active')
    })
})

describe('TinyUI ref ownership and failed initialization', () => {
    it('restores an outer ref after a conditional owner with the same name unmounts', () => {
        const view = html(`
            <div><span #target>outer</span><button if="visible" #target>inner</button></div>
        `, {visible: true})
        const outer = view.root.querySelector('span')
        expect(view.refs.target).toBe(view.root.querySelector('button'))

        view.update({visible: false})

        expect(view.refs.target).toBe(outer)
    })

    it('cleans bindings already created before initial template compilation fails', () => {
        const remove = vi.spyOn(Element.prototype, 'removeEventListener')
        const Text: TinyUIComponent = () => 'text'
        try {
            expect(() => html(
                '<div @tiny-cleanup="cleanup"><Text @click="cleanup" /></div>',
                {cleanup: vi.fn()},
                {components: {Text}},
            )).toThrow('must render an element')

            expect(remove.mock.calls.some(([name]) => name === 'tiny-cleanup')).toBe(true)
        } finally {
            remove.mockRestore()
        }
    })

    it('removes middle ref owners in O(1) order and preserves external ref overrides', () => {
        const refs: Record<string, HTMLElement> = {}
        const registry = new UIRefRegistry(refs)
        const first = document.createElement('span')
        const middle = document.createElement('button')
        const last = document.createElement('input')
        const external = document.createElement('aside')
        const removeFirst = registry.register('target', first)
        const removeMiddle = registry.register('target', middle)
        const removeLast = registry.register('target', last)

        removeMiddle()
        expect(refs.target).toBe(last)
        removeLast()
        expect(refs.target).toBe(first)

        refs.target = external
        removeFirst()
        removeFirst()
        expect(refs.target).toBe(external)
    })
})

describe('TinyUI scheduled updates', () => {
    it('coalesces updates in one microtask while mutating context immediately', async () => {
        const render = vi.fn<TinyUIComponent>((props) => String(props.value))
        const view = html('<div><Value :value="value" /></div>', {
            value: 'initial',
            components: {Value: render},
        })

        view.scheduleUpdate({value: 'first'})
        view.scheduleUpdate({value: 'second'})

        expect(view.context.value).toBe('second')
        expect(view.root.textContent).toBe('initial')
        expect(render).toHaveBeenCalledOnce()

        await Promise.resolve()
        expect(view.root.textContent).toBe('second')
        expect(render).toHaveBeenCalledTimes(2)
    })

    it('lets synchronous update flush pending work without a later duplicate render', async () => {
        const render = vi.fn<TinyUIComponent>((props) => String(props.value))
        const view = html('<div><Value :value="value" /></div>', {
            value: 0,
            components: {Value: render},
        })

        view.scheduleUpdate({value: 1})
        view.update({value: 2})
        expect(view.root.textContent).toBe('2')
        expect(render).toHaveBeenCalledTimes(2)

        await Promise.resolve()
        expect(render).toHaveBeenCalledTimes(2)
    })

    it('cancels pending DOM work when the view is destroyed', async () => {
        const render = vi.fn<TinyUIComponent>((props) => String(props.value))
        const view = html('<div><Value :value="value" /></div>', {
            value: 0,
            components: {Value: render},
        })

        view.scheduleUpdate({value: 1})
        view.destroy()
        await Promise.resolve()

        expect(render).toHaveBeenCalledOnce()
        expect(() => view.scheduleUpdate({value: 2})).toThrow('destroyed TinyUI view')
    })

    it('supports a scheduled full refresh after direct context mutation', async () => {
        const context = {message: 'before'}
        const view = html('<p>{{ message }}</p>', context)
        context.message = 'after'

        view.scheduleUpdate()
        await Promise.resolve()

        expect(view.root.textContent).toBe('after')
    })

    it('merges a scheduled full refresh with later patches', async () => {
        const context = {first: 'old', second: 'old'}
        const view = html('<p>{{ first }}:{{ second }}</p>', context)
        context.first = 'direct'

        view.scheduleUpdate()
        view.scheduleUpdate({second: 'patch'})
        await Promise.resolve()

        expect(view.root.textContent).toBe('direct:patch')
    })

    it('queues a new microtask when rendering schedules another update', async () => {
        let view: TinyUIView<{value: number}>
        const Value: TinyUIComponent<{value: number}> = (props) => {
            if (props.value === 1) view.scheduleUpdate({value: 2})
            return String(props.value)
        }
        view = html('<div><Value :value="value" /></div>', {value: 0}, {components: {Value}})

        view.scheduleUpdate({value: 1})
        await Promise.resolve()
        expect(view.root.textContent).toBe('1')

        await Promise.resolve()
        expect(view.root.textContent).toBe('2')
    })

    it('coalesces one thousand scheduled patches into one render', async () => {
        const render = vi.fn<TinyUIComponent>((props) => String(props.value))
        const view = html('<div><Value :value="value" /></div>', {value: 0}, {components: {Value: render}})

        for (let value = 1; value <= 1_000; value += 1) view.scheduleUpdate({value})
        await Promise.resolve()

        expect(view.root.textContent).toBe('1000')
        expect(render).toHaveBeenCalledTimes(2)
    })

    it('rejects a synchronous update triggered during component rendering', () => {
        let view: TinyUIView<{value: number}>
        const Value: TinyUIComponent<{value: number}> = (props) => {
            if (props.value === 1) view.update({value: 2})
            return String(props.value)
        }
        view = html('<div><Value :value="value" /></div>', {value: 0}, {components: {Value}})

        expect(() => view.update({value: 1})).toThrow('during TinyUI rendering')
        expect(view.context.value).toBe(1)
        expect(view.root.textContent).toBe('0')
    })

    it('continues scheduling after a microtask render fails', () => {
        const callbacks: VoidFunction[] = []
        const queue = vi.spyOn(globalThis, 'queueMicrotask').mockImplementation((callback) => callbacks.push(callback))
        let failing = false
        const Value: TinyUIComponent<{value: string}> = (props) => {
            if (failing) throw new Error('scheduled render failed')
            return String(props.value)
        }
        try {
            const view = html('<div><Value :value="value" /></div>', {value: 'initial'}, {
                components: {Value},
            })
            failing = true
            view.scheduleUpdate({value: 'failed'})
            expect(() => callbacks.shift()!()).toThrow('scheduled render failed')
            expect(view.root.textContent).toBe('initial')

            failing = false
            view.scheduleUpdate({value: 'recovered'})
            expect(() => callbacks.shift()!()).not.toThrow()
            expect(view.root.textContent).toBe('recovered')
        } finally {
            queue.mockRestore()
        }
    })

    it('updates while unmounted and remounts with the scheduled state', async () => {
        const host = document.createElement('div')
        const view = html('<p>{{ value }}</p>', {value: 'initial'})
        view.mount(host)
        view.unmount()

        view.scheduleUpdate({value: 'detached'})
        await Promise.resolve()
        view.mount(host)

        expect(host.textContent).toBe('detached')
    })
})
