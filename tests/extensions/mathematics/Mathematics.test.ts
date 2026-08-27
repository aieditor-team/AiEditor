import {Editor} from '@tiptap/core'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import {describe, expect, it} from 'vitest'
import {BlockMath} from '../../../src/extensions/mathematics/BlockMath'
import {InlineMath} from '../../../src/extensions/mathematics/InlineMath'
import type {InlineMathOptions} from '../../../src/extensions/mathematics/InlineMath'

function createEditor(options: Partial<InlineMathOptions> = {}) {
  return new Editor({
    element: document.createElement('div'),
    extensions: [Document, Paragraph, Text, InlineMath.configure(options), BlockMath.configure(options)],
    content: '<p>before</p>',
  })
}

describe('Mathematics', () => {
  it('uses raw LaTeX in plain text by default', () => {
    const editor = createEditor()
    editor.commands.insertInlineMath({latex: '\\frac{1}{n}'})
    expect(editor.getText()).toContain('\\frac{1}{n}')
    editor.destroy()
  })

  it('supports a placeholder or omitting formulas from plain text', () => {
    const placeholder = createEditor({renderTextMode: {placeholder: '[formula]'}})
    placeholder.commands.insertInlineMath({latex: 'x^2'})
    expect(placeholder.getText()).toContain('[formula]')
    placeholder.destroy()

    const hidden = createEditor({renderTextMode: 'none'})
    hidden.commands.insertInlineMath({latex: 'x^2'})
    expect(hidden.getText()).not.toContain('x^2')
    hidden.destroy()
  })
})
