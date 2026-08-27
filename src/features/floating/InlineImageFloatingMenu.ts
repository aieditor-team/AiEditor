import type { Editor } from '@tiptap/core'
import type {AiEditorI18n} from '../../i18n'
import { FloatingMenu } from './FloatingMenu'
import { MenuBar, SeparatorMenuItem, type MenuItem } from '../../menus/core'
import { ConvertToBlockImageMenuItem, ImageLinkMenuItem, ImagePropertiesMenuItem } from '../../menus/items'

/** 选中行内图片时显示的类型转换 Floating Menu。 */
export class InlineImageFloatingMenu {
  readonly element: HTMLElement
  readonly extension
  private readonly items: MenuItem[]
  private menuBar: MenuBar | undefined
  private editor: Editor | undefined
  private readonly updateMenu = () => this.menuBar?.update()

  constructor(items: MenuItem[] = [
    new ImageLinkMenuItem(),
    new ImagePropertiesMenuItem(),
    new SeparatorMenuItem('separator-inline-image-conversion'),
    new ConvertToBlockImageMenuItem(),
  ]) {
    this.element = document.createElement('div')
    this.element.className = 'aieditor__image-floating-menu'
    // 避免 Floating UI 首次测量时使用整个 body 的宽度。
    this.element.style.width = 'max-content'
    this.element.setAttribute('role', 'toolbar')
    this.element.setAttribute('aria-label', 'Inline image')
    this.items = items
    this.extension = FloatingMenu.extend({ name: 'inlineImageFloatingMenu' }).configure({
      element: this.element,
      pluginKey: 'inlineImageFloatingMenu',
      appendTo: () => document.body,
      updateDelay: 0,
      shouldShow: ({ editor }) => editor.isEditable && editor.isActive('inlineImage'),
      options: {
        placement: 'top',
        strategy: 'fixed',
        offset: 10,
        flip: true,
        shift: { padding: 8 },
      },
    })
  }

  /** 绑定编辑器，并订阅事务以同步菜单状态。 */
  mount(editor: Editor, i18n: AiEditorI18n): void {
    if (this.menuBar) throw new Error('InlineImageFloatingMenu is already mounted')
    this.editor = editor
    this.element.setAttribute('aria-label', i18n.t('Inline image'))
    this.menuBar = new MenuBar(this.element, { editor, i18n }, this.items)
    editor.on('transaction', this.updateMenu)
    this.updateMenu()
  }

  /** 解除订阅并释放菜单项和 DOM。 */
  destroy(): void {
    this.editor?.off('transaction', this.updateMenu)
    this.menuBar?.destroy()
    this.menuBar = undefined
    this.editor = undefined
    this.element.remove()
  }
}
