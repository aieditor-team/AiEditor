import type { Editor } from '@tiptap/core'
import type {AiEditorI18n} from '../../i18n'
import { FloatingMenu } from './FloatingMenu'
import { MenuBar, SeparatorMenuItem, type MenuItem } from '../../menus/core'
import {
  AlignImageCenterMenuItem,
  AlignImageLeftMenuItem,
  AlignImageRightMenuItem,
  ConvertToInlineImageMenuItem,
  ImageLinkMenuItem,
  ImagePropertiesMenuItem,
} from '../../menus/items'

/** 选中块级图片时显示的对齐与类型转换 Floating Menu。 */
export class ImageAlignmentFloatingMenu {
  readonly element: HTMLElement
  readonly extension
  private readonly items: MenuItem[]
  private menuBar: MenuBar | undefined
  private editor: Editor | undefined
  private readonly updateMenu = () => this.menuBar?.update()

  constructor(items: MenuItem[] = [
    new AlignImageLeftMenuItem(),
    new AlignImageCenterMenuItem(),
    new AlignImageRightMenuItem(),
    new SeparatorMenuItem('separator-image-details'),
    new ImageLinkMenuItem(),
    new ImagePropertiesMenuItem(),
    new SeparatorMenuItem('separator-image-conversion'),
    new ConvertToInlineImageMenuItem(),
  ]) {
    this.element = document.createElement('div')
    this.element.className = 'aieditor__image-floating-menu'
    // 避免 Floating UI 首次测量时使用整个 body 的宽度。
    this.element.style.width = 'max-content'
    this.element.setAttribute('role', 'toolbar')
    this.element.setAttribute('aria-label', 'Image alignment')
    this.items = items
    this.extension = FloatingMenu.extend({ name: 'imageAlignmentFloatingMenu' }).configure({
      element: this.element,
      pluginKey: 'imageAlignmentFloatingMenu',
      appendTo: () => document.body,
      updateDelay: 0,
      shouldShow: ({ editor }) => editor.isEditable && editor.isActive('image'),
      options: {
        placement: 'top',
        strategy: 'fixed',
        offset: 10,
        flip: true,
        shift: { padding: 8 },
      },
    })
  }

  /** 绑定 MenuBar，并在编辑器事务后刷新按钮状态。 */
  mount(editor: Editor, i18n: AiEditorI18n): void {
    if (this.menuBar) throw new Error('ImageAlignmentFloatingMenu is already mounted')
    this.editor = editor
    this.element.setAttribute('aria-label', i18n.t('Image alignment'))
    this.menuBar = new MenuBar(this.element, { editor, i18n }, this.items)
    editor.on('transaction', this.updateMenu)
    this.updateMenu()
  }

  /** 解除事务监听并销毁菜单 DOM。 */
  destroy(): void {
    this.editor?.off('transaction', this.updateMenu)
    this.menuBar?.destroy()
    this.menuBar = undefined
    this.editor = undefined
    this.element.remove()
  }
}
