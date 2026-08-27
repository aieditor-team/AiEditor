import {BrushCleaning, SendHorizontal, Square} from 'lucide'
import {describe, expect, it} from 'vitest'
import {html} from '../../src/tinyui'

describe('LucideIcon', () => {
    it('renders a tree-shakeable Lucide definition with decorative defaults', () => {
        const view = html(`
            <span><LucideIcon :icon="icon" size="16" class="action-icon" stroke-width="1.5" #icon /></span>
        `, {icon: SendHorizontal})
        const icon = view.refs.icon as SVGElement

        expect(icon.tagName.toLowerCase()).toBe('svg')
        expect(icon.getAttribute('width')).toBe('16')
        expect(icon.getAttribute('height')).toBe('16')
        expect(icon.getAttribute('stroke-width')).toBe('1.5')
        expect(icon.getAttribute('class')).toBe('action-icon')
        expect(icon.getAttribute('aria-hidden')).toBe('true')
        expect(icon.getAttribute('focusable')).toBe('false')
    })

    it('creates an accessible image when aria-label is present', () => {
        const view = html(`
            <span><LucideIcon :icon="icon" aria-label="Send message" /></span>
        `, {icon: SendHorizontal})
        const icon = view.root.querySelector('svg')!

        expect(icon.getAttribute('aria-label')).toBe('Send message')
        expect(icon.getAttribute('role')).toBe('img')
        expect(icon.hasAttribute('aria-hidden')).toBe(false)
    })

    it('replaces only the component output when its icon definition changes', () => {
        const view = html(`
            <button><LucideIcon :icon="icon" #icon /></button>
        `, {icon: SendHorizontal})
        const button = view.root
        const previous = view.refs.icon
        const previousMarkup = previous.innerHTML

        view.update({icon: Square})

        expect(view.root).toBe(button)
        expect(view.refs.icon).not.toBe(previous)
        expect(view.refs.icon.innerHTML).not.toBe(previousMarkup)
    })

    it('uses the TinyUI owner document and rejects an invalid icon property', () => {
        const isolatedDocument = document.implementation.createHTMLDocument('icons')
        const view = html('<span><LucideIcon :icon="icon" /></span>', {icon: BrushCleaning}, {
            document: isolatedDocument,
        })

        expect(view.root.ownerDocument).toBe(isolatedDocument)
        expect(view.root.querySelector('svg')?.ownerDocument).toBe(isolatedDocument)
        expect(() => html('<span><LucideIcon :icon="icon" /></span>', {icon: 'send'}))
            .toThrow('LucideIcon requires a valid icon property')
    })

    it('allows a view to override the default component without mutating other views', () => {
        const Override = (_props: Record<string, unknown>, context: {document: Document}): Node => {
            const element = context.document.createElement('i')
            element.textContent = 'override'
            return element
        }
        const overridden = html('<span><LucideIcon /></span>', {}, {components: {LucideIcon: Override}})
        const regular = html('<span><LucideIcon :icon="icon" /></span>', {icon: Square})

        expect(overridden.root.querySelector('i')?.textContent).toBe('override')
        expect(regular.root.querySelector('svg')).not.toBeNull()
    })
})
