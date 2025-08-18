import {Editor} from "@tiptap/core";

export function getCursorTextBefore(editor: Editor) {
    const {state} = editor
    const {selection, doc} = state
    const {$from} = selection

    // 当前节点（如当前段落）
    const currentNode = $from.parent
    const currentNodePos = $from.start()

    // 如果不是段落类型，忽略
    if (currentNode.type.name !== 'paragraph') {
        return null
    }

    // 获取当前段落中光标前的文本
    const cursorOffset = $from.parentOffset
    const currentTextBefore = currentNode.textContent.slice(0, cursorOffset)

    // 如果当前段落有内容，直接返回
    if (currentTextBefore.trim()) {
        return currentTextBefore
    }

    // 否则向上查找上一个段落
    let pos = currentNodePos - 2 // 段落前有一个换行符占1个位置
    while (pos > 0) {
        const node = doc.nodeAt(pos)
        if (node && node.type.name === 'paragraph' && node.textContent.trim()) {
            return node.textContent
        }
        pos -= 1
    }

    return null;
}
