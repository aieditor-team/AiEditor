import {
  Mention as TMention,
  type MentionNodeAttrs,
  type MentionOptions as TMentionOptions,
} from '@tiptap/extension-mention'
import type {SuggestionKeyDownProps, SuggestionOptions, SuggestionProps} from '@tiptap/suggestion'
import {applyEditorTheme} from '../../editor/AiEditorTheme'

/** 宿主提供的一个提及候选；id 写入文档，avatar 仅用于候选菜单。 */
export interface MentionItem {
  id: string | number
  label: string
  /** 候选列表头像 URL；不写入最终的 Mention 节点。 */
  avatar?: string | null
}

export type MentionQueryItem = string | MentionItem
/** 根据 @ 后的查询文本同步或异步返回候选项。 */
export type MentionQuery = (query: string) => MentionQueryItem[] | Promise<MentionQueryItem[]>

type NormalizedMentionItem = {id: string; label: string; avatar?: string}
type Translate = (value: string) => string

let mentionListSequence = 0

export type MentionOptions<
  SuggestionItem = any,
  Attrs extends Record<string, any> = MentionNodeAttrs,
> = TMentionOptions<SuggestionItem, Attrs>
export const Mention = TMention.extend<MentionOptions>({})

/** 将顶层 onMentionQuery 配置连接到 Tiptap Suggestion，并渲染无框架候选菜单。 */
export function createMentionSuggestion(
  query: MentionQuery,
  translate: Translate,
): MentionOptions['suggestion'] {
  return {
    char: '@',
    items: async ({query: value}) => normalizeMentionItems(await query(value)),
    render: () => createMentionRenderer(translate),
  } as Omit<SuggestionOptions<any, MentionNodeAttrs>, 'editor'>
}

/** 将字符串简写和结构化候选统一成 Tiptap Suggestion 使用的字符串字段。 */
function normalizeMentionItems(items: MentionQueryItem[]): NormalizedMentionItem[] {
  return items.map((item) => typeof item === 'string'
    ? {id: item, label: item}
    : {id: String(item.id), label: item.label, ...(item.avatar ? {avatar: item.avatar} : {})})
}

/** 创建一个 Suggestion 生命周期对应的候选列表渲染器。 */
function createMentionRenderer(translate: Translate) {
  let element: HTMLDivElement | undefined
  let current: SuggestionProps<NormalizedMentionItem, NormalizedMentionItem> | undefined
  let selectedIndex = 0
  let optionElements: HTMLButtonElement[] = []
  let unmount: (() => void) | undefined
  const listId = `aieditor-mention-list-${++mentionListSequence}`

  /** 同步视觉选中项与 listbox 的 aria-activedescendant。 */
  const updateSelection = (scrollIntoView = false) => {
    if (!element) return
    optionElements.forEach((option, index) => {
      option.setAttribute('aria-selected', String(index === selectedIndex))
    })
    const selected = optionElements[selectedIndex]
    if (!selected) {
      element.removeAttribute('aria-activedescendant')
      return
    }
    element.setAttribute('aria-activedescendant', selected.id)
    if (scrollIntoView) selected.scrollIntoView({block: 'nearest'})
  }

  /** 按加载、空结果或候选列表三种状态重建列表内容。 */
  const render = () => {
    if (!element || !current) return
    const list = element
    list.replaceChildren()
    optionElements = []
    list.removeAttribute('aria-activedescendant')

    if (current.loading && current.items.length === 0) {
      list.append(createStatus(translate('Loading mentions...')))
      return
    }
    if (current.items.length === 0) {
      list.append(createStatus(translate('No mentions found')))
      return
    }

    selectedIndex = Math.min(selectedIndex, current.items.length - 1)
    current.items.forEach((item, index) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'aieditor__mention-option'
      button.id = `${listId}-option-${index}`
      button.setAttribute('role', 'option')
      button.append(createMentionAvatar(item), createMentionLabel(item.label))
      button.addEventListener('mouseenter', () => {
        selectedIndex = index
        updateSelection()
      })
      button.addEventListener('mousedown', (event) => event.preventDefault())
      button.addEventListener('click', () => current?.command(item))
      optionElements.push(button)
      list.append(button)
    })
    updateSelection()
  }

  /** 查询文本变化时重置键盘索引，异步结果刷新则尽量保留当前索引。 */
  const update = (props: SuggestionProps<NormalizedMentionItem, NormalizedMentionItem>) => {
    const queryChanged = current?.query !== props.query
    current = props
    if (queryChanged) selectedIndex = 0
    render()
  }

  return {
    onStart(props: SuggestionProps<NormalizedMentionItem, NormalizedMentionItem>) {
      element = document.createElement('div')
      element.className = 'aieditor__mention-list'
      element.id = listId
      element.setAttribute('role', 'listbox')
      element.setAttribute('aria-label', translate('Mention suggestions'))
      applyEditorTheme(element, props.editor)
      current = props
      selectedIndex = 0
      render()
      unmount = props.mount(element)
    },
    onUpdate: update,
    onExit() {
      // mount 由 Suggestion 宿主提供，必须通过对应 unmount 释放 Portal 和定位监听。
      unmount?.()
      unmount = undefined
      element = undefined
      current = undefined
      optionElements = []
    },
    onKeyDown({event}: SuggestionKeyDownProps): boolean {
      if (!current?.items.length) return false
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        const direction = event.key === 'ArrowUp' ? -1 : 1
        selectedIndex = (selectedIndex + direction + current.items.length) % current.items.length
        updateSelection(true)
        return true
      }
      if (event.key === 'Enter') {
        current.command(current.items[selectedIndex])
        return true
      }
      return false
    },
  }
}

/** 创建头像；图片加载失败时保留由姓名首字母生成的兜底内容。 */
function createMentionAvatar(item: NormalizedMentionItem): HTMLElement {
  const avatar = document.createElement('span')
  avatar.className = 'aieditor__mention-avatar'
  avatar.setAttribute('aria-hidden', 'true')

  const fallback = document.createElement('span')
  fallback.className = 'aieditor__mention-avatar-fallback'
  fallback.textContent = getMentionInitials(item.label)
  avatar.append(fallback)

  if (item.avatar) {
    const image = document.createElement('img')
    image.src = item.avatar
    image.alt = ''
    image.decoding = 'async'
    image.draggable = false
    image.addEventListener('error', () => image.remove())
    avatar.append(image)
  }
  return avatar
}

/** 创建候选项的可见名称节点。 */
function createMentionLabel(label: string): HTMLElement {
  const element = document.createElement('span')
  element.className = 'aieditor__mention-label'
  element.textContent = label
  return element
}

/** 兼容中英文名称地生成最多两个字符的头像缩写。 */
function getMentionInitials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return Array.from(parts[0]).slice(0, 2).join('').toUpperCase()
  return `${Array.from(parts[0])[0] ?? ''}${Array.from(parts.at(-1) ?? '')[0] ?? ''}`.toUpperCase()
}

/** 创建具有 live region 语义的加载或空结果提示。 */
function createStatus(label: string): HTMLElement {
  const status = document.createElement('div')
  status.className = 'aieditor__mention-status'
  status.setAttribute('role', 'status')
  status.textContent = label
  return status
}
