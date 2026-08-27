import { Twitch as TTwitch, type TwitchOptions as TTwitchOptions } from '@tiptap/extension-twitch'
import {mediaAlignmentAttribute} from '../media-alignment/MediaAlignment'
import {createEmbeddedVideoView} from '../shared/EmbeddedVideoView'

export type TwitchOptions = TTwitchOptions
/** Twitch 嵌入节点，补充统一媒体对齐属性和可调整尺寸的节点视图。 */
export const Twitch = TTwitch.extend<TwitchOptions>({
  addAttributes() {
    return {
      ...this.parent?.(),
      alignment: mediaAlignmentAttribute,
    }
  },
  addNodeView() {
    // 与 YouTube 共用节点视图，保证选中、缩放和块边界交互一致。
    return createEmbeddedVideoView()
  },
})
