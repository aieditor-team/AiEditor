import {
    Mathematics as TMathematics,
    type MathematicsOptions as TMathematicsOptions
} from '@tiptap/extension-mathematics'
import {BlockMath} from './BlockMath'
import {InlineMath} from './InlineMath'
import type {MathDelimiters, MathRenderTextMode} from './MathOptions'

export type MathematicsOptions = TMathematicsOptions & {
    /** 公式输入规则支持的定界符模式。 */
    delimiters?: MathDelimiters
    /** editor.getText() 返回的公式文本形式。 */
  renderTextMode?: MathRenderTextMode
  translate?: (value: string) => string
}
/**
 * 数学公式组合扩展。
 * 统一把 KaTeX 配置同时传给块级和行内公式，避免两种节点渲染结果不一致。
 */
export const Mathematics = TMathematics.extend<MathematicsOptions>({
    addExtensions() {
        // 保留两类公式各自的节点选项，再叠加共享的 KaTeX 渲染参数。
        return [
            BlockMath.configure({
                ...this.options.blockOptions,
                delimiters: this.options.delimiters,
                renderTextMode: this.options.renderTextMode,
                translate: this.options.translate,
                katexOptions: this.options.katexOptions
            }),
            InlineMath.configure({
                ...this.options.inlineOptions,
                delimiters: this.options.delimiters,
                renderTextMode: this.options.renderTextMode,
                translate: this.options.translate,
                katexOptions: this.options.katexOptions
            }),
        ]
    },
})
