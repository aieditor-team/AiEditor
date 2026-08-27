import { AtSign } from 'lucide'
import { TextInputMenuItem } from '../../core'

/** Mention菜单项，封装对应的 Tiptap 命令。 */
export class MentionMenuItem extends TextInputMenuItem {
  constructor() {
    super({
      id: 'mention', label: 'Insert mention', icon: AtSign,
      dialogTitle: 'Insert a mention', inputLabel: 'Name',
      placeholder: 'Ada Lovelace', submitLabel: 'Insert mention',
      onSubmit: ({ editor }, label) => {
        editor.chain().focus().insertContent([
          { type: 'mention', attrs: { id: label, label } },
          { type: 'text', text: ' ' },
        ]).run()
      },
      isActive: ({ editor }) => editor.isActive('mention'),
    })
  }
}
