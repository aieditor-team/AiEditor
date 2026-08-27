import type {IconNode} from 'lucide'
import type {MenuItem} from './MenuItem'
import type {MenuContext} from './MenuContext'

/** 当前菜单 Surface 默认项目的 id；"|" 是创建分隔线的快捷写法。 */
export type MenuItemKey = string

/** 声明式按钮点击时可用的编辑器和原生事件上下文。 */
export interface MenuItemClickContext extends MenuContext {
    event: MouseEvent
}

/** 无需继承 MenuItem 即可声明的工具栏按钮。 */
export interface MenuItemButtonConfig {
    type: 'button'
    /** 菜单项的唯一标识，解析后作为 MenuItem id。 */
    key: string
    /** 无障碍名称；未配置 tip 时也作为鼠标提示。 */
    label: string
    /** 鼠标悬停和键盘聚焦时显示的提示。 */
    tip?: string
    /** Lucide IconNode；未配置时显示 text 或 label。 */
    icon?: IconNode
    text?: string
    onClick: (context: MenuItemClickContext) => void
    isActive?: (context: MenuContext) => boolean
    isEnabled?: (context: MenuContext) => boolean
}

/** 内联下拉菜单组；items 可继续嵌套字符串、菜单实例或子菜单组。 */
export interface MenuItemGroupConfig {
    type?: 'group'
    /** 菜单组的唯一标识，解析后作为 MenuItem id。 */
    key: string
    /** 菜单组入口文字；未配置时使用 key。 */
    label?: string
    icon?: IconNode
    items: readonly MenuItemConfig[]
}

/** 菜单可通过默认菜单 id、实例、声明式按钮或内联菜单组配置。 */
export type MenuItemConfig = MenuItemKey | MenuItem | MenuItemButtonConfig | MenuItemGroupConfig
