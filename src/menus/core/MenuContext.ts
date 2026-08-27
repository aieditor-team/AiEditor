import type { Editor } from '@tiptap/core'
import type {AiEditorI18n} from '../../i18n'

/** 菜单项执行和状态更新时共享的编辑器上下文。 */
export interface MenuContext {
  /** 当前菜单所属的 Tiptap 编辑器实例。 */
  editor: Editor
  /** 当前编辑器实例的翻译器。 */
  i18n: AiEditorI18n
}
