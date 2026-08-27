import {createElement} from 'lucide'
import type {UIContext} from '../core/UIContext'
import type {TinyUIComponent} from './UIComponent'

/** Lucide 原生图标节点定义；通过函数参数推导，避免依赖 Lucide 未公开的内部类型。 */
export type LucideIconNode = Parameters<typeof createElement>[0]

type LucideSvgAttribute = string | number | undefined

/**
 * TinyUI 的通用 Lucide 图标组件。
 *
 * 调用方传入按需导入的图标定义，可保持打包器 tree-shaking。组件默认把图标视为
 * 装饰内容；传入 `aria-label` 后则自动改为可被辅助技术识别的 img。
 */
export const LucideIcon: TinyUIComponent<UIContext> = (props, context) => {
    if (!Array.isArray(props.icon)) {
        throw new TypeError('LucideIcon requires a valid icon property.')
    }

    const attributes: Record<string, LucideSvgAttribute> = {
        'aria-hidden': 'true',
        focusable: 'false',
    }
    const size = toSvgAttribute(props.size)
    if (size !== undefined) {
        attributes.width = size
        attributes.height = size
    }
    copyAttribute(props, attributes, 'class')
    copyAttribute(props, attributes, 'stroke')
    copyAttribute(props, attributes, 'stroke-width')
    copyAttribute(props, attributes, 'aria-hidden')
    copyAttribute(props, attributes, 'focusable')
    copyAttribute(props, attributes, 'role')

    const label = toSvgAttribute(props['aria-label'])
    if (label !== undefined) {
        attributes['aria-label'] = label
        // 有可访问名称时不能同时从无障碍树隐藏；调用方仍可显式覆盖 role。
        delete attributes['aria-hidden']
        attributes.role ??= 'img'
    }

    const icon = createElement(props.icon as LucideIconNode, attributes)
    // lucide/createElement 使用全局 document；独立文档或 iframe 中需迁移到视图所属文档。
    return icon.ownerDocument === context.document
        ? icon
        : context.document.importNode(icon, true)
}

function copyAttribute(
    props: Record<string, unknown>,
    attributes: Record<string, LucideSvgAttribute>,
    name: string,
): void {
    const value = toSvgAttribute(props[name])
    if (value !== undefined) attributes[name] = value
}

/** 只把 SVG 能稳定表示的原始值转发给 Lucide，忽略对象和函数等错误输入。 */
function toSvgAttribute(value: unknown): LucideSvgAttribute {
    return typeof value === 'string' || typeof value === 'number' ? value : undefined
}
