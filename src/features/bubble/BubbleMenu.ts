import { BubbleMenu as TBubbleMenu, type BubbleMenuOptions as TBubbleMenuOptions } from '@tiptap/extension-bubble-menu'

/** 选区气泡菜单的 Tiptap 适配入口，实际菜单内容由 features/bubble 构建。 */
export type BubbleMenuOptions = TBubbleMenuOptions
export const BubbleMenu = TBubbleMenu.extend<BubbleMenuOptions>({})
