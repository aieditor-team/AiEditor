import type { Editor } from '@tiptap/core'
import {
  Table as TTable,
  TableView,
  type TableOptions as TTableOptions,
} from '@tiptap/extension-table'
import {Fragment, Slice, type Node as ProseMirrorNode} from '@tiptap/pm/model'
import {
  NodeSelection,
  Plugin,
  PluginKey,
  Selection,
  SelectionRange,
} from '@tiptap/pm/state'
import {CellSelection, TableMap, type CellBookmark} from '@tiptap/pm/tables'
import type {Mappable} from '@tiptap/pm/transform'
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view'
import { createElement, GripHorizontal, GripVertical } from 'lucide'
import {appendBlockBoundaryControls} from '../shared/BlockBoundaryControls'
import {normalizeTableRowHeight, TABLE_ROW_MIN_HEIGHT} from './TableRow'

export type TableSelectionMode = 'none' | 'cell' | 'row' | 'column' | 'table'
export type TableOptions = TTableOptions

/** 在官方可调整列宽的 TableView 外层增加上下插入段落的边界控件。 */
class AiEditorTableView extends TableView {
  private readonly removeBoundaryControls: () => void

  constructor(
    node: ProseMirrorNode,
    cellMinWidth: number,
    view: EditorView,
    HTMLAttributes: Record<string, unknown> = {},
  ) {
    super(node, cellMinWidth, view, HTMLAttributes)
    this.removeBoundaryControls = appendBlockBoundaryControls(this.dom, view, () => {
      const domPosition = view.posAtDOM(this.contentDOM, 0)
      const $position = view.state.doc.resolve(domPosition)
      for (let depth = $position.depth; depth > 0; depth -= 1) {
        if ($position.node(depth).type.name === 'table') {
          return {position: $position.before(depth), nodeSize: this.node.nodeSize}
        }
      }
      return undefined
    })
  }

  destroy(): void {
    this.removeBoundaryControls()
  }
}

/** 将 ProseMirror 选择类型映射为表格菜单需要的操作模式。 */
export function getTableSelectionMode(selection: Selection, inTable: boolean): TableSelectionMode {
  if (selection instanceof NodeSelection && selection.node.type.name === 'table') return 'table'
  if (!(selection instanceof CellSelection)) return inTable ? 'cell' : 'none'
  if (selection.isRowSelection() && selection.isColSelection()) return 'table'
  if (selection.isRowSelection()) return 'row'
  if (selection.isColSelection()) return 'column'
  return 'cell'
}

/** 第一行被 colspan 覆盖时，向下寻找真正起始于目标逻辑列的单元格。 */
function findColumnGripPosition(map: TableMap, table: ProseMirrorNode, column: number): number {
  // 所有逻辑列的手柄统一挂在首行；合并表头时由样式在合并单元格内分段。
  return map.positionAt(0, column, table)
}

function findRowBoundaryPosition(map: TableMap, table: ProseMirrorNode, row: number): number {
  for (let candidate = row; candidate >= 0; candidate -= 1) {
    const position = map.positionAt(candidate, 0, table)
    const rect = map.findCell(position)
    if (rect.left === 0 && rect.top <= row && rect.bottom > row) return position
  }
  return map.positionAt(row, 0, table)
}

/** 返回目标逻辑列实际覆盖的单元格，跨行单元格只保留一次。 */
function getLogicalColumnCellPositions(map: TableMap, column: number): number[] {
  const positions: number[] = []
  const seen = new Set<number>()
  for (let row = 0; row < map.height; row += 1) {
    const position = map.map[row * map.width + column]
    if (position === undefined || seen.has(position)) continue
    seen.add(position)
    positions.push(position)
  }
  return positions
}

/** 返回目标逻辑行实际覆盖的单元格，横向或纵向合并单元格只保留一次。 */
function getLogicalRowCellPositions(map: TableMap, row: number): number[] {
  return [...new Set(map.map.slice(row * map.width, (row + 1) * map.width))]
}

/** 优先用未横向合并的单元格作为选区锚点，使结构命令只处理一个逻辑列。 */
function findLogicalColumnAnchor(map: TableMap, column: number): number {
  for (const position of getLogicalColumnCellPositions(map, column)) {
    const rect = map.findCell(position)
    if (rect.left === column && rect.right === column + 1) return position
  }
  return map.map[column]!
}

/** 从 colspan 中裁出目标逻辑列，供复制逻辑列内容时使用。 */
function isolateLogicalColumnCell(
  cell: ProseMirrorNode,
  cellLeft: number,
  column: number,
): ProseMirrorNode {
  if (Number(cell.attrs.colspan) <= 1) return cell
  const widthIndex = column - cellLeft
  // colwidth 数组按“逻辑列”存储，一个合并单元格可能包含多个宽度。拆出目标列时必须
  // 取对应下标，而不能复用整个数组，否则 DOCX tblGrid 会多出列。
  const originalWidths = Array.isArray(cell.attrs.colwidth) ? cell.attrs.colwidth : null
  const width = originalWidths?.[widthIndex]
  const attrs = {
    ...cell.attrs,
    colspan: 1,
    colwidth: width ? [width] : null,
  }
  // 目标列位于合并单元格内部时不复制原内容，避免同一内容在多列复制结果中重复出现。
  return cellLeft < column
    ? cell.type.createAndFill(attrs)!
    : cell.type.create(attrs, cell.content)
}

/**
 * 表达“一个逻辑列”的 CellSelection。
 * 标准 colSelection 会被 colspan 扩成相邻列；此选区仍兼容表格菜单，但只枚举目标列相交的单元格。
 */
class LogicalColumnSelection extends CellSelection {
  readonly logicalColumn: number

  constructor($anchorCell: Parameters<typeof CellSelection.colSelection>[0], logicalColumn: number) {
    super($anchorCell)
    this.logicalColumn = logicalColumn
    const table = $anchorCell.node(-1)
    const map = TableMap.get(table)
    const tableStart = $anchorCell.start(-1)
    this.ranges = getLogicalColumnCellPositions(map, logicalColumn).map((position) => {
      const cell = table.nodeAt(position)!
      const from = tableStart + position + 1
      return new SelectionRange($anchorCell.doc.resolve(from), $anchorCell.doc.resolve(from + cell.content.size))
    })
  }

  map(doc: ProseMirrorNode, mapping: Mappable): Selection {
    const $mapped = doc.resolve(mapping.map(this.$anchorCell.pos))
    if (!$mapped.nodeAfter?.type.spec.tableRole) return Selection.near($mapped)
    return createLogicalColumnSelection(doc, $mapped.start(-1) - 1, this.logicalColumn)
  }

  forEachCell(callback: (node: ProseMirrorNode, pos: number) => void): void {
    const table = this.$anchorCell.node(-1)
    const map = TableMap.get(table)
    const tableStart = this.$anchorCell.start(-1)
    for (const position of getLogicalColumnCellPositions(map, this.logicalColumn)) {
      callback(table.nodeAt(position)!, tableStart + position)
    }
  }

  content(): Slice {
    const table = this.$anchorCell.node(-1)
    const map = TableMap.get(table)
    const seen = new Set<number>()
    const rows: ProseMirrorNode[] = []
    for (let row = 0; row < map.height; row += 1) {
      const position = map.map[row * map.width + this.logicalColumn]!
      const rowCells: ProseMirrorNode[] = []
      if (!seen.has(position)) {
        seen.add(position)
        const cell = table.nodeAt(position)!
        const rect = map.findCell(position)
        rowCells.push(isolateLogicalColumnCell(cell, rect.left, this.logicalColumn))
      }
      rows.push(table.child(row).copy(Fragment.from(rowCells)))
    }
    return new Slice(Fragment.from(rows), 1, 1)
  }

  isColSelection(): boolean {
    return true
  }

  eq(other: unknown): boolean {
    return other instanceof LogicalColumnSelection
      && other.$anchorCell.pos === this.$anchorCell.pos
      && other.logicalColumn === this.logicalColumn
  }

  getBookmark(): CellBookmark {
    return new LogicalColumnBookmark(this.$anchorCell.pos, this.logicalColumn)
  }
}

/** 在事务映射和历史记录恢复后保留逻辑列语义。 */
class LogicalColumnBookmark implements CellBookmark {
  readonly anchor: number
  readonly head: number
  readonly logicalColumn: number

  constructor(anchor: number, logicalColumn: number) {
    this.anchor = anchor
    this.head = anchor
    this.logicalColumn = logicalColumn
  }

  map(mapping: Mappable): CellBookmark {
    return new LogicalColumnBookmark(mapping.map(this.anchor), this.logicalColumn)
  }

  resolve(doc: ProseMirrorNode): Selection {
    const $anchor = doc.resolve(this.anchor)
    if (!$anchor.nodeAfter?.type.spec.tableRole) return Selection.near($anchor)
    return createLogicalColumnSelection(doc, $anchor.start(-1) - 1, this.logicalColumn)
  }
}

/** 表达一个逻辑行，并保留与该行相交的 rowspan/colspan 单元格。 */
class LogicalRowSelection extends CellSelection {
  readonly logicalRow: number

  constructor(
    $anchorCell: Parameters<typeof CellSelection.rowSelection>[0],
    $headCell: Parameters<typeof CellSelection.rowSelection>[0],
    logicalRow: number,
  ) {
    super($anchorCell, $headCell)
    this.logicalRow = logicalRow
    const table = $anchorCell.node(-1)
    const map = TableMap.get(table)
    const tableStart = $anchorCell.start(-1)
    this.ranges = getLogicalRowCellPositions(map, logicalRow).map((position) => {
      const cell = table.nodeAt(position)!
      const from = tableStart + position + 1
      return new SelectionRange($anchorCell.doc.resolve(from), $anchorCell.doc.resolve(from + cell.content.size))
    })
  }

  map(doc: ProseMirrorNode, mapping: Mappable): Selection {
    const $mapped = doc.resolve(mapping.map(this.$anchorCell.pos))
    if (!$mapped.nodeAfter?.type.spec.tableRole) return Selection.near($mapped)
    return createLogicalRowSelection(doc, $mapped.start(-1) - 1, this.logicalRow)
  }

  forEachCell(callback: (node: ProseMirrorNode, pos: number) => void): void {
    const table = this.$anchorCell.node(-1)
    const map = TableMap.get(table)
    const tableStart = this.$anchorCell.start(-1)
    for (const position of getLogicalRowCellPositions(map, this.logicalRow)) {
      callback(table.nodeAt(position)!, tableStart + position)
    }
  }

  isRowSelection(): boolean {
    return true
  }

  eq(other: unknown): boolean {
    return other instanceof LogicalRowSelection
      && other.$anchorCell.pos === this.$anchorCell.pos
      && other.$headCell.pos === this.$headCell.pos
      && other.logicalRow === this.logicalRow
  }

  getBookmark(): CellBookmark {
    return new LogicalRowBookmark(this.$anchorCell.pos, this.$headCell.pos, this.logicalRow)
  }
}

/** 在事务映射和历史记录恢复后保留逻辑行语义。 */
class LogicalRowBookmark implements CellBookmark {
  readonly anchor: number
  readonly head: number
  readonly logicalRow: number

  constructor(anchor: number, head: number, logicalRow: number) {
    this.anchor = anchor
    this.head = head
    this.logicalRow = logicalRow
  }

  map(mapping: Mappable): CellBookmark {
    return new LogicalRowBookmark(mapping.map(this.anchor), mapping.map(this.head), this.logicalRow)
  }

  resolve(doc: ProseMirrorNode): Selection {
    const $anchor = doc.resolve(this.anchor)
    if (!$anchor.nodeAfter?.type.spec.tableRole) return Selection.near($anchor)
    return createLogicalRowSelection(doc, $anchor.start(-1) - 1, this.logicalRow)
  }
}

/** 基于当前文档重新定位目标列，避免使用 Decoration 创建时的陈旧位置。 */
function createLogicalColumnSelection(
  doc: ProseMirrorNode,
  tablePosition: number,
  column: number,
): CellSelection {
  const table = doc.nodeAt(tablePosition)
  if (!table || table.type.spec.tableRole !== 'table') {
    throw new RangeError(`No table found at position ${tablePosition}`)
  }
  const map = TableMap.get(table)
  const logicalColumn = Math.max(0, Math.min(column, map.width - 1))
  const anchor = tablePosition + 1 + findLogicalColumnAnchor(map, logicalColumn)
  return new LogicalColumnSelection(doc.resolve(anchor), logicalColumn)
}

/** 基于当前文档重新定位目标逻辑行，避免 Decoration 回调使用陈旧位置。 */
function createLogicalRowSelection(
  doc: ProseMirrorNode,
  tablePosition: number,
  row: number,
): CellSelection {
  const table = doc.nodeAt(tablePosition)
  if (!table || table.type.spec.tableRole !== 'table') {
    throw new RangeError(`No table found at position ${tablePosition}`)
  }
  const map = TableMap.get(table)
  const logicalRow = Math.max(0, Math.min(row, map.height - 1))
  const positions = getLogicalRowCellPositions(map, logicalRow)
  const tableStart = tablePosition + 1
  return new LogicalRowSelection(
    doc.resolve(tableStart + positions[0]!),
    doc.resolve(tableStart + positions[positions.length - 1]!),
    logicalRow,
  )
}

/** 创建并滚动到新的 CellSelection，统一处理行、列和整表选择。 */
function dispatchSelection(editor: Editor, createSelection: (doc: ProseMirrorNode) => CellSelection): void {
  const { state, view } = editor
  view.dispatch(state.tr.setSelection(createSelection(state.doc)).scrollIntoView())
}

/** 判断当前 CellSelection 的两个端点是否都属于指定表格。 */
function selectionBelongsToTable(
  selection: Selection,
  table: ProseMirrorNode,
  tablePosition: number,
): selection is CellSelection {
  if (!(selection instanceof CellSelection)) return false
  const tableEnd = tablePosition + table.nodeSize
  return selection.$anchorCell.pos > tablePosition
    && selection.$anchorCell.pos < tableEnd
    && selection.$headCell.pos > tablePosition
    && selection.$headCell.pos < tableEnd
}

/** 创建表格、行或列的可访问选择手柄。 */
function createGrip(
  kind: 'row' | 'column' | 'table',
  index: number,
  selected: boolean,
  select: () => void,
  columnOffset = 0,
  columnSpan = 1,
  rowOffset = 0,
  rowSpan = 1,
): HTMLDivElement {
  const grip = document.createElement('div')
  const drag = document.createElement('div')
  const label = kind === 'table' ? 'Select table' : `Select ${kind} ${index + 1}`
  grip.className = `aieditor-table-grip aieditor-table-grip-${kind}`
  if (kind === 'column') {
    grip.style.setProperty('--table-grip-left', `${(columnOffset / columnSpan) * 100}%`)
    grip.style.setProperty('--table-grip-width', `${100 / columnSpan}%`)
  }
  if (kind === 'row') {
    grip.style.setProperty('--table-grip-top', `${(rowOffset / rowSpan) * 100}%`)
    grip.style.setProperty('--table-grip-height', `${100 / rowSpan}%`)
  }
  grip.dataset.tableGripKind = kind
  grip.dataset.tableGripIndex = String(index)
  grip.contentEditable = 'false'
  grip.tabIndex = 0
  grip.title = label
  grip.setAttribute('role', 'button')
  grip.setAttribute('aria-label', label)
  grip.setAttribute('aria-pressed', String(selected))
  grip.classList.toggle('is-selected', selected)

  drag.className = 'aieditor-table-grip-drag'
  drag.setAttribute('aria-hidden', 'true')
  if (kind !== 'table') {
    drag.append(createElement(kind === 'column' ? GripHorizontal : GripVertical))
  }
  grip.append(drag)

  const preserveGrip = (event: Event) => {
    event.preventDefault()
    event.stopImmediatePropagation()
  }
  // ProseMirror 会在 pointerdown 阶段更新选区并重建 Decoration，必须在该阶段保护当前 Grip。
  grip.addEventListener('pointerdown', preserveGrip)
  grip.addEventListener('mousedown', preserveGrip)
  grip.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopImmediatePropagation()
    select()
  })
  grip.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    event.stopImmediatePropagation()
    select()
  })
  return grip
}

/** 创建仅在单元格底边命中时响应的行高拖拽手柄。 */
function createRowResizeHandle(row: number, rowPosition: number): HTMLDivElement {
  const handle = document.createElement('div')
  handle.className = 'aieditor-table-row-resize-handle'
  handle.dataset.tableRowResizeHandle = ''
  handle.dataset.tableRowPosition = String(rowPosition)
  handle.contentEditable = 'false'
  handle.tabIndex = 0
  handle.setAttribute('role', 'separator')
  handle.setAttribute('aria-label', `Resize row ${row + 1}`)
  handle.setAttribute('aria-orientation', 'horizontal')
  return handle
}

/** 根据表格映射和当前选择生成三类 Grip 装饰。 */
function addTableDecorations(
  editor: Editor,
  table: ProseMirrorNode,
  tablePosition: number,
  selection: Selection,
  decorations: Decoration[],
): void {
  const map = TableMap.get(table)
  const tableStart = tablePosition + 1
  const isThisTableSelection = selectionBelongsToTable(selection, table, tablePosition)
  const mode = getTableSelectionMode(selection, isThisTableSelection)
  const selectionRect = isThisTableSelection
    ? map.rectBetween(selection.$anchorCell.pos - tableStart, selection.$headCell.pos - tableStart)
    : null
  const firstCellPosition = tableStart + map.positionAt(0, 0, table)
  const lastCellPosition = tableStart + map.positionAt(map.height - 1, map.width - 1, table)
  const tableSelected = mode === 'table'
  const rowPositions: number[] = []
  table.forEach((_rowNode, rowOffset) => rowPositions.push(tableStart + rowOffset))

  decorations.push(Decoration.widget(firstCellPosition + 1, () => createGrip(
    'table',
    0,
    tableSelected,
    () => dispatchSelection(editor, (doc) => CellSelection.create(doc, firstCellPosition, lastCellPosition)),
  ), {
    key: `table-grip-${tablePosition}-${firstCellPosition}-${lastCellPosition}-${tableSelected}`,
    side: -1,
  }))

  for (let row = 0; row < map.height; row += 1) {
    const gripPosition = tableStart + findRowBoundaryPosition(map, table, row)
    const gripCellRect = map.findCell(gripPosition - tableStart)
    const selected = (mode === 'row' || mode === 'table')
      && Boolean(selectionRect && row >= selectionRect.top && row < selectionRect.bottom)
    const rowSelected = selection instanceof LogicalRowSelection
      ? selection.logicalRow === row
      : selected

    decorations.push(Decoration.widget(gripPosition + 1, () => createGrip(
      'row',
      row,
      rowSelected,
      () => dispatchSelection(editor, (doc) => createLogicalRowSelection(doc, tablePosition, row)),
      0,
      1,
      row - gripCellRect.top,
      Math.max(1, gripCellRect.bottom - gripCellRect.top),
    ), {
      key: `row-grip-${tablePosition}-${row}-${gripPosition}-${rowSelected}`,
      side: -1,
    }))

    const rowNode = table.child(row)
    const rowPosition = rowPositions[row]!
    rowNode.forEach((_cell, cellOffset, cellIndex) => {
      const cellPosition = rowPosition + 1 + cellOffset
      const cellRect = map.findCell(cellPosition - tableStart)
      // rowspan 单元格跨越当前行时，当前边界不是实际单元格底边，不能创建内部手柄。
      if (cellRect.bottom !== row + 1) return
      decorations.push(Decoration.widget(cellPosition + 1, () => createRowResizeHandle(row, rowPosition), {
        key: `row-resize-${tablePosition}-${row}-${cellIndex}-${cellPosition}`,
        side: -1,
      }))
    })
  }

  for (let column = 0; column < map.width; column += 1) {
    const gripPosition = tableStart + findColumnGripPosition(map, table, column)
    const cellRect = map.findCell(gripPosition - tableStart)
    const selected = (mode === 'column' || mode === 'table')
      && Boolean(selectionRect && column >= selectionRect.left && column < selectionRect.right)

    decorations.push(Decoration.widget(gripPosition + 1, () => createGrip(
      'column',
      column,
      selected,
      () => dispatchSelection(editor, (doc) => createLogicalColumnSelection(doc, tablePosition, column)),
      column - cellRect.left,
      cellRect.right - cellRect.left,
    ), {
      key: `column-grip-${tablePosition}-${column}-${gripPosition}-${selected}`,
      side: -1,
    }))
  }
}

interface ActiveTableRowResize {
  pointerId: number
  rowPosition: number
  startY: number
  startHeight: number
  height: number
  originalHeight: number | null
  moved: boolean
}

/** 更新指定行全部分段手柄的拖拽态。 */
function setActiveRowResizeHandles(view: EditorView, rowPosition: number, active: boolean): void {
  view.dom.querySelectorAll<HTMLElement>(
    `[data-table-row-resize-handle][data-table-row-position="${rowPosition}"]`,
  ).forEach((handle) => handle.classList.toggle('is-resizing', active))
}

/** 在单元格底边提供行高拖拽，并在松开时仅提交一次可撤销事务。 */
function createTableRowResizePlugin(): Plugin {
  let active: ActiveTableRowResize | null = null
  let currentView: EditorView | null = null

  const stop = (commit: boolean): void => {
    if (!active || !currentView) return
    const resize = active
    active = null
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
    window.removeEventListener('pointercancel', handlePointerCancel)
    currentView.dom.classList.remove('aieditor-table-row-resizing')
    setActiveRowResizeHandles(currentView, resize.rowPosition, false)

    const rowNode = currentView.state.doc.nodeAt(resize.rowPosition)
    if (!rowNode || rowNode.type.name !== 'tableRow') return
    if (!resize.moved) return
    if (!commit) {
      currentView.dispatch(currentView.state.tr.setNodeMarkup(resize.rowPosition, undefined, {
        ...rowNode.attrs,
        rowHeight: resize.originalHeight,
      }).setMeta('addToHistory', false))
      return
    }
    // 拖动事务不进入历史；松开时先无历史还原，再提交一次最终值，使撤销只产生一个步骤。
    currentView.dispatch(currentView.state.tr.setNodeMarkup(resize.rowPosition, undefined, {
      ...rowNode.attrs,
      rowHeight: resize.originalHeight,
    }).setMeta('addToHistory', false))
    const restoredRow = currentView.state.doc.nodeAt(resize.rowPosition)
    if (!restoredRow || restoredRow.type.name !== 'tableRow') return
    currentView.dispatch(currentView.state.tr.setNodeMarkup(resize.rowPosition, undefined, {
      ...restoredRow.attrs,
      rowHeight: resize.height,
    }))
  }

  const handlePointerMove = (event: PointerEvent): void => {
    if (!active || event.pointerId !== active.pointerId) return
    event.preventDefault()
    const height = Math.max(TABLE_ROW_MIN_HEIGHT, Math.round(active.startHeight + event.clientY - active.startY))
    if (height === active.height) return
    const rowNode = currentView?.state.doc.nodeAt(active.rowPosition)
    if (!currentView || !rowNode || rowNode.type.name !== 'tableRow') return
    active.height = height
    active.moved = true
    currentView.dispatch(currentView.state.tr.setNodeMarkup(active.rowPosition, undefined, {
      ...rowNode.attrs,
      rowHeight: height,
    }).setMeta('addToHistory', false))
    setActiveRowResizeHandles(currentView, active.rowPosition, true)
  }
  const handlePointerUp = (event: PointerEvent): void => {
    if (active && event.pointerId === active.pointerId) stop(true)
  }
  const handlePointerCancel = (event: PointerEvent): void => {
    if (active && event.pointerId === active.pointerId) stop(false)
  }

  return new Plugin({
    key: new PluginKey('tableRowResize'),
    props: {
      handleDOMEvents: {
        pointerdown: (view, rawEvent) => {
          const event = rawEvent as PointerEvent
          if (event.button !== 0 || !(event.target instanceof Element)) return false
          const handle = event.target.closest<HTMLElement>('[data-table-row-resize-handle]')
          const row = handle?.closest<HTMLTableRowElement>('tr')
          const rowPosition = Number(handle?.dataset.tableRowPosition)
          if (!handle || !row || !Number.isInteger(rowPosition)) return false
          const rowNode = view.state.doc.nodeAt(rowPosition)
          if (!rowNode || rowNode.type.name !== 'tableRow') return false

          event.preventDefault()
          event.stopPropagation()
          currentView = view
          const startHeight = row.getBoundingClientRect().height
          active = {
            pointerId: event.pointerId,
            rowPosition,
            startY: event.clientY,
            startHeight,
            height: Math.max(TABLE_ROW_MIN_HEIGHT, Math.round(startHeight)),
            originalHeight: normalizeTableRowHeight(rowNode.attrs.rowHeight),
            moved: false,
          }
          view.dom.classList.add('aieditor-table-row-resizing')
          setActiveRowResizeHandles(view, rowPosition, true)
          window.addEventListener('pointermove', handlePointerMove, {passive: false})
          window.addEventListener('pointerup', handlePointerUp)
          window.addEventListener('pointercancel', handlePointerCancel)
          return true
        },
      },
    },
    view: (view) => {
      currentView = view
      return {destroy: () => stop(false)}
    },
  })
}

/** AIEditor 表格节点，包含官方表格能力以及表格、行和列的选择手柄。 */
export const Table = TTable.extend<TableOptions>({
  addOptions() {
    return {
      ...this.parent!(),
      View: AiEditorTableView,
    }
  },

  addProseMirrorPlugins() {
    return [
      ...(this.parent?.() ?? []),
      createTableRowResizePlugin(),
      new Plugin({
        key: new PluginKey('tableControls'),
        props: {
          decorations: (state) => {
            if (!this.editor.isEditable) return DecorationSet.empty
            const decorations: Decoration[] = []

            state.doc.descendants((node, tablePosition) => {
              // 非表格节点返回 true 继续遍历；表格内部由 addTableDecorations 统一处理。
              if (node.type.name !== 'table') return true
              addTableDecorations(this.editor, node, tablePosition, state.selection, decorations)
              return false
            })
            return DecorationSet.create(state.doc, decorations)
          },
        },
      }),
    ]
  },
})
