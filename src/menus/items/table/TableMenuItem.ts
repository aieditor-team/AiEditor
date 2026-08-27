import {autoUpdate, computePosition, flip, offset, shift} from '@floating-ui/dom'
import {ArrowLeft, ChevronRight, createElement, Table, TableProperties} from 'lucide'
import {clampFloatingPosition, MenuItem, resolveMenuFloatingOffset, resolveMenuFloatingPlacement, type MenuContext} from '../../core'

let tableMenuSequence = 0

export interface TableMenuItemOptions {
    id?: string
    label?: string
    maxRows?: number
    maxColumns?: number
    allowCustomSize?: boolean
    customMaxRows?: number
    customMaxColumns?: number
    withHeaderRow?: boolean
}

/** 提供鼠标与键盘网格选择的插入表格菜单项。 */
export class TableMenuItem extends MenuItem {
    private readonly options: Required<TableMenuItemOptions>
    private trigger: HTMLButtonElement | null = null
    private panel: HTMLElement | null = null
    private status: HTMLElement | null = null
    private gridView: HTMLElement | null = null
    private customView: HTMLElement | null = null
    private customSizeButton: HTMLButtonElement | null = null
    private rowInput: HTMLInputElement | null = null
    private columnInput: HTMLInputElement | null = null
    private selectedRow = 1
    private selectedColumn = 1
    private stopAutoUpdate: (() => void) | undefined

    constructor(options: TableMenuItemOptions = {}) {
        super(options.id ?? 'table')
        this.options = {
            id: options.id ?? 'table',
            label: options.label ?? 'Insert table',
            maxRows: Math.max(1, options.maxRows ?? 8),
            maxColumns: Math.max(1, options.maxColumns ?? 10),
            allowCustomSize: options.allowCustomSize ?? true,
            customMaxRows: Math.max(1, options.customMaxRows ?? 100),
            customMaxColumns: Math.max(1, options.customMaxColumns ?? 100),
            withHeaderRow: options.withHeaderRow ?? true,
        }
    }

    /** 创建触发按钮和 Portal 网格选择器。 */
    render(context: MenuContext): HTMLElement {
        const translate = (value: string) => context.i18n.t(value)
        const wrapper = document.createElement('div')
        const trigger = document.createElement('button')
        const panel = document.createElement('div')
        const header = document.createElement('div')
        const title = document.createElement('span')
        const status = document.createElement('span')
        const gridView = document.createElement('div')
        const grid = document.createElement('div')
        const panelId = `aieditor-table-picker-${++tableMenuSequence}`

        wrapper.className = 'aieditor__table-menu'
        trigger.type = 'button'
        trigger.className = 'aieditor__tool'
        trigger.title = translate(this.options.label)
        trigger.setAttribute('aria-label', translate(this.options.label))
        trigger.setAttribute('aria-haspopup', 'dialog')
        trigger.setAttribute('aria-expanded', 'false')
        trigger.setAttribute('aria-controls', panelId)
        trigger.append(createElement(Table, {'aria-hidden': 'true'}))

        panel.id = panelId
        panel.className = 'aieditor__table-picker'
        panel.setAttribute('role', 'dialog')
        panel.setAttribute('aria-label', translate(this.options.label))
        panel.hidden = true
        header.className = 'aieditor__table-picker-header'
        title.textContent = translate(this.options.label)
        status.className = 'aieditor__table-picker-status'
        status.setAttribute('aria-live', 'polite')
        grid.className = 'aieditor__table-picker-grid'
        grid.setAttribute('role', 'grid')
        grid.setAttribute('aria-label', translate('Table size'))
        grid.setAttribute('aria-rowcount', String(this.options.maxRows))
        grid.setAttribute('aria-colcount', String(this.options.maxColumns))
        grid.style.setProperty('--table-picker-columns', String(this.options.maxColumns))

        for (let row = 1; row <= this.options.maxRows; row += 1) {
            for (let column = 1; column <= this.options.maxColumns; column += 1) {
                const cell = document.createElement('button')
                cell.type = 'button'
                cell.className = 'aieditor__table-picker-cell'
                cell.dataset.row = String(row)
                cell.dataset.column = String(column)
                cell.setAttribute('role', 'gridcell')
                cell.setAttribute(
                    'aria-label',
                    `${row} ${translate(row === 1 ? 'row' : 'rows')} × ${column} ${translate(column === 1 ? 'column' : 'columns')}`,
                )
                cell.setAttribute('aria-rowindex', String(row))
                cell.setAttribute('aria-colindex', String(column))
                cell.setAttribute('aria-selected', 'false')
                cell.tabIndex = -1
                this.listen(cell, 'pointerenter', () => this.setSelection(row, column))
                this.listen(cell, 'focus', () => this.setSelection(row, column))
                this.listen(cell, 'click', () => this.insertTable(context, row, column))
                grid.append(cell)
            }
        }

        header.append(title, status)
        gridView.className = 'aieditor__table-picker-view'
        gridView.append(header, grid)
        panel.append(gridView)

        if (this.options.allowCustomSize) {
            const customSizeButton = document.createElement('button')
            const customSizeLabel = document.createElement('span')
            customSizeButton.type = 'button'
            customSizeButton.className = 'aieditor__table-picker-custom-trigger'
            customSizeLabel.textContent = translate('Custom rows and columns')
            customSizeButton.append(
                createElement(TableProperties, {'aria-hidden': 'true'}),
                customSizeLabel,
                createElement(ChevronRight, {'aria-hidden': 'true'}),
            )
            gridView.append(customSizeButton)
            this.customSizeButton = customSizeButton
            this.listen(customSizeButton, 'pointerenter', () => this.clearSelectionPreview())
            this.listen(customSizeButton, 'focus', () => this.clearSelectionPreview())
            this.listen(customSizeButton, 'click', () => this.showCustomView())

            const customView = this.createCustomView(context, panelId)
            panel.append(customView)
            this.customView = customView
        }

        wrapper.append(trigger)
        document.body.append(panel)
        this.trigger = trigger
        this.panel = panel
        this.status = status
        this.gridView = gridView
        this.setSelection(1, 1)

        this.listen(trigger, 'mousedown', (event) => event.preventDefault())
        this.listen(trigger, 'click', () => panel.hidden ? this.open() : this.close())
        this.listen(trigger, 'keydown', (event) => {
            if (event.key !== 'ArrowDown') return
            event.preventDefault()
            this.open(true)
        })
        this.listen(panel, 'keydown', (event) => this.handleKeydown(event, context))
        this.listen(document.documentElement, 'click', (event) => {
            const target = event.target as Node | null
            if (target && !wrapper.contains(target) && !panel.contains(target)) this.close()
        })
        return wrapper
    }

    /** 切换表格选择器。 */
    execute(context: MenuContext): void {
        this.insertTable(context, this.selectedRow, this.selectedColumn)
    }

    /** 在表格内高亮按钮，并根据编辑器可编辑状态禁用入口。 */
    update(context: MenuContext): void {
        if (!this.trigger) return
        const active = context.editor.isActive('table')
        this.trigger.classList.toggle('is-active', active)
        this.trigger.setAttribute('aria-pressed', String(active))
        this.trigger.disabled = !context.editor.can().insertTable({
            rows: 1,
            cols: 1,
            withHeaderRow: this.options.withHeaderRow,
        })
    }

    /** 停止自动定位并移除 Portal 网格。 */
    destroy(): void {
        this.close()
        this.panel?.remove()
        this.panel = null
        this.trigger = null
        this.status = null
        this.gridView = null
        this.customView = null
        this.customSizeButton = null
        this.rowInput = null
        this.columnInput = null
        super.destroy()
    }

    /** 打开选择器并按需把焦点移入第一个网格单元。 */
    private open(focusGrid = false): void {
        if (!this.trigger || !this.panel || this.trigger.disabled || !this.panel.hidden) return
        this.setSelection(1, 1)
        this.showGridView(false)
        this.panel.hidden = false
        this.trigger.setAttribute('aria-expanded', 'true')
        this.stopAutoUpdate = autoUpdate(this.trigger, this.panel, () => this.updatePosition())
        if (focusGrid) this.getCell(1, 1)?.focus()
    }

    /** 关闭选择器并清除临时网格选择。 */
    private close(returnFocus = false): void {
        if (!this.trigger || !this.panel) return
        this.stopAutoUpdate?.()
        this.stopAutoUpdate = undefined
        this.panel.hidden = true
        this.trigger.setAttribute('aria-expanded', 'false')
        this.showGridView(false)
        if (returnFocus) this.trigger.focus()
    }

    /** 插入指定行列数且带表头的表格。 */
    private insertTable(context: MenuContext, rows: number, columns: number): void {
        this.close()
        context.editor.chain().focus().insertTable({
            rows,
            cols: columns,
            withHeaderRow: this.options.withHeaderRow,
        }).run()
    }

    /** 更新网格预览及“行 × 列”状态文本。 */
    private setSelection(row: number, column: number): void {
        this.selectedRow = Math.min(this.options.maxRows, Math.max(1, row))
        this.selectedColumn = Math.min(this.options.maxColumns, Math.max(1, column))
        if (this.status) this.status.textContent = `${this.selectedRow} × ${this.selectedColumn}`
        if (!this.panel) return

        this.panel.querySelectorAll<HTMLButtonElement>('.aieditor__table-picker-cell').forEach((cell) => {
            const cellRow = Number(cell.dataset.row)
            const cellColumn = Number(cell.dataset.column)
            const selected = cellRow <= this.selectedRow && cellColumn <= this.selectedColumn
            const active = cellRow === this.selectedRow && cellColumn === this.selectedColumn
            cell.classList.toggle('is-selected', selected)
            cell.setAttribute('aria-selected', String(selected))
            cell.tabIndex = active ? 0 : -1
        })
    }

    /** 鼠标离开快速网格后清除视觉与无障碍选中状态。 */
    private clearSelectionPreview(): void {
        if (this.status) this.status.textContent = ''
        this.panel?.querySelectorAll<HTMLButtonElement>('.aieditor__table-picker-cell').forEach((cell) => {
            cell.classList.remove('is-selected')
            cell.setAttribute('aria-selected', 'false')
        })
    }

    /** 实现网格方向键、Enter/Space 插入和 Escape 关闭。 */
    private handleKeydown(event: KeyboardEvent, context: MenuContext): void {
        const customViewOpen = this.customView ? !this.customView.hidden : false
        if (event.key === 'Escape' && customViewOpen) {
            event.preventDefault()
            this.showGridView(true)
            return
        }
        if (event.key === 'Escape' || (event.key === 'Tab' && !customViewOpen)) {
            this.close(event.key === 'Escape')
            return
        }
        if (customViewOpen) {
            if (event.key === 'Tab') this.keepFocusInCustomView(event)
            return
        }
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            this.execute(context)
            return
        }

        const destinations: Record<string, [number, number]> = {
            ArrowLeft: [this.selectedRow, this.selectedColumn - 1],
            ArrowRight: [this.selectedRow, this.selectedColumn + 1],
            ArrowUp: [this.selectedRow - 1, this.selectedColumn],
            ArrowDown: [this.selectedRow + 1, this.selectedColumn],
            Home: [this.selectedRow, 1],
            End: [this.selectedRow, this.options.maxColumns],
        }
        const destination = destinations[event.key]
        if (!destination) return
        event.preventDefault()
        this.setSelection(...destination)
        this.getCell(this.selectedRow, this.selectedColumn)?.focus()
    }

    private getCell(row: number, column: number): HTMLButtonElement | null {
        return this.panel?.querySelector<HTMLButtonElement>(`[data-row="${row}"][data-column="${column}"]`) ?? null
    }

    /** 创建带原生数值校验的自定义行列数表单。 */
    private createCustomView(context: MenuContext, panelId: string): HTMLElement {
        const view = document.createElement('div')
        const header = document.createElement('div')
        const back = document.createElement('button')
        const title = document.createElement('span')
        const form = document.createElement('form')
        const fields = document.createElement('div')
        const rowField = this.createNumberField(`${panelId}-rows`, context.i18n.t('Rows'), this.options.customMaxRows)
        const columnField = this.createNumberField(`${panelId}-columns`, context.i18n.t('Columns'), this.options.customMaxColumns)
        const submit = document.createElement('button')

        view.className = 'aieditor__table-picker-custom'
        view.hidden = true
        header.className = 'aieditor__table-picker-custom-header'
        back.type = 'button'
        back.className = 'aieditor__table-picker-back'
        back.title = context.i18n.t('Back to quick sizes')
        back.setAttribute('aria-label', context.i18n.t('Back to quick sizes'))
        back.append(createElement(ArrowLeft, {'aria-hidden': 'true'}))
        title.className = 'aieditor__table-picker-custom-title'
        title.textContent = context.i18n.t('Custom table size')
        form.className = 'aieditor__table-picker-form'
        fields.className = 'aieditor__table-picker-fields'
        submit.type = 'submit'
        submit.className = 'aieditor__button aieditor__button--primary aieditor__table-picker-submit'
        submit.textContent = context.i18n.t('Insert table')

        header.append(back, title)
        fields.append(rowField.wrapper, columnField.wrapper)
        form.append(fields, submit)
        view.append(header, form)
        this.rowInput = rowField.input
        this.columnInput = columnField.input

        this.listen(back, 'click', () => this.showGridView(true))
        this.listen(form, 'submit', (event) => {
            event.preventDefault()
            if (!form.reportValidity()) return
            this.insertTable(context, Number(rowField.input.value), Number(columnField.input.value))
        })
        return view
    }

    private createNumberField(id: string, labelText: string, max: number): {
        wrapper: HTMLElement
        input: HTMLInputElement
    } {
        const wrapper = document.createElement('label')
        const label = document.createElement('span')
        const input = document.createElement('input')
        wrapper.className = 'aieditor__table-picker-field'
        label.textContent = labelText
        input.id = id
        input.className = 'aieditor__table-picker-input'
        input.type = 'number'
        input.inputMode = 'numeric'
        input.min = '1'
        input.max = String(max)
        input.step = '1'
        input.required = true
        input.setAttribute('aria-label', labelText)
        wrapper.append(label, input)
        return {wrapper, input}
    }

    private showCustomView(): void {
        if (!this.gridView || !this.customView || !this.rowInput || !this.columnInput) return
        this.rowInput.value = String(Math.min(this.selectedRow, this.options.customMaxRows))
        this.columnInput.value = String(Math.min(this.selectedColumn, this.options.customMaxColumns))
        this.gridView.hidden = true
        this.customView.hidden = false
        this.rowInput.focus()
        this.rowInput.select()
    }

    private showGridView(returnFocus: boolean): void {
        if (!this.gridView) return
        this.gridView.hidden = false
        if (this.customView) this.customView.hidden = true
        if (returnFocus) this.customSizeButton?.focus()
    }

    private keepFocusInCustomView(event: KeyboardEvent): void {
        if (!this.customView) return
        const focusable = [...this.customView.querySelectorAll<HTMLElement>('button, input')]
            .filter((element) => !element.hidden && !(element as HTMLButtonElement).disabled)
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first?.focus()
        }
    }

    /** 用 Floating UI 定位选择器并处理视口碰撞。 */
    private async updatePosition(): Promise<void> {
        if (!this.trigger || !this.panel || this.panel.hidden) return
        const {x, y} = await computePosition(this.trigger, this.panel, {
            placement: resolveMenuFloatingPlacement(this.trigger, 'bottom-start'),
            strategy: 'fixed',
            middleware: [offset(({placement}) => resolveMenuFloatingOffset(this.trigger!, placement)), flip(), shift({padding: 8})],
        })
        if (!this.panel || this.panel.hidden) return
        const position = clampFloatingPosition(this.panel, x, y)
        Object.assign(this.panel.style, {left: `${position.x}px`, top: `${position.y}px`})
    }
}
