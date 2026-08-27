import { FloatingMenu as TFloatingMenu, type FloatingMenuOptions as TFloatingMenuOptions } from '@tiptap/extension-floating-menu'

/** 空段落浮动菜单的 Tiptap 适配入口。 */
export type FloatingMenuOptions = TFloatingMenuOptions
export const FloatingMenu = TFloatingMenu.extend<FloatingMenuOptions>({})
