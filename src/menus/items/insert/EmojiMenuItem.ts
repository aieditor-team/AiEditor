import {autoUpdate, computePosition, flip, offset, shift} from '@floating-ui/dom'
import {emojis as tiptapEmojis} from '@tiptap/extension-emoji'
import {ChevronDown, createElement, Smile} from 'lucide'
import {clampFloatingPosition, MenuItem, resolveMenuFloatingOffset, resolveMenuFloatingPlacement, type MenuContext} from '../../core'

let emojiPickerSequence = 0

export interface EmojiPickerOption {
    emoji: string
    label: string
    shortcode: string
}

export interface EmojiPickerCategory {
    id: string
    label: string
    icon: string
    emojis: EmojiPickerOption[]
}

export interface EmojiMenuItemOptions {
    categories?: EmojiPickerCategory[]
}

const defaultEmojiCategoryDefinitions = [
    {
        id: 'faces', label: 'Smileys', icon: '😀', shortcodes: [
            'grinning', 'smiley', 'smile', 'grin', 'laughing', 'sweat_smile', 'rofl', 'joy',
            'slightly_smiling_face', 'upside_down_face', 'wink', 'blush', 'innocent', 'smiling_face_with_3_hearts', 'heart_eyes', 'star_struck',
            'kissing_heart', 'yum', 'stuck_out_tongue_winking_eye', 'zany_face', 'hugging_face', 'thinking', 'saluting_face', 'neutral_face',
            'expressionless', 'rolling_eyes', 'smirk', 'relieved', 'cry', 'sob', 'angry', 'sunglasses_cool',
        ],
    },
    {
        id: 'gestures', label: 'Gestures', icon: '👋', shortcodes: [
            'wave', 'raised_back_of_hand', 'hand', 'vulcan', 'ok_hand', 'pinched_fingers', 'pinching_hand', 'v',
            'crossed_fingers', 'love_you_gesture', 'metal', 'call_me_hand', 'point_left', 'point_right', 'point_up', 'point_down',
            '+1', '-1', 'fist', 'punch', 'clap', 'raised_hands', 'heart_hands', 'open_hands',
            'palms_up_together', 'handshake', 'pray', 'writing_hand', 'nail_care', 'muscle', 'eyes', 'ear',
        ],
    },
    {
        id: 'animals', label: 'Animals and nature', icon: '🐻', shortcodes: [
            'dog', 'cat', 'mouse', 'hamster', 'rabbit', 'fox_face', 'bear', 'panda_face',
            'koala', 'tiger', 'lion', 'cow', 'pig', 'frog', 'monkey_face', 'see_no_evil',
            'hear_no_evil', 'speak_no_evil', 'chicken', 'penguin', 'bird', 'baby_chick', 'duck', 'eagle',
            'owl', 'bat', 'wolf', 'boar', 'horse', 'unicorn', 'bee', 'butterfly',
        ],
    },
    {
        id: 'food', label: 'Food', icon: '🍎', shortcodes: [
            'green_apple', 'apple', 'pear', 'tangerine', 'lemon', 'banana', 'watermelon', 'grapes',
            'strawberry', 'blueberries', 'melon', 'cherries', 'peach', 'mango', 'pineapple', 'coconut',
            'avocado', 'eggplant', 'potato', 'carrot', 'corn', 'hot_pepper', 'bell_pepper', 'cucumber',
            'broccoli', 'garlic', 'bread', 'cheese', 'egg', 'hamburger', 'pizza', 'cake',
        ],
    },
    {
        id: 'activities', label: 'Activities', icon: '⚽', shortcodes: [
            'soccer', 'basketball', 'football', 'baseball', 'softball', 'tennis', 'volleyball', 'rugby_football',
            'flying_disc', 'bowling', 'cricket_game', 'field_hockey', 'ice_hockey', 'ping_pong', 'badminton', 'boxing_glove',
            'martial_arts_uniform', 'goal_net', 'golf', 'ice_skate', 'fishing_pole_and_fish', 'diving_mask', 'running_shirt_with_sash', 'ski',
            'sled', 'curling_stone', 'dart', 'yo_yo', 'kite', '8ball', 'video_game', 'trophy',
        ],
    },
    {
        id: 'travel', label: 'Travel and places', icon: '🚀', shortcodes: [
            'car', 'taxi', 'blue_car', 'bus', 'trolleybus', 'racing_car', 'police_car', 'ambulance',
            'fire_engine', 'minibus', 'truck', 'articulated_lorry', 'tractor', 'motorcycle', 'bike', 'scooter',
            'skateboard', 'roller_skate', 'train', 'metro', 'light_rail', 'station', 'airplane', 'rocket',
            'flying_saucer', 'helicopter', 'sailboat', 'speedboat', 'anchor', 'fuelpump', 'traffic_light', 'world_map',
        ],
    },
    {
        id: 'objects', label: 'Objects', icon: '💡', shortcodes: [
            'watch', 'iphone', 'computer', 'keyboard', 'desktop_computer', 'printer', 'computer_mouse', 'trackball',
            'joystick', 'camera', 'video_camera', 'movie_camera', 'telephone_receiver', 'phone', 'pager', 'fax',
            'bulb', 'flashlight', 'candle', 'fire_extinguisher', 'shopping_cart', 'moneybag', 'credit_card', 'gift',
            'balloon', 'memo', 'pencil2', 'pushpin', 'paperclip', 'briefcase', 'calendar', 'book',
        ],
    },
    {
        id: 'symbols', label: 'Symbols', icon: '❤', shortcodes: [
            'heart', 'orange_heart', 'yellow_heart', 'green_heart', 'blue_heart', 'purple_heart', 'black_heart', 'white_heart',
            'broken_heart', 'heart_exclamation', 'two_hearts', 'sparkling_heart', '100', 'anger', 'boom', 'dizzy',
            'sweat_drops', 'dash', 'hole', 'speech_balloon', 'thought_balloon', 'white_check_mark', 'heavy_check_mark', 'x',
            'warning', 'question', 'exclamation', 'heavy_plus_sign', 'heavy_minus_sign', 'heavy_multiplication_x', 'heavy_division_sign', 'infinity',
        ],
    },
] as const

export const defaultEmojiCategories: EmojiPickerCategory[] = defaultEmojiCategoryDefinitions.map((category) => ({
    id: category.id,
    label: category.label,
    icon: category.icon,
    emojis: category.shortcodes.map((shortcode) => {
        const item = tiptapEmojis.find((candidate) => candidate.name === shortcode || candidate.shortcodes.includes(shortcode))
        if (!item?.emoji) throw new Error(`Unknown default emoji shortcode: ${shortcode}`)
        return {
            emoji: item.emoji,
            label: item.name.replaceAll('_', ' ').replace(/^./, (character) => character.toUpperCase()),
            shortcode,
        }
    }),
}))

/** 分类 Emoji 面板，点击表情即可通过 Tiptap Emoji 命令插入。 */
/** 带分类标签、二维键盘导航和 Portal 定位的表情选择器。 */
export class EmojiMenuItem extends MenuItem {
    private readonly categories: EmojiPickerCategory[]
    private trigger: HTMLButtonElement | null = null
    private panel: HTMLElement | null = null
    private tabs: HTMLElement | null = null
    private grid: HTMLElement | null = null
    private activeCategory = 0
    private stopAutoUpdate: (() => void) | undefined
    private translate = (value: string): string => value

    constructor(options: EmojiMenuItemOptions = {}) {
        super('emoji')
        this.categories = options.categories ?? defaultEmojiCategories
        if (!this.categories.length || this.categories.some((category) => !category.emojis.length)) {
            throw new Error('EmojiMenuItem requires categories with at least one emoji')
        }
    }

    /** 创建触发器、分类标签和表情网格，并注册鼠标与键盘交互。 */
    render(context: MenuContext): HTMLElement {
        this.translate = (value) => context.i18n.t(value)
        const wrapper = document.createElement('div')
        const trigger = document.createElement('button')
        const panel = document.createElement('div')
        const tabs = document.createElement('div')
        const grid = document.createElement('div')
        const panelId = `aieditor-emoji-picker-${++emojiPickerSequence}`
        const gridId = `${panelId}-grid`

        wrapper.className = 'aieditor__emoji-menu'
        trigger.type = 'button'
        trigger.className = 'aieditor__tool aieditor__emoji-trigger'
        trigger.title = this.translate('Insert emoji')
        trigger.setAttribute('aria-label', this.translate('Insert emoji'))
        trigger.setAttribute('aria-haspopup', 'dialog')
        trigger.setAttribute('aria-expanded', 'false')
        trigger.setAttribute('aria-controls', panelId)
        const icon = createElement(Smile, {'aria-hidden': 'true'})
        icon.classList.add('aieditor__emoji-trigger-icon')
        const chevron = createElement(ChevronDown, {'aria-hidden': 'true'})
        chevron.classList.add('aieditor__emoji-trigger-chevron', 'aieditor__menu-chevron')
        trigger.append(icon, chevron)

        panel.id = panelId
        panel.className = 'aieditor__emoji-panel'
        panel.setAttribute('role', 'dialog')
        panel.setAttribute('aria-label', this.translate('Select emoji'))
        panel.hidden = true
        tabs.className = 'aieditor__emoji-tabs'
        tabs.setAttribute('role', 'tablist')
        tabs.setAttribute('aria-label', this.translate('Emoji categories'))
        grid.id = gridId
        grid.className = 'aieditor__emoji-grid'
        grid.setAttribute('role', 'group')

        this.categories.forEach((category, index) => {
            const tab = document.createElement('button')
            tab.type = 'button'
            tab.className = 'aieditor__emoji-tab'
            tab.dataset.emojiCategory = String(index)
            tab.setAttribute('role', 'tab')
            tab.setAttribute('aria-controls', gridId)
            tab.setAttribute('aria-selected', String(index === this.activeCategory))
            tab.setAttribute('aria-label', this.translate(category.label))
            tab.title = this.translate(category.label)
            tab.textContent = category.icon
            tabs.append(tab)
        })

        panel.append(tabs, grid)
        document.body.append(panel)
        wrapper.append(trigger)
        this.trigger = trigger
        this.panel = panel
        this.tabs = tabs
        this.grid = grid
        this.renderGrid()

        this.listen(trigger, 'mousedown', (event) => event.preventDefault())
        this.listen(trigger, 'click', () => panel.hidden ? this.open() : this.close())
        this.listen(trigger, 'keydown', (event) => {
            if (event.key !== 'ArrowDown') return
            event.preventDefault()
            this.open(true)
        })
        this.listen(tabs, 'click', (event) => {
            const tab = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-emoji-category]')
            if (!tab || !tabs.contains(tab)) return
            this.selectCategory(Number(tab.dataset.emojiCategory))
        })
        this.listen(panel, 'click', (event) => {
            const item = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-emoji-shortcode]')
            if (!item || !panel.contains(item)) return
            const shortcode = item.dataset.emojiShortcode
            if (!shortcode) return
            this.close()
            context.editor.chain().focus().setEmoji(shortcode).run()
        })
        this.listen(panel, 'keydown', (event) => this.handlePanelKeydown(event))
        this.listen(document.documentElement, 'click', (event) => {
            const target = event.target as Node | null
            if (target && !wrapper.contains(target) && !panel.contains(target)) this.close()
        })
        return wrapper
    }

    /** 只读或扩展不可用时禁用入口。 */
    update(context: MenuContext): void {
        if (!this.trigger) return
        const first = this.categories[0]?.emojis[0]
        this.trigger.disabled = !context.editor.isEditable || !first || !context.editor.can().setEmoji(first.shortcode)
    }

    /** 停止定位并移除挂载到 body 的选择器。 */
    destroy(): void {
        this.close()
        this.panel?.remove()
        this.panel = null
        this.tabs = null
        this.grid = null
        this.trigger = null
        super.destroy()
    }

    /** 根据当前分类重建网格，并维持单一 roving tabindex 入口。 */
    private renderGrid(): void {
        if (!this.grid) return
        const category = this.categories[this.activeCategory]
        this.grid.setAttribute('aria-label', this.translate(category.label))
        this.grid.replaceChildren(...category.emojis.map((option) => {
            const item = document.createElement('button')
            item.type = 'button'
            item.className = 'aieditor__emoji-option'
            item.dataset.emojiShortcode = option.shortcode
            item.setAttribute('aria-label', this.translate(option.label))
            item.title = this.translate(option.label)
            item.textContent = option.emoji
            return item
        }))
    }

    /** 切换分类并按需把焦点保留在分类标签上。 */
    private selectCategory(index: number, focusTab = false): void {
        if (!Number.isInteger(index) || index < 0 || index >= this.categories.length) return
        this.activeCategory = index
        const tabs = this.getTabs()
        tabs.forEach((tab, tabIndex) => tab.setAttribute('aria-selected', String(tabIndex === index)))
        this.renderGrid()
        if (focusTab) tabs[index]?.focus()
    }

    /** 打开选择器并按需把键盘焦点移入第一个表情。 */
    private open(focusFirst = false): void {
        if (!this.trigger || !this.panel || this.trigger.disabled || !this.panel.hidden) return
        this.panel.hidden = false
        this.trigger.setAttribute('aria-expanded', 'true')
        this.stopAutoUpdate = autoUpdate(this.trigger, this.panel, () => this.updatePosition())
        if (focusFirst) this.getEmojiItems()[0]?.focus()
    }

    /** 关闭选择器并停止锚点跟随。 */
    private close(returnFocus = false): void {
        if (!this.trigger || !this.panel) return
        this.stopAutoUpdate?.()
        this.stopAutoUpdate = undefined
        this.panel.hidden = true
        this.trigger.setAttribute('aria-expanded', 'false')
        if (returnFocus) this.trigger.focus()
    }

    /** 将选择器定位到触发按钮附近并处理视口碰撞。 */
    private async updatePosition(): Promise<void> {
        if (!this.trigger || !this.panel || this.panel.hidden) return
        const {x, y} = await computePosition(this.trigger, this.panel, {
            placement: resolveMenuFloatingPlacement(this.trigger, 'bottom-start'),
            strategy: 'fixed',
            middleware: [offset(({placement}) => resolveMenuFloatingOffset(this.trigger!, placement)), flip(), shift({padding: 8})],
        })
        if (!this.panel || this.panel.hidden) return
        const position = clampFloatingPosition(this.panel, x, y)
        Object.assign(this.panel.style, {left: `${position.x}px`, top: `${position.y}px`})
    }

    /** 在分类标签和表情网格中处理方向键、Home/End 与 Escape。 */
    private handlePanelKeydown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            event.preventDefault()
            this.close(true)
            return
        }

        const tabs = this.getTabs()
        const tabIndex = tabs.indexOf(document.activeElement as HTMLButtonElement)
        if (tabIndex >= 0 && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
            event.preventDefault()
            const destination = event.key === 'Home'
                ? 0
                : event.key === 'End'
                    ? tabs.length - 1
                    : event.key === 'ArrowRight'
                        ? (tabIndex + 1) % tabs.length
                        : (tabIndex - 1 + tabs.length) % tabs.length
            this.selectCategory(destination, true)
            return
        }

        const items = this.getEmojiItems()
        const itemIndex = items.indexOf(document.activeElement as HTMLButtonElement)
        if (itemIndex < 0) return
        const destinations: Record<string, number> = {
            ArrowRight: (itemIndex + 1) % items.length,
            ArrowDown: (itemIndex + 8) % items.length,
            ArrowLeft: (itemIndex - 1 + items.length) % items.length,
            ArrowUp: (itemIndex - 8 + items.length) % items.length,
            Home: 0,
            End: items.length - 1,
        }
        const destination = destinations[event.key]
        if (destination === undefined) return
        event.preventDefault()
        items[destination]?.focus()
    }

    /** 返回所有分类标签按钮。 */
    private getTabs(): HTMLButtonElement[] {
        return this.tabs ? [...this.tabs.querySelectorAll<HTMLButtonElement>('[role="tab"]')] : []
    }

    /** 返回当前分类中的表情按钮。 */
    private getEmojiItems(): HTMLButtonElement[] {
        return this.grid ? [...this.grid.querySelectorAll<HTMLButtonElement>('[data-emoji-shortcode]')] : []
    }
}
