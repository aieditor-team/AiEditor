import {describe, expect, it, vi} from 'vitest'
import type {AiEditorProductContext} from '../../../src/editor/AiEditorProduct'
import {SidebarSurface, type SidebarItem} from '../../../src/features/sidebar'

function createItem(id: string): SidebarItem & {rail?: HTMLButtonElement; content?: HTMLElement} {
  return {
    id,
    label: `${id} tools`,
    renderIcon: vi.fn(() => document.createTextNode(id.slice(0, 1).toUpperCase())),
    mountContent: vi.fn(function (this: SidebarItem & {content?: HTMLElement}, _context, host) {
      this.content = host
      host.textContent = `${id} content`
    }),
    updateContent: vi.fn(),
    destroy: vi.fn(),
  }
}

function createContext(): AiEditorProductContext {
  const root = document.createElement('div')
  const content = document.createElement('main')
  const sidebar = document.createElement('aside')
  const editorDom = document.createElement('div')
  root.append(content, sidebar)
  return {
    editor: {view: {dom: editorDom}} as AiEditorProductContext['editor'],
    i18n: {t: (value: string) => value} as AiEditorProductContext['i18n'],
    root,
    content,
    sidebar,
    uploader: undefined,
  }
}

describe('SidebarSurface', () => {
  it('mounts multiple items and owns switching and collapsed layout state', () => {
    const ai = createItem('ai-chat')
    const history = createItem('history')
    const context = createContext()
    const surface = new SidebarSurface({items: [ai, history], width: 420})

    surface.mount(context)

    expect(context.sidebarRail?.children).toHaveLength(2)
    expect(context.sidebarContent?.children).toHaveLength(2)
    const aiRail = context.sidebarRail?.querySelector<HTMLButtonElement>('[data-sidebar-item="ai-chat"]')
    const historyRail = context.sidebarRail?.querySelector<HTMLButtonElement>('[data-sidebar-item="history"]')
    expect(aiRail?.classList.contains('is-active')).toBe(true)
    expect(ai.content?.hidden).toBe(false)
    expect(history.content?.hidden).toBe(true)
    expect(context.root.dataset.aieditorSidebarState).toBe('expanded')
    expect(context.root.style.getPropertyValue('--aieditor-sidebar-width')).toBe('420px')

    aiRail?.click()
    expect(ai.content?.hidden).toBe(true)
    expect(context.sidebar?.classList.contains('is-collapsed')).toBe(true)
    expect(context.root.classList.contains('is-sidebar-collapsed')).toBe(true)
    expect(context.root.dataset.aieditorSidebarState).toBe('collapsed')
    expect(context.root.style.getPropertyValue('--aieditor-sidebar-width')).toBe('42px')

    historyRail?.click()
    expect(ai.content?.hidden).toBe(true)
    expect(history.content?.hidden).toBe(false)
    expect(historyRail?.getAttribute('aria-pressed')).toBe('true')
    expect(context.root.dataset.aieditorSidebarState).toBe('expanded')
    expect(context.root.style.getPropertyValue('--aieditor-sidebar-width')).toBe('420px')

    surface.update(context)
    expect(ai.updateContent).toHaveBeenCalledWith(context, ai.content)
    expect(history.updateContent).toHaveBeenCalledWith(context, history.content)

    surface.destroy()
    expect(ai.destroy).toHaveBeenCalledOnce()
    expect(history.destroy).toHaveBeenCalledOnce()
    expect(context.sidebarRail).toBeUndefined()
    expect(context.sidebarContent).toBeUndefined()
    expect(context.root.dataset.aieditorSidebarState).toBeUndefined()
  })

  it('supports a collapsed initial state', () => {
    const item = createItem('review')
    const context = createContext()
    const surface = new SidebarSurface({items: [item], defaultItem: false})

    surface.mount(context)
    expect(item.content?.hidden).toBe(true)
    expect(context.root.dataset.aieditorSidebarState).toBe('collapsed')

    const rail = context.sidebarRail?.querySelector<HTMLButtonElement>('[data-sidebar-item="review"]')
    rail?.click()
    expect(item.content?.hidden).toBe(false)
    expect(context.root.dataset.aieditorSidebarState).toBe('expanded')
  })

  it('rejects duplicate and unknown item identifiers', () => {
    expect(() => new SidebarSurface({items: [createItem('review'), createItem('review')]}))
      .toThrow('Duplicate SidebarItem id')
    expect(() => new SidebarSurface({items: [createItem('review')], defaultItem: 'missing'}))
      .toThrow('Unknown default SidebarItem')
  })

  it('passes a stable host to items and runs framework cleanup on destroy', () => {
    const context = createContext()
    const cleanup = vi.fn()
    const item: SidebarItem = {
      id: 'framework',
      label: 'Framework panel',
      renderIcon: () => document.createElement('span'),
      mountContent: vi.fn((_context, host) => {
        host.dataset.frameworkRoot = 'mounted'
        return cleanup
      }),
      destroy: vi.fn(),
    }
    const surface = new SidebarSurface({items: [item]})

    surface.mount(context)

    const host = context.sidebarContent?.firstElementChild as HTMLElement
    expect(host.className).toBe('aieditor__sidebar-item-content')
    expect(host.dataset.frameworkRoot).toBe('mounted')
    expect(context.sidebarRail?.querySelector('button')?.firstElementChild?.tagName).toBe('SPAN')

    surface.destroy()
    expect(cleanup).toHaveBeenCalledOnce()
    expect(item.destroy).toHaveBeenCalledOnce()
  })
})
