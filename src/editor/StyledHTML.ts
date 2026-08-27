const NON_STATIC_STYLE_PROPERTIES = [
    'animation',
    'caret-',
    'cursor',
    'pointer-events',
    'resize',
    'scroll-behavior',
    'touch-action',
    'transition',
    'user-select',
    'will-change',
]

const INHERITED_STYLE_PROPERTIES = [
    'border-collapse',
    'border-spacing',
    'color',
    'color-scheme',
    'direction',
    'font-family',
    'font-feature-settings',
    'font-kerning',
    'font-optical-sizing',
    'font-size',
    'font-stretch',
    'font-style',
    'font-variant',
    'font-weight',
    'letter-spacing',
    'line-height',
    'list-style',
    'overflow-wrap',
    'tab-size',
    'text-align',
    'text-decoration-color',
    'text-indent',
    'text-rendering',
    'text-transform',
    'visibility',
    'white-space',
    'word-break',
    'word-spacing',
    'writing-mode',
]

/** 排除动画、交互状态和 CSS 变量，只保留导出后仍有意义的静态外观属性。 */
function isStaticStyleProperty(property: string): boolean {
    return !property.startsWith('--')
        && !NON_STATIC_STYLE_PROPERTIES.some((ignored) => property === ignored || property.startsWith(ignored))
}

/** 按 DOM 顺序返回根节点及全部后代，供样式副本进行一一比对。 */
function elementsIn(root: HTMLElement): HTMLElement[] {
    return [root, ...root.querySelectorAll<HTMLElement>('*')]
}

/** 清除基准副本中的内联样式，使其只保留浏览器的初始样式。 */
function clearInlineStyles(root: HTMLElement): void {
    for (const element of elementsIn(root)) element.removeAttribute('style')
}

/** 按节点出现顺序复制运行时生成的内容，适用于两棵结构一致的 DOM 树。 */
function copyInnerHTMLByIndex(targetRoot: HTMLElement, sourceRoot: HTMLElement, targetSelector: string, sourceSelector = targetSelector): void {
    const targets = targetRoot.querySelectorAll<HTMLElement>(targetSelector)
    const sources = sourceRoot.querySelectorAll<HTMLElement>(sourceSelector)
    targets.forEach((target, index) => {
        const source = sources[index]
        if (source) target.innerHTML = source.innerHTML
    })
}

/** 补回 Tiptap NodeView/装饰器生成、但 editor.getHTML() 不会序列化的静态展示结构。 */
function hydrateRenderedContent(targetRoot: HTMLElement, sourceRoot: HTMLElement): void {
    copyInnerHTMLByIndex(targetRoot, sourceRoot, 'pre > code')
    copyInnerHTMLByIndex(targetRoot, sourceRoot, '[data-type="block-math"]')
    copyInnerHTMLByIndex(targetRoot, sourceRoot, '[data-type="inline-math"]')
    copyInnerHTMLByIndex(targetRoot, sourceRoot, 'a[data-type="attachment"]', 'a.aieditor__attachment')

    targetRoot.querySelectorAll<HTMLElement>('[data-type="block-math"], [data-type="inline-math"]').forEach((element) => {
        element.classList.add('tiptap-mathematics-render')
    })
    targetRoot.querySelectorAll<HTMLElement>('a[data-type="attachment"]').forEach((element) => {
        element.classList.add('aieditor__attachment')
    })
    targetRoot.querySelectorAll<HTMLElement>('.aieditor__selection').forEach((selection) => {
        selection.replaceWith(...selection.childNodes)
    })
}

/** 让无样式基准树与真实内容使用相同盒模型，避免宽度差异影响换行和计算值。 */
function copyLayoutContext(source: HTMLElement, target: HTMLElement): void {
    const style = getComputedStyle(source)
    target.style.boxSizing = style.boxSizing
    target.style.width = style.width
    target.style.padding = style.padding
    target.style.border = style.border
}

/** 递归收集当前元素命中的样式规则属性，并遵循 media/supports 条件。 */
function collectRuleProperties(element: HTMLElement, rules: CSSRuleList, properties: Set<string>): void {
    for (let index = 0; index < rules.length; index += 1) {
        const rule = rules[index]
        if (rule instanceof CSSStyleRule) {
            try {
                if (!element.matches(rule.selectorText)) continue
            } catch {
                continue
            }
            for (let propertyIndex = 0; propertyIndex < rule.style.length; propertyIndex += 1) {
                properties.add(rule.style.item(propertyIndex))
            }
            continue
        }

        if (rule instanceof CSSMediaRule && !window.matchMedia(rule.conditionText).matches) continue
        if (rule instanceof CSSSupportsRule && !CSS.supports(rule.conditionText)) continue
        if ('cssRules' in rule) {
            const group = rule as CSSRule & {readonly cssRules: CSSRuleList}
            collectRuleProperties(element, group.cssRules, properties)
        }
    }
}

/** 收集值得比较的候选属性，避免遍历 computedStyle 中数百个无关默认值。 */
function declaredStyleProperties(element: HTMLElement): Set<string> {
    const properties = new Set(INHERITED_STYLE_PROPERTIES)
    for (let index = 0; index < element.style.length; index += 1) {
        properties.add(element.style.item(index))
    }
    for (const sheet of document.styleSheets) {
        try {
            collectRuleProperties(element, sheet.cssRules, properties)
        } catch {
            // 跨域样式表无法读取 CSSRule，但继承属性和节点原有内联样式仍可正常导出。
        }
    }
    return properties
}

/**
 * 将真实编辑器与浏览器初始样式的差异写回内联 style。
 * 两棵树必须结构一致，elementsIn 返回的相同下标才代表同一个语义节点。
 */
function inlineStyleDifferences(styledRoot: HTMLElement, baselineRoot: HTMLElement): void {
    const styledElements = elementsIn(styledRoot)
    const baselineElements = elementsIn(baselineRoot)

    for (let elementIndex = 0; elementIndex < styledElements.length; elementIndex += 1) {
        const element = styledElements[elementIndex]
        const baseline = baselineElements[elementIndex]
        if (!element || !baseline) continue

        const computed = getComputedStyle(element)
        const defaultComputed = getComputedStyle(baseline)
        const declarations: Array<[string, string]> = []

        for (const property of declaredStyleProperties(element)) {
            if (!property || !isStaticStyleProperty(property)) continue

            const value = computed.getPropertyValue(property)
            if (value !== defaultComputed.getPropertyValue(property)) declarations.push([property, value])
        }

        // 写入 style 会改变后续的 computedStyle，因此先完成当前节点的差异收集。
        element.removeAttribute('style')
        for (const [property, value] of declarations) element.style.setProperty(property, value)
    }
}

/** 把 getComputedStyle 返回的 CSS content 字符串转换为可插入 DOM 的文本。 */
function unquoteCssContent(value: string): string | undefined {
    if (value === 'none' || value === 'normal') return undefined
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        return value.slice(1, -1)
    }
    return value
}

/** 将无法内联的详情箭头伪元素转换为真实文本。 */
function materializeDetailsMarkers(root: HTMLElement): void {
    root.querySelectorAll<HTMLElement>('div[data-type="details"] > button').forEach((button) => {
        const markerStyle = getComputedStyle(button, '::before')
        const marker = unquoteCssContent(markerStyle.content)
        if (!marker) return

        button.textContent = marker
        button.style.color = markerStyle.color
        button.style.fontFamily = markerStyle.fontFamily
        button.style.fontSize = markerStyle.fontSize
        button.style.fontWeight = markerStyle.fontWeight
        button.style.lineHeight = markerStyle.lineHeight
        if (markerStyle.transform !== 'none') button.style.transform = markerStyle.transform
    })
}

/** 在当前浏览器中计算编辑器内容的最终样式，并返回可独立展示的 HTML 片段。 */
export function createStyledHTML(html: string, editorRoot: HTMLElement, editorContent: HTMLElement): string {
    const width = editorContent.getBoundingClientRect().width || editorContent.clientWidth || 800
    const host = document.createElement('div')
    host.className = 'aieditor'
    host.dataset.theme = editorRoot.dataset.theme ?? 'light'
    host.dataset.editable = 'false'
    host.style.cssText = `position:fixed;left:-100000px;top:0;width:${width}px;visibility:hidden;`
    copyDocumentStyle(editorRoot, host)

    const styledContent = document.createElement('div')
    styledContent.className = 'aieditor__prose'
    styledContent.innerHTML = html
    hydrateRenderedContent(styledContent, editorContent)
    host.append(styledContent)

    const baselineHost = document.createElement('div')
    baselineHost.style.cssText = `all:initial;position:fixed;left:-100000px;top:0;width:${width}px;visibility:hidden;`
    // Shadow DOM 隔离应用样式表，构造仅受浏览器初始样式影响的对照树。
    const shadow = baselineHost.attachShadow({mode: 'open'})
    const baselineContent = styledContent.cloneNode(true) as HTMLElement
    clearInlineStyles(baselineContent)
    shadow.append(baselineContent)

    // 元素必须进入文档后 getComputedStyle 才能获得可靠的最终值；移到视口外防止闪烁。
    document.body.append(host, baselineHost)
    try {
        copyLayoutContext(styledContent, baselineContent)
        inlineStyleDifferences(styledContent, baselineContent)
        materializeDetailsMarkers(styledContent)
        return styledContent.innerHTML
    } finally {
        // 即使样式表访问或样式计算异常，也不能在页面中遗留离屏测量节点。
        host.remove()
        baselineHost.remove()
    }
}
import {copyDocumentStyle} from './AiEditorDocumentStyle'
