import {resolveTinyUIOptions, type TinyUIOptions, type UIContext} from './UIContext'
import {UIRuntime} from './UIRuntime'
import {UIView} from './UIView'
import {UITemplate} from '../template/UITemplate'
import {UITemplateParser} from '../template/UITemplateParser'

/** TinyUI 的门面类，负责把模板、上下文和组件注册表组装成 UIView。 */
export class TinyUI {
    /**
     * 编译一段可信的开发者模板并返回尚未挂载的 UIView。
     *
     * 模板必须只有一个普通 HTML 根元素；根元素本身不能使用 if、each，也不能
     * 是注册组件。文本插值和普通属性不会作为 HTML 再次解析；DOM Property 则遵循
     * 浏览器原生语义，因此不应把不可信内容写入 innerHTML、outerHTML 等属性。
     */
    static html<State extends UIContext = UIContext>(
        source: string,
        context: State = {} as State,
        options: TinyUIOptions<State> = {},
    ): UIView<State> {
        const resolvedOptions = resolveTinyUIOptions(context, options)
        const ownerDocument = resolvedOptions.document ?? globalThis.document
        if (!ownerDocument) throw new Error('TinyUI requires a Document. Pass one through options.document.')

        const componentNames = Object.keys(resolvedOptions.components ?? {})
        const template = new UITemplate(source, ownerDocument, componentNames)
        const rootName = template.root.localName.toLowerCase()
        if (template.root.hasAttribute('if') || template.root.hasAttribute('each')
            || componentNames.some((name) => name.toLowerCase() === rootName)) {
            throw new Error('TinyUI root elements cannot use if, each, or a registered component.')
        }

        const runtime = new UIRuntime(context, {}, {}, resolvedOptions)
        try {
            new UITemplateParser<State>().parse(template, runtime)
        } catch (error) {
            // parse 过程中前面的节点可能已经注册事件、组件或 Ref，失败时必须释放。
            runtime.destroy()
            throw error
        }
        return new UIView(template.root, context, runtime)
    }
}

/** TinyUI.html 的函数式别名。 */
export const html = TinyUI.html
