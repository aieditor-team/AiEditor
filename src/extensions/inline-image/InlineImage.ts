import {mergeAttributes} from '@tiptap/core'
import { Image as TImage } from '@tiptap/extension-image'
import { Fragment } from '@tiptap/pm/model'
import type {DOMOutputSpec} from '@tiptap/pm/model'
import { NodeSelection } from '@tiptap/pm/state'
import {
  imageLinkAttributes,
  imageLinkHTMLAttributes,
  normalizeImageLink,
  normalizeImageLinkTarget,
} from '../image/ImageLinkAttributes'
import type {ImageAttributes} from '../image/Image'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    inlineImage: {
      setInlineImage: (options: ImageAttributes) => ReturnType
      convertImageToInline: () => ReturnType
      convertInlineImageToBlock: () => ReturnType
    }
  }
}

/**
 * 可嵌入文本流的图片节点，并提供块级图片与行内图片的双向转换命令。
 * priority 高于块级 Image，确保带 data-image-type="inline" 的 HTML 优先由本扩展解析。
 */
export const InlineImage = TImage.extend({
  name: 'inlineImage',
  priority: 1100,

  /** 保留官方图片属性，并兼容转换时携带的 alignment。 */
  addAttributes() {
    return {
      ...this.parent?.(),
      alignment: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-alignment') ?? 'center',
        renderHTML: (attributes) => ({ 'data-alignment': attributes.alignment }),
      },
      loading: {
        default: null,
        parseHTML: (element) => ['lazy', 'eager'].includes(element.getAttribute('loading') ?? '')
          ? element.getAttribute('loading')
          : null,
      },
      decoding: {
        default: null,
        parseHTML: (element) => ['sync', 'async', 'auto'].includes(element.getAttribute('decoding') ?? '')
          ? element.getAttribute('decoding')
          : null,
      },
      ...imageLinkAttributes(),
    }
  },

  /** 仅解析明确标记为 inline 的图片，避免与块级 Image 冲突。 */
  parseHTML() {
    return [{ tag: 'img[data-image-type="inline"][src]' }]
  },

  renderHTML({node, HTMLAttributes}) {
    const image: DOMOutputSpec = ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
    const href = normalizeImageLink(node.attrs.href)
    return href
      ? ['a', imageLinkHTMLAttributes(href, node.attrs.target), image]
      : image
  },

  /** 注册插入与块/行内转换命令。 */
  addCommands() {
    return {
      setInlineImage: (options) => ({ commands }) => commands.insertContent({
        type: this.name,
        attrs: {
          ...options,
          href: normalizeImageLink(options.href),
          target: normalizeImageLink(options.href) ? normalizeImageLinkTarget(options.target) : null,
          loading: options.loading === 'lazy' || options.loading === 'eager' ? options.loading : null,
          decoding: ['sync', 'async', 'auto'].includes(options.decoding ?? '') ? options.decoding : null,
        },
      }),

      convertImageToInline: () => ({ state, dispatch }) => {
        const { selection, schema } = state
        if (!(selection instanceof NodeSelection) || selection.node.type.name !== 'image') return false
        const inlineType = schema.nodes.inlineImage
        const paragraphType = schema.nodes.paragraph
        if (!inlineType || !paragraphType) return false

        if (dispatch) {
          const inlineImage = inlineType.create(selection.node.attrs)
          const before = selection.$from.nodeBefore
          const after = selection.$to.nodeAfter
          let transaction = state.tr
          let imagePosition = selection.from + 1

          // 两侧是同类型文本块时合并三者，避免转换后产生多余空段落。
          if (before?.isTextblock && after?.isTextblock && before.type === after.type) {
            const content = before.content.append(Fragment.from(inlineImage)).append(after.content)
            const merged = before.type.create(before.attrs, content)
            const replaceFrom = selection.from - before.nodeSize
            imagePosition = replaceFrom + 1 + before.content.size
            transaction = transaction.replaceWith(replaceFrom, selection.to + after.nodeSize, merged)
          } else if (before?.isTextblock) {
            const merged = before.type.create(before.attrs, before.content.append(Fragment.from(inlineImage)))
            const replaceFrom = selection.from - before.nodeSize
            imagePosition = replaceFrom + 1 + before.content.size
            transaction = transaction.replaceWith(replaceFrom, selection.to, merged)
          } else if (after?.isTextblock) {
            const merged = after.type.create(after.attrs, Fragment.from(inlineImage).append(after.content))
            imagePosition = selection.from + 1
            transaction = transaction.replaceWith(selection.from, selection.to + after.nodeSize, merged)
          } else {
            const paragraph = paragraphType.create(null, inlineImage)
            transaction = transaction.replaceSelectionWith(paragraph)
          }

          transaction.setSelection(NodeSelection.create(transaction.doc, imagePosition))
          dispatch(transaction.scrollIntoView())
        }
        return true
      },

      convertInlineImageToBlock: () => ({ state, dispatch }) => {
        const { selection, schema } = state
        if (!(selection instanceof NodeSelection) || selection.node.type.name !== 'inlineImage') return false
        const blockType = schema.nodes.image
        const { $from } = selection
        if (!blockType || $from.depth < 1 || !$from.parent.isTextblock) return false

        if (dispatch) {
          const parent = $from.parent
          const parentStart = $from.before()
          const parentEnd = $from.after()
          const offset = $from.parentOffset
          const beforeContent = parent.content.cut(0, offset)
          const afterContent = parent.content.cut(offset + selection.node.nodeSize)
          // 将行内图片前后文本拆成段落，块级图片置于它们之间。
          const replacement = []

          if (beforeContent.size) replacement.push(parent.type.create(parent.attrs, beforeContent))
          const imagePosition = parentStart + replacement.reduce((size, node) => size + node.nodeSize, 0)
          replacement.push(blockType.create(selection.node.attrs))
          if (afterContent.size) replacement.push(parent.type.create(parent.attrs, afterContent))

          const transaction = state.tr.replaceWith(parentStart, parentEnd, Fragment.fromArray(replacement))
          transaction.setSelection(NodeSelection.create(transaction.doc, imagePosition))
          dispatch(transaction.scrollIntoView())
        }
        return true
      },
    }
  },
})
