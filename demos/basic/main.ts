import '../../src/styles/aieditor.css'
import './demo.css'
import {
  BookOpen,
  CirclePlus,
  Cloud,
  Copy,
  createElement,
  FolderOpen,
  History,
  Home,
  Images,
  LayoutGrid,
  Maximize,
  MessageSquareText,
  PanelLeft,
  PenLine,
  Search,
  Settings2,
  Share2,
  Star,
  ZoomIn,
  ZoomOut,
  X,
  type IconNode,
} from 'lucide'
import {
  SelectAllMenuItem,
  AiEditor,
  type AiEditorLocale,
  type AiEditorTemplateFactory,
  type AiEditorTheme,
  type DocumentStylePreset,
  type DocumentOutlineItem,
  type ToolbarSize,
  type ToolbarStyle,
  type MenuItemConfig,
  type MenuItemGroupConfig,
  type ToolbarOverflow,
} from '../../src'

declare global {
  interface Window {
    aieditor: AiEditor
  }
}

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) throw new Error('缺少 #app 挂载元素')

const toolbarStyles: ToolbarStyle[] = ['classic', 'compact', 'ribbon']
const toolbarStyleLabels: Record<ToolbarStyle, string> = {
  classic: '经典',
  compact: '标准',
  ribbon: '功能区',
}
const savedToolbarStyle = window.localStorage.getItem('aieditor-toolbar-style')
const initialToolbarStyle: ToolbarStyle = toolbarStyles.includes(savedToolbarStyle as ToolbarStyle)
  ? savedToolbarStyle as ToolbarStyle
  : 'compact'
const toolbarSizes: ToolbarSize[] = ['small', 'default', 'large']
const toolbarSizeLabels: Record<ToolbarSize, string> = {
  small: '小',
  default: '默认',
  large: '大',
}
const savedToolbarSize = window.localStorage.getItem('aieditor-toolbar-size')
const initialToolbarSize: ToolbarSize = toolbarSizes.includes(savedToolbarSize as ToolbarSize)
  ? savedToolbarSize as ToolbarSize
  : 'default'
const toolbarOverflows: ToolbarOverflow[] = ['wrap', 'scroll', 'menu']
const toolbarOverflowLabels: Record<ToolbarOverflow, string> = {
  wrap: '换行',
  scroll: '滚动',
  menu: '更多菜单',
}
const savedToolbarOverflow = window.localStorage.getItem('aieditor-toolbar-overflow')
const initialToolbarOverflow: ToolbarOverflow = toolbarOverflows.includes(savedToolbarOverflow as ToolbarOverflow)
  ? savedToolbarOverflow as ToolbarOverflow
  : 'wrap'
const savedToolbarSticky = window.localStorage.getItem('aieditor-toolbar-sticky')
const initialToolbarSticky = savedToolbarSticky === null || savedToolbarSticky === 'true'
type ToolbarMenuGroupMode = 'expanded' | 'grouped'
const savedToolbarMenuGroupMode = window.localStorage.getItem('aieditor-toolbar-menu-groups')
const initialToolbarMenuGroupMode: ToolbarMenuGroupMode = savedToolbarMenuGroupMode === 'expanded'
  ? 'expanded'
  : 'grouped'
const mediaToolbarMenuGroup: MenuItemGroupConfig = {
  type: 'group',
  key: 'media-tools',
  label: '媒体',
  icon: Images,
  items: ['image', 'audio', 'video', 'attachment'],
}
const richContentToolbarMenuGroup: MenuItemGroupConfig = {
  type: 'group',
  key: 'rich-content-tools',
  label: '丰富内容',
  icon: LayoutGrid,
  items: [mediaToolbarMenuGroup, 'table', 'formula'],
}
const insertToolbarMenuGroup: MenuItemGroupConfig = {
  type: 'group',
  key: 'insert-tools',
  label: 'Insert',
  icon: CirclePlus,
  items: [richContentToolbarMenuGroup, 'emoji', 'horizontal-rule', 'link'],
}
const groupedToolbarMenuKeys = new Set([
  'image', 'audio', 'video', 'attachment', 'table', 'formula',
  'emoji', 'horizontal-rule', 'link',
])
let defaultToolbarMenuKeys: string[] = []

function createToolbarMenuConfig(mode: ToolbarMenuGroupMode): MenuItemConfig[] {
  const configs: MenuItemConfig[] = []
  let insertedGroup = false
  defaultToolbarMenuKeys.forEach((key) => {
    if (!groupedToolbarMenuKeys.has(key)) {
      configs.push(key)
      return
    }
    if (!insertedGroup) {
      configs.push(insertToolbarMenuGroup)
      insertedGroup = true
    }
  })
  if (mode === 'expanded') {
    configs.splice(0, configs.length, ...defaultToolbarMenuKeys)
  }
  configs.push(
    '|',
    {
      type: 'button',
      key: 'demo-insert-time',
      label: '插入当前时间',
      tip: '在光标处插入当前时间',
      icon: History,
      onClick: ({editor}) => {
        const time = new Intl.DateTimeFormat('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).format(new Date())
        editor.chain().focus().insertContent(time).run()
        showDemoMenuFeedback(`已插入时间 ${time}`)
      },
      isEnabled: ({editor}) => editor.isEditable,
    },
    new SelectAllMenuItem(),
  )
  return configs
}
const locales: AiEditorLocale[] = ['zh-CN', 'en-US']
const savedLocale = window.localStorage.getItem('aieditor-locale')
const initialLocale: AiEditorLocale = locales.includes(savedLocale as AiEditorLocale)
  ? savedLocale as AiEditorLocale
  : 'zh-CN'
const themes: AiEditorTheme[] = ['light', 'dark']
const savedTheme = window.localStorage.getItem('aieditor-theme')
const initialTheme: AiEditorTheme = themes.includes(savedTheme as AiEditorTheme)
  ? savedTheme as AiEditorTheme
  : 'light'
const documentStyles: DocumentStylePreset[] = ['web', 'word', 'wps']
const documentStyleLabels: Record<DocumentStylePreset, string> = {
  web: 'Web',
  word: 'Word',
  wps: 'WPS',
}
const savedDocumentStyle = window.localStorage.getItem('aieditor-document-style')
const initialDocumentStyle: DocumentStylePreset = documentStyles.includes(savedDocumentStyle as DocumentStylePreset)
  ? savedDocumentStyle as DocumentStylePreset
  : 'word'
type EditorTemplateMode = 'default' | 'tencent-docs' | 'wps'
const editorTemplateModes: EditorTemplateMode[] = ['default', 'tencent-docs', 'wps']
const editorTemplateLabels: Record<EditorTemplateMode, string> = {
  default: '默认',
  'tencent-docs': '腾讯文档',
  wps: 'WPS',
}
const savedEditorTemplate = window.localStorage.getItem('aieditor-template')
const migratedEditorTemplate = savedEditorTemplate === 'sidebars'
  ? 'tencent-docs'
  : savedEditorTemplate === 'bottom-toolbar'
    ? 'wps'
    : savedEditorTemplate
const initialEditorTemplate: EditorTemplateMode = editorTemplateModes.includes(migratedEditorTemplate as EditorTemplateMode)
  ? migratedEditorTemplate as EditorTemplateMode
  : 'default'
if (savedEditorTemplate && savedEditorTemplate !== initialEditorTemplate) {
  window.localStorage.setItem('aieditor-template', initialEditorTemplate)
}
document.documentElement.dataset.theme = initialTheme

app.innerHTML = `
  <main class="app-shell">
    <header class="app-header">
      <div class="app-header-bar">
        <a class="brand" href="/" aria-label="AiEditor 首页">
          <span class="brand-mark" aria-hidden="true">Z</span>
          <span>AiEditor</span>
        </a>
        <div class="document-status" aria-live="polite">
          <span class="status-dot" aria-hidden="true"></span>
          <span id="save-status">所有更改已保存</span>
        </div>
        <div class="configuration-summary" aria-label="当前演示配置">
          <span id="summary-template">${editorTemplateLabels[initialEditorTemplate]}</span>
          <span id="summary-document-style">${documentStyleLabels[initialDocumentStyle]}</span>
          <span id="summary-toolbar">${toolbarStyleLabels[initialToolbarStyle]} · ${toolbarSizeLabels[initialToolbarSize]}</span>
          <span id="summary-editable">编辑</span>
        </div>
        <div class="header-actions">
          <div class="settings-menu">
            <button class="header-action header-action--settings" id="toggle-page-layout" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="page-layout-panel">
              <span data-demo-icon="page-layout" aria-hidden="true"></span>
              <span>页面布局</span>
            </button>
            <section class="settings-panel" id="page-layout-panel" role="dialog" aria-labelledby="page-layout-title" hidden>
              <div class="settings-panel-header">
                <h2 id="page-layout-title">页面布局</h2>
                <button class="settings-close" type="button" aria-label="关闭页面布局" data-close-settings>
                  <span data-demo-icon="close" aria-hidden="true"></span>
                </button>
              </div>
              <div class="settings-fields">
                <div class="settings-field">
                  <span class="settings-label">模板布局</span>
                  <div class="menu-style-control" data-header-control="template" role="group" aria-label="编辑器模板">
                    ${editorTemplateModes.map((mode) => `<button class="menu-style-option" type="button" data-template-option="${mode}" aria-pressed="${mode === initialEditorTemplate}">${editorTemplateLabels[mode]}</button>`).join('')}
                  </div>
                </div>
                <div class="settings-field">
                  <span class="settings-label">内容排版</span>
                  <div class="menu-style-control" data-header-control="document-style" role="group" aria-label="内容排版预设">
                    ${documentStyles.map((style) => `<button class="menu-style-option" type="button" data-document-style-option="${style}" aria-pressed="${style === initialDocumentStyle}">${documentStyleLabels[style]}</button>`).join('')}
                  </div>
                </div>
              </div>
            </section>
          </div>
          <div class="settings-menu">
            <button class="header-action header-action--settings" id="toggle-toolbar-settings" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="toolbar-settings-panel">
              <span data-demo-icon="toolbar-settings" aria-hidden="true"></span>
              <span>工具栏设置</span>
            </button>
            <section class="settings-panel settings-panel--toolbar" id="toolbar-settings-panel" role="dialog" aria-labelledby="toolbar-settings-title" hidden>
              <div class="settings-panel-header">
                <h2 id="toolbar-settings-title">工具栏设置</h2>
                <button class="settings-close" type="button" aria-label="关闭工具栏设置" data-close-settings>
                  <span data-demo-icon="close" aria-hidden="true"></span>
                </button>
              </div>
              <div class="settings-fields">
                <div class="settings-field">
                  <span class="settings-label">界面风格</span>
                  <div class="menu-style-control" data-header-control="toolbar" role="group" aria-label="工具栏风格">
                    ${toolbarStyles.map((style) => `<button class="menu-style-option" type="button" data-toolbar-style-option="${style}" aria-pressed="${style === initialToolbarStyle}">${toolbarStyleLabels[style]}</button>`).join('')}
                  </div>
                </div>
                <div class="settings-field">
                  <span class="settings-label">控件大小</span>
                  <div class="menu-style-control" data-header-control="toolbar-size" role="group" aria-label="工具栏大小">
                    ${toolbarSizes.map((size) => `<button class="menu-style-option" type="button" data-toolbar-size-option="${size}" aria-pressed="${size === initialToolbarSize}">${toolbarSizeLabels[size]}</button>`).join('')}
                  </div>
                </div>
                <div class="settings-field">
                  <span class="settings-label">空间不足时</span>
                  <div class="menu-style-control" data-header-control="toolbar-overflow" role="group" aria-label="工具栏溢出方式">
                    ${toolbarOverflows.map((overflow) => `<button class="menu-style-option" type="button" data-toolbar-overflow-option="${overflow}" aria-pressed="${overflow === initialToolbarOverflow}">${toolbarOverflowLabels[overflow]}</button>`).join('')}
                  </div>
                </div>
                <div class="settings-field">
                  <span class="settings-label">工具组织</span>
                  <div class="menu-style-control" data-header-control="toolbar-menu-groups" role="group" aria-label="工具栏工具组">
                    <button class="menu-style-option" type="button" data-toolbar-menu-group-option="expanded" aria-pressed="${initialToolbarMenuGroupMode === 'expanded'}">展开</button>
                    <button class="menu-style-option" type="button" data-toolbar-menu-group-option="grouped" aria-pressed="${initialToolbarMenuGroupMode === 'grouped'}">分组</button>
                  </div>
                </div>
                <div class="settings-field settings-field--switch">
                  <span class="settings-label">页面滚动时</span>
                  <label class="toolbar-sticky-control">
                    <input type="checkbox" role="switch" aria-label="悬浮工具栏" data-toolbar-sticky ${initialToolbarSticky ? 'checked' : ''} />
                    <span class="toolbar-sticky-track" aria-hidden="true"></span>
                    <span>固定工具栏</span>
                  </label>
                </div>
              </div>
            </section>
          </div>
          <div class="settings-menu">
            <button class="header-action header-action--settings" id="toggle-editor-settings" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="editor-settings-panel">
              <span data-demo-icon="editor-settings" aria-hidden="true"></span>
              <span>编辑器设置</span>
            </button>
            <section class="settings-panel" id="editor-settings-panel" role="dialog" aria-labelledby="editor-settings-title" hidden>
              <div class="settings-panel-header">
                <h2 id="editor-settings-title">编辑器设置</h2>
                <button class="settings-close" type="button" aria-label="关闭编辑器设置" data-close-settings>
                  <span data-demo-icon="close" aria-hidden="true"></span>
                </button>
              </div>
              <div class="settings-fields">
                <div class="settings-field">
                  <span class="settings-label">编辑状态</span>
                  <div class="menu-style-control" data-header-control="editable" role="group" aria-label="编辑模式">
                    <button class="menu-style-option" type="button" data-editable-option="true" aria-pressed="true">编辑</button>
                    <button class="menu-style-option" type="button" data-editable-option="false" aria-pressed="false">只读</button>
                  </div>
                </div>
                <div class="settings-field">
                  <span class="settings-label">显示主题</span>
                  <div class="menu-style-control" data-header-control="theme" role="group" aria-label="编辑器主题">
                    <button class="menu-style-option" type="button" data-theme-option="light" aria-pressed="${initialTheme === 'light'}">亮色</button>
                    <button class="menu-style-option" type="button" data-theme-option="dark" aria-pressed="${initialTheme === 'dark'}">暗色</button>
                  </div>
                </div>
                <div class="settings-field">
                  <span class="settings-label">界面语言</span>
                  <div class="menu-style-control" data-header-control="locale" role="group" aria-label="界面语言">
                    <button class="menu-style-option" type="button" data-locale-option="zh-CN" aria-pressed="${initialLocale === 'zh-CN'}">中文</button>
                    <button class="menu-style-option" type="button" data-locale-option="en-US" aria-pressed="${initialLocale === 'en-US'}">English</button>
                  </div>
                </div>
              </div>
            </section>
          </div>
          <button class="header-action header-action--icon" id="copy-html" type="button" title="复制 HTML">
            <span data-demo-icon="copy" aria-hidden="true"></span>
            <span class="header-action-label">复制 HTML</span>
          </button>
        </div>
      </div>
    </header>

    <section class="workspace" data-editor-template="${initialEditorTemplate}" aria-label="文档编辑器">
      <div class="document-heading">
        <span class="document-label">文档</span>
        <input class="document-title" value="产品笔记" aria-label="文档标题" />
        <p class="document-meta">刚刚更新</p>
      </div>
      <div id="editor"></div>
    </section>
  </main>
`

const saveStatus = document.querySelector<HTMLSpanElement>('#save-status')
const copyButton = document.querySelector<HTMLButtonElement>('#copy-html')
const settingsToggles = [...document.querySelectorAll<HTMLButtonElement>('.settings-menu > .header-action')]
const settingsPanels = [...document.querySelectorAll<HTMLElement>('.settings-panel')]
const settingsCloseButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-close-settings]')]
const styleButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-toolbar-style-option]')]
const toolbarSizeButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-toolbar-size-option]')]
const toolbarOverflowButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-toolbar-overflow-option]')]
const toolbarMenuGroupButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-toolbar-menu-group-option]')]
const localeButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-locale-option]')]
const editableButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-editable-option]')]
const themeButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-theme-option]')]
const documentStyleButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-document-style-option]')]
const templateButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-template-option]')]
const toolbarStickySwitch = document.querySelector<HTMLInputElement>('[data-toolbar-sticky]')
const titleInput = document.querySelector<HTMLInputElement>('.document-title')
let saveTimer: number | undefined

function showDemoMenuFeedback(message: string): void {
  if (!saveStatus) return
  window.clearTimeout(saveTimer)
  saveStatus.textContent = message
  saveTimer = window.setTimeout(() => {
    saveStatus.textContent = '所有更改已保存'
  }, 1800)
}

document.querySelector('[data-demo-icon="page-layout"]')?.append(createElement(LayoutGrid, {'aria-hidden': 'true'}))
document.querySelector('[data-demo-icon="toolbar-settings"]')?.append(createElement(Settings2, {'aria-hidden': 'true'}))
document.querySelector('[data-demo-icon="editor-settings"]')?.append(createElement(PenLine, {'aria-hidden': 'true'}))
document.querySelector('[data-demo-icon="copy"]')?.append(createElement(Copy, {'aria-hidden': 'true'}))
document.querySelectorAll('[data-demo-icon="close"]').forEach((element) => element.append(createElement(X, {'aria-hidden': 'true'})))

/** 同步页头的精简摘要，让用户无需展开面板也能确认当前操作对象。 */
function updateConfigurationSummary(): void {
  const toolbarStyle = styleButtons.find((button) => button.getAttribute('aria-pressed') === 'true')?.dataset.toolbarStyleOption as ToolbarStyle | undefined
  const toolbarSize = toolbarSizeButtons.find((button) => button.getAttribute('aria-pressed') === 'true')?.dataset.toolbarSizeOption as ToolbarSize | undefined
  const documentStyle = documentStyleButtons.find((button) => button.getAttribute('aria-pressed') === 'true')?.dataset.documentStyleOption as DocumentStylePreset | undefined
  const editable = editableButtons.find((button) => button.getAttribute('aria-pressed') === 'true')?.dataset.editableOption === 'true'
  const summaryToolbar = document.querySelector('#summary-toolbar')
  const summaryDocumentStyle = document.querySelector('#summary-document-style')
  const summaryEditable = document.querySelector('#summary-editable')
  if (summaryToolbar && toolbarStyle && toolbarSize) summaryToolbar.textContent = `${toolbarStyleLabels[toolbarStyle]} · ${toolbarSizeLabels[toolbarSize]}`
  if (summaryDocumentStyle && documentStyle) summaryDocumentStyle.textContent = documentStyleLabels[documentStyle]
  if (summaryEditable) summaryEditable.textContent = editable ? '编辑' : '只读'
}

function setSettingsOpen(panelId?: string, returnFocus = false): void {
  let triggerToFocus: HTMLButtonElement | undefined
  settingsToggles.forEach((toggle) => {
    const isOpen = toggle.getAttribute('aria-controls') === panelId
    if (!isOpen && toggle.getAttribute('aria-expanded') === 'true') triggerToFocus = toggle
    toggle.setAttribute('aria-expanded', String(isOpen))
  })
  settingsPanels.forEach((panel) => { panel.hidden = panel.id !== panelId })
  document.body.classList.toggle('is-settings-open', Boolean(panelId))
  if (returnFocus) triggerToFocus?.focus()
}

settingsToggles.forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const panelId = toggle.getAttribute('aria-controls') ?? undefined
    setSettingsOpen(toggle.getAttribute('aria-expanded') === 'true' ? undefined : panelId)
  })
})
settingsCloseButtons.forEach((button) => button.addEventListener('click', () => setSettingsOpen(undefined, true)))
document.addEventListener('pointerdown', (event) => {
  const target = event.target as Node | null
  if (target && !settingsPanels.some((panel) => panel.contains(target)) && !settingsToggles.some((toggle) => toggle.contains(target))) {
    setSettingsOpen()
  }
})
document.addEventListener('keydown', (event) => {
  const settingsPanel = settingsPanels.find((panel) => !panel.hidden)
  if (!settingsPanel) return
  if (event.key === 'Escape') {
    setSettingsOpen(undefined, true)
    return
  }
  if (event.key !== 'Tab') return
  const focusable = [...settingsPanel.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hasAttribute('disabled'))
  const first = focusable[0]
  const last = focusable.at(-1)
  if (!first || !last) return
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
})

/** 仅用于 Demo：在约 3 秒内模拟可取消的上传进度。 */
function simulateUploadProgress(signal: AbortSignal, onProgress: (progress: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const duration = 3000
    const startedAt = performance.now()
    let timer: number | undefined

    const cleanup = () => {
      if (timer !== undefined) window.clearInterval(timer)
      signal.removeEventListener('abort', abort)
    }
    const abort = () => {
      cleanup()
      reject(signal.reason ?? new DOMException('上传已取消', 'AbortError'))
    }
    const update = () => {
      const progress = Math.min(100, ((performance.now() - startedAt) / duration) * 100)
      onProgress(progress)
      if (progress < 100) return
      cleanup()
      resolve()
    }

    if (signal.aborted) {
      abort()
      return
    }
    signal.addEventListener('abort', abort, {once: true})
    onProgress(0)
    timer = window.setInterval(update, 100)
  })
}

function createDemoFooter(document: Document, label: string) {
  const footer = document.createElement('footer')
  const editorType = document.createElement('span')
  const context = document.createElement('span')
  const count = document.createElement('span')
  editorType.dataset.editorType = ''
  editorType.textContent = '富文本'
  context.className = 'demo-template-context'
  context.textContent = label
  count.textContent = '0 词 · 0 字符'
  footer.append(editorType, context, count)
  return {footer, count}
}

function createSidebar(document: Document, title: string, items: string[]): HTMLElement {
  const aside = document.createElement('aside')
  const heading = document.createElement('h2')
  const list = document.createElement('ol')
  aside.className = 'demo-template-sidebar'
  aside.setAttribute('aria-label', title)
  heading.textContent = title
  items.forEach((text, index) => {
    const item = document.createElement('li')
    const marker = document.createElement('span')
    marker.textContent = String(index + 1).padStart(2, '0')
    item.append(marker, text)
    list.append(item)
  })
  aside.append(heading, list)
  return aside
}

function createChromeButton(
  document: Document,
  icon: IconNode,
  label: string,
  signal: AbortSignal,
  onClick?: (button: HTMLButtonElement) => void,
): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'demo-template-icon-button'
  button.title = label
  button.setAttribute('aria-label', label)
  button.append(createElement(icon, {'aria-hidden': 'true'}))
  if (onClick) button.addEventListener('click', () => onClick(button), {signal})
  return button
}

function createTencentDocsTemplate(): AiEditorTemplateFactory {
  return ({document}) => {
    const events = new AbortController()
    const root = document.createElement('div')
    const header = document.createElement('header')
    const identity = document.createElement('div')
    const brand = document.createElement('span')
    const title = document.createElement('strong')
    const sync = document.createElement('span')
    const actions = document.createElement('div')
    const toolbar = document.createElement('div')
    const body = document.createElement('div')
    const content = document.createElement('div')
    const sidebar = document.createElement('aside')
    const {footer, count} = createDemoFooter(document, '第 1 页')
    const outline = createSidebar(document, '大纲', [])

    root.className = 'demo-editor-template demo-editor-template--tencent-docs'
    header.className = 'demo-template-product-bar'
    identity.className = 'demo-template-identity'
    brand.className = 'demo-template-brand demo-template-brand--tencent'
    brand.textContent = 'T'
    title.textContent = '产品笔记'
    sync.className = 'demo-template-sync'
    sync.append(createElement(Cloud, {'aria-hidden': 'true'}), ' 已保存')
    identity.append(
      createChromeButton(document, Home, '首页', events.signal),
      brand,
      title,
      createChromeButton(document, Star, '收藏', events.signal),
      createChromeButton(document, FolderOpen, '移动到文件夹', events.signal),
      sync,
    )
    actions.className = 'demo-template-actions'
    const outlineButton = createChromeButton(document, PanelLeft, '显示或隐藏大纲', events.signal, (button) => {
      const hidden = root.classList.toggle('is-outline-hidden')
      button.setAttribute('aria-pressed', String(!hidden))
    })
    outlineButton.setAttribute('aria-pressed', 'true')
    actions.append(
      createChromeButton(document, Search, '查找', events.signal),
      createChromeButton(document, MessageSquareText, '评论', events.signal),
      outlineButton,
    )
    const share = document.createElement('button')
    share.type = 'button'
    share.className = 'demo-template-share'
    share.append(createElement(Share2, {'aria-hidden': 'true'}), ' 分享')
    actions.append(share)
    header.append(identity, actions)
    body.className = 'demo-template-workspace'
    body.append(outline, content, sidebar)
    root.append(header, toolbar, body, footer)
    return {root, toolbar, content, sidebar, footer, count, destroy: () => events.abort()}
  }
}

function createWpsTemplate(): AiEditorTemplateFactory {
  return ({document}) => {
    const events = new AbortController()
    const root = document.createElement('div')
    const header = document.createElement('header')
    const identity = document.createElement('div')
    const brand = document.createElement('span')
    const title = document.createElement('strong')
    const tabs = document.createElement('nav')
    const toolbar = document.createElement('div')
    const body = document.createElement('div')
    const content = document.createElement('div')
    const sidebar = document.createElement('aside')
    const {footer, count} = createDemoFooter(document, '页面 1 / 2')

    root.className = 'demo-editor-template demo-editor-template--wps'
    header.className = 'demo-template-wps-header'
    identity.className = 'demo-template-identity'
    brand.className = 'demo-template-brand demo-template-brand--wps'
    brand.textContent = 'W'
    title.textContent = '产品笔记'
    identity.append(brand, title, createElement(Cloud, {'aria-hidden': 'true'}))
    tabs.className = 'demo-template-wps-tabs'
    ;['开始', '插入', '页面', '引用', '审阅', '视图'].forEach((label, index) => {
      const tab = document.createElement('span')
      tab.textContent = label
      if (index === 0) tab.className = 'is-active'
      tabs.append(tab)
    })
    header.append(identity, tabs)
    body.className = 'demo-template-wps-workspace'
    body.append(content, sidebar)
    const zoom = document.createElement('span')
    zoom.className = 'demo-template-zoom'
    zoom.append(
      createChromeButton(document, ZoomOut, '缩小', events.signal),
      '100%',
      createChromeButton(document, ZoomIn, '放大', events.signal),
      createChromeButton(document, Maximize, '适合窗口', events.signal),
    )
    footer.append(zoom)
    root.append(header, toolbar, body, footer)
    return {root, toolbar, content, sidebar, footer, count, destroy: () => events.abort()}
  }
}

function getEditorTemplate(mode: EditorTemplateMode): AiEditorTemplateFactory | undefined {
  if (mode === 'tencent-docs') return createTencentDocsTemplate()
  if (mode === 'wps') return createWpsTemplate()
  return undefined
}

const restoredTemplateContent = window.sessionStorage.getItem('aieditor-template-content')
window.sessionStorage.removeItem('aieditor-template-content')

const aieditor = new AiEditor({
  element: '#editor',
  template: getEditorTemplate(initialEditorTemplate),
  locale: initialLocale,
  theme: initialTheme,
  documentStyle: initialDocumentStyle,
  // 代码块默认支持 Tab / Shift+Tab；这里显式配置以演示公开选项。
  codeBlock: {
    enableTabIndentation: true,
    tabSize: 2,
  },
  // 官方 TableOfContents 插件负责稳定标题 ID 和目录更新；宿主只负责如何渲染目录。
  tableOfContents: {
    onUpdate: () => queueMicrotask(renderDemoDocumentOutline),
  },
  blockDragMenu: {
    quickInsert: (defaults) => [
      defaults.find((item) => item.id === 'text-style')!,
      defaults.find((item) => item.id === 'table')!,
      defaults.find((item) => item.id === 'image')!,
      defaults.find((item) => item.id === 'video')!,
      {
        key: 'quick-more',
        label: '更多',
        icon: LayoutGrid,
        items: [
          'attachment',
          'bullet-list',
          {
            key: 'quick-format',
            label: '格式',
            items: ['underline', 'horizontal-rule'],
          },
        ],
      },
      '|',
      {
        id: 'notice',
        label: '通知块',
        icon: MessageSquareText,
        content: '<blockquote><p>请输入通知内容</p></blockquote>',
      },
    ],
  },
  // Demo 用 3 秒进度和临时 blob URL 模拟上传；生产环境应改为真实存储服务。
  uploader: {
    accept: {
      image: 'image/*',
      audio: 'audio/*',
      video: 'video/*',
      attachment: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip',
    },
    maxSize: { image: 10 * 1024 * 1024, audio: 50 * 1024 * 1024, video: 200 * 1024 * 1024, attachment: 50 * 1024 * 1024 },
    upload: async (file, { signal, onProgress }) => {
      await simulateUploadProgress(signal, onProgress)
      return {url: URL.createObjectURL(file), title: file.name, name: file.name, mimeType: file.type, size: file.size}
    },
  },
  toolbar: {
    style: initialToolbarStyle,
    size: initialToolbarSize,
    overflow: initialToolbarOverflow,
    sticky: initialToolbarSticky,
    menus: (defaults) => {
      defaultToolbarMenuKeys = defaults.map((item) => item.id)
      return createToolbarMenuConfig(initialToolbarMenuGroupMode)
    },
  },
  bubbleMenu: {
    items: [
      'bubble-ai',
      'bold',
      'italic',
      'underline',
      'strike',
      'code',
      '|',
      {
        type: 'button',
        key: 'demo-book-title',
        label: '添加书名号',
        tip: '为选中文字添加书名号',
        icon: BookOpen,
        onClick: ({editor}) => {
          const {from, to} = editor.state.selection
          const text = editor.state.doc.textBetween(from, to, ' ')
          if (!text) return
          editor.chain().focus().insertContentAt({from, to}, `《${text}》`).run()
          showDemoMenuFeedback('已添加书名号')
        },
        isEnabled: ({editor}) => editor.isEditable && !editor.state.selection.empty,
      },
      'bubble-link',
      'clear-formatting',
    ],
  },
  aiChat: {
    welcomeMessage: '你好，我是 **AI 助手**。\n\n我可以帮你：\n\n- 优化表达\n- 总结内容\n- 提出编辑建议',
  },
  onMentionQuery: (query) => [
    {id: 1, label: '王小明', avatar: 'https://i.pravatar.cc/64?img=12'},
    {id: 2, label: '李华', avatar: 'https://i.pravatar.cc/64?img=47'},
    {id: 3, label: '产品团队'},
    {id: 4, label: '设计团队'},
    {id: 5, label: '工程团队'},
  ].filter((item) => item.label.toLowerCase().startsWith(query.toLowerCase())).slice(0, 5),
  textAlignments: { indicatorPosition: 'end' },
  ai: {
    provider: 'openai',
    model: 'deepseek-chat',
    baseURL: new URL('/api/deepseek', window.location.origin).toString(),
    apiKey: 'managed-by-local-vite-proxy',
    dangerouslyAllowBrowser: true,
    timeout: 30_000,
    maxRetries: 1,
  },
  content: restoredTemplateContent ?? `
    <h1>更从容地写作</h1>
    <p>AiEditor 把需要的工具放在触手可及的位置，同时尽量减少干扰。选择一段文字或另起一行，即可体验丰富的格式控制。</p>
    <h2>什么是优秀的编辑器？</h2>
    <p>好的写作工具几乎让人感觉不到它的存在。它提供清晰的结构，却不会打断你的思路。</p>
    <h2>代码块与语法高亮</h2>
    <p>下面的示例创建一个编辑器实例，并写入初始内容。</p>
    <pre><code class="language-typescript">import { AiEditor } from 'aieditor'

const editor = new AiEditor({
  element: '#editor',
  content: '&lt;p&gt;Hello AiEditor&lt;/p&gt;',
})
    </code></pre>
    <h2>丰富内容</h2>
    <p>开源核心支持表格、任务列表、代码块、公式、媒体和自定义扩展。</p>
    <h2>项目路线图</h2>
    <p>使用紧凑的表格，让后续计划更容易浏览和编辑。</p>
    <table>
      <thead>
        <tr>
          <th>阶段</th>
          <th>负责人</th>
          <th>状态</th>
          <th>目标日期</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>调研</td>
          <td>产品团队</td>
          <td>已完成</td>
          <td>5 月 10 日</td>
        </tr>
        <tr>
          <td>原型</td>
          <td>设计团队</td>
          <td>进行中</td>
          <td>5 月 24 日</td>
        </tr>
        <tr>
          <td>发布</td>
          <td>工程团队</td>
          <td>已计划</td>
          <td>6 月 7 日</td>
        </tr>
      </tbody>
    </table>
    <img data-image-type="block" src="https://placehold.co/600x400" alt="AiEditor 块级图片示例" />
    <p>行内图片 <img data-image-type="inline" src="https://placehold.co/120x80" alt="小型行内图片示例" width="72" /> 可以直接出现在句子中。</p>
    <h2>音频与视频</h2>
    <p>媒体元素保留浏览器原生播放控件，并可从左右两侧调整尺寸。</p>
    <audio src="https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3" title="恐龙吼叫音频" data-width="420" controls></audio>
    <video src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" title="花朵绽放视频" data-width="600" controls playsinline></video>
    <blockquote><p>优秀的设计是尽可能少的设计。</p></blockquote>
    <ul>
      <li>清晰的信息层级</li>
      <li>可靠的键盘快捷键</li>
      <li>简洁、可移植的 HTML</li>
    </ul>
    <p>本文档中的所有内容均可编辑，现在就开始创作吧。</p>
  `,
  onUpdate: () => {
    if (!saveStatus) return
    saveStatus.textContent = '正在保存……'
    window.clearTimeout(saveTimer)
    saveTimer = window.setTimeout(() => {
      saveStatus.textContent = '所有更改已保存'
    }, 500)
  },
  onSelectionUpdate: (editor) => updateDemoOutlineActive(editor.state.selection.from),
})

function flattenDocumentOutline(items: DocumentOutlineItem[]): DocumentOutlineItem[] {
  return items.flatMap((item) => [item, ...flattenDocumentOutline(item.children)])
}

function updateDemoOutlineActive(position: number): void {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-outline-from]')]
  let active: HTMLButtonElement | undefined
  buttons.forEach((button) => {
    button.classList.remove('is-active')
    if (Number(button.dataset.outlineFrom) <= position) active = button
  })
  active?.classList.add('is-active')
}

function renderDemoDocumentOutline(): void {
  const list = document.querySelector<HTMLOListElement>('.demo-template-sidebar ol')
  if (!list) return
  const selection = aieditor.editor.state.selection.from
  const fragment = document.createDocumentFragment()
  flattenDocumentOutline(aieditor.getDocumentOutline()).forEach((item, index) => {
    const row = document.createElement('li')
    const button = document.createElement('button')
    const marker = document.createElement('span')
    button.type = 'button'
    button.dataset.outlineFrom = String(item.position.from)
    button.dataset.outlineTo = String(item.position.to)
    button.style.setProperty('--demo-outline-depth', String(item.level - 1))
    button.title = item.text
    marker.textContent = String(index + 1).padStart(2, '0')
    button.append(marker, item.text)
    button.addEventListener('click', () => {
      aieditor.scrollToDocumentOutline(item)
      updateDemoOutlineActive(item.position.from)
    })
    row.append(button)
    fragment.append(row)
  })
  list.replaceChildren(fragment)
  updateDemoOutlineActive(selection)
}

renderDemoDocumentOutline()

styleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const style = button.dataset.toolbarStyleOption as ToolbarStyle
    aieditor.setToolbarStyle(style)
    window.localStorage.setItem('aieditor-toolbar-style', style)
    styleButtons.forEach((option) => option.setAttribute('aria-pressed', String(option === button)))
    updateConfigurationSummary()
  })
})

toolbarSizeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const size = button.dataset.toolbarSizeOption as ToolbarSize
    aieditor.setToolbarSize(size)
    window.localStorage.setItem('aieditor-toolbar-size', size)
    toolbarSizeButtons.forEach((option) => option.setAttribute('aria-pressed', String(option === button)))
    updateConfigurationSummary()
  })
})

toolbarOverflowButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const overflow = button.dataset.toolbarOverflowOption as ToolbarOverflow
    aieditor.setToolbarOverflow(overflow)
    window.localStorage.setItem('aieditor-toolbar-overflow', overflow)
    toolbarOverflowButtons.forEach((option) => option.setAttribute('aria-pressed', String(option === button)))
  })
})

toolbarMenuGroupButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const mode = button.dataset.toolbarMenuGroupOption as ToolbarMenuGroupMode
    aieditor.setMenuItems(createToolbarMenuConfig(mode))
    window.localStorage.setItem('aieditor-toolbar-menu-groups', mode)
    toolbarMenuGroupButtons.forEach((option) => option.setAttribute('aria-pressed', String(option === button)))
  })
})

templateButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const mode = button.dataset.templateOption as EditorTemplateMode
    if (mode === initialEditorTemplate) return
    window.sessionStorage.setItem('aieditor-template-content', aieditor.getHTML())
    window.localStorage.setItem('aieditor-template', mode)
    if (mode === 'tencent-docs') {
      window.localStorage.setItem('aieditor-toolbar-style', 'compact')
      window.localStorage.setItem('aieditor-toolbar-size', 'default')
    } else if (mode === 'wps') {
      window.localStorage.setItem('aieditor-toolbar-style', 'ribbon')
      window.localStorage.setItem('aieditor-toolbar-size', 'large')
    }
    templateButtons.forEach((option) => option.setAttribute('aria-pressed', String(option === button)))
    window.location.reload()
  })
})

toolbarStickySwitch?.addEventListener('change', () => {
  aieditor.setToolbarSticky(toolbarStickySwitch.checked)
  window.localStorage.setItem('aieditor-toolbar-sticky', String(toolbarStickySwitch.checked))
})

localeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const locale = button.dataset.localeOption as AiEditorLocale
    aieditor.setLocale(locale)
    window.localStorage.setItem('aieditor-locale', locale)
    localeButtons.forEach((option) => option.setAttribute('aria-pressed', String(option === button)))
  })
})

editableButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const editable = button.dataset.editableOption === 'true'
    aieditor.setEditable(editable)
    if (titleInput) titleInput.readOnly = !editable
    editableButtons.forEach((option) => option.setAttribute('aria-pressed', String(option === button)))
    updateConfigurationSummary()
  })
})

themeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const theme = button.dataset.themeOption as AiEditorTheme
    aieditor.setTheme(theme)
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('aieditor-theme', theme)
    themeButtons.forEach((option) => option.setAttribute('aria-pressed', String(option === button)))
  })
})

documentStyleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const documentStyle = button.dataset.documentStyleOption as DocumentStylePreset
    aieditor.setDocumentStyle(documentStyle)
    window.localStorage.setItem('aieditor-document-style', documentStyle)
    documentStyleButtons.forEach((option) => option.setAttribute('aria-pressed', String(option === button)))
    updateConfigurationSummary()
  })
})

copyButton?.addEventListener('click', async () => {
  await navigator.clipboard.writeText(aieditor.getHTML())
  const label = copyButton.querySelector('.header-action-label')
  if (label) label.textContent = '已复制'
  copyButton.title = '已复制'
  window.setTimeout(() => {
    if (label) label.textContent = '复制 HTML'
    copyButton.title = '复制 HTML'
  }, 1400)
})

// 暴露示例实例，便于在浏览器控制台中调试。
window.aieditor = aieditor
