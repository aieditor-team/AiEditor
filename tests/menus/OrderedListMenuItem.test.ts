import {afterEach, describe, expect, it} from 'vitest'
import {Editor} from '@tiptap/core'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import {ListItem} from '../../src/extensions/list-item/ListItem'
import {OrderedList} from '../../src/extensions/ordered-list/OrderedList'
import {AiEditorI18n} from '../../src/i18n/AiEditorI18n'
import {OrderedListMenuItem} from '../../src/menus/items/blocks/OrderedListMenuItem'
import type {MenuContext} from '../../src/menus/core'

const cleanups: Array<() => void> = []

afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

function createContext(content = '<p>item</p>'): MenuContext {
  const element = document.createElement('div')
  document.body.append(element)
  const editor = new Editor({
    element,
    extensions: [Document, Paragraph, Text, ListItem, OrderedList],
    content,
  })
  cleanups.push(() => {
    editor.destroy()
    element.remove()
  })
  return {editor, i18n: new AiEditorI18n()}
}

describe('OrderedListMenuItem', () => {
  it('renders the numbered-list dropdown with translated options', () => {
    const context = createContext()
    const item = new OrderedListMenuItem()
    item.mount(document.body, context)

    expect(item.getElement()?.querySelector('.aieditor__dropdown-trigger')).not.toBeNull()
    expect(document.body.querySelectorAll('.aieditor__dropdown-panel [data-value]')).toHaveLength(6)
    expect(document.body.querySelector('[data-value=""]')?.textContent).toContain('无编号')

    item.destroy()
  })

  it('applies the selected numbering style and can remove numbering', () => {
    const context = createContext()
    const item = new OrderedListMenuItem()
    item.mount(document.body, context)

    item.execute(context, 'A')
    expect(context.editor.isActive('orderedList')).toBe(true)
    expect(context.editor.getAttributes('orderedList').type).toBe('A')

    item.execute(context, '')
    expect(context.editor.isActive('orderedList')).toBe(false)

    item.destroy()
  })

  it('updates the type of an existing ordered list without changing its content', () => {
    const context = createContext('<ol type="i"><li><p>one</p></li><li><p>two</p></li></ol>')
    const item = new OrderedListMenuItem()
    item.mount(document.body, context)

    item.execute(context, '1')
    expect(context.editor.getAttributes('orderedList').type).toBe(null)
    expect(context.editor.getText()).toContain('one')
    expect(context.editor.getText()).toContain('two')

    item.destroy()
  })
})
