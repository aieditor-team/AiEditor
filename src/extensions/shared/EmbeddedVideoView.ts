import type {NodeViewRenderer} from '@tiptap/core'
import {DOMSerializer, type Node as ProseMirrorNode} from '@tiptap/pm/model'
import {appendBlockBoundaryControls} from './BlockBoundaryControls'

/** 使用扩展自身的 toDOM 结果渲染在线视频，并补充块级边界控件。 */
export function createEmbeddedVideoView(): NodeViewRenderer {
  return ({node, editor, getPos}) => {
    const serializer = DOMSerializer.fromSchema(editor.schema)
    const render = (value: ProseMirrorNode): HTMLElement => {
      const rendered = serializer.serializeNode(value)
      if (!(rendered instanceof HTMLElement)) throw new Error('Embedded video must render as an element')
      return rendered
    }

    const dom = render(node)
    let currentNode = node
    const removeBoundaryControls = appendBlockBoundaryControls(dom, editor.view, () => {
      const position = getPos()
      return typeof position === 'number' ? {position, nodeSize: currentNode.nodeSize} : undefined
    })

    return {
      dom,
      update: (nextNode) => {
        if (nextNode.type !== currentNode.type) return false
        currentNode = nextNode
        const nextDom = render(nextNode)
        // 保留 NodeView 根节点和已绑定事件的边界按钮，只替换扩展序列化出的嵌入内容。
        const currentContent = Array.from(dom.children)
          .find((element) => !element.classList.contains('aieditor__block-boundary-button'))
        const nextContent = Array.from(nextDom.children)[0]
        if (currentContent && nextContent) currentContent.replaceWith(nextContent)
        return true
      },
      // iframe 会吞掉浏览器事件，边界按钮也有自己的交互，两者均不交给 ProseMirror 处理。
      stopEvent: (event) => event.target instanceof Element
        && Boolean(event.target.closest('iframe, .aieditor__block-boundary-button')),
      destroy: removeBoundaryControls,
    }
  }
}
