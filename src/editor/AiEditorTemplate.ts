import type {AiEditorLocale} from '../i18n'

/** 创建自定义编辑器模板时可用的实例上下文。 */
export interface AiEditorTemplateContext {
    /** 使用挂载目标所属的 Document，兼容 iframe 等独立文档环境。 */
    document: Document
    locale: AiEditorLocale
    t: (value: string) => string
}

/**
 * 自定义模板向 AiEditor 声明的功能区域。
 * root 必须包含 toolbar、content 以及所有可选区域。
 */
export interface AiEditorTemplateSlots {
    root: HTMLElement
    toolbar: HTMLElement
    content: HTMLElement
    /** Optional right-side product area. */
    sidebar?: HTMLElement
    footer?: HTMLElement
    count?: HTMLElement
    /** 释放模板内部自行注册的资源；AiEditor 的资源会先被释放。 */
    destroy?: () => void
}

/**
 * 每个 AiEditor 实例调用一次，必须返回一组全新的模板区域。
 * 工厂可自由排列各区域或插入宿主自定义节点，但不能跨编辑器复用同一批 DOM 元素。
 */
export type AiEditorTemplateFactory = (context: AiEditorTemplateContext) => AiEditorTemplateSlots
