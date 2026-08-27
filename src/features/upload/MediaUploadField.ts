import {createElement, Upload} from 'lucide'
import {formatBytes, UploadError, type UploadMediaType, type UploadProgress, type UploadResult, type Uploader} from '../../uploader'

/** 媒体上传字段与具体菜单之间的协作接口。 */
interface MediaUploadFieldOptions {
  uploader: Uploader
  type: UploadMediaType
  translate: (value: string) => string
  onUploaded: (result: UploadResult, file: File) => void
  onBusyChange?: (busy: boolean) => void
}

/** 图片、音频、视频和附件弹窗共用的文件选择、进度、取消与错误状态。 */
export class MediaUploadField {
  readonly element: HTMLElement
  private readonly label: HTMLLabelElement
  private readonly input: HTMLInputElement
  private readonly status: HTMLElement
  private readonly options: MediaUploadFieldOptions
  private controller: AbortController | undefined
  private destroyed = false

  constructor(options: MediaUploadFieldOptions) {
    this.options = options
    const element = document.createElement('div')
    const label = document.createElement('label')
    const input = document.createElement('input')
    const status = document.createElement('span')

    element.className = 'aieditor__upload-field'
    label.className = 'aieditor__button aieditor__button--quiet aieditor__upload-button'
    label.append(createElement(Upload, {'aria-hidden': 'true'}), document.createTextNode(options.translate(`Upload ${options.type}`)))
    input.type = 'file'
    input.accept = options.uploader.getAccept(options.type)
    input.className = 'aieditor__upload-input'
    input.setAttribute('aria-label', options.translate(`Upload ${options.type}`))
    status.className = 'aieditor__upload-status'
    status.setAttribute('role', 'status')
    status.setAttribute('aria-live', 'polite')
    label.append(input)
    element.append(label, status)

    input.addEventListener('change', () => {
      const file = input.files?.[0]
      if (file) void this.upload(file)
    })
    this.element = element
    this.label = label
    this.input = input
    this.status = status
  }

  /** 取消当前请求并恢复文件输入可用状态。 */
  cancel(): void {
    this.controller?.abort()
    this.controller = undefined
    this.setBusy(false)
    this.input.value = ''
  }

  /** 供对话框重新打开时清除上一次上传结果和提示。 */
  reset(): void {
    this.cancel()
    this.input.value = ''
    this.status.textContent = ''
    this.status.classList.remove('is-error', 'is-success')
  }

  /** 标记实例失效，确保迟到的异步结果不会再更新 DOM。 */
  destroy(): void {
    this.destroyed = true
    this.cancel()
    this.element.remove()
  }

  /** 为每次文件选择建立独立 AbortController，并处理完成、失败和竞态清理。 */
  private async upload(file: File): Promise<void> {
    this.cancel()
    const controller = new AbortController()
    this.controller = controller
    this.setBusy(true)
    this.setStatus(this.options.translate('Uploading...'))
    try {
      const result = await this.options.uploader.uploadFile(file, this.options.type, {
        signal: controller.signal,
        onProgress: (progress) => this.showProgress(progress),
      })
      // 对话框可能已关闭或开始了下一次上传，旧请求的结果必须丢弃。
      if (this.destroyed || controller.signal.aborted) return
      this.options.onUploaded(result, file)
      this.setStatus(this.options.translate('Upload complete'), 'is-success')
    } catch (error) {
      if (this.destroyed || controller.signal.aborted) return
      this.setStatus(this.getErrorMessage(error), 'is-error')
    } finally {
      if (this.controller === controller) this.controller = undefined
      if (!this.destroyed) {
        this.setBusy(false)
        this.input.value = ''
      }
    }
  }

  /** 兼容数字百分比和字节进度对象，并将显示值限制在 0 到 100。 */
  private showProgress(progress: number | UploadProgress): void {
    const percent = typeof progress === 'number'
      ? progress
      : progress.percent ?? (progress.total ? (progress.loaded / progress.total) * 100 : undefined)
    const suffix = percent === undefined ? '' : ` ${Math.round(Math.min(100, Math.max(0, percent)))}%`
    this.setStatus(`${this.options.translate('Uploading...')}${suffix}`)
  }

  /** 同步 live region 文本及成功/失败视觉状态。 */
  private setStatus(message: string, state?: 'is-error' | 'is-success'): void {
    this.status.textContent = message
    this.status.classList.toggle('is-error', state === 'is-error')
    this.status.classList.toggle('is-success', state === 'is-success')
  }

  /** 上传期间锁定文件选择，并通知宿主同步禁用提交按钮。 */
  private setBusy(busy: boolean): void {
    this.input.disabled = busy
    this.label.classList.toggle('is-disabled', busy)
    this.label.setAttribute('aria-disabled', String(busy))
    this.options.onBusyChange?.(busy)
  }

  /** 将标准上传错误转换为可本地化提示，未知错误保留宿主消息。 */
  private getErrorMessage(error: unknown): string {
    if (error instanceof UploadError && error.code === 'file-too-large' && error.limit) {
      return `${this.options.translate('File is too large. Maximum size:')} ${formatBytes(error.limit)}`
    }
    if (error instanceof UploadError && error.code === 'invalid-file-type') {
      return this.options.translate('Unsupported file type.')
    }
    if (error instanceof UploadError && error.code === 'empty-url') {
      return this.options.translate('Uploader returned an empty URL.')
    }
    return error instanceof Error ? error.message : this.options.translate('Upload failed')
  }
}
