import type { Editor } from '@tiptap/core'
import {NodeSelection} from '@tiptap/pm/state'
import {CellSelection} from '@tiptap/pm/tables'
import { BubbleMenu } from './BubbleMenu'
import {
  BoldMenuItem,
  ClearFormattingMenuItem,
  InlineCodeMenuItem,
  ItalicMenuItem,
  LinkMenuItem,
  type LinkMenuItemOptions,
  StrikethroughMenuItem,
  UnderlineMenuItem,
} from '../../menus/items'
import { MenuBar, type MenuItem, type MenuItemConfig } from '../../menus/core'
import {resolveMenuItems} from '../../menus/resolve-menu-items'
import type {AiEditorI18n} from '../../i18n'
import { AiBubbleMenuItem, type AiBubbleMenuItemOptions } from './AiBubbleMenuItem'

export interface TextBubbleMenuOptions {
  items?: readonly MenuItemConfig[] | ((defaults: MenuItem[]) => readonly MenuItemConfig[])
  updateDelay?: number
}

/** 创建默认选区菜单；AI 配置存在时才加入 AI 写作入口。 */
export function createDefaultTextBubbleMenuItems(ai?: AiBubbleMenuItemOptions, link: LinkMenuItemOptions = {}): MenuItem[] {
  return [
    ...(ai ? [new AiBubbleMenuItem(ai)] : []),
    new BoldMenuItem(),
    new ItalicMenuItem(),
    new UnderlineMenuItem(),
    new StrikethroughMenuItem(),
    new InlineCodeMenuItem(),
    new LinkMenuItem({ ...link, id: 'bubble-link' }),
    new ClearFormattingMenuItem(),
  ]
}

/** 选择非空文本后显示的 Bubble Menu Surface。 */
export class TextBubbleMenu {
  readonly element: HTMLElement
  readonly extension: ReturnType<typeof BubbleMenu.configure>
  private menuBar: MenuBar | undefined

  /** 创建 DOM、菜单项和官方 BubbleMenu 扩展实例。 */
  constructor(options: TextBubbleMenuOptions = {}, ai?: AiBubbleMenuItemOptions, link: LinkMenuItemOptions = {}) {
    this.element = document.createElement('div')
    this.element.className = 'aieditor__bubble-menu'
    this.element.setAttribute('role', 'toolbar')
    this.element.setAttribute('aria-label', 'Text formatting')

    this.extension = BubbleMenu.configure({
      element: this.element,
      pluginKey: 'aieditorTextBubbleMenu',
      updateDelay: options.updateDelay ?? 100,
      options: {
        placement: 'top',
        strategy: 'fixed',
        offset: 8,
        flip: true,
        shift: { padding: 8 },
        inline: true,
      },
      // 统一过滤空选区、代码块和媒体节点，避免在不适用的位置展示文本操作。
      shouldShow: ({ editor, from, to }) => this.shouldShow(editor, from, to),
    })

    const defaults = createDefaultTextBubbleMenuItems(ai, link)
    const configs = typeof options.items === 'function'
      ? options.items(defaults)
      : options.items ?? defaults
    this.pendingItems = resolveMenuItems(configs, defaults)
  }

  private readonly pendingItems: MenuItem[]

  /** 将 MenuBar 与编辑器绑定。 */
  mount(editor: Editor, i18n: AiEditorI18n): void {
    this.element.setAttribute('aria-label', i18n.t('Text formatting'))
    this.menuBar = new MenuBar(this.element, { editor, i18n }, this.pendingItems)
  }

  update(): void {
    this.menuBar?.update()
  }

  /** 销毁菜单项并移除 Bubble Menu DOM。 */
  destroy(): void {
    this.menuBar?.destroy()
    this.menuBar = undefined
    this.element.remove()
  }

  getItems(): readonly MenuItem[] {
    return this.menuBar?.getItems() ?? this.pendingItems
  }

  /** 判断当前选择是否支持文本级操作。 */
  private shouldShow(editor: Editor, from: number, to: number): boolean {
    if (from === to || !editor.isEditable || !editor.view.hasFocus()) return false
    // 单元格/行/列/整表选择交由表格菜单处理，避免两个浮动菜单同时出现。
    const {selection} = editor.state
    if (selection instanceof CellSelection) return false
    if (selection instanceof NodeSelection && selection.node.type.name === 'table') return false
    if (!editor.state.doc.textBetween(from, to, '').trim()) return false
    return !editor.isActive('link')
      && !editor.isActive('codeBlock')
      && !editor.isActive('image')
      && !editor.isActive('inlineImage')
      && !editor.isActive('audio')
      && !editor.isActive('video')
      && !editor.isActive('youtube')
      && !editor.isActive('twitch')
  }
}
