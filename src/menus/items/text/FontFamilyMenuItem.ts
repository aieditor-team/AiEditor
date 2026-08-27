import { DropdownMenuItem } from '../../core'

export interface FontFamilyOption {
  /** 用户看到的字体名称。 */
  label: string
  /** CSS font-family 值；空字符串表示恢复编辑器默认字体。 */
  value: string
}

export const defaultFontFamilies: FontFamilyOption[] = [
  { label: 'Default font', value: '' },
  { label: '宋体', value: '"Songti SC", SimSun, serif' },
  { label: '仿宋', value: 'FangSong, "FangSong SC", serif' },
  { label: '黑体', value: '"Heiti SC", SimHei, sans-serif' },
  { label: '楷体', value: 'KaiTi, "Kaiti SC", serif' },
  { label: '微软雅黑', value: '"Microsoft YaHei", "PingFang SC", sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
]

/** 设置当前选区字体，空值会移除 fontFamily 属性并恢复默认字体。 */
export class FontFamilyMenuItem extends DropdownMenuItem {
  constructor(fontFamilies: FontFamilyOption[] = defaultFontFamilies) {
    if (!fontFamilies.length) throw new Error('FontFamilyMenuItem requires at least one font family')

    super({
      id: 'font-family',
      label: 'Font family',
      options: fontFamilies.map((font) => ({
        ...font,
        style: font.value ? { fontFamily: font.value } : undefined,
      })),
      getValue: ({ editor }) => editor.getAttributes('textStyle').fontFamily ?? '',
      execute: ({ editor }, value) => {
        const chain = editor.chain().focus()
        if (value) chain.setFontFamily(value).run()
        else chain.unsetFontFamily().run()
      },
      isEnabled: ({ editor }) => editor.isEditable,
    })
  }
}
