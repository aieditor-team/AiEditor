import { Highlighter, PaintBucket, type IconNode } from 'lucide'
import {
  ColorPaletteMenuItem,
  type ColorPaletteConfig,
  type ColorPaletteOption,
  type ColorPaletteSetting,
} from '../../core'

export type TextColorOption = ColorPaletteOption
export type TextColorPaletteOptions = ColorPaletteConfig
export type TextColorPaletteSetting = ColorPaletteSetting

/** 文字颜色按钮使用无下划线的 A，底部色条由通用调色板组件绘制。 */
const FontColorIcon: IconNode = [
  ['path', { d: 'M3.5 20 12 3 20.5 20' }],
  ['path', { d: 'M7 13h10' }],
]

export const defaultThemeColorValues = [
  'ffffff', '000000', 'e9d989', '2972f4', '609eec', 'de3c36', 'a1d533', '7334c5', '27b5d9', 'ff8926',
  'f2f2f2', '7f7f7f', 'ddd9c3', 'c6d9f0', 'dbe5f1', 'f2dcdb', 'ebf1dd', 'e5e0ec', 'dbeef3', 'fdeada',
  'd8d8d8', '595959', 'c4bd97', '8db3e2', 'b8cce4', 'e5b9b7', 'd7e3bc', 'ccc1d9', 'b7dde8', 'fbd5b5',
  'bfbfbf', '3f3f3f', '938953', '548dd4', '95b3d7', 'd99694', 'c3d69b', 'b2a2c7', '92cddc', 'fac08f',
  'a5a5a5', '262626', '494429', '17365d', '366092', '953734', '76923c', '5f497a', '31859b', 'e36c09',
  '6e6e6e', '0c0c0c', '1d1b10', '0f243e', '244061', '632423', '4f6128', '3f3151', '205867', '974806',
] as const

/** 不随主题分组变化的高饱和基础色。 */
export const defaultStandardColorValues = [
  'c00000', 'ff0000', 'ffc000', 'ffff00', '92d050',
  '00b050', '00b0f0', '0070c0', '002060', '7030a0',
] as const

/** 将无井号的内部色值表转换为调色板统一选项格式。 */
function createColorOptions(values: readonly string[]): ColorPaletteOption[] {
  return values.map((hex) => ({ label: `#${hex}`, value: `#${hex}` }))
}

export const defaultThemeColors = createColorOptions(defaultThemeColorValues)
export const defaultStandardColors = createColorOptions(defaultStandardColorValues)

/** 解析数组简写或完整配置，并补齐标准色与最近使用数量。 */
function resolvePalette(setting: ColorPaletteSetting): Required<ColorPaletteConfig> {
  const options = Array.isArray(setting) ? { colors: setting } : setting
  return {
    colors: options.colors ?? defaultThemeColors,
    standardColors: options.standardColors ?? defaultStandardColors,
    recentLimit: options.recentLimit ?? 8,
  }
}

/** 设置或清除文字前景色。 */
export class FontColorMenuItem extends ColorPaletteMenuItem {
  constructor(setting: ColorPaletteSetting = {}) {
    const palette = resolvePalette(setting)
    super({
      id: 'font-color',
      label: 'Font color',
      paletteLabel: 'Font color palette',
      icon: FontColorIcon,
      ...palette,
      getValue: ({ editor }) => editor.getAttributes('textStyle').color ?? '',
      execute: ({ editor }, value) => {
        const chain = editor.chain().focus()
        if (value) chain.setColor(value).run()
        else chain.unsetColor().run()
      },
      isEnabled: ({ editor }) => editor.isEditable,
    })
  }
}

/** 设置或清除 TextStyle 的背景颜色。 */
export class BackgroundColorMenuItem extends ColorPaletteMenuItem {
  constructor(setting: ColorPaletteSetting = {}) {
    const palette = resolvePalette(setting)
    super({
      id: 'background-color',
      label: 'Background color',
      paletteLabel: 'Background color palette',
      icon: PaintBucket,
      ...palette,
      getValue: ({ editor }) => editor.getAttributes('textStyle').backgroundColor ?? '',
      execute: ({ editor }, value) => {
        const chain = editor.chain().focus()
        if (value) chain.setBackgroundColor(value).run()
        else chain.unsetBackgroundColor().run()
      },
      isEnabled: ({ editor }) => editor.isEditable,
    })
  }
}

/** 设置或清除独立的语义化高亮 mark。 */
export class HighlightColorMenuItem extends ColorPaletteMenuItem {
  constructor(setting: ColorPaletteSetting = {}) {
    const palette = resolvePalette(setting)
    super({
      id: 'highlight-color',
      label: 'Highlight color',
      paletteLabel: 'Highlight color palette',
      icon: Highlighter,
      ...palette,
      getValue: ({ editor }) => editor.getAttributes('highlight').color ?? '',
      execute: ({ editor }, value) => {
        const chain = editor.chain().focus()
        if (value) chain.setHighlight({ color: value }).run()
        else chain.unsetHighlight().run()
      },
      isEnabled: ({ editor }) => editor.isEditable,
    })
  }
}
