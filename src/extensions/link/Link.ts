import { Link as TLink, type LinkOptions as TLinkOptions } from '@tiptap/extension-link'
import type {TagParseRule} from '@tiptap/pm/model'

export type LinkOptions = TLinkOptions
export const Link = TLink.extend<LinkOptions>({
  addAttributes() {
    return {
      ...this.parent?.(),
      alt: {
        default: null,
        parseHTML: (element) => element.getAttribute('alt'),
        renderHTML: ({alt}) => alt ? {alt} : {},
      },
    }
  },

  /** 图片外层链接由图片节点自身解析，避免行内图片同时获得 Link mark 后产生嵌套 a 标签。 */
  parseHTML() {
    return (this.parent?.() ?? []).map((rule) => {
      if (!('tag' in rule)) return rule
      const tagRule = rule as TagParseRule
      const parentGetAttrs = tagRule.getAttrs
      return {
        ...tagRule,
        getAttrs: (element: HTMLElement) => {
          if (element.querySelector(':scope > img')) return false
          return parentGetAttrs?.(element) ?? null
        },
      }
    })
  },
})
