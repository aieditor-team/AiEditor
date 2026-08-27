import { mergeAttributes, Node } from '@tiptap/core'
import { InnerResizerView } from '../shared/InnerResizerView'
import {mediaAlignmentAttribute, type MediaAlignment} from '../media-alignment/MediaAlignment'

export interface SetAudioOptions {
  src: string
  title?: string
  width?: number
  alignment?: MediaAlignment
}

// 扩展 Tiptap Commands 类型，使 editor.commands.setAudio 获得完整类型提示。
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    audio: {
      setAudio: (options: SetAudioOptions) => ReturnType
    }
  }
}

/** 同步音频节点属性，同时固定编辑器内需要的原生播放配置。 */
function updateAudioElement(view: InnerResizerView, audio: HTMLAudioElement): void {
  const { src, title } = view.node.attrs
  if (audio.getAttribute('src') !== src) audio.src = src ?? ''
  audio.title = title ?? ''
  audio.controls = true
  audio.preload = 'metadata'
}

/** 可拖拽、可缩放并带原生播放控件的块级音频节点。 */
export const Audio = Node.create({
  name: 'audio',
  group: 'block',
  atom: true,
  draggable: true,

  /** 声明可持久化的媒体地址、标题和显示宽度。 */
  addAttributes() {
    return {
      src: { default: null },
      title: { default: null },
      alignment: mediaAlignmentAttribute,
      width: {
        default: 420,
        parseHTML: (element) => Number(element.getAttribute('data-width')) || 420,
        renderHTML: ({ width }) => ({ 'data-width': width, style: `width: ${width}px` }),
      },
    }
  },

  /** 从已有 HTML 中识别带 src 的 audio 元素。 */
  parseHTML() {
    return [{ tag: 'audio[src]' }]
  },

  /** 导出 HTML 时保留 controls 与懒加载元数据配置。 */
  renderHTML({ HTMLAttributes }) {
    return ['audio', mergeAttributes(HTMLAttributes, { controls: '', preload: 'metadata' })]
  },

  /** 注册插入音频节点的链式命令。 */
  addCommands() {
    return {
      setAudio: (options) => ({ commands }) => commands.insertContent({
        type: this.name,
        attrs: options,
      }),
    }
  },

  /** 通过共享 NodeView 提供选中态与左右缩放手柄。 */
  addNodeView() {
    return InnerResizerView.create({
      label: 'audio',
      minWidth: 240,
      selectOnPointerDown: true,
      onInit: (view) => {
        const audio = document.createElement('audio')
        updateAudioElement(view, audio)
        return audio
      },
      onUpdate: (view, element) => updateAudioElement(view, element as HTMLAudioElement),
      // 播放、暂停和进度条事件应由原生 audio 自己处理，不能交给 ProseMirror。
      stopEvent: (event) => event.target instanceof Element && Boolean(event.target.closest('audio')),
    })
  },
})
