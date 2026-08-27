import { Youtube as TYoutube, type YoutubeOptions as TYoutubeOptions } from '@tiptap/extension-youtube'
import {mediaAlignmentAttribute} from '../media-alignment/MediaAlignment'
import {createEmbeddedVideoView} from '../shared/EmbeddedVideoView'

export type YoutubeOptions = TYoutubeOptions
/** YouTube 嵌入节点，补充统一媒体对齐属性和可调整尺寸的节点视图。 */
export const Youtube = TYoutube.extend<YoutubeOptions>({
  addAttributes() {
    return {
      ...this.parent?.(),
      alignment: mediaAlignmentAttribute,
    }
  },
  addNodeView() {
    // 使用受控 iframe 视图，避免编辑状态下 iframe 抢走指针事件。
    return createEmbeddedVideoView()
  },
})
