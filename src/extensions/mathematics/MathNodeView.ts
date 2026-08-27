import katex from 'katex'
import type {Editor} from '@tiptap/core'
import type {Node as PMNode} from '@tiptap/pm/model'

interface MathNodeViewOptions {
    node: PMNode
    editor: Editor
    getPos: () => number | undefined
    block: boolean
    katexOptions?: Parameters<typeof katex.render>[2]
    translate?: (value: string) => string
}

/** 行内公式和块级公式共用的可编辑 NodeView。 */
export function createMathNodeView({node, editor, getPos, block, katexOptions, translate = (value) => value}: MathNodeViewOptions) {
    const dom = document.createElement(block ? 'div' : 'span')
    const target = document.createElement(block ? 'div' : 'span')
    dom.className = `tiptap-mathematics-render ${block ? 'block-math' : 'inline-math'}`
    dom.dataset.type = block ? 'block-math' : 'inline-math'
    dom.dataset.latex = String(node.attrs.latex ?? '')
    dom.append(target)
    let latex = String(node.attrs.latex ?? '')
    let popover: HTMLDivElement | null = null
    let removeOutside: (() => void) | undefined

    const render = (value = latex, displayMode = block) => {
        try {
            katex.render(value, target, {...katexOptions, displayMode, throwOnError: false})
        } catch {
            target.textContent = value
        }
    }
    const close = (apply: boolean) => {
        if (!popover) return
        const input = popover.querySelector('textarea') as HTMLTextAreaElement
        const checkbox = popover.querySelector('input') as HTMLInputElement
        if (apply && input.value.trim()) updateFormula(editor, getPos(), node, input.value.trim(), checkbox.checked)
        removeOutside?.()
        removeOutside = undefined
        popover.remove()
        popover = null
        render()
    }
    const open = () => {
        if (!editor.isEditable || popover) return
        popover = document.createElement('div')
        popover.className = 'aieditor__math-editor aieditor__dialog-form'
        popover.setAttribute('role', 'dialog')
        popover.setAttribute('aria-label', translate('Edit formula'))
        const label = document.createElement('label')
        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.checked = block
        label.className = 'aieditor__dialog-label aieditor__math-editor-toggle'
        label.append(checkbox, document.createTextNode(` ${translate('Display as block formula')}`))
        const input = document.createElement('textarea')
        input.rows = 5
        input.className = 'aieditor__math-input'
        input.spellcheck = false
        input.value = latex
        const hint = document.createElement('div')
        hint.className = 'aieditor__math-editor-hint'
        hint.textContent = translate('Enter LaTeX formula')
        const actions = document.createElement('div')
        actions.className = 'aieditor__dialog-actions aieditor__math-editor-actions'
        const cancel = document.createElement('button')
        cancel.type = 'button'
        cancel.className = 'aieditor__button aieditor__button--quiet'
        cancel.textContent = translate('Cancel')
        const apply = document.createElement('button')
        apply.type = 'button'
        apply.className = 'aieditor__button aieditor__button--primary'
        apply.textContent = translate('Apply')
        actions.append(cancel, apply)
        popover.append(label, input, hint, actions)
        const host = editor.view.dom.closest<HTMLElement>('.aieditor') ?? document.body
        host.append(popover)
        const rect = dom.getBoundingClientRect()
        popover.style.position = 'fixed'
        popover.style.left = `${Math.max(8, rect.left)}px`
        popover.style.top = `${Math.max(8, rect.bottom + 8)}px`
        input.addEventListener('input', () => render(input.value, checkbox.checked))
        checkbox.addEventListener('change', () => render(input.value, checkbox.checked))
        cancel.addEventListener('click', () => close(false))
        apply.addEventListener('click', () => close(true))
        const onOutside = (event: PointerEvent) => {
            if (!popover?.contains(event.target as Node) && event.target !== dom) close(true)
        }
        document.addEventListener('pointerdown', onOutside)
        removeOutside = () => document.removeEventListener('pointerdown', onOutside)
        input.focus()
        input.select()
    }
    dom.addEventListener('click', (event) => {
        event.preventDefault()
        open()
    })
    render()
    return {
        dom, destroy: () => {
            removeOutside?.();
            popover?.remove()
        }
    }
}

function updateFormula(editor: Editor, pos: number | undefined, node: PMNode, latex: string, asBlock: boolean): void {
    if (pos == null) return
    const currentBlock = node.type.name === 'blockMath'
    if (currentBlock === asBlock) {
        editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, node.type, {...node.attrs, latex}))
        return
    }
    const targetType = editor.schema.nodes[asBlock ? 'blockMath' : 'inlineMath']
    if (!targetType) return
    const replacement = targetType.create({...node.attrs, latex})
    const resolved = editor.state.doc.resolve(pos)
    if (asBlock && resolved.parent.isTextblock && resolved.depth > 0) {
        const before = resolved.parent.content.cut(0, resolved.parentOffset)
        const after = resolved.parent.content.cut(resolved.parentOffset + node.nodeSize)
        const content: PMNode[] = []
        if (before.size) content.push(resolved.parent.copy(before))
        content.push(replacement)
        if (after.size) content.push(resolved.parent.copy(after))
        editor.view.dispatch(editor.state.tr.replaceWith(resolved.before(), resolved.after(), content))
        return
    }
    if (!asBlock) {
        const paragraph = editor.schema.nodes.paragraph
        if (!paragraph) return
        editor.view.dispatch(editor.state.tr.replaceWith(pos, pos + node.nodeSize, paragraph.create(null, replacement)))
        return
    }
    editor.view.dispatch(editor.state.tr.replaceWith(pos, pos + node.nodeSize, replacement))
}
