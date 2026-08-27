import { DropdownMenuItem } from '../../core'

export interface FontSizeOption {
  /** 用户看到的字号名称。 */
  label: string
  /** CSS font-size 值；空字符串表示恢复编辑器默认字号。 */
  value: string
}

export const defaultFontSizes: FontSizeOption[] = [
  { label: 'Default size', value: '' },
  { label: '12px', value: '12px' },
  { label: '14px', value: '14px' },
  { label: '16px', value: '16px' },
  { label: '18px', value: '18px' },
  { label: '20px', value: '20px' },
  { label: '24px', value: '24px' },
  { label: '28px', value: '28px' },
  { label: '32px', value: '32px' },
  { label: '40px', value: '40px' },
  { label: '48px', value: '48px' },
]

/** 设置当前选区字号，空值会移除 fontSize 属性并恢复默认字号。 */
export class FontSizeMenuItem extends DropdownMenuItem {
  constructor(fontSizes: FontSizeOption[] = defaultFontSizes) {
    if (!fontSizes.length) throw new Error('FontSizeMenuItem requires at least one font size')

    super({
      id: 'font-size',
      label: 'Font size',
      options: fontSizes,
      getValue: ({ editor }) => editor.getAttributes('textStyle').fontSize ?? '',
      execute: ({ editor }, value) => {
        const chain = editor.chain().focus()
        if (value) chain.setFontSize(value).run()
        else chain.unsetFontSize().run()
      },
      isEnabled: ({ editor }) => editor.isEditable,
    })
  }
}
