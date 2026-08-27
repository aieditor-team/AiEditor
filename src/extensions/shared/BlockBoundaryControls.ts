import {createElement, Plus} from 'lucide'
import {TextSelection} from '@tiptap/pm/state'
import type {EditorView} from '@tiptap/pm/view'

/** 块边界按钮相对于当前节点的插入方向。 */
export type BlockBoundaryDirection = 'before' | 'after'

/** 当前 NodeView 在 ProseMirror 文档中的位置及节点长度。 */
export interface BlockBoundary {
  position: number
  nodeSize: number
}

/** 为块级内容增加“在上方/下方插入空段落”的边界按钮。 */
export function appendBlockBoundaryControls(
  container: HTMLElement,
  view: EditorView,
  getBoundary: () => BlockBoundary | undefined,
): () => void {
  // AbortController 将两个按钮的监听器绑定到同一生命周期，销毁 NodeView 时统一释放。
  const events = new AbortController()
  container.classList.add('aieditor__block-boundary')

  for (const direction of ['before', 'after'] as const) {
    const button = document.createElement('button')
    const label = direction === 'before' ? 'Insert paragraph above' : 'Insert paragraph below'
    button.type = 'button'
    button.className = 'aieditor__block-boundary-button'
    button.dataset.blockBoundaryDirection = direction
    button.contentEditable = 'false'
    button.title = label
    button.setAttribute('aria-label', label)
    button.append(createElement(Plus, {'aria-hidden': 'true'}))
    button.addEventListener('mousedown', (event) => {
      event.preventDefault()
      event.stopPropagation()
    }, {signal: events.signal})
    button.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      insertBoundaryParagraph(view, getBoundary(), direction)
    }, {signal: events.signal})
    container.append(button)
  }

  return () => {
    events.abort()
    container.querySelectorAll('.aieditor__block-boundary-button').forEach((button) => button.remove())
    container.classList.remove('aieditor__block-boundary')
  }
}

/** 在目标块前后插入可编辑的空段落，并把光标移动到新段落中。 */
function insertBoundaryParagraph(
  view: EditorView,
  boundary: BlockBoundary | undefined,
  direction: BlockBoundaryDirection,
): void {
  if (!view.editable || !boundary) return
  const paragraph = view.state.schema.nodes.paragraph
  if (!paragraph) return
  const position = direction === 'before'
    ? boundary.position
    : boundary.position + boundary.nodeSize
  if (position < 0 || position > view.state.doc.content.size) return

  // 先基于事务的新文档创建选区，保证插入导致的位置变化已经反映在 selection 中。
  const transaction = view.state.tr.insert(position, paragraph.create())
  transaction.setSelection(TextSelection.create(transaction.doc, position + 1))
  view.dispatch(transaction.scrollIntoView())
  view.focus()
}
