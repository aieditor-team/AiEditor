import { Superscript as TSuperscript, type SuperscriptExtensionOptions } from '@tiptap/extension-superscript'

export type SuperscriptOptions = SuperscriptExtensionOptions

/** 官方上标扩展，补充与下标互斥的命令行为。 */
export const Superscript = TSuperscript.extend<SuperscriptOptions>({
  addCommands() {
    return {
      setSuperscript: () => ({ chain }) => chain().unsetSubscript().setMark(this.name).run(),
      toggleSuperscript: () => ({ editor, chain }) => editor.isActive(this.name)
        ? chain().unsetMark(this.name).run()
        : chain().unsetSubscript().setMark(this.name).run(),
      unsetSuperscript: () => ({ commands }) => commands.unsetMark(this.name),
    }
  },
})
