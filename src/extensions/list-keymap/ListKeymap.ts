import { ListKeymap as TListKeymap, type ListKeymapOptions as TListKeymapOptions } from '@tiptap/extension-list'

/** 统一列表回车、缩进和退格行为的快捷键扩展。 */
export type ListKeymapOptions = TListKeymapOptions
export const ListKeymap = TListKeymap.extend<ListKeymapOptions>({})
