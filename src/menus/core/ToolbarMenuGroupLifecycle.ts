/** 判断归属于工具组的 Portal 是否真正打开，排除隐藏弹层内部自身未带 hidden 的节点。 */
export function hasOpenToolbarMenuGroupPortal(panelId: string, ownerDocument: Document = document): boolean {
    return [...ownerDocument.querySelectorAll<HTMLElement>(
        `[data-toolbar-menu-group-owner~="${panelId}"]:not([hidden])`,
    )].some((element) => !element.closest('[hidden]'))
}

/** 判断点击目标是否位于当前工具组拥有的任一打开 Portal 内。 */
export function toolbarMenuGroupPortalContains(panelId: string, target: Node): boolean {
    const ownerDocument = target.ownerDocument ?? document
    return [...ownerDocument.querySelectorAll<HTMLElement>(
        `[data-toolbar-menu-group-owner~="${panelId}"]:not([hidden])`,
    )].some((element) => !element.closest('[hidden]') && element.contains(target))
}

/** 为已挂载菜单项创建的 Portal 弹层增删工具组归属链。 */
export function setToolbarMenuGroupPortalOwner(root: HTMLElement, panelId: string, active: boolean): void {
    const ownerDocument = root.ownerDocument
    const visited = new Set<HTMLElement>()
    const visit = (element: HTMLElement): void => {
        if (visited.has(element)) return
        visited.add(element)
        const controls = element.matches('[aria-controls]')
            ? [element, ...element.querySelectorAll<HTMLElement>('[aria-controls]')]
            : [...element.querySelectorAll<HTMLElement>('[aria-controls]')]
        controls.forEach((control) => {
            const controlledId = control.getAttribute('aria-controls')
            const controlled = controlledId ? ownerDocument.getElementById(controlledId) : null
            if (!controlled || controlled === root) return
            const owners = new Set((controlled.dataset.toolbarMenuGroupOwner ?? '').split(' ').filter(Boolean))
            if (active) owners.add(panelId)
            else owners.delete(panelId)
            if (owners.size) controlled.dataset.toolbarMenuGroupOwner = [...owners].join(' ')
            else delete controlled.dataset.toolbarMenuGroupOwner
            visit(controlled)
        })
    }
    visit(root)
}
