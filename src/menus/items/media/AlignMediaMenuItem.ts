import {AlignCenter, AlignLeft, AlignRight, type IconNode} from 'lucide'
import type {MediaAlignment} from '../../../extensions/media-alignment/MediaAlignment'
import {ButtonMenuItem} from '../../core'

export type AlignableMediaNode = 'audio' | 'video' | 'youtube' | 'twitch' | 'attachment'

const mediaNodeTypes: AlignableMediaNode[] = ['audio', 'video', 'youtube', 'twitch', 'attachment']
const alignmentIcons: Record<MediaAlignment, IconNode> = {
  left: AlignLeft,
  center: AlignCenter,
  right: AlignRight,
}
const alignmentLabels: Record<MediaAlignment, string> = {
  left: 'Align media left',
  center: 'Align media center',
  right: 'Align media right',
}

export function getActiveMediaNode(editor: {isActive: (name: string) => boolean}): AlignableMediaNode | undefined {
  return mediaNodeTypes.find((nodeType) => editor.isActive(nodeType))
}

/** 音频、视频和附件共用的节点对齐菜单项。 */
export class AlignMediaMenuItem extends ButtonMenuItem {
  constructor(alignment: MediaAlignment) {
    super({
      id: `media-align-${alignment}`,
      label: alignmentLabels[alignment],
      icon: alignmentIcons[alignment],
      execute: ({editor}) => {
        const nodeType = getActiveMediaNode(editor)
        if (nodeType) editor.chain().focus().updateAttributes(nodeType, {alignment}).run()
      },
      isActive: ({editor}) => {
        const nodeType = getActiveMediaNode(editor)
        return Boolean(nodeType && editor.getAttributes(nodeType).alignment === alignment)
      },
      isEnabled: ({editor}) => Boolean(getActiveMediaNode(editor)),
    })
  }
}
