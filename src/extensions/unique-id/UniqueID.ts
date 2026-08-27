export {
    UniqueID,
    generateUniqueIds,
    type UniqueIDGenerationContext,
    type UniqueIDOptions,
} from '@tiptap/extension-unique-id'

/** 默认给可独立引用和操作的块级节点添加稳定 ID。 */
export const DEFAULT_UNIQUE_ID_TYPES = [
    'paragraph',
    'heading',
    'blockquote',
    'codeBlock',
    'listItem',
    'taskItem',
    'horizontalRule',
    'highlightBlock',
    'details',
    'table',
    'image',
    'audio',
    'video',
    'attachment',
] as const
