import type {Attributes} from '@tiptap/core'

export type ImageLinkTarget = '_self' | '_blank' | '_parent' | '_top' | null

/**
 * 规范化图片链接，阻止 javascript:、data: 等可执行或内嵌协议进入文档。
 * 相对路径、站内锚点以及 http(s)、邮件和电话链接均可正常使用。
 */
export function normalizeImageLink(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const href = value.trim()
  if (!href || /[\u0000-\u001F\u007F]/.test(href)) return null

  const protocol = href.match(/^([a-z][a-z\d+.-]*):/i)?.[1]?.toLowerCase()
  if (protocol && !['http', 'https', 'mailto', 'tel'].includes(protocol)) return null
  return href
}

/** 只允许浏览器定义的四种链接打开目标，未知值按当前窗口处理。 */
export function normalizeImageLinkTarget(value: unknown): ImageLinkTarget {
  return value === '_self' || value === '_blank' || value === '_parent' || value === '_top' ? value : null
}

/** 图片节点共享的链接属性；解析时从包裹图片的 a 标签恢复。 */
export function imageLinkAttributes(): Attributes {
  return {
    href: {
      default: null,
      parseHTML: (element) => element.parentElement?.tagName === 'A'
        ? normalizeImageLink(element.parentElement.getAttribute('href'))
        : null,
      renderHTML: () => ({}),
    },
    target: {
      default: null,
      parseHTML: (element) => element.parentElement?.tagName === 'A'
        ? normalizeImageLinkTarget(element.parentElement.getAttribute('target'))
        : null,
      renderHTML: () => ({}),
    },
  }
}

export function imageLinkHTMLAttributes(href: string, target?: string | null) {
  const safeHref = normalizeImageLink(href)
  const safeTarget = normalizeImageLinkTarget(target)
  return {
    ...(safeHref ? {href: safeHref} : {}),
    ...(safeTarget ? {target: safeTarget} : {}),
    ...(safeTarget === '_blank' ? {rel: 'noopener noreferrer'} : {}),
  }
}
