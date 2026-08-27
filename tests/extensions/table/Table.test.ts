import {Editor} from '@tiptap/core'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import {UndoRedo} from '@tiptap/extensions'
import {NodeSelection, TextSelection} from '@tiptap/pm/state'
import {CellSelection, TableMap} from '@tiptap/pm/tables'
import {afterEach, describe, expect, it} from 'vitest'
function getLogicalTableColumnCount(table: import('@tiptap/pm/model').Node): number {
  return table.type.name === 'table' ? TableMap.get(table).width : 0
}
import {Table, getTableSelectionMode} from '../../../src/extensions/table/Table'
import {TableCell} from '../../../src/extensions/table/TableCell'
import {normalizeTableCellColor} from '../../../src/extensions/table/TableCellAttributes'
import {TableHeader} from '../../../src/extensions/table/TableHeader'
import {normalizeTableRowHeight, TableRow} from '../../../src/extensions/table/TableRow'

const editors: Editor[] = []

function createEditor(content: string): Editor {
  const element = document.createElement('div')
  document.body.append(element)
  const editor = new Editor({
    element,
    extensions: [
      Document,
      Paragraph,
      Text,
      UndoRedo,
      Table.configure({resizable: true, cellMinWidth: 80, allowTableNodeSelection: true}),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
  })
  editors.push(editor)
  return editor
}

function cellPositions(editor: Editor): number[] {
  const positions: number[] = []
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') positions.push(pos)
  })
  return positions
}

afterEach(() => editors.splice(0).forEach((editor) => editor.destroy()))

describe('Table selection and controls', () => {
  it('将整表 NodeSelection 识别为 table 模式', () => {
    const editor = createEditor('<table><tbody><tr><td><p>A</p></td></tr></tbody></table>')
    const tableSelection = NodeSelection.create(editor.state.doc, 0)
    const textSelection = TextSelection.create(editor.state.doc, cellPositions(editor)[0]! + 1)

    expect(getTableSelectionMode(tableSelection, true)).toBe('table')
    expect(getTableSelectionMode(textSelection, true)).toBe('cell')
    expect(getTableSelectionMode(textSelection, false)).toBe('none')
  })

  it('整表 Grip 选择完整的二维表格', () => {
    const editor = createEditor(`
      <table><tbody>
        <tr><td><p>A</p></td><td><p>B</p></td></tr>
        <tr><td><p>C</p></td><td><p>D</p></td></tr>
      </tbody></table>
    `)
    editor.view.dom.querySelector<HTMLElement>('[data-table-grip-kind="table"]')?.click()

    expect(getTableSelectionMode(editor.state.selection, true)).toBe('table')
    expect(editor.view.dom.querySelectorAll('.selectedCell')).toHaveLength(4)
  })

  it('第一列存在 rowspan 时按逻辑行创建左侧行手柄', () => {
    const editor = createEditor(`
      <table><tbody>
        <tr><td rowspan="2"><p>A</p></td><td><p>B</p></td></tr>
        <tr><td><p>C</p></td></tr>
      </tbody></table>
    `)

    const grips = [...editor.view.dom.querySelectorAll<HTMLElement>('[data-table-grip-kind="row"]')]
    expect(grips).toHaveLength(2)
    expect(grips.map((grip) => grip.dataset.tableGripIndex)).toEqual(['0', '1'])
    grips[1]?.click()
    expect(editor.state.selection).toBeInstanceOf(CellSelection)
  })

  it('逻辑行选择包含当前行相交的所有合并与独立单元格', () => {
    const editor = createEditor(`
      <table><tbody>
        <tr><th><p>阶段</p></th><th><p>负责人</p></th><th><p>状态</p></th><th><p>目标日期</p></th></tr>
        <tr><td><p>调研</p></td><td rowspan="2" colspan="2"><p>合并内容</p></td><td><p>5 月 10 日</p></td></tr>
        <tr><td><p>原型</p></td><td><p>5 月 24 日</p></td></tr>
        <tr><td><p>发布</p></td><td><p>工程团队</p></td><td><p>已计划</p></td><td><p>6 月 7 日</p></td></tr>
      </tbody></table>
    `)

    const grips = [...editor.view.dom.querySelectorAll<HTMLElement>('[data-table-grip-kind="row"]')]
    grips[1]?.click()
    expect(editor.state.selection).toBeInstanceOf(CellSelection)
    const secondRowCells: string[] = []
    ;(editor.state.selection as CellSelection).forEachCell((cell) => secondRowCells.push(cell.textContent))
    expect(new Set(secondRowCells)).toEqual(new Set(['调研', '合并内容', '5 月 10 日']))
    expect(new Set([...editor.view.dom.querySelectorAll<HTMLElement>('.selectedCell')].map((cell) => cell.textContent))).toEqual(
      new Set(['调研', '合并内容', '5 月 10 日']),
    )

    grips[2]?.click()
    expect(editor.state.selection).toBeInstanceOf(CellSelection)
    const thirdRowCells: string[] = []
    ;(editor.state.selection as CellSelection).forEachCell((cell) => thirdRowCells.push(cell.textContent))
    expect(new Set(thirdRowCells)).toEqual(new Set(['原型', '合并内容', '5 月 24 日']))
    expect(new Set([...editor.view.dom.querySelectorAll<HTMLElement>('.selectedCell')].map((cell) => cell.textContent))).toEqual(
      new Set(['原型', '合并内容', '5 月 24 日']),
    )
  })

  it('rowspan 单元格内部不重复创建行高操作手柄', () => {
    const editor = createEditor(`
      <table><tbody>
        <tr><td rowspan="2"><p>A</p></td><td><p>B</p></td></tr>
        <tr><td><p>C</p></td></tr>
      </tbody></table>
    `)

    expect(editor.view.dom.querySelectorAll('[data-table-row-resize-handle]')).toHaveLength(2)
  })

  it('第一行存在 colspan 时仍为每个逻辑列创建选择手柄', () => {
    const editor = createEditor(`
      <table><tbody>
        <tr><td colspan="2"><p>A</p></td></tr>
        <tr><td><p>B</p></td><td><p>C</p></td></tr>
      </tbody></table>
    `)

    const grips = [...editor.view.dom.querySelectorAll<HTMLElement>('[data-table-grip-kind="column"]')]
    expect(grips).toHaveLength(2)
    expect(grips.map((grip) => grip.dataset.tableGripIndex)).toEqual(['0', '1'])
    grips[1]?.click()
    expect(editor.state.selection).toBeInstanceOf(CellSelection)
  })

  it('点击与合并单元格相交的列时只选择目标逻辑列', () => {
    const editor = createEditor(`
      <table><tbody>
        <tr><td><p>H1</p></td><td><p>H2</p></td><td><p>H3</p></td><td><p>H4</p></td></tr>
        <tr><td><p>A1</p></td><td rowspan="2" colspan="3"><p>merged</p></td></tr>
        <tr><td><p>B1</p></td></tr>
      </tbody></table>
    `)

    editor.view.dom.querySelector<HTMLElement>(
      '[data-table-grip-kind="column"][data-table-grip-index="1"]',
    )?.click()

    const selectedGrips = [...editor.view.dom.querySelectorAll<HTMLElement>(
      '[data-table-grip-kind="column"][aria-pressed="true"]',
    )]
    const selectedCells: string[] = []
    const selection = editor.state.selection as CellSelection
    selection.forEachCell((cell) => selectedCells.push(cell.textContent))

    expect(getTableSelectionMode(selection, true)).toBe('column')
    expect(selectedGrips.map((grip) => grip.dataset.tableGripIndex)).toEqual(['1'])
    expect(selectedCells).toEqual(['H2', 'merged'])

    expect(editor.commands.setTableCellBackgroundColor('#123456')).toBe(true)
    expect(editor.getHTML().match(/background-color: rgb\(18, 52, 86\)/g)).toHaveLength(2)

    expect(editor.commands.deleteColumn()).toBe(true)
    expect(getLogicalTableColumnCount(editor.state.doc.firstChild!)).toBe(3)
    expect(editor.getHTML()).toContain('colspan="2"')
  })

  it('拖动单元格底边后持久化表格行高', () => {
    const editor = createEditor('<table><tbody><tr><td><p>A</p></td><td><p>B</p></td></tr></tbody></table>')
    const cell = editor.view.dom.querySelector<HTMLTableCellElement>('td')!
    const row = cell.parentElement as HTMLTableRowElement
    const handle = cell.querySelector<HTMLElement>('[data-table-row-resize-handle]')!
    row.getBoundingClientRect = () => ({
      x: 10, y: 10, top: 10, left: 10, right: 410, bottom: 50, width: 400, height: 40, toJSON: () => ({}),
    })

    handle.dispatchEvent(new MouseEvent('pointerdown', {bubbles: true, button: 0, clientX: 100, clientY: 49}))
    window.dispatchEvent(new MouseEvent('pointermove', {bubbles: true, clientX: 100, clientY: 79}))

    expect(editor.getJSON().content?.[0]?.content?.[0]?.attrs?.rowHeight).toBe(70)

    window.dispatchEvent(new MouseEvent('pointerup', {bubbles: true, clientX: 100, clientY: 79}))

    expect(editor.getJSON().content?.[0]?.content?.[0]?.attrs?.rowHeight).toBe(70)
    expect(editor.getHTML()).toContain('style="height: 70px;"')
    expect(editor.commands.undo()).toBe(true)
    expect(editor.getJSON().content?.[0]?.content?.[0]?.attrs?.rowHeight).toBeNull()
  })
})

describe('Table cell style attributes', () => {
  it('从 HTML 恢复行高并限制异常值', () => {
    const editor = createEditor('<table><tbody><tr style="height: 64px"><td><p>A</p></td></tr></tbody></table>')

    expect(editor.getJSON().content?.[0]?.content?.[0]?.attrs?.rowHeight).toBe(64)
    expect(editor.getHTML()).toContain('style="height: 64px;"')
    expect(normalizeTableRowHeight('2px')).toBe(32)
    expect(normalizeTableRowHeight('invalid')).toBeNull()
  })

  it('批量设置背景色、文字色和垂直对齐并正确导出 HTML', () => {
    const editor = createEditor(`
      <table><tbody><tr><td><p>A</p></td><td><p>B</p></td></tr></tbody></table>
    `)
    const [first, second] = cellPositions(editor)
    editor.commands.setCellSelection({anchorCell: first!, headCell: second!})

    expect(editor.commands.setTableCellBackgroundColor('#FFCC00')).toBe(true)
    expect(editor.commands.setTableCellTextColor('rgb(10, 20, 30)')).toBe(true)
    expect(editor.commands.setTableCellVerticalAlign('middle')).toBe(true)

    const cells = editor.getJSON().content?.[0]?.content?.[0]?.content ?? []
    expect(cells).toHaveLength(2)
    cells.forEach((cell) => expect(cell.attrs).toMatchObject({
      backgroundColor: '#ffcc00',
      color: 'rgb(10, 20, 30)',
      verticalAlign: 'middle',
    }))
    const html = editor.getHTML()
    expect(html.match(/background-color: rgb\(255, 204, 0\)/g)).toHaveLength(2)
    expect(html.match(/color: rgb\(10, 20, 30\)/g)).toHaveLength(2)
    expect(html.match(/vertical-align: middle/g)).toHaveLength(2)
  })

  it('TableCell 和 TableHeader 都能从 HTML 恢复样式属性', () => {
    const editor = createEditor(`
      <table><tbody><tr>
        <th style="background-color: rgb(1, 2, 3); color: white; vertical-align: bottom"><p>H</p></th>
        <td style="background-color: #abcdef; color: red; vertical-align: middle"><p>A</p></td>
      </tr></tbody></table>
    `)
    const cells = editor.getJSON().content?.[0]?.content?.[0]?.content ?? []

    expect(cells[0]?.type).toBe('tableHeader')
    expect(cells[0]?.attrs).toMatchObject({
      backgroundColor: 'rgb(1, 2, 3)', color: 'white', verticalAlign: 'bottom',
    })
    expect(cells[1]?.attrs).toMatchObject({
      backgroundColor: 'rgb(171, 205, 239)', color: 'red', verticalAlign: 'middle',
    })
  })

  it('切换表头单元格时保留样式，并允许恢复默认值', () => {
    const editor = createEditor('<table><tbody><tr><td><p>A</p></td></tr></tbody></table>')
    const [first] = cellPositions(editor)
    editor.commands.setCellSelection({anchorCell: first!})
    editor.commands.setTableCellBackgroundColor('#123456')
    editor.commands.setTableCellVerticalAlign('bottom')

    expect(editor.commands.toggleHeaderCell()).toBe(true)
    expect(editor.getJSON().content?.[0]?.content?.[0]?.content?.[0]).toMatchObject({
      type: 'tableHeader', attrs: {backgroundColor: '#123456', verticalAlign: 'bottom'},
    })
    editor.commands.setTableCellBackgroundColor(null)
    editor.commands.setTableCellVerticalAlign(null)
    expect(editor.getHTML()).not.toContain('background-color')
    expect(editor.getHTML()).not.toContain('vertical-align')
  })

  it('切换表头行和表头列时保留单元格样式', () => {
    const editor = createEditor(`
      <table><tbody>
        <tr><td><p>A</p></td><td><p>B</p></td></tr>
        <tr><td><p>C</p></td><td><p>D</p></td></tr>
      </tbody></table>
    `)
    const positions = cellPositions(editor)
    editor.commands.setCellSelection({anchorCell: positions[0]!, headCell: positions.at(-1)!})
    editor.commands.setTableCellBackgroundColor('#abcdef')
    editor.commands.setTableCellTextColor('navy')
    editor.commands.setTableCellVerticalAlign('middle')

    expect(editor.commands.toggleHeaderRow()).toBe(true)
    expect(editor.commands.toggleHeaderColumn()).toBe(true)

    const rows = editor.getJSON().content?.[0]?.content ?? []
    expect(rows[0]?.content?.every((cell) => cell.type === 'tableHeader')).toBe(true)
    expect(rows[1]?.content?.[0]?.type).toBe('tableHeader')
    rows.forEach((row) => row.content?.forEach((cell) => expect(cell.attrs).toMatchObject({
      backgroundColor: '#abcdef', color: 'navy', verticalAlign: 'middle',
    })))
  })

  it('拒绝可注入声明或加载外部资源的颜色值', () => {
    expect(normalizeTableCellColor('red; background: black')).toBeNull()
    expect(normalizeTableCellColor('url(https://example.com/a.png)')).toBeNull()
    expect(normalizeTableCellColor('var(--secret)')).toBeNull()
    expect(normalizeTableCellColor('#ABC')).toBe('#abc')

    const editor = createEditor('<table><tbody><tr><td><p>A</p></td></tr></tbody></table>')
    editor.commands.setCellSelection({anchorCell: cellPositions(editor)[0]!})
    editor.commands.setTableCellBackgroundColor('red; background: black')
    expect(editor.getAttributes('tableCell').backgroundColor).toBeNull()
    expect(editor.getHTML()).not.toContain('background: black')
  })

  it('合并单元格时仍能计算正确的逻辑列数', () => {
    const editor = createEditor(`
      <table><tbody>
        <tr><td colspan="2"><p>A</p></td></tr>
        <tr><td><p>B</p></td><td><p>C</p></td></tr>
      </tbody></table>
    `)
    const table = editor.state.doc.firstChild!

    expect(table.firstChild?.childCount).toBe(1)
    expect(getLogicalTableColumnCount(table)).toBe(2)
  })
})
