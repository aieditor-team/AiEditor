import { ListItem as TListItem, type ListItemOptions as TListItemOptions } from '@tiptap/extension-list'

/** 有序、无序列表共用的列表项节点。 */
export type ListItemOptions = TListItemOptions
export const ListItem = TListItem.extend<ListItemOptions>({})
