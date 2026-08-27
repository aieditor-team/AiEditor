import { Details as TDetails, type DetailsOptions as TDetailsOptions } from '@tiptap/extension-details'

/** 可折叠内容的外层容器，组合 summary 与 content 两类子节点。 */
export type DetailsOptions = TDetailsOptions
export const Details = TDetails.extend<DetailsOptions>({})
