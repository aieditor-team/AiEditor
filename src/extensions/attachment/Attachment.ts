import {mergeAttributes, Node} from '@tiptap/core'
import {createElement, Download, FileText} from 'lucide'
import {formatBytes} from '../../uploader'
import {mediaAlignmentAttribute, type MediaAlignment} from '../media-alignment/MediaAlignment'
import {appendBlockBoundaryControls} from '../shared/BlockBoundaryControls'

/** 插入附件节点所需的下载信息及可选展示属性。 */
export interface SetAttachmentOptions {
  url: string
  name: string
  size?: number | null
  mimeType?: string | null
  alignment?: MediaAlignment
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    attachment: {
      setAttachment: (options: SetAttachmentOptions) => ReturnType
    }
  }
}

/** 可下载的块级附件，保留文件名、大小和 MIME 类型元数据。 */
export const Attachment = Node.create({
  name: 'attachment',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      url: {
        default: null,
        parseHTML: (element) => element.getAttribute('href'),
        renderHTML: () => ({}),
      },
      name: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-name') || element.textContent?.trim() || null,
        renderHTML: () => ({}),
      },
      size: {
        default: null,
        parseHTML: (element) => {
          // 非数字或 0 均按未知大小处理，避免导入异常值后展示误导信息。
          const value = element.getAttribute('data-size')
          return value ? Number(value) || null : null
        },
        renderHTML: () => ({}),
      },
      mimeType: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-mime-type'),
        renderHTML: () => ({}),
      },
      alignment: mediaAlignmentAttribute,
    }
  },

  parseHTML() {
    return [{tag: 'a[data-type="attachment"][href]'}]
  },

  renderHTML({node}) {
    const {url, name, size, mimeType, alignment} = node.attrs
    return ['a', mergeAttributes({
      'data-type': 'attachment',
      href: url,
      download: '',
      'data-name': name,
      'data-size': size,
      'data-mime-type': mimeType,
      'data-alignment': alignment,
    }), name || url]
  },

  addCommands() {
    return {
      setAttachment: (options) => ({commands}) => commands.insertContent({type: this.name, attrs: options}),
    }
  },

  addNodeView() {
    return ({node, editor, getPos}) => {
      // 编辑态使用更丰富的附件卡片；renderHTML 仍保持为可移植的普通下载链接。
      const dom = document.createElement('div')
      const attachment = document.createElement('a')
      const icon = document.createElement('span')
      const body = document.createElement('span')
      const name = document.createElement('strong')
      const meta = document.createElement('span')
      const download = document.createElement('span')

      dom.className = 'aieditor__attachment-wrapper'
      dom.contentEditable = 'false'
      dom.draggable = true
      attachment.className = 'aieditor__attachment'
      attachment.dataset.type = 'attachment'
      attachment.draggable = false
      icon.className = 'aieditor__attachment-icon'
      body.className = 'aieditor__attachment-body'
      name.className = 'aieditor__attachment-name'
      meta.className = 'aieditor__attachment-meta'
      download.className = 'aieditor__attachment-download'
      icon.append(createElement(FileText, {'aria-hidden': 'true'}))
      download.append(createElement(Download, {'aria-hidden': 'true'}))
      body.append(name, meta)
      attachment.append(icon, body, download)
      dom.append(attachment)
      let currentNode = node
      const removeBoundaryControls = appendBlockBoundaryControls(dom, editor.view, () => {
        const position = getPos()
        return typeof position === 'number' ? {position, nodeSize: currentNode.nodeSize} : undefined
      })

      /** 将最新节点属性同步到卡片，同时保留边界按钮和事件监听。 */
      const update = (nextNode = node) => {
        currentNode = nextNode
        const attrs = nextNode.attrs as SetAttachmentOptions
        attachment.href = attrs.url
        attachment.download = attrs.name || ''
        attachment.title = attrs.name
        attachment.dataset.alignment = attrs.alignment ?? 'center'
        dom.dataset.alignment = attrs.alignment ?? 'center'
        name.textContent = attrs.name || attrs.url
        const details = [attrs.mimeType, attrs.size ? formatBytes(attrs.size) : ''].filter(Boolean)
        meta.textContent = details.join(' · ')
        meta.hidden = details.length === 0
      }
      update()

      attachment.addEventListener('click', (event) => {
        // 编辑态点击应选择/操作节点，而只读态仍允许浏览器执行下载。
        if (editor.isEditable) event.preventDefault()
      })

      return {
        dom,
        update: (nextNode) => {
          if (nextNode.type.name !== 'attachment') return false
          update(nextNode)
          return true
        },
        selectNode: () => dom.classList.add('ProseMirror-selectednode'),
        deselectNode: () => dom.classList.remove('ProseMirror-selectednode'),
        stopEvent: (event) => event.target instanceof Element
          && Boolean(event.target.closest('.aieditor__block-boundary-button')),
        destroy: removeBoundaryControls,
      }
    }
  },
})
