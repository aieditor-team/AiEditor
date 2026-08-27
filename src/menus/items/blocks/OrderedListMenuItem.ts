import { ListOrdered } from 'lucide'
import { DropdownMenuItem } from '../../core'

export type OrderedListStyle = '' | '1' | 'A' | 'a' | 'I' | 'i'

export const defaultOrderedListStyles = [
  { label: 'No numbering', value: '' as OrderedListStyle },
  { label: '1. 2. 3.', value: '1' as OrderedListStyle },
  { label: 'A. B. C.', value: 'A' as OrderedListStyle },
  { label: 'a. b. c.', value: 'a' as OrderedListStyle },
  { label: 'I. II. III.', value: 'I' as OrderedListStyle },
  { label: 'i. ii. iii.', value: 'i' as OrderedListStyle },
]

/** 有序列表菜单项，提供常用编号样式选择。 */
export class OrderedListMenuItem extends DropdownMenuItem {
  constructor(styles = defaultOrderedListStyles) {
    super({
      id: 'ordered-list',
      label: 'Numbered list',
      triggerIcon: ListOrdered,
      iconOnly: false,
      options: styles,
      getValue: ({ editor }) => {
        if (!editor.isActive('orderedList')) return ''
        return (editor.getAttributes('orderedList').type ?? '1') as OrderedListStyle
      },
      execute: ({ editor }, value) => {
        const chain = editor.chain().focus()
        if (!value) {
          if (editor.isActive('orderedList')) chain.toggleOrderedList().run()
          return
        }
        if (!editor.isActive('orderedList')) chain.toggleOrderedList().run()
        editor.chain().focus().updateAttributes('orderedList', {
          type: value === '1' ? null : value,
        }).run()
      },
      isEnabled: ({ editor }) => editor.isEditable,
    })
  }
}
