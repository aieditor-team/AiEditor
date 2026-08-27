import {describe, expect, it, vi} from 'vitest'
import {html, UIBinding, UIUpdateQueue} from '../../src/tinyui'

class TestBinding extends UIBinding {
    readonly dependencies: ReadonlySet<string>
    readonly update = vi.fn<(changed: ReadonlySet<string> | null) => void>()
    readonly destroy = vi.fn<() => void>()

    constructor(...dependencies: string[]) {
        super()
        this.dependencies = new Set(dependencies)
    }
}

describe('UIBinding and UIUpdateQueue', () => {
    it('matches full updates and intersecting dependency patches', () => {
        const binding = new TestBinding('title', 'message')

        expect(binding.shouldUpdate(null)).toBe(true)
        expect(binding.shouldUpdate(new Set(['title']))).toBe(true)
        expect(binding.shouldUpdate(new Set(['unrelated']))).toBe(false)
        expect(new TestBinding().shouldUpdate(new Set(['title']))).toBe(false)
    })

    it('deduplicates queued bindings and forwards changed keys on flush', () => {
        const queue = new UIUpdateQueue()
        const first = new TestBinding('first')
        const second = new TestBinding('second')
        const changed = new Set(['first'])

        queue.enqueue(first)
        queue.enqueue(first)
        queue.enqueue(second)
        queue.flush(changed)

        expect(first.update).toHaveBeenCalledOnce()
        expect(first.update).toHaveBeenCalledWith(changed)
        expect(second.update).toHaveBeenCalledOnce()
        queue.flush(null)
        expect(first.update).toHaveBeenCalledOnce()
    })

    it('clears pending bindings without updating them', () => {
        const queue = new UIUpdateQueue()
        const binding = new TestBinding('value')
        queue.enqueue(binding)
        queue.clear()
        queue.flush(null)
        expect(binding.update).not.toHaveBeenCalled()
    })
})

describe('UIView lifecycle', () => {
    it('mounts, unmounts, remounts, and exposes the mutable context', () => {
        const context = {message: 'First'}
        const view = html('<p>{{ message }}</p>', context)
        const firstHost = document.createElement('div')
        const secondHost = document.createElement('div')

        view.mount(firstHost)
        expect(firstHost.firstElementChild).toBe(view.root)
        view.unmount()
        expect(view.root.isConnected).toBe(false)
        view.mount(secondHost)
        view.update({message: 'Second'})

        expect(view.context).toBe(context)
        expect(context.message).toBe('Second')
        expect(secondHost.textContent).toBe('Second')
    })

    it('performs a full refresh when state is changed before update()', () => {
        const context = {message: 'First'}
        const view = html('<p>{{ message }}</p>', context)
        context.message = 'Direct mutation'
        view.update()
        expect(view.root.textContent).toBe('Direct mutation')
    })

    it('destroys idempotently and rejects later mount or update operations', () => {
        const view = html('<button #button @click="click">Run</button>', {click: vi.fn()})
        document.body.append(view.root)

        view.destroy()
        view.destroy()

        expect(view.root.isConnected).toBe(false)
        expect(view.refs.button).toBeUndefined()
        expect(() => view.mount(document.body)).toThrow('Cannot mount a destroyed TinyUI view')
        expect(() => view.update()).toThrow('Cannot update a destroyed TinyUI view')
    })

    it('reports a missing DOM environment when no Document is supplied', () => {
        vi.stubGlobal('document', undefined)
        try {
            expect(() => html('<div></div>', {})).toThrow('TinyUI requires a Document')
        } finally {
            vi.unstubAllGlobals()
        }
    })
})
