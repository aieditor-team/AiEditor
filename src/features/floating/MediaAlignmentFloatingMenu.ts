import type {Editor} from '@tiptap/core'
import type {AiEditorI18n} from '../../i18n'
import {FloatingMenu} from './FloatingMenu'
import {MenuBar, type MenuItem} from '../../menus/core'
import {AlignMediaMenuItem, getActiveMediaNode} from '../../menus/items'

/** 选中音频、原生/在线视频或附件时显示的对齐 Floating Menu。 */
export class MediaAlignmentFloatingMenu {
  readonly element: HTMLElement
  readonly extension
  private readonly items: MenuItem[]
  private menuBar: MenuBar | undefined
  private editor: Editor | undefined
  private readonly updateMenu = () => this.menuBar?.update()

  constructor(items: MenuItem[] = [
    new AlignMediaMenuItem('left'),
    new AlignMediaMenuItem('center'),
    new AlignMediaMenuItem('right'),
  ]) {
    this.element = document.createElement('div')
    this.element.className = 'aieditor__media-floating-menu'
    // 避免 Floating UI 首次测量时使用整个 body 的宽度。
    this.element.style.width = 'max-content'
    this.element.setAttribute('role', 'toolbar')
    this.element.setAttribute('aria-label', 'Media alignment')
    this.items = items
    this.extension = FloatingMenu.extend({name: 'mediaAlignmentFloatingMenu'}).configure({
      element: this.element,
      pluginKey: 'mediaAlignmentFloatingMenu',
      appendTo: () => document.body,
      updateDelay: 0,
      shouldShow: ({editor}) => editor.isEditable && Boolean(getActiveMediaNode(editor)),
      options: {
        placement: 'top',
        strategy: 'fixed',
        offset: 10,
        flip: true,
        shift: {padding: 8},
      },
    })
  }

  mount(editor: Editor, i18n: AiEditorI18n): void {
    if (this.menuBar) throw new Error('MediaAlignmentFloatingMenu is already mounted')
    this.editor = editor
    this.element.setAttribute('aria-label', i18n.t('Media alignment'))
    this.menuBar = new MenuBar(this.element, {editor, i18n}, this.items)
    editor.on('transaction', this.updateMenu)
    this.updateMenu()
  }

  destroy(): void {
    this.editor?.off('transaction', this.updateMenu)
    this.menuBar?.destroy()
    this.menuBar = undefined
    this.editor = undefined
    this.element.remove()
  }
}
