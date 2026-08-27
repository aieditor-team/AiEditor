import { mergeAttributes, Node } from '@tiptap/core'
import { InnerResizerView } from '../shared/InnerResizerView'
import {mediaAlignmentAttribute, type MediaAlignment} from '../media-alignment/MediaAlignment'

export interface SetVideoOptions {
  src: string
  poster?: string
  title?: string
  width?: number
  alignment?: MediaAlignment
}

// 扩展 Tiptap Commands 类型，使自定义视频命令可被 TypeScript 识别。
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: SetVideoOptions) => ReturnType
    }
  }
}

/** 将视频节点属性同步到 NodeView 内的 video 元素。 */
function updateVideoElement(view: InnerResizerView, video: HTMLVideoElement): void {
  const { src, poster, title } = view.node.attrs
  if (video.getAttribute('src') !== src) video.src = src ?? ''
  if (video.getAttribute('poster') !== (poster ?? null)) {
    if (poster) video.poster = poster
    else video.removeAttribute('poster')
  }
  video.title = title ?? ''
  video.controls = true
  video.playsInline = true
  video.preload = 'metadata'
}

/** 支持原生播放、拖拽和等比例缩放的块级视频节点。 */
export const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,

  /** 声明视频来源、标题、海报、宽度及播放选项。 */
  addAttributes() {
    return {
      src: { default: null },
      poster: { default: null },
      title: { default: null },
      alignment: mediaAlignmentAttribute,
      width: {
        default: 600,
        parseHTML: (element) => Number(element.getAttribute('data-width') ?? element.getAttribute('width')) || 600,
        renderHTML: ({ width }) => ({ 'data-width': width, width }),
      },
    }
  },

  /** 从已有 HTML 中恢复视频节点。 */
  parseHTML() {
    return [{ tag: 'video[src]' }]
  },

  /** 输出可独立播放的标准 video HTML。 */
  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, { controls: '', playsinline: '', preload: 'metadata' })]
  },

  /** 注册 setVideo 插入命令。 */
  addCommands() {
    return {
      setVideo: (options) => ({ commands }) => commands.insertContent({
        type: this.name,
        attrs: options,
      }),
    }
  },

  /** 使用共享 NodeView 管理媒体缩放和节点属性同步。 */
  addNodeView() {
    return InnerResizerView.create({
      label: 'video',
      minWidth: 240,
      selectOnPointerDown: true,
      onInit: (view) => {
        const video = document.createElement('video')
        updateVideoElement(view, video)
        return video
      },
      onUpdate: (view, element) => updateVideoElement(view, element as HTMLVideoElement),
      // 原生播放器内部事件不能冒泡给 ProseMirror，否则点击播放可能改变编辑器选区。
      stopEvent: (event) => event.target instanceof Element && Boolean(event.target.closest('video')),
    })
  },
})
