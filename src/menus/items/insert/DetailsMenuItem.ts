import { ListCollapse } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** Details 折叠块菜单项，封装对应的 Tiptap 命令。 */
export class DetailsMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'details', label: 'Toggle details', icon: ListCollapse,
      execute: ({ editor }) => {
        const chain = editor.chain().focus()
        if (editor.isActive('details')) chain.unsetDetails().run()
        else chain.setDetails().run()
      },
      isActive: ({ editor }) => editor.isActive('details'),
    })
  }
}
