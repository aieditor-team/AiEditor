import { DropdownMenuItem } from '../../core'

/** 在正文、标题 1-6 之间切换的块类型下拉菜单。 */
export class TextStyleMenuItem extends DropdownMenuItem {
  constructor() {
    super({
      id: 'text-style',
      label: 'Text style',
      options: [
        { value: 'paragraph', label: 'Paragraph' },
        { value: 'heading-1', label: 'Heading 1' },
        { value: 'heading-2', label: 'Heading 2' },
        { value: 'heading-3', label: 'Heading 3' },
        { value: 'heading-4', label: 'Heading 4' },
        { value: 'heading-5', label: 'Heading 5' },
        { value: 'heading-6', label: 'Heading 6' },
      ],
      getValue: ({ editor }) => {
        if (editor.isActive('heading', { level: 1 })) return 'heading-1'
        if (editor.isActive('heading', { level: 2 })) return 'heading-2'
        if (editor.isActive('heading', { level: 3 })) return 'heading-3'
        if (editor.isActive('heading', { level: 4 })) return 'heading-4'
        if (editor.isActive('heading', { level: 5 })) return 'heading-5'
        if (editor.isActive('heading', { level: 6 })) return 'heading-6'
        return 'paragraph'
      },
      execute: ({ editor }, value) => {
        const chain = editor.chain().focus()
        if (value === 'paragraph') chain.setParagraph().run()
        if (value === 'heading-1') chain.setHeading({ level: 1 }).run()
        if (value === 'heading-2') chain.setHeading({ level: 2 }).run()
        if (value === 'heading-3') chain.setHeading({ level: 3 }).run()
        if (value === 'heading-4') chain.setHeading({ level: 4 }).run()
        if (value === 'heading-5') chain.setHeading({ level: 5 }).run()
        if (value === 'heading-6') chain.setHeading({ level: 6 }).run()
      },
    })
  }
}
