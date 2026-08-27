import {marked} from 'marked'
import {ClipboardPaste} from 'lucide'
import {DropdownMenuItem, type MenuContext} from '../../core'
import {applyEditorTheme} from '../../../editor/AiEditorTheme'

/** 用户可选择的剪贴板解释和清理策略。 */
export type PasteMode = 'markdown' | 'word' | 'clean' | 'text'

/** 控制粘贴下拉菜单中暴露哪些模式及其顺序。 */
export interface PasteMenuItemOptions {
  modes?: PasteMode[]
}

interface ClipboardContent {
  html?: string
  text: string
}

const modeLabels: Record<PasteMode, string> = {
  markdown: 'Paste Markdown',
  word: 'Paste from Word',
  clean: 'Paste and clear formatting',
  text: 'Paste as text',
}

const defaultModes: PasteMode[] = ['markdown', 'word', 'clean', 'text']
const unsafeElements = 'script, style, link, meta, iframe, object, embed, form, input, button, textarea, select'
const clearFormattingTags = new Set(['A', 'SPAN', 'STRONG', 'B', 'EM', 'I', 'U'])
const presentationAttributes = new Set(['style', 'class', 'id', 'color', 'face', 'size', 'bgcolor', 'align', 'width', 'height'])

/** 从系统剪贴板读取内容，并按指定模式插入当前选区。 */
export class PasteMenuItem extends DropdownMenuItem {
  constructor(options: PasteMenuItemOptions = {}) {
    const modes = options.modes ?? defaultModes
    super({
      id: 'paste',
      label: 'Paste',
      triggerIcon: ClipboardPaste,
      options: modes.map((mode) => ({label: modeLabels[mode], value: mode})),
      selectionMode: 'none',
      execute: (context, value) => { void pasteClipboardContent(context, value as PasteMode) },
      isEnabled: ({editor}) => editor.isEditable,
    })
  }
}

/** 读取剪贴板并按模式转换；所有 HTML 路径在插入前都会经过安全清理。 */
export async function pasteClipboardContent(context: MenuContext, mode: PasteMode): Promise<boolean> {
  try {
    const clipboard = await readClipboardContent()
    if (!clipboard.html && !clipboard.text) {
      throw new Error('The clipboard is empty.')
    }

    if (mode === 'text') return insertPlainText(context, clipboard.text || htmlToText(clipboard.html ?? ''))
    if (mode === 'markdown') {
      const html = await marked.parse(clipboard.text || htmlToText(clipboard.html ?? ''), {async: false})
      return insertHTML(context, sanitizeHTML(html))
    }
    if (mode === 'word') {
      return clipboard.html
        ? insertHTML(context, cleanWordHTML(clipboard.html))
        : insertPlainText(context, clipboard.text)
    }
    return clipboard.html
      ? insertHTML(context, clearHTMLFormatting(clipboard.html))
      : insertPlainText(context, clipboard.text)
  } catch (error) {
    const fallback = context.i18n.t('Unable to read the clipboard. Allow clipboard access and try again.')
    const knownMessages = new Set(['The clipboard is empty.', 'Clipboard API is not available.'])
    const message = error instanceof Error && knownMessages.has(error.message)
      ? context.i18n.t(error.message)
      : fallback
    showPasteError(message, context)
    return false
  }
}

/** 清理 Word 生成的命名空间节点、mso 属性和无效元数据，同时保留可解析的富文本结构。 */
export function cleanWordHTML(html: string): string {
  const document = parseHTML(html)
  sanitizeDocument(document)
  document.body.querySelectorAll<HTMLElement>('*').forEach((element) => {
    if (element.tagName.includes(':')) {
      unwrap(element)
      return
    }
    element.removeAttribute('class')
    element.removeAttribute('lang')
    element.removeAttribute('dir')
    const style = element.style
    for (const property of [...style]) {
      if (property.startsWith('mso-') || property === 'tab-stops') style.removeProperty(property)
    }
    if (!element.getAttribute('style')?.trim()) element.removeAttribute('style')
    for (const attribute of [...element.attributes]) {
      if (attribute.name.startsWith('xmlns') || attribute.name.startsWith('v:') || attribute.name.startsWith('o:')) {
        element.removeAttribute(attribute.name)
      }
    }
  })
  return document.body.innerHTML
}

/** 移除常见行内修饰和所有表现型属性，保留段落、列表、表格、代码及高亮等语义结构。 */
export function clearHTMLFormatting(html: string): string {
  const document = parseHTML(html)
  sanitizeDocument(document)
  document.body.querySelectorAll<HTMLElement>('*').forEach((element) => {
    for (const attribute of [...element.attributes]) {
      if (presentationAttributes.has(attribute.name.toLowerCase()) || attribute.name.startsWith('on')) {
        element.removeAttribute(attribute.name)
      }
    }
  })
  document.body.querySelectorAll<HTMLElement>('*').forEach((element) => {
    if (clearFormattingTags.has(element.tagName)) unwrap(element)
  })
  return document.body.innerHTML
}

function sanitizeHTML(html: string): string {
  const document = parseHTML(html)
  sanitizeDocument(document)
  return document.body.innerHTML
}

/** 移除主动内容、事件属性和 javascript: URL，保留可安全解析的文档结构。 */
function sanitizeDocument(document: Document): void {
  document.body.querySelectorAll(unsafeElements).forEach((element) => element.remove())
  document.body.querySelectorAll<HTMLElement>('*').forEach((element) => {
    for (const attribute of [...element.attributes]) {
      if (attribute.name.startsWith('on')) element.removeAttribute(attribute.name)
    }
    for (const attribute of ['href', 'src']) {
      const value = element.getAttribute(attribute)?.trim().toLowerCase()
      if (value?.startsWith('javascript:')) element.removeAttribute(attribute)
    }
  })
}

/** 优先读取同时包含 HTML/纯文本的现代 ClipboardItem，缺失时降级到 readText。 */
async function readClipboardContent(): Promise<ClipboardContent> {
  if (navigator.clipboard?.read) {
    const items = await navigator.clipboard.read()
    let html: string | undefined
    let text = ''
    for (const item of items) {
      if (!html && item.types.includes('text/html')) html = await (await item.getType('text/html')).text()
      if (!text && item.types.includes('text/plain')) text = await (await item.getType('text/plain')).text()
    }
    return {html, text}
  }
  if (navigator.clipboard?.readText) return {text: await navigator.clipboard.readText()}
  throw new Error('Clipboard API is not available.')
}

/** 将已净化 HTML 交给 Tiptap 解析并插入当前选区。 */
function insertHTML({editor}: MenuContext, html: string): boolean {
  if (!html.trim()) return false
  return editor.chain().focus().insertContent(html).run()
}

/** 将换行文本显式转换为段落 JSON，防止纯文本被当作 HTML 解释。 */
function insertPlainText({editor}: MenuContext, text: string): boolean {
  if (!text) return false
  const paragraphs = text.replace(/\r\n?/g, '\n').split('\n').map((line) => ({
    type: 'paragraph',
    ...(line ? {content: [{type: 'text', text: line}]} : {}),
  }))
  return editor.chain().focus().insertContent(paragraphs).run()
}

function htmlToText(html: string): string {
  return parseHTML(html).body.textContent ?? ''
}

function parseHTML(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html')
}

/** 移除包装标签但保留其子节点顺序。 */
function unwrap(element: Element): void {
  element.replaceWith(...element.childNodes)
}

/** 以编辑器当前主题显示临时错误提示，并替换页面中已有的粘贴错误。 */
function showPasteError(message: string, {editor}: MenuContext): void {
  document.querySelector('.aieditor__paste-notice')?.remove()
  const notice = document.createElement('div')
  notice.className = 'aieditor__paste-notice'
  notice.setAttribute('role', 'alert')
  notice.textContent = message
  applyEditorTheme(notice, editor)
  document.body.append(notice)
  window.setTimeout(() => notice.remove(), 4000)
}
