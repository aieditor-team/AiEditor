import type {Node as ProseMirrorNode} from '@tiptap/pm/model'
import type {TableOfContentData} from '@tiptap/extension-table-of-contents'

export interface DocumentOutlinePosition {
    /** 标题节点在 ProseMirror 文档中的起始位置。 */
    from: number
    /** 标题节点在 ProseMirror 文档中的结束位置。 */
    to: number
}

export interface DocumentOutlineItem {
    /** 插件启用时为标题的稳定 ID；关闭插件时回退为基于当前文档位置的快照 ID。 */
    id: string
    text: string
    /** 用于呈现层级；配置 TableOfContents.getLevel 后可能与标题原始级别不同。 */
    level: number
    /** 标题节点原始 level。 */
    originalLevel?: number
    /** 当前层级中的目录序号，由 TableOfContents.getIndex 计算。 */
    index?: number
    /** 标题当前是否为滚动容器中的活动项。 */
    isActive?: boolean
    /** 标题是否已经滚过。 */
    isScrolledOver?: boolean
    position: DocumentOutlinePosition
    children: DocumentOutlineItem[]
}

/** 根据 level 将扁平目录转换为公共 API 使用的树形结构。 */
function nestDocumentOutline(items: DocumentOutlineItem[]): DocumentOutlineItem[] {
    const outline: DocumentOutlineItem[] = []
    const stack: DocumentOutlineItem[] = []
    items.forEach((item) => {
        while (stack.length && stack.at(-1)!.level >= item.level) stack.pop()
        const parent = stack.at(-1)
        if (parent) parent.children.push(item)
        else outline.push(item)
        stack.push(item)
    })
    return outline
}

/** 将 Tiptap TableOfContents 的实时扁平 anchors 转换为 AiEditor 的树形目录快照。 */
export function createDocumentOutlineFromTableOfContents(data: TableOfContentData): DocumentOutlineItem[] {
    return nestDocumentOutline(data.map((anchor) => ({
        id: anchor.id,
        text: anchor.textContent.trim(),
        level: Number.isInteger(anchor.level) && anchor.level > 0 ? anchor.level : 1,
        originalLevel: anchor.originalLevel,
        index: anchor.itemIndex,
        isActive: anchor.isActive,
        isScrolledOver: anchor.isScrolledOver,
        position: {from: anchor.pos, to: anchor.pos + anchor.node.nodeSize},
        children: [],
    })))
}

/**
 * 从当前 ProseMirror 文档创建按 heading level 嵌套的目录快照。
 * position 是 ProseMirror 文档坐标而非 DOM 偏移，可直接用于选区与滚动定位命令。
 */
export function createDocumentOutline(document: ProseMirrorNode): DocumentOutlineItem[] {
    const items: DocumentOutlineItem[] = []
    document.descendants((node, position) => {
        if (node.type.name !== 'heading') return
        const text = node.textContent.trim()
        if (!text) return
        const level = Number(node.attrs.level)
        if (!Number.isInteger(level) || level < 1 || level > 6) return
        const item: DocumentOutlineItem = {
            id: `heading-${position}`,
            text,
            level,
            originalLevel: level,
            position: {from: position, to: position + node.nodeSize},
            children: [],
        }
        items.push(item)
    })
    // 标题级别允许跳跃，例如 h2 后直接出现 h4，此时 h4 仍归入最近的 h2。
    return nestDocumentOutline(items)
}
