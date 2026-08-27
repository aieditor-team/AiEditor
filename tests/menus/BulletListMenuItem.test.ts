import {afterEach, describe, expect, it} from 'vitest'
import {Editor} from '@tiptap/core'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import {BulletList} from '../../src/extensions/bullet-list/BulletList'
import {ListItem} from '../../src/extensions/list-item/ListItem'
import {AiEditorI18n} from '../../src/i18n/AiEditorI18n'
import {BulletListMenuItem} from '../../src/menus/items/blocks/BulletListMenuItem'
import type {MenuContext} from '../../src/menus/core'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

function createContext(content = '<p>item</p>'): MenuContext {
  const element = document.createElement('div')
  document.body.append(element)
  const editor = new Editor({
    element,
    extensions: [Document, Paragraph, Text, ListItem, BulletList],
    content,
  })
  cleanups.push(() => {
    editor.destroy()
    element.remove()
  })
  return {editor, i18n: new AiEditorI18n()}
}

describe('BulletListMenuItem', () => {
  it('renders the bullet-list dropdown with translated options', () => {
    const context = createContext()
    const item = new BulletListMenuItem()
    item.mount(document.body, context)

    expect(item.getElement()?.querySelector('.aieditor__dropdown-trigger')).not.toBeNull()
    expect(document.body.querySelectorAll('.aieditor__dropdown-panel [data-value]')).toHaveLength(4)
    expect(document.body.querySelector('[data-value="circle"]')?.textContent).toContain('空心圆')
    expect(document.body.querySelector('[data-value="circle"] svg')).not.toBeNull()
    expect(document.body.querySelector('[data-value=""] .aieditor__dropdown-option-icon')).toBeNull()

    item.destroy()
  })

  it('applies the selected bullet style and can remove bullets', () => {
    const context = createContext()
    const item = new BulletListMenuItem()
    item.mount(document.body, context)

    item.execute(context, 'square')
    expect(context.editor.isActive('bulletList')).toBe(true)
    expect(context.editor.getAttributes('bulletList').type).toBe('square')
    expect(context.editor.getHTML()).toContain('list-style-type: square')

    item.update(context)
    expect(document.body.querySelector('[data-value="square"]')?.getAttribute('aria-checked')).toBe('true')

    item.execute(context, '')
    expect(context.editor.isActive('bulletList')).toBe(false)

    item.destroy()
  })

  it('does not duplicate list-style-type when updating legacy HTML', () => {
    const context = createContext('<ul style="color: red; list-style-type: circle"><li><p>item</p></li></ul>')
    const item = new BulletListMenuItem()
    item.mount(document.body, context)

    item.execute(context, 'square')
    const html = context.editor.getHTML()
    expect(html.match(/list-style-type:/g)).toHaveLength(1)
    expect(html).toContain('list-style-type: square')

    item.destroy()
  })
})
