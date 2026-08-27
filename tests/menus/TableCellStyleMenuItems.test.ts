import {afterEach, describe, expect, it} from 'vitest'
import {TableCellBackgroundColorMenuItem} from '../../src/menus/items/table/TableCellBackgroundColorMenuItem'
import {TableCellTextColorMenuItem} from '../../src/menus/items/table/TableCellTextColorMenuItem'
import {TableCellVerticalAlignMenuItem} from '../../src/menus/items/table/TableCellVerticalAlignMenuItem'
import {ToggleTableHeaderCellMenuItem} from '../../src/menus/items/table/ToggleTableHeaderCellMenuItem'
import {createTableEditorContext} from '../helpers/table'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

describe('Table cell style menu items', () => {
  it('颜色菜单从当前单元格属性恢复颜色指示条', () => {
    const {context, editor, destroy} = createTableEditorContext()
    cleanups.push(destroy)
    const item = new TableCellBackgroundColorMenuItem()
    const element = item.render(context)
    document.body.append(element)

    item.update(context)
    expect(element.querySelector<HTMLButtonElement>('.aieditor__color-primary')?.disabled).toBe(false)

    editor.commands.setTableCellBackgroundColor('#ff0000')
    item.update(context)

    const indicator = element.querySelector<HTMLElement>('[data-color-indicator]')
    expect(indicator?.style.backgroundColor).toBe('rgb(255, 0, 0)')
    item.destroy()
  })

  it('垂直对齐菜单执行命令并同步选中项', () => {
    const {context, editor, destroy} = createTableEditorContext()
    cleanups.push(destroy)
    const item = new TableCellVerticalAlignMenuItem()
    const element = item.render(context)
    document.body.append(element)

    item.execute(context, 'bottom')
    item.update(context)

    expect(editor.getAttributes('tableCell').verticalAlign).toBe('bottom')
    const active = document.body.querySelector<HTMLButtonElement>(
      '.aieditor__dropdown-panel [data-value="bottom"]',
    )
    expect(active?.getAttribute('aria-checked')).toBe('true')
    item.destroy()
  })

  it('文字颜色菜单可设置颜色并恢复指示条', () => {
    const {context, editor, destroy} = createTableEditorContext()
    cleanups.push(destroy)
    const item = new TableCellTextColorMenuItem()
    const element = item.render(context)
    document.body.append(element)

    item.execute(context, '#123456')
    item.update(context)

    expect(editor.getAttributes('tableCell').color).toBe('#123456')
    expect(element.querySelector<HTMLElement>('[data-color-indicator]')?.style.backgroundColor)
      .toBe('rgb(18, 52, 86)')
    item.destroy()
  })

  it('表头单元格按钮可切换节点并同步激活状态', () => {
    const {context, editor, destroy} = createTableEditorContext()
    cleanups.push(destroy)
    const item = new ToggleTableHeaderCellMenuItem()
    item.mount(document.body, context)
    const element = document.body.querySelector<HTMLElement>('[data-menu-item="table-toggle-header-cell"]')!

    item.execute(context)
    item.update(context)

    expect(editor.isActive('tableHeader')).toBe(true)
    expect(element.getAttribute('aria-pressed')).toBe('true')
    item.destroy()
  })
})
