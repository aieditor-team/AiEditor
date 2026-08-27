import { List, type IconNode } from 'lucide'
import { ButtonMenuItem, DropdownMenuItem } from '../../core'

export type BulletListMenuStyle = '' | 'disc' | 'circle' | 'square'

const filledCircleIcon: IconNode = [['circle', {cx: '12', cy: '12', r: '5', fill: 'currentColor', stroke: 'none'}]]
const hollowCircleIcon: IconNode = [['circle', {cx: '12', cy: '12', r: '5'}]]
const filledSquareIcon: IconNode = [['rect', {x: '7', y: '7', width: '10', height: '10', fill: 'currentColor', stroke: 'none'}]]

export const defaultBulletListStyles = [
  { label: 'No bullets', value: '' as BulletListMenuStyle },
  { label: 'Filled circle', value: 'disc' as BulletListMenuStyle, icon: filledCircleIcon },
  { label: 'Hollow circle', value: 'circle' as BulletListMenuStyle, icon: hollowCircleIcon },
  { label: 'Filled square', value: 'square' as BulletListMenuStyle, icon: filledSquareIcon },
]

/** 块拖拽快捷菜单使用的无下拉快速切换按钮。 */
export class BulletListToggleMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'bullet-list', label: 'Bullet list', icon: List,
      execute: ({ editor }) => { editor.chain().focus().toggleBulletList().run() },
      isActive: ({ editor }) => editor.isActive('bulletList'),
    })
  }
}

/** 无序列表菜单项，提供常用项目符号样式选择。 */
export class BulletListMenuItem extends DropdownMenuItem {
  constructor(styles = defaultBulletListStyles) {
    super({
      id: 'bullet-list',
      label: 'Bullet list',
      triggerIcon: List,
      iconOnly: false,
      options: styles,
      getValue: ({ editor }) => {
        if (!editor.isActive('bulletList')) return ''
        return (editor.getAttributes('bulletList').type ?? 'disc') as BulletListMenuStyle
      },
      execute: ({ editor }, value) => {
        const chain = editor.chain().focus()
        if (!value) {
          if (editor.isActive('bulletList')) chain.toggleBulletList().run()
          return
        }
        if (!editor.isActive('bulletList')) chain.toggleBulletList().run()
        editor.chain().focus().updateAttributes('bulletList', {type: value}).run()
      },
      isEnabled: ({ editor }) => editor.isEditable,
    })
  }
}
