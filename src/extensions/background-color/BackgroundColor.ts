import { BackgroundColor as TBackgroundColor, type BackgroundColorOptions as TBackgroundColorOptions } from '@tiptap/extension-text-style'

/** 将文字背景色保存到 TextStyle 标记，并通过本地入口统一配置。 */
export type BackgroundColorOptions = TBackgroundColorOptions
export const BackgroundColor = TBackgroundColor.extend<BackgroundColorOptions>({})
