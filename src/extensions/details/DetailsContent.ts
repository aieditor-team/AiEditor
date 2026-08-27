import { DetailsContent as TDetailsContent, type DetailsContentOptions as TDetailsContentOptions } from '@tiptap/extension-details'

/** 折叠内容中可展开、收起的正文区域。 */
export type DetailsContentOptions = TDetailsContentOptions
export const DetailsContent = TDetailsContent.extend<DetailsContentOptions>({})
