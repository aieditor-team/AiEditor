import {Editor} from '@tiptap/core'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import {Table} from '../../src/extensions/table/Table'
import {TableCell} from '../../src/extensions/table/TableCell'
import {TableHeader} from '../../src/extensions/table/TableHeader'
import {TableRow} from '../../src/extensions/table/TableRow'
import type {MenuContext} from '../../src/menus/core'

/** 为表格菜单测试创建带真实 Tiptap 命令的最小上下文。 */
export function createTableEditorContext() {
  const element = document.createElement('div')
  document.body.append(element)
  const editor = new Editor({
    element,
    extensions: [Document, Paragraph, Text, Table, TableRow, TableHeader, TableCell],
    content: '<table><tbody><tr><td><p>A</p></td></tr></tbody></table>',
  })
  let position = 0
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'tableCell') position = pos
  })
  editor.commands.setCellSelection({anchorCell: position})
  const context = {
    editor,
    i18n: {t: (value: string) => value},
  } as MenuContext
  return {
    context,
    editor,
    destroy: () => {
      editor.destroy()
      element.remove()
    },
  }
}
