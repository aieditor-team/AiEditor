const TEMPLATE_CACHE_LIMIT = 100
const TEMPLATE_CACHE = new WeakMap<Document, Map<string, DocumentFragment>>()

/**
 * 只负责保存和解析模板本身，不读取状态，也不创建 Binding。
 *
 * UITemplate 会先展开已注册组件的自闭合写法，再交给浏览器 template 元素完成
 * 标准 HTML 解析。解析结果按 Document 保存在最多 100 项的 LRU 中，重复视图通过
 * 克隆复用；最终 root 会导入调用方 Document，避免留在 inert Document。
 */
export class UITemplate {
    /** 调用方传入的原始模板，保留首尾空白，便于诊断。 */
    readonly source: string
    /** 浏览器用于解析 HTML 的 template 元素。 */
    readonly template: HTMLTemplateElement
    /** 从 template.content 导入目标 Document 后的唯一根元素。 */
    readonly root: HTMLElement

    constructor(source: string, ownerDocument: Document, componentNames: readonly string[] = []) {
        this.source = source
        this.template = ownerDocument.createElement('template')
        const normalizedSource = source.trim()
        const normalizedComponents = Array.from(new Set(componentNames.map((name) => name.toLowerCase()))).sort()
        const cacheKey = JSON.stringify([normalizedSource, normalizedComponents])
        let cache = TEMPLATE_CACHE.get(ownerDocument)
        if (!cache) {
            cache = new Map()
            TEMPLATE_CACHE.set(ownerDocument, cache)
        }
        const cached = cache.get(cacheKey)
        if (cached) {
            // Map 的删除再写入用于维护最近使用顺序。
            cache.delete(cacheKey)
            cache.set(cacheKey, cached)
            this.template.content.append(cached.cloneNode(true))
        } else {
            this.template.innerHTML = this.expandSelfClosingComponents(normalizedSource, normalizedComponents)
        }
        const roots = Array.from(this.template.content.children)
        if (roots.length !== 1 || this.template.content.childNodes.length !== 1) {
            throw new Error('TinyUI templates must contain exactly one root element.')
        }
        if (!cached) {
            cache.set(cacheKey, this.template.content.cloneNode(true) as DocumentFragment)
            if (cache.size > TEMPLATE_CACHE_LIMIT) {
                const oldest = cache.keys().next().value
                if (oldest !== undefined) cache.delete(oldest)
            }
        }
        // template.content 位于浏览器创建的 inert Document。必须显式 import，才能保证
        // Ref、组件节点和根节点共享 options.document 指定的 ownerDocument。
        this.root = ownerDocument.importNode(roots[0], true) as HTMLElement
    }

    /**
     * 将 <Icon /> 展开为 <Icon></Icon>。
     *
     * HTML 模式不会把普通未知标签的 /> 当作真正闭合，连续组件可能因此错误嵌套。
     * 这里使用引号感知扫描而不是简单正则，避免属性中的 > 或 /> 提前结束标签；
     * 注释以及 script/style/textarea/title 的 raw-text 内容也不会被改写。
     */
    private expandSelfClosingComponents(source: string, componentNames: readonly string[]): string {
        if (componentNames.length === 0) return source
        const registered = new Set(componentNames.map((name) => name.toLowerCase()))
        let output = ''
        let cursor = 0
        let index = 0

        while (index < source.length) {
            if (source.startsWith('<!--', index)) {
                // 注释内出现的 <Component /> 只是文本，不参与组件解析。
                const commentEnd = source.indexOf('-->', index + 4)
                index = commentEnd < 0 ? source.length : commentEnd + 3
                continue
            }
            if (source[index] !== '<' || !/[A-Za-z]/.test(source[index + 1] ?? '')) {
                index += 1
                continue
            }
            const start = index
            index += 1
            const nameStart = index
            while (/[\w.-]/.test(source[index] ?? '')) index += 1
            const name = source.slice(nameStart, index)
            let quote = ''
            while (index < source.length) {
                const character = source[index]
                if (quote) {
                    if (character === quote) quote = ''
                } else if (character === '"' || character === "'") {
                    quote = character
                } else if (character === '>') {
                    const opening = source.slice(start, index)
                    const normalizedName = name.toLowerCase()
                    const selfClosing = /\/\s*$/.test(opening)
                    if (registered.has(normalizedName) && selfClosing) {
                        output += source.slice(cursor, start)
                        output += `${opening.replace(/\/\s*$/, '')}></${name}>`
                        cursor = index + 1
                    } else if (!selfClosing && ['script', 'style', 'textarea', 'title'].includes(normalizedName)) {
                        // raw-text 元素内部由元素自身的结束标签界定，不能继续扫描组件。
                        const closingStart = source.toLowerCase().indexOf(`</${normalizedName}`, index + 1)
                        const closingEnd = closingStart < 0 ? -1 : source.indexOf('>', closingStart)
                        if (closingEnd < 0) {
                            index = source.length
                            break
                        }
                        index = closingEnd
                    }
                    index += 1
                    break
                }
                index += 1
            }
        }
        return output + source.slice(cursor)
    }
}
