import {describe, expect, it, vi} from 'vitest'
import {html, UITemplate, type TinyUIComponent} from '../../src/tinyui'

describe('UITemplate', () => {
    it('stores the original source and creates one detached root', () => {
        const source = '  <section><p>Content</p></section>  '
        const template = new UITemplate(source, document)

        expect(template.source).toBe(source)
        expect(template.template).toBeInstanceOf(HTMLTemplateElement)
        expect(template.root.tagName).toBe('SECTION')
        expect(template.root.isConnected).toBe(false)
    })

    it('expands only registered self-closing components case-insensitively', () => {
        const template = new UITemplate(
            '<div><Widget value="1" /><span>After</span></div>',
            document,
            ['widget'],
        )

        expect(template.root.children).toHaveLength(2)
        expect(template.root.firstElementChild?.localName).toBe('widget')
        expect(template.root.lastElementChild?.textContent).toBe('After')
    })

    it('does not rewrite component-looking text in comments or raw-text elements', () => {
        const source = '<div><!-- <Widget /> --><textarea><Widget /></textarea><Widget /></div>'
        const template = new UITemplate(source, document, ['Widget'])

        expect(template.root.querySelector('textarea')?.value).toBe('<Widget />')
        expect(template.root.childNodes[0].nodeType).toBe(Node.COMMENT_NODE)
        expect(template.root.lastElementChild?.localName).toBe('widget')
    })

    it('leaves unterminated raw-text content untouched', () => {
        const template = new UITemplate('<div><textarea><Widget />', document, ['Widget'])
        expect(template.root.querySelector('textarea')?.value).toBe('<Widget />')
        expect(template.root.querySelector('widget')).toBeNull()
    })

    it('reuses the bounded parse cache while returning independent DOM clones', () => {
        const prototype = UITemplate.prototype as unknown as {
            expandSelfClosingComponents(source: string, componentNames: readonly string[]): string
        }
        const expand = vi.spyOn(prototype, 'expandSelfClosingComponents')
        const source = '<div data-template-cache-probe><CacheProbe /></div>'

        const first = new UITemplate(source, document, ['CacheProbe'])
        first.root.firstElementChild?.setAttribute('changed', 'true')
        const second = new UITemplate(source, document, ['cacheprobe'])

        expect(expand).toHaveBeenCalledOnce()
        expect(second.root).not.toBe(first.root)
        expect(second.root.firstElementChild?.hasAttribute('changed')).toBe(false)
        expand.mockRestore()
    })

    it('isolates cache entries by component registry and evicts the least recently used template', () => {
        const isolatedDocument = document.implementation.createHTMLDocument('template-cache')
        const componentSource = '<div><CacheWidget /><span>After</span></div>'
        const plain = new UITemplate(componentSource, isolatedDocument)
        const component = new UITemplate(componentSource, isolatedDocument, ['CacheWidget'])
        expect(plain.root.children).toHaveLength(1)
        expect(component.root.children).toHaveLength(2)

        const prototype = UITemplate.prototype as unknown as {
            expandSelfClosingComponents(source: string, componentNames: readonly string[]): string
        }
        const expand = vi.spyOn(prototype, 'expandSelfClosingComponents')
        for (let index = 0; index <= 100; index += 1) {
            new UITemplate(
                `<div data-lru-cache-probe="${index}"><CacheProbe /></div>`,
                isolatedDocument,
                ['CacheProbe'],
            )
        }
        expect(expand).toHaveBeenCalledTimes(101)

        new UITemplate(
            '<div data-lru-cache-probe="0"><CacheProbe /></div>',
            isolatedDocument,
            ['CacheProbe'],
        )
        expect(expand).toHaveBeenCalledTimes(102)
        expand.mockRestore()
    })

    it('promotes a cache hit before evicting the least recently used template', () => {
        const isolatedDocument = document.implementation.createHTMLDocument('template-cache-promotion')
        const prototype = UITemplate.prototype as unknown as {
            expandSelfClosingComponents(source: string, componentNames: readonly string[]): string
        }
        const expand = vi.spyOn(prototype, 'expandSelfClosingComponents')
        try {
            for (let index = 0; index < 100; index += 1) {
                new UITemplate(`<div data-cache-promotion="${index}"><CacheProbe /></div>`, isolatedDocument, [
                    'CacheProbe',
                ])
            }
            new UITemplate('<div data-cache-promotion="0"><CacheProbe /></div>', isolatedDocument, ['CacheProbe'])
            new UITemplate('<div data-cache-promotion="100"><CacheProbe /></div>', isolatedDocument, ['CacheProbe'])
            new UITemplate('<div data-cache-promotion="0"><CacheProbe /></div>', isolatedDocument, ['CacheProbe'])
            new UITemplate('<div data-cache-promotion="1"><CacheProbe /></div>', isolatedDocument, ['CacheProbe'])

            expect(expand).toHaveBeenCalledTimes(102)
        } finally {
            expand.mockRestore()
        }
    })

    it('isolates cached templates by Document', () => {
        const firstDocument = document.implementation.createHTMLDocument('cache-document-one')
        const secondDocument = document.implementation.createHTMLDocument('cache-document-two')
        const prototype = UITemplate.prototype as unknown as {
            expandSelfClosingComponents(source: string, componentNames: readonly string[]): string
        }
        const expand = vi.spyOn(prototype, 'expandSelfClosingComponents')
        const source = '<div data-document-cache><CacheProbe /></div>'
        try {
            const first = new UITemplate(source, firstDocument, ['CacheProbe'])
            const second = new UITemplate(source, secondDocument, ['CacheProbe'])
            new UITemplate(source, firstDocument, ['CacheProbe'])
            new UITemplate(source, secondDocument, ['CacheProbe'])

            expect(expand).toHaveBeenCalledTimes(2)
            expect(first.root.ownerDocument).toBe(firstDocument)
            expect(second.root.ownerDocument).toBe(secondDocument)
        } finally {
            expand.mockRestore()
        }
    })

    it('does not copy runtime form state, expandos, or listeners through the cache', () => {
        const isolatedDocument = document.implementation.createHTMLDocument('cache-runtime-state')
        const source = '<div data-runtime-cache><input value="seed"></div>'
        const first = new UITemplate(source, isolatedDocument)
        const firstInput = first.root.querySelector('input')!
        const click = vi.fn()
        firstInput.value = 'mutated'
        firstInput.checked = true
        ;(firstInput as HTMLInputElement & {expando?: string}).expando = 'private'
        firstInput.addEventListener('click', click)

        const second = new UITemplate(source, isolatedDocument)
        const secondInput = second.root.querySelector('input')!
        secondInput.click()

        expect(secondInput.value).toBe('seed')
        expect(secondInput.checked).toBe(false)
        expect((secondInput as HTMLInputElement & {expando?: string}).expando).toBeUndefined()
        expect(click).not.toHaveBeenCalled()
    })

    it('does not cache invalid templates or component implementations', () => {
        const isolatedDocument = document.implementation.createHTMLDocument('invalid-template-cache')
        const prototype = UITemplate.prototype as unknown as {
            expandSelfClosingComponents(source: string, componentNames: readonly string[]): string
        }
        const expand = vi.spyOn(prototype, 'expandSelfClosingComponents')
        const invalid = '<div></div><CacheFailure />'

        expect(() => new UITemplate(invalid, isolatedDocument, ['CacheFailure'])).toThrow('exactly one root')
        expect(() => new UITemplate(invalid, isolatedDocument, ['CacheFailure'])).toThrow('exactly one root')
        expect(expand).toHaveBeenCalledTimes(2)
        expand.mockRestore()

        const source = '<div><CachedImplementation /></div>'
        const First: TinyUIComponent = (_props, context) => context.document.createElement('i')
        const Second: TinyUIComponent = (_props, context) => context.document.createElement('b')
        const first = html(source, {}, {document: isolatedDocument, components: {CachedImplementation: First}})
        const second = html(source, {}, {document: isolatedDocument, components: {CachedImplementation: Second}})
        expect(first.root.firstElementChild?.tagName).toBe('I')
        expect(second.root.firstElementChild?.tagName).toBe('B')
    })

    it.each([
        '',
        'plain text',
        '<div></div><span></span>',
        '<!-- comment --><div></div>',
    ])('rejects a template without exactly one root element: %s', (source) => {
        expect(() => new UITemplate(source, document)).toThrow(
            'must contain exactly one root element',
        )
    })
})
