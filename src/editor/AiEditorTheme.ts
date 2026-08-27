import type {Editor} from '@tiptap/core'

/** 编辑器内置的明暗主题标识。 */
export type AiEditorTheme = 'light' | 'dark'

let editorThemeSequence = 0
// WeakMap 不阻止已销毁 Editor 被回收，也无需由调用方显式清理主题注册表。
const editorThemes = new WeakMap<Editor, AiEditorTheme>()
const editorThemeOwners = new WeakMap<Editor, string>()

/** 注册编辑器根节点，并为该实例生成隔离 Portal/Surface 的归属标识。 */
export function registerEditorTheme(editor: Editor, root: HTMLElement, theme: AiEditorTheme): void {
  const owner = `aieditor-${++editorThemeSequence}`
  editorThemeOwners.set(editor, owner)
  editorThemes.set(editor, theme)
  applyEditorTheme(root, editor)
}

/** 给编辑器所属的 Portal 或 Surface 标记实例归属和当前主题。 */
export function applyEditorTheme(element: HTMLElement, editor: Editor): void {
  const owner = editorThemeOwners.get(editor)
  if (owner) element.dataset.aieditorOwner = owner
  element.dataset.theme = getEditorTheme(editor)
}

/** 更新编辑器主题，并同步到该实例所有可能挂载在 body 下的浮层。 */
export function setEditorTheme(editor: Editor, theme: AiEditorTheme): void {
  editorThemes.set(editor, theme)
  const owner = editorThemeOwners.get(editor)
  if (!owner) return
  const ownerDocument = editor.view.dom.ownerDocument
  ownerDocument.querySelectorAll<HTMLElement>(`[data-aieditor-owner="${owner}"]`).forEach((element) => {
    element.dataset.theme = theme
  })
}

/** 获取当前主题；尚未注册的编辑器按亮色主题处理。 */
export function getEditorTheme(editor: Editor): AiEditorTheme {
  return editorThemes.get(editor) ?? 'light'
}

/** 在配置入口校验字符串，同时为后续 TypeScript 代码收窄类型。 */
export function assertAiEditorTheme(theme: string): asserts theme is AiEditorTheme {
  if (theme !== 'light' && theme !== 'dark') {
    throw new Error(`Unsupported AiEditorTheme: "${theme}"`)
  }
}
