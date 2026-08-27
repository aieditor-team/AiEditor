import { Subscript as TSubscript, type SubscriptExtensionOptions } from '@tiptap/extension-subscript'

export type SubscriptOptions = SubscriptExtensionOptions

/** 官方下标扩展，补充与上标互斥的命令行为。 */
export const Subscript = TSubscript.extend<SubscriptOptions>({
  addCommands() {
    return {
      setSubscript: () => ({ chain }) => chain().unsetSuperscript().setMark(this.name).run(),
      toggleSubscript: () => ({ editor, chain }) => editor.isActive(this.name)
        ? chain().unsetMark(this.name).run()
        : chain().unsetSuperscript().setMark(this.name).run(),
      unsetSubscript: () => ({ commands }) => commands.unsetMark(this.name),
    }
  },
})
