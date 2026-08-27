import {
    MenuItem,
    SeparatorMenuItem,
    type MenuItemButtonConfig,
    type MenuItemConfig,
    type MenuItemGroupConfig,
} from './core'
import {DeclarativeButtonMenuItem} from './DeclarativeButtonMenuItem'
import {ToolbarMenuGroupItem} from './core/ToolbarMenuGroupItem'

type MenuObjectConfig = MenuItemButtonConfig | MenuItemGroupConfig

function invalidConfig(message: string): never {
    throw new Error(`Invalid declarative menu config: ${message}`)
}

function assertKey(value: unknown): asserts value is string {
    if (typeof value !== 'string' || !value.trim()) invalidConfig('"key" must be a non-empty string')
}

function resolveObjectConfig(entry: unknown): MenuObjectConfig {
    if (!entry || typeof entry !== 'object') {
        return invalidConfig('expected type "button" or a group with an "items" array')
    }

    const config = entry as Record<string, unknown>
    if (config.type === 'button') {
        assertKey(config.key)
        if (typeof config.label !== 'string' || !config.label.trim()) {
            invalidConfig('button "label" must be a non-empty string')
        }
        if (config.tip !== undefined && typeof config.tip !== 'string') {
            invalidConfig('button "tip" must be a string')
        }
        if (config.text !== undefined && typeof config.text !== 'string') {
            invalidConfig('button "text" must be a string')
        }
        if (config.icon !== undefined && !Array.isArray(config.icon)) {
            invalidConfig('button "icon" must be a Lucide IconNode, not an SVG or HTML string')
        }
        if (typeof config.onClick !== 'function') invalidConfig('button "onClick" must be a function')
        if (config.isActive !== undefined && typeof config.isActive !== 'function') {
            invalidConfig('button "isActive" must be a function')
        }
        if (config.isEnabled !== undefined && typeof config.isEnabled !== 'function') {
            invalidConfig('button "isEnabled" must be a function')
        }
        return entry as MenuItemButtonConfig
    }

    if (config.type !== undefined && config.type !== 'group') {
        return invalidConfig(`unsupported type "${String(config.type)}"`)
    }

    if (config.type === 'group' || 'items' in config) {
        assertKey(config.key)
        if (config.label !== undefined && (typeof config.label !== 'string' || !config.label.trim())) {
            invalidConfig('group "label" must be a non-empty string')
        }
        if (config.icon !== undefined && !Array.isArray(config.icon)) {
            invalidConfig('group "icon" must be a Lucide IconNode, not an SVG or HTML string')
        }
        if (!Array.isArray(config.items)) invalidConfig('group "items" must be an array')
        return entry as MenuItemGroupConfig
    }

    return invalidConfig('expected type "button" or a group with an "items" array')
}

function collectReservedIds(entries: readonly MenuItemConfig[], ids: Set<string>): void {
    entries.forEach((entry) => {
        if (typeof entry === 'string') return
        if (entry instanceof MenuItem) {
            ids.add(entry.id)
            return
        }
        const config = resolveObjectConfig(entry)
        ids.add(config.key)
        if (config.type !== 'button') collectReservedIds(config.items, ids)
    })
}

/** 将默认 Key、分隔符、声明式对象和菜单实例解析为任意 MenuBar 可挂载的项目。 */
export function resolveMenuItems(
    entries: readonly MenuItemConfig[],
    defaults: readonly MenuItem[],
    options: {warnUnknown?: boolean} = {},
): MenuItem[] {
    const defaultsById = new Map(defaults.map((item) => [item.id, item]))
    const reservedIds = new Set(defaultsById.keys())
    collectReservedIds(entries, reservedIds)
    const selectedIds = new Set<string>()
    let separatorIndex = 0

    const claimId = (id: string): void => {
        if (selectedIds.has(id)) throw new Error(`Duplicate menu key or id: "${id}"`)
        selectedIds.add(id)
    }

    const resolve = (configs: readonly MenuItemConfig[]): MenuItem[] => configs.flatMap((entry) => {
        if (typeof entry !== 'string') {
            if (entry instanceof MenuItem) {
                claimId(entry.id)
                return [entry]
            }

            const config = resolveObjectConfig(entry)
            claimId(config.key)
            if (config.type === 'button') return [new DeclarativeButtonMenuItem(config)]

            return [new ToolbarMenuGroupItem({
                id: config.key,
                label: config.label ?? config.key,
                icon: config.icon,
                items: resolve(config.items),
            })]
        }

        if (entry === '|') {
            let id: string
            do {
                id = `separator-custom-${separatorIndex++}`
            } while (reservedIds.has(id) || selectedIds.has(id))
            claimId(id)
            return [new SeparatorMenuItem(id)]
        }

        const item = defaultsById.get(entry)
        if (item) {
            claimId(item.id)
            return [item]
        }

        if (options.warnUnknown !== false) console.warn(`[AiEditor] Unknown menu key: ${entry}`)
        return []
    })

    return resolve(entries)
}
