import type {Editor} from '@tiptap/core'
import {ExternalLink, Unlink} from 'lucide'
import {BubbleMenu} from './BubbleMenu'
import type {AiEditorI18n} from '../../i18n'
import {ButtonMenuItem, MenuBar, type MenuItem} from '../../menus/core'
import {LinkMenuItem, type LinkMenuItemOptions} from '../../menus/items'

/** 光标或选区位于链接文字时显示的链接操作 Bubble Menu。 */
export class LinkBubbleMenu {
    readonly element: HTMLElement
    readonly extension: ReturnType<typeof BubbleMenu.configure>
    readonly label: string
    private readonly items: MenuItem[]
    private menuBar: MenuBar | undefined

    constructor(options: LinkMenuItemOptions = {}) {
        const editLabel = options.editLabel ?? options.setLabel ?? 'Edit link'
        const removeLabel = options.removeLabel ?? 'Remove link'
        const visitLabel = options.visitLabel ?? 'Visit link'
        this.label = options.actionsLabel ?? 'Link actions'

        this.element = document.createElement('div')
        this.element.className = 'aieditor__bubble-menu aieditor__link-bubble-menu'
        this.element.setAttribute('role', 'toolbar')
        this.element.setAttribute('aria-label', this.label)
        this.items = [
            new LinkMenuItem({
                ...options,
                id: 'link-bubble-edit',
                label: editLabel,
                dialogTitle: editLabel,
                icon: 'edit',
            }),
            new ButtonMenuItem({
                id: 'link-bubble-remove',
                label: removeLabel,
                icon: Unlink,
                execute: ({editor}) => editor.chain().focus().extendMarkRange('link').unsetLink().run(),
                isEnabled: ({editor}) => editor.isEditable && editor.isActive('link'),
            }),
            new ButtonMenuItem({
                id: 'link-bubble-visit',
                label: visitLabel,
                icon: ExternalLink,
                execute: ({editor}) => {
                    const href = editor.getAttributes('link').href as string | undefined
                    if (href) window.open(href, '_blank', 'noopener,noreferrer')
                },
                isEnabled: ({editor}) => Boolean(editor.getAttributes('link').href),
            }),
        ]
        this.extension = BubbleMenu.extend({name: 'linkBubbleMenu'}).configure({
            element: this.element,
            pluginKey: 'aieditorLinkBubbleMenu',
            updateDelay: 0,
            options: {
                placement: 'top',
                strategy: 'fixed',
                offset: 8,
                flip: true,
                shift: {padding: 8},
                inline: true,
            },
            shouldShow: ({editor}) => this.shouldShow(editor),
        })
    }

    /** 挂载菜单项目，并将容器标签切换为当前语言。 */
    mount(editor: Editor, i18n: AiEditorI18n): void {
        if (this.menuBar) throw new Error('LinkBubbleMenu is already mounted')
        this.element.setAttribute('aria-label', i18n.t(this.label))
        this.menuBar = new MenuBar(this.element, {editor, i18n}, this.items)
    }

    /** 刷新编辑、移除和访问操作的可用状态。 */
    update(): void {
        this.menuBar?.update()
    }

    /** 销毁菜单项目并移除 BubbleMenu 容器。 */
    destroy(): void {
        this.menuBar?.destroy()
        this.menuBar = undefined
        this.element.remove()
    }

    /** 返回当前 MenuBar 项目，供编辑器统一刷新或遍历。 */
    getItems(): readonly MenuItem[] {
        return this.menuBar?.getItems() ?? this.items
    }

    /** 只有聚焦且位于有效链接 mark 中时才显示操作菜单。 */
    private shouldShow(editor: Editor): boolean {
        return editor.isEditable
            && editor.view.hasFocus()
            && editor.isActive('link')
            && Boolean(editor.getAttributes('link').href)
    }
}
