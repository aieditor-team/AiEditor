import { AlignCenter, AlignJustify, AlignLeft, AlignRight } from 'lucide'
import { DropdownMenuItem, type DropdownIndicatorPosition } from '../../core'

export type TextAlignment = 'left' | 'center' | 'right' | 'justify'
export type TextAlignmentValue = TextAlignment

export interface TextAlignmentOption {
  label: string
  value: TextAlignmentValue
}

export interface TextAlignMenuOptions {
  alignments?: TextAlignmentOption[]
  indicatorPosition?: DropdownIndicatorPosition
}

export const defaultTextAlignments: TextAlignmentOption[] = [
  { label: 'Align left', value: 'left' },
  { label: 'Align center', value: 'center' },
  { label: 'Align right', value: 'right' },
  { label: 'Justify', value: 'justify' },
]

const alignmentIcons = {
  left: AlignLeft,
  center: AlignCenter,
  right: AlignRight,
  justify: AlignJustify,
}

/** 设置当前段落或标题的水平对齐方式。 */
export class TextAlignMenuItem extends DropdownMenuItem {
  constructor(options: TextAlignmentOption[] | TextAlignMenuOptions = {}) {
    const { alignments, indicatorPosition } = Array.isArray(options)
      ? { alignments: options, indicatorPosition: undefined }
      : { alignments: options.alignments ?? defaultTextAlignments, indicatorPosition: options.indicatorPosition }
    if (!alignments.length) throw new Error('TextAlignMenuItem requires at least one alignment')

    super({
      id: 'text-align',
      label: 'Text alignment',
      options: alignments.map((alignment) => ({
        ...alignment,
        icon: alignmentIcons[alignment.value],
      })),
      iconOnly: true,
      indicatorPosition,
      getValue: ({ editor }) => {
        const nodeType = editor.isActive('heading') ? 'heading' : 'paragraph'
        return editor.getAttributes(nodeType).textAlign ?? 'left'
      },
      execute: ({ editor }, value) => editor.chain().focus().setTextAlign(value).run(),
      isEnabled: ({ editor }) => editor.isEditable,
    })
  }
}
