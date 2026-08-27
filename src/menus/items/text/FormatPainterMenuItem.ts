import { Paintbrush } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 捕获源格式并将其一次性应用到下一个目标选区。 */
export class FormatPainterMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'format-painter',
      label: 'Format painter',
      icon: Paintbrush,
      execute: ({ editor }) => {
        if (editor.storage.formatPainter.active) editor.commands.clearFormatPainter()
        else editor.commands.captureFormat()
      },
      isActive: ({ editor }) => Boolean(editor.storage.formatPainter.active),
      isEnabled: ({ editor }) => editor.isEditable,
    })
  }
}
