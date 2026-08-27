import type { Editor } from '@tiptap/core'
import {NodeSelection} from '@tiptap/pm/state'
import {CellSelection} from '@tiptap/pm/tables'
import { FloatingMenu } from './FloatingMenu'
import { getTableSelectionMode, type TableSelectionMode } from '../../extensions/table/Table'
import { MenuBar, SeparatorMenuItem, type MenuItem } from '../../menus/core'
import type {AiEditorI18n} from '../../i18n'
import {
  AddTableColumnAfterMenuItem,
  AddTableColumnBeforeMenuItem,
  AddTableRowAfterMenuItem,
  AddTableRowBeforeMenuItem,
  AlignTableCellCenterMenuItem,
  AlignTableCellLeftMenuItem,
  AlignTableCellRightMenuItem,
  DeleteTableColumnMenuItem,
  DeleteTableMenuItem,
  DeleteTableRowMenuItem,
  MergeTableCellsMenuItem,
  SplitTableCellMenuItem,
  TableCellBackgroundColorMenuItem,
  TableCellTextColorMenuItem,
  TableCellVerticalAlignMenuItem,
  ToggleTableHeaderCellMenuItem,
  ToggleTableHeaderColumnMenuItem,
  ToggleTableHeaderRowMenuItem,
} from '../../menus/items'

/** 根据单元格、行、列或整表选择动态切换操作项的表格 Floating Menu。 */
export class TableFloatingMenu {
  readonly element: HTMLElement
  readonly extension
  private readonly itemGroups: Record<Exclude<TableSelectionMode, 'none'>, MenuItem[]>
  private menuBar: MenuBar | undefined
  private editor: Editor | undefined
  private mode: TableSelectionMode = 'none'
  private readonly updateMenu = () => {
    if (!this.editor || !this.menuBar) return
    const nextMode = getTableSelectionMode(this.editor.state.selection, this.editor.isActive('table'))
    if (nextMode !== this.mode) {
      // 仅选择模式变化时重建项目，普通事务只需刷新现有项目状态。
      this.mode = nextMode
      this.menuBar.setItems(nextMode === 'none' ? [] : this.itemGroups[nextMode])
    }
    this.menuBar.update()
  }

  /** 创建各选择模式的默认操作组，调用方可按模式整体替换。 */
  constructor(itemGroups: Partial<Record<Exclude<TableSelectionMode, 'none'>, MenuItem[]>> = {}) {
    this.element = document.createElement('div')
    this.element.className = 'aieditor__table-floating-menu'
    // Floating UI 可能先于 Tiptap 应用 max-content 宽度完成测量，因此预先固定宽度。
    this.element.style.width = 'max-content'
    this.element.setAttribute('role', 'toolbar')
    this.element.setAttribute('aria-label', 'Table operations')
    this.itemGroups = {
      cell: itemGroups.cell ?? [
        new MergeTableCellsMenuItem(),
        new SplitTableCellMenuItem(),
        new SeparatorMenuItem('separator-cell-colors'),
        new TableCellBackgroundColorMenuItem(),
        new TableCellTextColorMenuItem(),
        new TableCellVerticalAlignMenuItem(),
        new SeparatorMenuItem('separator-cell-alignment'),
        new AlignTableCellLeftMenuItem(),
        new AlignTableCellCenterMenuItem(),
        new AlignTableCellRightMenuItem(),
        new SeparatorMenuItem('separator-cell-header'),
        new ToggleTableHeaderCellMenuItem(),
      ],
      row: itemGroups.row ?? [
        new AddTableRowBeforeMenuItem(),
        new AddTableRowAfterMenuItem(),
        new DeleteTableRowMenuItem(),
        new SeparatorMenuItem('separator-row-cells'),
        new MergeTableCellsMenuItem(),
        new SplitTableCellMenuItem(),
        new SeparatorMenuItem('separator-row-colors'),
        new TableCellBackgroundColorMenuItem(),
        new TableCellTextColorMenuItem(),
        new TableCellVerticalAlignMenuItem(),
        new SeparatorMenuItem('separator-row-alignment'),
        new AlignTableCellLeftMenuItem(),
        new AlignTableCellCenterMenuItem(),
        new AlignTableCellRightMenuItem(),
      ],
      column: itemGroups.column ?? [
        new AddTableColumnBeforeMenuItem(),
        new AddTableColumnAfterMenuItem(),
        new DeleteTableColumnMenuItem(),
        new SeparatorMenuItem('separator-column-cells'),
        new MergeTableCellsMenuItem(),
        new SplitTableCellMenuItem(),
        new SeparatorMenuItem('separator-column-colors'),
        new TableCellBackgroundColorMenuItem(),
        new TableCellTextColorMenuItem(),
        new TableCellVerticalAlignMenuItem(),
        new SeparatorMenuItem('separator-column-alignment'),
        new AlignTableCellLeftMenuItem(),
        new AlignTableCellCenterMenuItem(),
        new AlignTableCellRightMenuItem(),
      ],
      table: itemGroups.table ?? [
        new TableCellBackgroundColorMenuItem(),
        new TableCellTextColorMenuItem(),
        new TableCellVerticalAlignMenuItem(),
        new SeparatorMenuItem('separator-table-header'),
        new ToggleTableHeaderRowMenuItem(),
        new ToggleTableHeaderColumnMenuItem(),
        new SeparatorMenuItem('separator-table-delete'),
        new DeleteTableMenuItem(),
      ],
    }
    this.extension = FloatingMenu.extend({ name: 'tableFloatingMenu' }).configure({
      element: this.element,
      pluginKey: 'tableFloatingMenu',
      appendTo: () => document.body,
      updateDelay: 0,
      shouldShow: ({ editor }) => {
        if (!editor.isEditable || !editor.isActive('table')) return false
        const {selection} = editor.state
        // 只有明确选中单元格范围或整表节点时才显示；普通文本光标不打断输入。
        return selection instanceof CellSelection
          || (selection instanceof NodeSelection && selection.node.type.name === 'table')
      },
      options: {
        placement: 'top',
        strategy: 'fixed',
        offset: 34,
        flip: true,
        shift: { padding: 8 },
      },
    })
  }

  /** 挂载 MenuBar 并订阅事务变化。 */
  mount(editor: Editor, i18n: AiEditorI18n): void {
    if (this.menuBar) throw new Error('TableFloatingMenu is already mounted')
    this.editor = editor
    this.element.setAttribute('aria-label', i18n.t('Table operations'))
    this.menuBar = new MenuBar(this.element, { editor, i18n })
    editor.on('transaction', this.updateMenu)
    this.updateMenu()
  }

  /** 解除订阅并清理动态菜单项。 */
  destroy(): void {
    this.editor?.off('transaction', this.updateMenu)
    this.menuBar?.destroy()
    this.menuBar = undefined
    this.editor = undefined
    this.mode = 'none'
    this.element.remove()
  }
}
