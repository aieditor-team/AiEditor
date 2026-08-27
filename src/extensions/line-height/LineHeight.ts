import { Extension, getStyleProperty } from '@tiptap/core'

export interface LineHeightOptions {
  /** 可以应用行高的块节点名称。 */
  types: string[]
}

/**
 * 将行高存为段落/标题节点属性，符合文字处理器的段落行距语义。
 * 无单位值（如 1.5）表示相对字号的多倍行距；px/pt（如 28pt）表示固定距离。
 * Java DOCX SDK 依靠这个差异选择 w:lineRule=auto 或 exact，请勿在序列化时统一补单位。
 */
export const LineHeight = Extension.create<LineHeightOptions>({
  name: 'lineHeight',

  addOptions() {
    return { types: ['heading', 'paragraph'] }
  },

  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        lineHeight: {
          default: null,
          // getStyleProperty 能读取 style 属性中规范化后的值；后备分支兼容旧浏览器实现。
          parseHTML: (element) => getStyleProperty(element, 'line-height') ?? element.style.lineHeight,
          // 属性为空时不输出内联样式，让 DocumentStyleConfig 的实例级 CSS 默认值生效。
          renderHTML: (attributes) => attributes.lineHeight
            ? { style: `line-height: ${attributes.lineHeight}` }
            : {},
        },
      },
    }]
  },

  addCommands() {
    return {
      // 同时更新 paragraph 和 heading，混合块选区也能一次完成行高设置。
      setLineHeight: (lineHeight: string) => ({ commands }) => this.options.types
        .map((type) => commands.updateAttributes(type, { lineHeight }))
        .some(Boolean),
      // 清除节点属性后恢复当前文档预设，而不是写死一个默认行高。
      unsetLineHeight: () => ({ commands }) => this.options.types
        .map((type) => commands.resetAttributes(type, 'lineHeight'))
        .some(Boolean),
    }
  },
})
