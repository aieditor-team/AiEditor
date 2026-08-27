import { DetailsSummary as TDetailsSummary, type DetailsSummaryOptions as TDetailsSummaryOptions } from '@tiptap/extension-details'

/** 折叠内容始终可见的摘要标题节点。 */
export type DetailsSummaryOptions = TDetailsSummaryOptions
export const DetailsSummary = TDetailsSummary.extend<DetailsSummaryOptions>({})
