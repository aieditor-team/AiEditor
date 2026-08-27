import {mergeAttributes} from '@tiptap/core'
import { BulletList as TBulletList, type BulletListOptions as TBulletListOptions } from '@tiptap/extension-list'

/** 无序列表扩展的统一出口，供扩展管理器按固定名称装配。 */
export type BulletListOptions = TBulletListOptions

export type BulletListNodeStyle = 'disc' | 'circle' | 'square'

function withoutListStyleType(style: string | undefined): string {
  return (style ?? '')
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part && !/^list-style-type\s*:/i.test(part))
    .join('; ')
}

/** 扩展标准 ul 的项目符号样式，同时保留旧文档的默认圆点行为。 */
export const BulletList = TBulletList.extend<BulletListOptions>({
  addAttributes() {
    return {
      ...this.parent?.(),
      type: {
        default: 'disc' as BulletListNodeStyle,
        parseHTML: (element) => {
          const style = element.getAttribute('style') ?? ''
          const match = style.match(/(?:^|;)\s*list-style-type\s*:\s*([^;]+)/i)
          const value = match?.[1]?.trim().toLowerCase()
          return value === 'circle' || value === 'square' ? value : 'disc'
        },
      },
    }
  },

  renderHTML({HTMLAttributes}) {
    const {type, style: rawStyle, ...attributes} = HTMLAttributes
    const baseStyle = withoutListStyleType(rawStyle)
    const style = type && type !== 'disc'
      ? `${baseStyle ? `${baseStyle}; ` : ''}list-style-type: ${type}`
      : baseStyle
    return ['ul', mergeAttributes(this.options.HTMLAttributes, attributes, style ? {style} : {}), 0]
  },
})
