import {mergeAttributes, type CommandProps} from '@tiptap/core'
import {Image as TImage, type ImageOptions as TImageOptions, type SetImageOptions} from '@tiptap/extension-image'
import type {DOMOutputSpec} from '@tiptap/pm/model'
import {NodeSelection, Plugin} from '@tiptap/pm/state'
import {InnerResizerView} from '../shared/InnerResizerView'
import {
  imageLinkAttributes,
  imageLinkHTMLAttributes,
  normalizeImageLink,
  normalizeImageLinkTarget,
  type ImageLinkTarget,
} from './ImageLinkAttributes'
import type {MediaAlignment} from '../media-alignment/MediaAlignment'

export type ImageAlignment = MediaAlignment
export type ImageOptions = TImageOptions
export type ImageLoading = 'eager' | 'lazy' | null
export type ImageDecoding = 'sync' | 'async' | 'auto' | null
export type {ImageLinkTarget} from './ImageLinkAttributes'

/** 块级和行内图片共享的完整可序列化属性。 */
export interface ImageAttributes extends Omit<SetImageOptions, 'width' | 'height'> {
  /** 支持拖拽产生的像素值和属性面板提供的百分比宽度；null 用于恢复原始尺寸。 */
  width?: number | string | null
  height?: number | string | null
  alignment?: ImageAlignment
  href?: string | null
  target?: ImageLinkTarget
  loading?: ImageLoading
  decoding?: ImageDecoding
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageAttributes: {
      /** 插入一个带完整属性的块级图片。 */
      setImageWithAttributes: (attributes: ImageAttributes) => ReturnType
      /** 更新当前选中的块级或行内图片。 */
      updateImageAttributes: (attributes: Partial<ImageAttributes>) => ReturnType
      /** 为当前选中的图片设置安全链接。 */
      setImageLink: (options: {href: string; target?: ImageLinkTarget}) => ReturnType
      /** 移除当前选中图片的链接。 */
      unsetImageLink: () => ReturnType
    }
  }
}

/** 仅允许浏览器支持的图片加载与解码策略进入节点属性。 */
function mediaBehaviorAttributes() {
  return {
    loading: {
      default: null,
      parseHTML: (element: HTMLElement) => {
        const value = element.getAttribute('loading')
        return value === 'lazy' || value === 'eager' ? value : null
      },
      renderHTML: (attributes: Record<string, unknown>) => attributes.loading
        ? {loading: attributes.loading}
        : {},
    },
    decoding: {
      default: null,
      parseHTML: (element: HTMLElement) => {
        const value = element.getAttribute('decoding')
        return value === 'sync' || value === 'async' || value === 'auto' ? value : null
      },
      renderHTML: (attributes: Record<string, unknown>) => attributes.decoding
        ? {decoding: attributes.decoding}
        : {},
    },
  }
}

/** 对公共命令传入的枚举和链接属性做统一清洗。 */
function normalizeImageAttributes(
  attributes: Partial<ImageAttributes>,
  currentHref?: unknown,
): Partial<ImageAttributes> {
  const normalized = {...attributes}
  if ('href' in normalized) normalized.href = normalizeImageLink(normalized.href)
  if ('target' in normalized) normalized.target = normalizeImageLinkTarget(normalized.target)
  if ('loading' in normalized && normalized.loading !== 'lazy' && normalized.loading !== 'eager') {
    normalized.loading = null
  }
  if ('decoding' in normalized && !['sync', 'async', 'auto'].includes(normalized.decoding ?? '')) {
    normalized.decoding = null
  }

  const resultingHref = 'href' in normalized ? normalized.href : normalizeImageLink(currentHref)
  if (!resultingHref) normalized.target = null
  return normalized
}

/** 将节点属性同步到 NodeView 内的真实图片元素。 */
function updateImageElement(view: InnerResizerView, container: HTMLElement): void {
  const attributes = view.node.attrs
  let image = container.querySelector('img')
  if (!image) {
    image = document.createElement('img')
    container.append(image)
  }
  image.src = attributes.src ?? ''
  image.alt = attributes.alt ?? ''
  if (attributes.title) image.setAttribute('title', attributes.title)
  else image.removeAttribute('title')
  image.dataset.alignment = attributes.alignment ?? 'center'
  if (attributes.width) image.setAttribute('width', String(attributes.width))
  else image.removeAttribute('width')
  if (attributes.height) image.setAttribute('height', String(attributes.height))
  else image.removeAttribute('height')
  if (attributes.loading) image.setAttribute('loading', attributes.loading)
  else image.removeAttribute('loading')
  if (attributes.decoding) image.setAttribute('decoding', attributes.decoding)
  else image.removeAttribute('decoding')

  const currentLink = image.parentElement?.tagName === 'A' ? image.parentElement as HTMLAnchorElement : null
  const href = normalizeImageLink(attributes.href)
  const target = normalizeImageLinkTarget(attributes.target)
  if (href) {
    const link = currentLink ?? document.createElement('a')
    if (!currentLink) {
      image.replaceWith(link)
      link.append(image)
      link.addEventListener('click', (event) => {
        if (view.editor.isEditable) event.preventDefault()
      })
    }
    link.setAttribute('href', href)
    if (target) link.setAttribute('target', target)
    else link.removeAttribute('target')
    if (target === '_blank') link.setAttribute('rel', 'noopener noreferrer')
    else link.removeAttribute('rel')
  } else if (currentLink) {
    currentLink.replaceWith(image)
  }
}

/**
 * 支持完整图片属性、链接、对齐和拖拽缩放的块级图片扩展。
 * 图片链接存储在节点属性中，导出 HTML 时转换为包裹图片的 a 标签。
 */
export const Image = TImage.extend<ImageOptions>({
  /** 排除带 inline 标记的图片，避免与 InlineImage 同时解析同一个 DOM。 */
  parseHTML() {
    return [{tag: 'img[src]:not([data-image-type="inline"])'}]
  },

  /** 在官方图片属性基础上增加布局、加载策略和链接属性。 */
  addAttributes() {
    return {
      ...this.parent?.(),
      alignment: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-alignment') ?? 'center',
        renderHTML: (attributes) => ({'data-alignment': attributes.alignment}),
      },
      ...mediaBehaviorAttributes(),
      ...imageLinkAttributes(),
    }
  },

  /** 链接属性保存在图片节点中，但导出时包裹在 a 标签上。 */
  renderHTML({node, HTMLAttributes}) {
    const image: DOMOutputSpec = ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
    const href = normalizeImageLink(node.attrs.href)
    return href
      ? ['a', imageLinkHTMLAttributes(href, node.attrs.target), image]
      : image
  },

  /** 提供完整图片属性的插入、更新和链接命令，块级与行内图片共用更新逻辑。 */
  addCommands() {
    const parentCommands = this.parent?.() ?? {}
    const updateSelectedImage = (attributes: Partial<ImageAttributes>) => ({state, dispatch}: CommandProps) => {
      const {selection} = state
      if (!(selection instanceof NodeSelection) || !['image', 'inlineImage'].includes(selection.node.type.name)) {
        return false
      }
      if (dispatch) {
        dispatch(state.tr.setNodeMarkup(selection.from, undefined, {
          ...selection.node.attrs,
          ...normalizeImageAttributes(attributes, selection.node.attrs.href),
        }))
      }
      return true
    }

    return {
      ...parentCommands,
      setImageWithAttributes: (attributes: ImageAttributes) => ({commands}) => commands.insertContent({
        type: this.name,
        attrs: normalizeImageAttributes(attributes),
      }),
      updateImageAttributes: (attributes: Partial<ImageAttributes>) => updateSelectedImage(attributes),
      setImageLink: ({href, target}: {href: string; target?: ImageLinkTarget}) => {
        const safeHref = normalizeImageLink(href)
        return updateSelectedImage({href: safeHref, target: safeHref ? normalizeImageLinkTarget(target) : null})
      },
      unsetImageLink: () => updateSelectedImage({href: null, target: null}),
    }
  },

  /** 使用共享 InnerResizerView 渲染并持久化图片宽度。 */
  addNodeView() {
    return InnerResizerView.create({
      minWidth: 120,
      onInit: (view) => {
        const container = document.createElement('span')
        container.className = 'aieditor__image-content'
        // 扩展级 HTMLAttributes 只在元素创建时合并，节点属性由 updateImageElement 持续同步。
        updateImageElement(view, container)
        const image = container.querySelector('img')
        if (image) {
          for (const [key, value] of Object.entries(mergeAttributes(this.options.HTMLAttributes))) {
            if (value !== undefined && value !== null) image.setAttribute(key, String(value))
          }
        }
        return container
      },
      onUpdate: (view, element) => updateImageElement(view, element),
    })
  },

  /** 编辑状态点击图片链接只选择节点，不直接离开当前页面。 */
  addProseMirrorPlugins() {
    return [
      ...(this.parent?.() ?? []),
      new Plugin({
        props: {
          handleDOMEvents: {
            click: (_view, event) => {
              const target = event.target
              if (this.editor.isEditable && target instanceof Element && target.closest('a')?.querySelector('img')) {
                event.preventDefault()
              }
              return false
            },
          },
        },
      }),
    ]
  },
})
