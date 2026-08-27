import { DropdownMenuItem } from '../../core'

export interface LineHeightOption {
  label: string
  /** 合法的 CSS line-height；空字符串表示恢复默认行高。 */
  value: string
}

export const defaultLineHeights: LineHeightOption[] = [
  { label: 'Default line height', value: '' },
  { label: '1.0', value: '1' },
  { label: '1.15', value: '1.15' },
  { label: '1.5', value: '1.5' },
  { label: '1.75', value: '1.75' },
  { label: '2.0', value: '2' },
  { label: '2.5', value: '2.5' },
  { label: '3.0', value: '3' },
]

/** 设置当前段落或标题的行高。 */
export class LineHeightMenuItem extends DropdownMenuItem {
  constructor(lineHeights: LineHeightOption[] = defaultLineHeights) {
    if (!lineHeights.length) throw new Error('LineHeightMenuItem requires at least one line height')

    super({
      id: 'line-height',
      label: 'Line height',
      options: lineHeights,
      getValue: ({ editor }) => {
        const nodeType = editor.isActive('heading') ? 'heading' : 'paragraph'
        return editor.getAttributes(nodeType).lineHeight ?? ''
      },
      execute: ({ editor }, value) => {
        const chain = editor.chain().focus()
        if (value) chain.setLineHeight(value).run()
        else chain.unsetLineHeight().run()
      },
      isEnabled: ({ editor }) => editor.isEditable,
    })
  }
}
