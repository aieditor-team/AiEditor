import { Tv } from 'lucide'
import { TextInputMenuItem } from '../../core'

/** @deprecated 默认工具栏已合并到 VideoMenuItem；保留该类供旧配置兼容。 */
export class TwitchMenuItem extends TextInputMenuItem {
  constructor() {
    super({
      id: 'twitch', label: 'Insert Twitch video', icon: Tv,
      dialogTitle: 'Insert a Twitch video', inputLabel: 'Twitch URL', inputType: 'url',
      placeholder: 'https://www.twitch.tv/videos/...', submitLabel: 'Insert video',
      onSubmit: ({ editor }, src) => { editor.chain().focus().setTwitchVideo({ src }).run() },
      isActive: ({ editor }) => editor.isActive('twitch'),
    })
  }
}
