import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { AiEditorContext } from '../../types'
import { EditorTool, type EditorToolExecution } from '../core/EditorTool'
import { clampInteger, objectSchema, requireString } from '../core/tool-utils'

/** 在文档文本节点中查找文字并返回可供其他 Tool 使用的 ProseMirror 范围。 */
export class SearchDocumentTool extends EditorTool {
  readonly name = 'search_document' as const
  readonly description = 'Search the editor document for text and return matching ranges and excerpts.'
  readonly parameters = objectSchema({
    query: { type: 'string', description: 'Text to search for.' },
    case_sensitive: { type: 'boolean', description: 'Whether matching is case-sensitive.' },
    max_results: { type: 'integer', minimum: 1, maximum: 50 },
  }, ['query'])

  /** 在每个文本块内建立字符到文档位置的映射，允许匹配跨越粗体、链接等 mark 边界。 */
  execute(arguments_: Record<string, unknown>, context: AiEditorContext): EditorToolExecution {
    const query = requireString(arguments_, 'query')
    const caseSensitive = arguments_.case_sensitive === true
    const maxResults = clampInteger(arguments_.max_results, 10, 1, 50)
    const normalizedNeedle = normalizeWithOffsets(query, caseSensitive)
    const needle = normalizedNeedle.text
    const matches: Array<{ from: number; to: number; text: string; excerpt: string }> = []

    context.editor.state.doc.descendants((node, position) => {
      if (!node.isTextblock || matches.length >= maxResults) return
      const block = collectTextBlock(node, position)
      const normalized = normalizeWithOffsets(block.text, caseSensitive)
      const haystack = normalized.text
      let index = haystack.indexOf(needle)
      while (index >= 0 && matches.length < maxResults) {
        const originalStart = normalized.offsets[index]
        const normalizedEnd = index + needle.length
        const originalEnd = normalizedEnd >= normalized.offsets.length
          ? block.text.length
          : normalized.offsets[normalizedEnd]
        const from = block.positions[originalStart]
        const to = originalEnd >= block.positions.length
          ? block.end
          : block.positions[originalEnd]
        const excerptStart = Math.max(0, originalStart - 32)
        const excerptEnd = Math.min(block.text.length, originalEnd + 32)
        matches.push({
          from,
          to,
          text: block.text.slice(originalStart, originalEnd),
          excerpt: block.text.slice(excerptStart, excerptEnd),
        })
        index = haystack.indexOf(needle, index + Math.max(1, needle.length))
      }
      // 文本块已经完整处理，阻止 descendants 再逐个访问其文本子节点。
      return false
    })

    return { output: { ok: true, query, count: matches.length, matches } }
  }
}

interface TextBlockMap {
  text: string
  positions: number[]
  end: number
}

/** 拼接同一文本块内的文本节点，同时保留每个 UTF-16 偏移对应的 ProseMirror 坐标。 */
function collectTextBlock(node: ProseMirrorNode, blockPosition: number): TextBlockMap {
  let text = ''
  const positions: number[] = []
  node.descendants((child, relativePosition) => {
    if (!child.isText || !child.text) return
    for (let index = 0; index < child.text.length; index += 1) {
      positions.push(blockPosition + 1 + relativePosition + index)
    }
    text += child.text
  })
  return {text, positions, end: blockPosition + node.nodeSize - 1}
}

/** 大小写转换可能改变字符串长度，因此同时记录转换后索引到原始索引的映射。 */
function normalizeWithOffsets(value: string, caseSensitive: boolean): {text: string; offsets: number[]} {
  if (caseSensitive) return {text: value, offsets: Array.from({length: value.length}, (_, index) => index)}
  let text = ''
  const offsets: number[] = []
  for (let index = 0; index < value.length;) {
    const codePoint = value.codePointAt(index)
    const character = String.fromCodePoint(codePoint!)
    const normalized = character.toLocaleLowerCase()
    text += normalized
    for (let offset = 0; offset < normalized.length; offset += 1) offsets.push(index)
    index += character.length
  }
  return {text, offsets}
}
