import {Editor} from '@tiptap/core'
import Bold from '@tiptap/extension-bold'
import Document from '@tiptap/extension-document'
import Heading from '@tiptap/extension-heading'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import {UndoRedo} from '@tiptap/extensions'

export function createTestEditor(content = '<p></p>', editable = true): Editor {
    return new Editor({
        element: document.createElement('div'),
        extensions: [Document, Paragraph, Text, Bold, Heading, UndoRedo],
        content,
        editable,
    })
}
