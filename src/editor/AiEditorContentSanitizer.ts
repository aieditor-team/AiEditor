import type {JSONContent} from '@tiptap/core'
import type {Schema} from '@tiptap/pm/model'

export type ContentSanitizationIssueKind = 'node' | 'mark' | 'attribute' | 'emptyText'

/** 一项被内容清洗器删除或展开的输入。 */
export interface ContentSanitizationIssue {
    kind: ContentSanitizationIssueKind
    /** 节点、mark 或属性名称；空文本使用 text。 */
    name: string
    /** 在输入 JSON 中的稳定路径，便于定位上游转换器。 */
    path: string
}

export interface ContentSanitizationResult {
    content: JSONContent
    issues: ContentSanitizationIssue[]
}

type JsonNode = JSONContent & {attrs?: Record<string, unknown>}

/**
 * 根据编辑器当前 schema 清洗外部 JSON。
 *
 * <p>未知容器不会简单删除：其可识别的子节点会提升到父级，因此类似 DOCX 分节的
 * 传输包装不会连带丢失正文。未知原子节点、marks、属性和空 TextNode 会被删除。</p>
 */
export function sanitizeContentForSchema(content: JSONContent, schema: Schema): ContentSanitizationResult {
    const issues: ContentSanitizationIssue[] = []
    const normalized = sanitizeNode(content as JsonNode, schema, '$', issues)
    const topType = schema.topNodeType.name
    let root = normalized.length === 1 && normalized[0].type === topType
        ? normalized[0]
        : {type: topType, content: normalized}
    // 当输入只包含未知原子节点时，使用 schema 自己生成合法的最小文档，避免留下
    // 不满足 doc.content（通常为 block+）的空根节点。
    if (!root.content?.length) root = schema.topNodeType.createAndFill()?.toJSON() ?? root
    return {content: root, issues}
}

function sanitizeNode(
    source: JsonNode,
    schema: Schema,
    path: string,
    issues: ContentSanitizationIssue[],
): JsonNode[] {
    const typeName = typeof source.type === 'string' ? source.type : ''
    if (typeName === 'text' && (typeof source.text !== 'string' || source.text.length === 0)) {
        issues.push({kind: 'emptyText', name: 'text', path})
        return []
    }

    const children = Array.isArray(source.content)
        ? source.content.flatMap((child, index) => sanitizeNode(
            child as JsonNode,
            schema,
            `${path}.content[${index}]`,
            issues,
        ))
        : undefined
    const nodeType = schema.nodes[typeName]
    if (!nodeType) {
        issues.push({kind: 'node', name: typeName || '(missing type)', path})
        // 未知分节、插件包装等容器被展开；没有子内容的未知原子节点直接删除。
        return children ?? []
    }

    const result: JsonNode = {type: typeName}
    if (typeName === 'text') result.text = source.text
    const attrs = sanitizeAttributes(source.attrs, nodeType.spec.attrs, path, issues)
    if (attrs && Object.keys(attrs).length) result.attrs = attrs
    const marks = sanitizeMarks(source.marks, schema, path, issues)
    if (marks?.length) result.marks = marks
    if (children) result.content = children
    return [result]
}

function sanitizeAttributes(
    attrs: Record<string, unknown> | undefined,
    schemaAttrs: Record<string, unknown> | undefined,
    path: string,
    issues: ContentSanitizationIssue[],
): Record<string, unknown> | undefined {
    if (!attrs) return undefined
    const allowed = new Set(Object.keys(schemaAttrs ?? {}))
    const result: Record<string, unknown> = {}
    for (const [name, value] of Object.entries(attrs)) {
        if (allowed.has(name)) result[name] = value
        else issues.push({kind: 'attribute', name, path: `${path}.attrs.${name}`})
    }
    return result
}

function sanitizeMarks(
    marks: JSONContent['marks'],
    schema: Schema,
    path: string,
    issues: ContentSanitizationIssue[],
): JSONContent['marks'] {
    if (!Array.isArray(marks)) return undefined
    return marks.flatMap((source, index) => {
        const mark = source as JsonNode
        const markPath = `${path}.marks[${index}]`
        const typeName = typeof mark.type === 'string' ? mark.type : ''
        const markType = schema.marks[typeName]
        if (!markType) {
            issues.push({kind: 'mark', name: typeName || '(missing type)', path: markPath})
            return []
        }
        const result: NonNullable<JSONContent['marks']>[number] = {type: typeName}
        const attrs = sanitizeAttributes(mark.attrs, markType.spec.attrs, markPath, issues)
        if (attrs && Object.keys(attrs).length) result.attrs = attrs
        return [result]
    })
}

/** 将同类问题聚合成一条可读警告，避免大型导入文档产生大量 console 输出。 */
export function formatContentSanitizationWarning(issues: readonly ContentSanitizationIssue[]): string {
    const groups = new Map<string, number>()
    for (const issue of issues) {
        const key = `${issue.kind}:${issue.name}`
        groups.set(key, (groups.get(key) ?? 0) + 1)
    }
    const labels: Record<ContentSanitizationIssueKind, string> = {
        node: 'nodes', mark: 'marks', attribute: 'attributes', emptyText: 'empty text nodes',
    }
    const summary = [...groups.entries()].map(([key, count]) => {
        const separator = key.indexOf(':')
        const kind = key.slice(0, separator) as ContentSanitizationIssueKind
        const name = key.slice(separator + 1)
        return `${labels[kind]} ${name} (${count})`
    }).join(', ')
    return `[AiEditor] Content sanitization removed unsupported content: ${summary}.`
}
