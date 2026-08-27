import {afterEach, describe, expect, it} from 'vitest'
import {Editor} from '@tiptap/core'
import Document from '@tiptap/extension-document'
import Heading from '@tiptap/extension-heading'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import {BulletList, ListItem} from '@tiptap/extension-list'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import {MessageSquareText} from 'lucide'
import {createBlockDragMenuPlugin, defaultBlockQuickInsertItems, moveBlock} from '../../../src/features/block-drag/BlockDragMenu'

const editors: Editor[] = []

function createEditor(options = {}) {
  const host = document.createElement('div')
  document.body.append(host)
  const editor = new Editor({
    element: host,
    extensions: [Document, Paragraph, Text, Heading, HorizontalRule, ListItem, BulletList],
    content: '<p>First</p><p>Second</p>',
  })
  editor.registerPlugin(createBlockDragMenuPlugin(editor, options))
  editors.push(editor)
  return editor
}

function createDragEvent(type: string, dataTransfer: Record<string, unknown>, clientX: number, clientY: number): Event {
  const event = new Event(type, {bubbles: true, cancelable: true})
  Object.defineProperties(event, {
    dataTransfer: {value: dataTransfer},
    clientX: {value: clientX},
    clientY: {value: clientY},
  })
  return event
}

afterEach(() => editors.splice(0).forEach((editor) => editor.destroy()))

describe('BlockDragMenu', () => {
  it('renders the block controls and default quick insert items', () => {
    const editor = createEditor()
    const menu = editor.view.dom.parentElement?.querySelector('.aieditor__block-drag-menu')
    expect(menu).toBeTruthy()
    expect(menu?.querySelector('.aieditor__block-drag-handle')).toBeTruthy()
    expect(menu?.firstElementChild?.classList.contains('aieditor__block-quick-trigger')).toBe(true)
    expect(menu?.children[1]?.classList.contains('aieditor__block-drag-handle')).toBe(true)
    expect(menu?.querySelectorAll('.aieditor__block-quick-insert button').length)
      .toBeGreaterThan(0)
    expect(menu?.querySelector('.aieditor__block-quick-insert')?.classList
      .contains('aieditor__toolbar-menu-group-panel')).toBe(true)
  })

  it('closes the quick insert menu when clicking outside', () => {
    const editor = createEditor()
    const first = editor.view.dom.firstElementChild as HTMLElement
    first.dispatchEvent(new MouseEvent('mousemove', {bubbles: true}))
    const menu = editor.view.dom.parentElement?.querySelector('.aieditor__block-drag-menu') as HTMLElement
    const quick = menu.querySelector('.aieditor__block-quick-insert') as HTMLElement
    ;(menu.querySelector('.aieditor__block-quick-trigger') as HTMLButtonElement).click()
    expect(quick.hidden).toBe(false)
    editor.view.dom.dispatchEvent(new MouseEvent('click', {bubbles: true}))
    expect(quick.hidden).toBe(true)
  })

  it('locks the controls to their trigger block while the quick insert menu is open', () => {
    const editor = createEditor()
    const host = editor.view.dom.parentElement as HTMLElement
    const first = editor.view.dom.firstElementChild as HTMLElement
    const second = editor.view.dom.children[1] as HTMLElement
    const menu = host.querySelector('.aieditor__block-drag-menu') as HTMLElement
    const quick = menu.querySelector('.aieditor__block-quick-insert') as HTMLElement
    host.getBoundingClientRect = () => ({left: 0, top: 100} as DOMRect)
    first.getBoundingClientRect = () => ({left: 100, top: 200} as DOMRect)
    second.getBoundingClientRect = () => ({left: 100, top: 300} as DOMRect)

    first.dispatchEvent(new MouseEvent('mousemove', {bubbles: true}))
    ;(menu.querySelector('.aieditor__block-quick-trigger') as HTMLButtonElement).click()
    expect(menu.style.top).toBe('102px')
    expect(quick.hidden).toBe(false)

    second.dispatchEvent(new MouseEvent('mousemove', {bubbles: true}))
    expect(menu.style.top).toBe('102px')

    editor.view.dom.dispatchEvent(new MouseEvent('click', {bubbles: true}))
    second.dispatchEvent(new MouseEvent('mousemove', {bubbles: true}))
    expect(quick.hidden).toBe(true)
    expect(menu.style.top).toBe('202px')
  })

  it('positions the controls correctly inside a scrolled paginated host', () => {
    const editor = createEditor()
    const host = editor.view.dom.parentElement as HTMLElement
    const first = editor.view.dom.firstElementChild as HTMLElement
    const menu = host.querySelector('.aieditor__block-drag-menu') as HTMLElement
    Object.defineProperty(host, 'scrollTop', {value: 500, writable: true})
    Object.defineProperty(host, 'scrollLeft', {value: 20, writable: true})
    Object.defineProperty(menu, 'offsetWidth', {value: 56})
    editor.view.dom.style.paddingLeft = '100px'
    host.getBoundingClientRect = () => ({left: 50, top: 100} as DOMRect)
    editor.view.dom.getBoundingClientRect = () => ({left: 200, width: 800} as DOMRect)
    first.getBoundingClientRect = () => ({left: 400, top: 300} as DOMRect)

    first.dispatchEvent(new MouseEvent('mousemove', {bubbles: true}))

    expect(menu.style.left).toBe('210px')
    expect(menu.style.top).toBe('702px')
    expect(menu.hidden).toBe(false)
  })

  it('keeps controls in the content gutter when a media block is centered or resized', () => {
    const editor = createEditor()
    const host = editor.view.dom.parentElement as HTMLElement
    const first = editor.view.dom.firstElementChild as HTMLElement
    const second = editor.view.dom.children[1] as HTMLElement
    const menu = host.querySelector('.aieditor__block-drag-menu') as HTMLElement
    Object.defineProperty(menu, 'offsetWidth', {value: 56})
    editor.view.dom.style.paddingLeft = '100px'
    host.getBoundingClientRect = () => ({left: 50, top: 100} as DOMRect)
    editor.view.dom.getBoundingClientRect = () => ({left: 200, width: 800} as DOMRect)
    first.getBoundingClientRect = () => ({left: 300, top: 200} as DOMRect)
    second.getBoundingClientRect = () => ({left: 500, top: 300} as DOMRect)

    first.dispatchEvent(new MouseEvent('mousemove', {bubbles: true}))
    const paragraphLeft = menu.style.left
    second.dispatchEvent(new MouseEvent('mousemove', {bubbles: true}))

    expect(paragraphLeft).toBe('190px')
    expect(menu.style.left).toBe(paragraphLeft)
    expect(menu.style.top).toBe('202px')
  })

  it('centers controls on a product-declared line anchor', () => {
    const editor = createEditor()
    const host = editor.view.dom.parentElement as HTMLElement
    const first = editor.view.dom.firstElementChild as HTMLElement
    const menu = host.querySelector('.aieditor__block-drag-menu') as HTMLElement
    const organization = document.createElement('span')
    organization.dataset.blockDragAnchor = 'line'
    organization.style.lineHeight = '40px'
    first.replaceChildren(organization)
    Object.defineProperty(menu, 'offsetWidth', {value: 56})
    Object.defineProperty(menu, 'offsetHeight', {value: 28})
    host.getBoundingClientRect = () => ({left: 0, top: 100} as DOMRect)
    editor.view.dom.getBoundingClientRect = () => ({left: 100, width: 800} as DOMRect)
    first.getBoundingClientRect = () => ({left: 200, top: 200} as DOMRect)
    organization.getBoundingClientRect = () => ({left: 200, top: 230, height: 40} as DOMRect)

    organization.dispatchEvent(new MouseEvent('mousemove', {bubbles: true}))

    expect(menu.style.top).toBe('136px')
  })

  it('aligns controls with a product-declared element anchor', () => {
    const editor = createEditor()
    const host = editor.view.dom.parentElement as HTMLElement
    const first = editor.view.dom.firstElementChild as HTMLElement
    const menu = host.querySelector('.aieditor__block-drag-menu') as HTMLElement
    const seal = document.createElement('img')
    seal.dataset.blockDragAnchor = ''
    first.replaceChildren(seal)
    Object.defineProperty(menu, 'offsetWidth', {value: 56})
    host.getBoundingClientRect = () => ({left: 0, top: 100} as DOMRect)
    editor.view.dom.getBoundingClientRect = () => ({left: 100, width: 800} as DOMRect)
    first.getBoundingClientRect = () => ({left: 200, top: 200} as DOMRect)
    seal.getBoundingClientRect = () => ({left: 200, top: 230} as DOMRect)

    seal.dispatchEvent(new MouseEvent('mousemove', {bubbles: true}))

    expect(menu.style.top).toBe('132px')
  })

  it('ignores extension decoration widgets between document blocks', () => {
    const editor = createEditor()
    const host = editor.view.dom.parentElement as HTMLElement
    const first = editor.view.dom.firstElementChild as HTMLElement
    const widget = document.createElement('span')
    const menu = host.querySelector('.aieditor__block-drag-menu') as HTMLElement
    widget.setAttribute('contenteditable', 'false')
    widget.classList.add('ProseMirror-widget')
    editor.view.dom.append(widget)
    host.getBoundingClientRect = () => ({left: 0, top: 100} as DOMRect)
    editor.view.dom.getBoundingClientRect = () => ({left: 100, width: 800} as DOMRect)
    first.getBoundingClientRect = () => ({left: 200, top: 200} as DOMRect)
    widget.getBoundingClientRect = () => ({left: 200, top: 400} as DOMRect)

    first.dispatchEvent(new MouseEvent('mousemove', {bubbles: true}))
    const firstTop = menu.style.top
    widget.dispatchEvent(new MouseEvent('mousemove', {bubbles: true}))

    expect(menu.style.top).toBe(firstTop)
  })

  it('aligns paginated tables with the first real cell instead of the page-break row', () => {
    const editor = createEditor()
    const host = editor.view.dom.parentElement as HTMLElement
    const first = editor.view.dom.firstElementChild as HTMLElement
    const menu = host.querySelector('.aieditor__block-drag-menu') as HTMLElement
    const table = document.createElement('table')
    const pageBreakRow = table.insertRow()
    const pageBreakCell = pageBreakRow.insertCell()
    const contentRow = table.insertRow()
    const contentCell = contentRow.insertCell()
    const content = document.createElement('p')
    pageBreakRow.classList.add('ProseMirror-widget')
    content.style.lineHeight = '40px'
    contentCell.append(content)
    first.replaceChildren(table)
    Object.defineProperty(menu, 'offsetWidth', {value: 56})
    Object.defineProperty(menu, 'offsetHeight', {value: 28})
    host.getBoundingClientRect = () => ({left: 0, top: 100} as DOMRect)
    editor.view.dom.getBoundingClientRect = () => ({left: 100, width: 800} as DOMRect)
    first.getBoundingClientRect = () => ({left: 200, top: 200} as DOMRect)
    pageBreakCell.getBoundingClientRect = () => ({left: 200, top: 200, height: 40} as DOMRect)
    content.getBoundingClientRect = () => ({left: 200, top: 300, height: 40} as DOMRect)

    content.dispatchEvent(new MouseEvent('mousemove', {bubbles: true}))

    expect(menu.style.top).toBe('206px')
  })

  it('supports custom items and passes the real editor to content functions', () => {
    let received: Editor | undefined
    const editor = createEditor({quickInsert: [{
      id: 'custom',
      label: 'Custom block',
      content: (instance: Editor) => {
        received = instance
        return '<p>Inserted</p>'
      },
    }]})
    const first = editor.view.dom.firstElementChild as HTMLElement
    first.dispatchEvent(new MouseEvent('mousemove', {bubbles: true}))
    const menu = editor.view.dom.parentElement?.querySelector('.aieditor__block-drag-menu') as HTMLElement
    ;(menu.querySelector('.aieditor__block-quick-trigger') as HTMLButtonElement).click()
    ;(menu.querySelector('[data-block-quick-insert="custom"]') as HTMLButtonElement)?.click()
    expect(received).toBe(editor)
    expect(editor.getHTML()).toContain('Inserted')
  })

  it('preserves the configured order when built-in and custom items are mixed', () => {
    const editor = createEditor({quickInsert: [
      'text-style',
      {id: 'custom', label: 'Custom block', content: '<p>Custom</p>'},
      'underline',
    ]})
    const items = [...editor.view.dom.parentElement!.querySelectorAll(
      '.aieditor__block-quick-menu-items > [data-menu-item]',
    )].map((element) => element.getAttribute('data-menu-item'))
    expect(items).toEqual(['text-style', 'custom'])
  })

  it('supports ToolbarMenusConfig callbacks and separators', () => {
    let defaultIds: string[] = []
    const editor = createEditor({quickInsert: (defaults: {id: string}[]) => {
      defaultIds = defaults.map((item) => item.id)
      return ['text-style', '|', {id: 'custom', label: 'Custom', content: '<p>Custom</p>'}]
    }})
    const items = [...editor.view.dom.parentElement!.querySelectorAll(
      '.aieditor__block-quick-menu-items > [data-menu-item]',
    )].map((element) => element.getAttribute('data-menu-item'))
    expect(defaultIds).toContain('table')
    expect(items).toEqual(['text-style', 'separator-custom-0', 'custom'])
  })

  it('renders nested menu groups and declarative buttons', () => {
    let clicked = false
    const editor = createEditor({quickInsert: [{
      key: 'insert-group',
      label: 'Insert',
      items: [
        'text-style',
        {
          key: 'nested-group',
          label: 'Nested',
          items: [{
            type: 'button',
            key: 'custom-action',
            label: 'Custom action',
            onClick: () => { clicked = true },
          }],
        },
      ],
    }]})
    const host = editor.view.dom.parentElement!
    const topTrigger = host.querySelector('[data-menu-item="insert-group"] button') as HTMLButtonElement
    topTrigger.click()
    const nestedTrigger = document.body.querySelector(
      '[data-menu-item="nested-group"] button',
    ) as HTMLButtonElement
    expect(nestedTrigger).toBeTruthy()
    nestedTrigger.click()
    const action = document.body.querySelector(
      '[data-menu-item="custom-action"]',
    ) as HTMLButtonElement
    expect(action).toBeTruthy()
    action.click()
    expect(clicked).toBe(true)
  })

  it('renders direct menu items with icons separately from menu groups', () => {
    const editor = createEditor({quickInsert: [
      'bullet-list',
      {id: 'notice', label: 'Notice', icon: MessageSquareText, content: '<blockquote>Notice</blockquote>'},
      {key: 'more', label: 'More', icon: MessageSquareText, items: ['text-style']},
    ]})
    const host = editor.view.dom.parentElement!
    const bullet = host.querySelector('button[data-menu-item="bullet-list"]') as HTMLButtonElement
    const notice = host.querySelector('button[data-menu-item="notice"]') as HTMLButtonElement
    const group = host.querySelector('[data-menu-item="more"] button') as HTMLButtonElement

    expect(bullet.querySelector('svg')).toBeTruthy()
    expect(bullet.hasAttribute('aria-haspopup')).toBe(false)
    expect(notice.querySelector('svg')).toBeTruthy()
    expect(notice.hasAttribute('aria-haspopup')).toBe(false)
    expect(group.querySelector('svg.aieditor__toolbar-menu-group-icon')).toBeTruthy()
    expect(group.getAttribute('aria-haspopup')).toBe('menu')
  })

  it('moves a top-level block when the drag handle is dropped on another block', () => {
    const editor = createEditor()
    moveBlock(editor.view, 0, 1)
    expect(editor.getJSON().content?.map((node) => node.content?.[0]?.text)).toEqual(['Second', 'First'])
  })

  it('moves a lower block after an upper target', () => {
    const editor = createEditor()
    editor.commands.setContent('<p>First</p><p>Second</p><p>Third</p>')

    moveBlock(editor.view, 2, 0)

    expect(editor.getJSON().content?.map((node) => node.content?.[0]?.text))
      .toEqual(['First', 'Third', 'Second'])
  })

  it('commits a native drop once and does not copy the dragged block on dragend', () => {
    const editor = createEditor()
    editor.commands.setContent('<p>First</p><p>Second</p><p>Third</p>')
    const blocks = [...editor.view.dom.children] as HTMLElement[]
    const handle = editor.view.dom.parentElement!.querySelector('.aieditor__block-drag-handle') as HTMLElement
    const originalElementFromPoint = document.elementFromPoint
    const dataTransfer = {
      effectAllowed: 'none',
      clearData: () => undefined,
      setData: () => undefined,
      setDragImage: () => undefined,
    }
    blocks.forEach((block, index) => {
      block.getBoundingClientRect = () => ({left: 100, top: 100 + index * 100, height: 40} as DOMRect)
    })
    Object.defineProperty(document, 'elementFromPoint', {configurable: true, value: () => blocks[2]})

    try {
      blocks[0].dispatchEvent(new MouseEvent('mousemove', {bubbles: true}))
      handle.dispatchEvent(createDragEvent('dragstart', dataTransfer, 100, 100))
      blocks[2].dispatchEvent(createDragEvent('drop', dataTransfer, 100, 300))
      handle.dispatchEvent(createDragEvent('dragend', dataTransfer, 100, 300))

      const texts = editor.getJSON().content?.map((node) => node.content?.[0]?.text)
      expect(texts).toEqual(['Second', 'Third', 'First'])
      expect(texts).toHaveLength(3)
    } finally {
      Object.defineProperty(document, 'elementFromPoint', {
        configurable: true,
        value: originalElementFromPoint,
      })
    }
  })

  it('moves after the preceding real block when dropped on an extension decoration gap', () => {
    const editor = createEditor()
    editor.commands.setContent('<p>First</p><p>Second</p><p>Third</p>')
    const blocks = [...editor.view.dom.children] as HTMLElement[]
    const widget = document.createElement('div')
    const handle = editor.view.dom.parentElement!.querySelector('.aieditor__block-drag-handle') as HTMLElement
    const originalElementFromPoint = document.elementFromPoint
    const dataTransfer = {
      effectAllowed: 'none',
      clearData: () => undefined,
      setData: () => undefined,
      setDragImage: () => undefined,
    }
    widget.className = 'ProseMirror-widget'
    widget.setAttribute('contenteditable', 'false')
    editor.view.dom.insertBefore(widget, blocks[2])
    blocks[0].getBoundingClientRect = () => ({left: 100, top: 100, height: 40} as DOMRect)
    blocks[1].getBoundingClientRect = () => ({left: 100, top: 200, height: 40} as DOMRect)
    widget.getBoundingClientRect = () => ({left: 100, top: 250, height: 200} as DOMRect)
    blocks[2].getBoundingClientRect = () => ({left: 100, top: 500, height: 40} as DOMRect)
    Object.defineProperty(document, 'elementFromPoint', {configurable: true, value: () => widget})

    try {
      blocks[0].dispatchEvent(new MouseEvent('mousemove', {bubbles: true}))
      handle.dispatchEvent(createDragEvent('dragstart', dataTransfer, 100, 100))
      widget.dispatchEvent(createDragEvent('drop', dataTransfer, 100, 400))
      handle.dispatchEvent(createDragEvent('dragend', dataTransfer, 100, 400))

      const texts = editor.getJSON().content?.map((node) => node.content?.[0]?.text)
      expect(texts).toEqual(['Second', 'First', 'Third'])
      expect(texts).toHaveLength(3)
    } finally {
      Object.defineProperty(document, 'elementFromPoint', {
        configurable: true,
        value: originalElementFromPoint,
      })
    }
  })
})
