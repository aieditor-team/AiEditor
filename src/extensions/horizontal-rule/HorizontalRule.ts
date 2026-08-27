import {mergeAttributes, type JSONContent} from '@tiptap/core'
import {
    HorizontalRule as THorizontalRule,
    type HorizontalRuleOptions as THorizontalRuleOptions,
} from '@tiptap/extension-horizontal-rule'

export const horizontalRuleStyles = [
    'solid',
    'dotted',
    'dashed',
    'long-dashed',
    'dash-dot',
    'dash-dot-dot',
    'double',
    'triple',
    'thin-thick',
    'thick-thin',
    'wavy',
    'double-wavy',
    'shadow',
] as const

/** 分隔线支持的持久化线型，由预设列表自动推导，避免类型与运行时校验脱节。 */
export type HorizontalRuleStyle = typeof horizontalRuleStyles[number]

/** 单个分隔线节点可覆盖的视觉属性。 */
export interface HorizontalRuleAttributes {
    lineStyle?: HorizontalRuleStyle
    color?: string
    thickness?: number
}

export type HorizontalRuleOptions = THorizontalRuleOptions

export const defaultHorizontalRuleAttributes: Required<HorizontalRuleAttributes> = {
    lineStyle: 'solid',
    color: '',
    thickness: 1,
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        horizontalRuleStyle: {
            /** 插入带样式的分隔线；选中分隔线时改为更新当前节点。 */
            setHorizontalRuleStyle: (attributes?: HorizontalRuleAttributes) => ReturnType
            /** 仅更新当前选中的分隔线。 */
            updateHorizontalRuleStyle: (attributes: HorizontalRuleAttributes) => ReturnType
        }
    }
}

/** 将外部 HTML 中未知的线型降级为默认实线。 */
function normalizeStyle(value: unknown): HorizontalRuleStyle {
    return horizontalRuleStyles.includes(value as HorizontalRuleStyle)
        ? value as HorizontalRuleStyle
        : defaultHorizontalRuleAttributes.lineStyle
}

/** 把粗细限制在可读范围内，并过滤 NaN、Infinity 等异常输入。 */
function normalizeThickness(value: unknown): number {
    const number = Number(value)
    return Number.isFinite(number) ? Math.min(6, Math.max(.25, number)) : 1
}

/** 支持线型、颜色和粗细持久化的 Tiptap 分隔线。 */
export const HorizontalRule = THorizontalRule.extend<HorizontalRuleOptions>({
    addAttributes() {
        return {
            lineStyle: {
                default: defaultHorizontalRuleAttributes.lineStyle,
                parseHTML: (element) => normalizeStyle(element.getAttribute('data-divider-style')),
                renderHTML: () => ({}),
            },
            color: {
                default: defaultHorizontalRuleAttributes.color,
                parseHTML: (element) => element.getAttribute('data-divider-color') ?? '',
                renderHTML: () => ({}),
            },
            thickness: {
                default: defaultHorizontalRuleAttributes.thickness,
                parseHTML: (element) => normalizeThickness(element.getAttribute('data-divider-thickness')),
                renderHTML: () => ({}),
            },
        }
    },

    renderHTML({node, HTMLAttributes}) {
        const attributes: Required<HorizontalRuleAttributes> = {
            lineStyle: normalizeStyle(node.attrs.lineStyle),
            color: typeof node.attrs.color === 'string' ? node.attrs.color : '',
            thickness: normalizeThickness(node.attrs.thickness),
        }
        // 空颜色使用主题变量，但 data 属性仍保留为空，便于重新进入编辑器时识别“跟随主题”。
        const color = attributes.color || 'var(--aieditor-line, currentColor)'
        return ['hr', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
            'data-divider-style': attributes.lineStyle,
            'data-divider-color': attributes.color || null,
            'data-divider-thickness': attributes.thickness,
            style: `--aieditor-divider-color: ${color}; --aieditor-divider-thickness: ${attributes.thickness}pt`,
        })]
    },

    addCommands() {
        return {
            ...this.parent?.(),
            setHorizontalRuleStyle: (attributes = {}) => ({commands, editor}) => {
                const next = {...defaultHorizontalRuleAttributes, ...attributes}
                // 同一入口同时承担插入和编辑，工具栏无需区分当前是否为 NodeSelection。
                return editor.isActive(this.name)
                    ? commands.updateAttributes(this.name, next)
                    : commands.insertContent({type: this.name, attrs: next} as JSONContent)
            },
            updateHorizontalRuleStyle: (attributes) => ({commands, editor}) => editor.isActive(this.name)
                && commands.updateAttributes(this.name, attributes),
        }
    },
})
