import {Extension, type Editor} from '@tiptap/core'
import {FileHandlePlugin} from '@tiptap/extension-file-handler'
import {AudioLines, FileText, Image as ImageIcon, Video as VideoIcon, X, createElement} from 'lucide'
import {Plugin, PluginKey} from '@tiptap/pm/state'
import {Decoration, DecorationSet} from '@tiptap/pm/view'
import {formatBytes, matchesAccept, UploadError, type UploadMediaType, type UploadProgress, type UploadResult, type Uploader} from '../../uploader'

type Translate = (value: string) => string
type UploadState = 'queued' | 'uploading' | 'error'

/** 单个待上传文件的运行时状态；位置会随文档事务持续映射。 */
interface MediaUploadTask {
  id: string
  file: File
  type?: UploadMediaType
  pos: number
  side: number
  state: UploadState
  progress?: number
  error?: string
  controller: AbortController
  element?: HTMLElement
  previewUrl?: string
  remove: () => void
}

/** 通过事务 meta 增删上传占位，不把临时状态写入文档 schema。 */
interface MediaUploadMeta {
  add?: {task: MediaUploadTask; pos: number; side: number}
  remove?: string
}

/** 拖放上传扩展依赖的上传器和本地化函数。 */
export interface MediaDropUploadOptions {
  uploader?: Uploader
  translate: Translate
}

const mediaUploadPluginKey = new PluginKey<DecorationSet>('mediaDropUploads')
let mediaUploadSequence = 0

/** 使用官方 FileHandler 捕获外部文件，并在落点显示上传进度占位。 */
export const MediaDropUpload = Extension.create<MediaDropUploadOptions>({
  name: 'mediaDropUpload',

  addOptions() {
    return {
      uploader: undefined,
      translate: (value) => value,
    }
  },

  addProseMirrorPlugins() {
    const uploader = this.options.uploader
    if (!uploader) return []
    const translate = this.options.translate
    const tasks = new Map<string, MediaUploadTask>()

    const decorations = new Plugin<DecorationSet>({
      key: mediaUploadPluginKey,
      state: {
        init: () => DecorationSet.empty,
        apply(transaction, current) {
          if (transaction.docChanged) {
            // 用户继续编辑时同步映射每个任务落点，上传完成后仍插入原来的逻辑位置。
            tasks.forEach((task) => {
              task.pos = transaction.mapping.map(task.pos, task.side)
            })
          }
          let next = current.map(transaction.mapping, transaction.doc)
          const meta = transaction.getMeta(mediaUploadPluginKey) as MediaUploadMeta | undefined
          if (meta?.add) {
            const {task, side} = meta.add
            const pos = Math.max(0, Math.min(meta.add.pos, transaction.doc.content.size))
            task.pos = pos
            task.side = side
            next = next.add(transaction.doc, [Decoration.widget(
              pos,
              () => createUploadElement(task, translate),
              {uploadId: task.id, side},
            )])
          }
          if (meta?.remove) {
            next = next.remove(next.find(undefined, undefined, (spec) => spec.uploadId === meta.remove))
          }
          // ProseMirror 在部分映射中可能移除 widget；仍存活的任务需要补回占位。
          const existing = new Set(next.find().map((decoration) => decoration.spec.uploadId as string | undefined))
          const missing = Array.from(tasks.values())
            .filter((task) => !existing.has(task.id))
            .map((task) => Decoration.widget(
              Math.max(0, Math.min(task.pos, transaction.doc.content.size)),
              () => createUploadElement(task, translate),
              {uploadId: task.id, side: task.side},
            ))
          if (missing.length) next = next.add(transaction.doc, missing)
          return next
        },
      },
      props: {
        decorations: (state) => mediaUploadPluginKey.getState(state),
      },
      view: () => ({
        destroy: () => {
          tasks.forEach((task) => {
            task.controller.abort()
            releaseTaskPreview(task)
          })
          tasks.clear()
        },
      }),
    })

    return [
      decorations,
      FileHandlePlugin({
        key: new PluginKey('mediaDropUploadFileHandler'),
        editor: this.editor,
        onDrop: (editor, files, pos) => {
          if (!editor.isEditable) return
          const queued = files.map((file, index) => createTask(editor, file, pos, index, uploader, tasks, translate))
          void uploadTasksInOrder(editor, queued, uploader, tasks, translate)
        },
        onPaste: (editor, files) => {
          if (!editor.isEditable) return
          const pos = editor.state.selection.from
          const queued = files.map((file, index) => createTask(editor, file, pos, index, uploader, tasks, translate))
          void uploadTasksInOrder(editor, queued, uploader, tasks, translate)
        },
        consumePasteEvent: true,
      }),
    ]
  },
})

/** 创建上传任务、文件预览和对应的占位 Decoration。 */
function createTask(
  editor: Editor,
  file: File,
  pos: number,
  index: number,
  uploader: Uploader,
  tasks: Map<string, MediaUploadTask>,
  translate: Translate,
): MediaUploadTask {
  const id = `media-upload-${++mediaUploadSequence}`
  const type = getMediaType(file, uploader)
  const task: MediaUploadTask = {
    id,
    file,
    type,
    pos,
    side: index + 1,
    state: 'queued',
    controller: new AbortController(),
    previewUrl: type === 'image' || type === 'video' ? createPreviewUrl(file) : undefined,
    remove: () => removeTask(editor, id, tasks),
  }
  if (!task.type) {
    task.state = 'error'
    task.error = translate('Unsupported file type.')
  }
  tasks.set(id, task)
  editor.view.dispatch(editor.state.tr.setMeta(mediaUploadPluginKey, {
    add: {task, pos, side: index + 1},
  } satisfies MediaUploadMeta))
  return task
}

/**
 * 按拖放文件顺序串行上传。
 * 串行处理可维持用户选择顺序，也避免多个大文件同时占满带宽。
 */
async function uploadTasksInOrder(
  editor: Editor,
  tasksToUpload: MediaUploadTask[],
  uploader: Uploader,
  tasks: Map<string, MediaUploadTask>,
  translate: Translate,
): Promise<void> {
  for (const task of tasksToUpload) {
    if (!task.type || task.controller.signal.aborted || editor.isDestroyed) continue
    task.state = 'uploading'
    task.progress = 0
    updateUploadElement(task, translate)
    try {
      const result = await uploader.uploadFile(task.file, task.type, {
        signal: task.controller.signal,
        onProgress: (progress) => {
          task.progress = getProgressPercent(progress)
          updateUploadElement(task, translate)
        },
      })
      if (task.controller.signal.aborted || editor.isDestroyed) continue
      if (!editor.isEditable) {
        // 上传期间切换为只读时不再写入文档，只清理临时占位。
        removeTask(editor, task.id, tasks)
        continue
      }
      if (!insertUploadedMedia(editor, task, result)) {
        throw new Error(translate('Could not insert uploaded file.'))
      }
      removeTask(editor, task.id, tasks)
    } catch (error) {
      if (task.controller.signal.aborted || editor.isDestroyed) {
        removeTask(editor, task.id, tasks)
        continue
      }
      task.state = 'error'
      task.error = getErrorMessage(error, translate)
      updateUploadElement(task, translate)
    }
  }
}

/** 把上传结果转换成对应媒体节点，并插入任务占位的实时位置。 */
function insertUploadedMedia(editor: Editor, task: MediaUploadTask, result: UploadResult): boolean {
  const decoration = mediaUploadPluginKey.getState(editor.state)
    ?.find(undefined, undefined, (spec) => spec.uploadId === task.id)[0]
  if (!decoration || !task.type) return false
  const content = task.type === 'image'
    ? {type: 'image', attrs: {src: result.url, alt: result.alt ?? task.file.name}}
    : task.type === 'audio'
      ? {type: 'audio', attrs: {src: result.url, title: result.title ?? task.file.name}}
      : task.type === 'video'
        ? {type: 'video', attrs: {src: result.url, poster: result.poster ?? null, title: result.title ?? task.file.name}}
        : {
          type: 'attachment',
          attrs: {
            url: result.url,
            name: result.name ?? result.title ?? task.file.name,
            size: result.size ?? task.file.size,
            mimeType: result.mimeType ?? task.file.type ?? null,
          },
        }
  return editor.commands.insertContentAt(decoration.from, content, {updateSelection: false})
}

/** 构建不可编辑的上传状态组件，并把 DOM 引用保存到任务中供进度更新。 */
function createUploadElement(task: MediaUploadTask, translate: Translate): HTMLElement {
  const element = document.createElement('span')
  const visual = createUploadVisual(task)
  const body = document.createElement('span')
  const heading = document.createElement('span')
  const name = document.createElement('span')
  const status = document.createElement('span')
  const track = document.createElement('span')
  const bar = document.createElement('span')
  const message = document.createElement('span')
  const action = document.createElement('button')

  element.className = 'aieditor__drop-upload'
  element.contentEditable = 'false'
  element.setAttribute('role', 'status')
  element.setAttribute('aria-live', 'polite')
  element.dataset.uploadType = task.type ?? 'attachment'
  body.className = 'aieditor__drop-upload-body'
  heading.className = 'aieditor__drop-upload-heading'
  name.className = 'aieditor__drop-upload-name'
  name.textContent = task.file.name
  status.className = 'aieditor__drop-upload-status'
  track.className = 'aieditor__drop-upload-track'
  track.setAttribute('role', 'progressbar')
  track.setAttribute('aria-valuemin', '0')
  track.setAttribute('aria-valuemax', '100')
  bar.className = 'aieditor__drop-upload-bar'
  message.className = 'aieditor__drop-upload-message'
  action.type = 'button'
  action.className = 'aieditor__drop-upload-action'
  action.append(createElement(X, {'aria-hidden': 'true'}))
  action.addEventListener('mousedown', (event) => event.preventDefault())
  action.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    task.controller.abort()
    task.remove()
  })
  heading.append(name, status)
  track.append(bar)
  body.append(heading, track, message)
  element.append(visual, body, action)
  task.element = element
  updateUploadElement(task, translate)
  return element
}

/** 根据文件类型创建缩略图、媒体图标或音频波形占位。 */
function createUploadVisual(task: MediaUploadTask): HTMLElement {
  const visual = document.createElement('span')
  const icon = document.createElement('span')
  const Icon = task.type === 'audio'
    ? AudioLines
    : task.type === 'video'
      ? VideoIcon
      : task.type === 'image'
        ? ImageIcon
        : FileText

  visual.className = 'aieditor__drop-upload-visual'
  visual.setAttribute('aria-hidden', 'true')
  icon.className = 'aieditor__drop-upload-icon'
  icon.append(createElement(Icon))

  if (task.previewUrl && task.type === 'image') {
    const image = document.createElement('img')
    image.className = 'aieditor__drop-upload-preview'
    image.src = task.previewUrl
    image.alt = ''
    visual.append(image)
  } else if (task.previewUrl && task.type === 'video') {
    const video = document.createElement('video')
    video.className = 'aieditor__drop-upload-preview'
    video.src = task.previewUrl
    video.muted = true
    video.preload = 'metadata'
    video.playsInline = true
    visual.append(video)
  }

  visual.append(icon)
  if (task.type === 'audio') {
    const waveform = document.createElement('span')
    waveform.className = 'aieditor__drop-upload-waveform'
    for (let index = 0; index < 11; index += 1) waveform.append(document.createElement('i'))
    visual.append(waveform)
  }
  return visual
}

/** 将任务状态增量同步到现有占位 DOM，避免每次进度变化重建 Decoration。 */
function updateUploadElement(task: MediaUploadTask, translate: Translate): void {
  const element = task.element
  if (!element) return
  const progress = Math.round(Math.min(100, Math.max(0, task.progress ?? 0)))
  const status = element.querySelector<HTMLElement>('.aieditor__drop-upload-status')
  const track = element.querySelector<HTMLElement>('.aieditor__drop-upload-track')
  const bar = element.querySelector<HTMLElement>('.aieditor__drop-upload-bar')
  const message = element.querySelector<HTMLElement>('.aieditor__drop-upload-message')
  const action = element.querySelector<HTMLButtonElement>('.aieditor__drop-upload-action')
  const uploading = task.state === 'uploading'
  const error = task.state === 'error'

  element.dataset.uploadState = task.state
  if (status) status.textContent = uploading ? `${progress}%` : translate(error ? 'Upload failed' : 'Waiting to upload')
  if (track) {
    track.hidden = !uploading
    track.setAttribute('aria-valuenow', String(progress))
    track.setAttribute('aria-label', translate('Uploading...'))
  }
  if (bar) bar.style.width = `${progress}%`
  if (message) {
    message.hidden = !error
    message.textContent = task.error ?? ''
  }
  if (action) {
    const label = translate(error ? 'Dismiss upload error' : 'Cancel upload')
    action.title = label
    action.setAttribute('aria-label', label)
  }
}

/** 释放任务资源并通过事务移除对应占位。 */
function removeTask(editor: Editor, id: string, tasks: Map<string, MediaUploadTask>): void {
  const task = tasks.get(id)
  if (!task) return
  releaseTaskPreview(task)
  tasks.delete(id)
  if (editor.isDestroyed) return
  editor.view.dispatch(editor.state.tr.setMeta(mediaUploadPluginKey, {remove: id} satisfies MediaUploadMeta))
}

/** 为本地图片或视频创建临时预览 URL。 */
function createPreviewUrl(file: File): string | undefined {
  return typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : undefined
}

/** 回收 Object URL，避免连续拖放大文件造成内存泄漏。 */
function releaseTaskPreview(task: MediaUploadTask): void {
  if (!task.previewUrl) return
  URL.revokeObjectURL(task.previewUrl)
  task.previewUrl = undefined
}

/** 根据 MIME 与上传器 accept 规则选择目标节点类型。 */
function getMediaType(file: File, uploader: Uploader): UploadMediaType | undefined {
  if (file.type.toLowerCase().startsWith('image/')) return 'image'
  if (file.type.toLowerCase().startsWith('audio/')) return 'audio'
  if (file.type.toLowerCase().startsWith('video/')) return 'video'
  if (matchesAccept(file, uploader.getAccept('attachment'))) return 'attachment'
  return undefined
}

/** 兼容百分比和 loaded/total 两种上传进度协议。 */
function getProgressPercent(progress: number | UploadProgress): number {
  if (typeof progress === 'number') return progress
  return progress.percent ?? (progress.total ? (progress.loaded / progress.total) * 100 : 0)
}

/** 把结构化上传错误转换成用户可读文案。 */
function getErrorMessage(error: unknown, translate: Translate): string {
  if (error instanceof UploadError && error.code === 'file-too-large' && error.limit) {
    return `${translate('File is too large. Maximum size:')} ${formatBytes(error.limit)}`
  }
  if (error instanceof UploadError && error.code === 'invalid-file-type') return translate('Unsupported file type.')
  if (error instanceof UploadError && error.code === 'empty-url') return translate('Uploader returned an empty URL.')
  return error instanceof Error ? error.message : translate('Upload failed')
}
