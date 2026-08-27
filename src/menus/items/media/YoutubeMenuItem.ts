import { MonitorPlay } from 'lucide'
import { TextInputMenuItem } from '../../core'

/** @deprecated 默认工具栏已合并到 VideoMenuItem；保留该类供旧配置兼容。 */
export class YoutubeMenuItem extends TextInputMenuItem {
  constructor() {
    super({
      id: 'youtube', label: 'Insert YouTube video', icon: MonitorPlay,
      dialogTitle: 'Insert a YouTube video', inputLabel: 'YouTube URL', inputType: 'url',
      placeholder: 'https://www.youtube.com/watch?v=...', submitLabel: 'Insert video',
      onSubmit: ({ editor }, src) => { editor.chain().focus().setYoutubeVideo({ src }).run() },
      isActive: ({ editor }) => editor.isActive('youtube'),
    })
  }
}
