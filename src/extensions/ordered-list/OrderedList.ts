import { OrderedList as TOrderedList, type OrderedListOptions as TOrderedListOptions } from '@tiptap/extension-list'

/** 有序列表节点的本地适配层。 */
export type OrderedListOptions = TOrderedListOptions
export const OrderedList = TOrderedList.extend<OrderedListOptions>({})
