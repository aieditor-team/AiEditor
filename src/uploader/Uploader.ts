/** 编辑器内置上传入口支持的媒体分类，用于选择校验规则和宿主上传策略。 */
export type UploadMediaType = 'image' | 'audio' | 'video' | 'attachment'

/** 上传过程的进度快照；不便计算百分比时可只提供已上传字节数。 */
export interface UploadProgress {
    loaded: number
    total?: number
    percent?: number
}

/** 传给宿主上传函数的运行时上下文。 */
export interface UploadContext {
    type: UploadMediaType
    signal: AbortSignal
    /** 可传 0-100 的数字，或包含 loaded/total 的进度对象。 */
    onProgress: (progress: number | UploadProgress) => void
}

/** 上传器在调用宿主服务前后能够确定的标准错误类型。 */
export type UploadErrorCode = 'file-too-large' | 'invalid-file-type' | 'empty-url'

/** 带机器可读错误码的上传异常，便于 UI 显示本地化提示。 */
export class UploadError extends Error {
    readonly code: UploadErrorCode
    readonly limit: number | undefined

    constructor(code: UploadErrorCode, message: string, limit?: number) {
        super(message)
        this.name = 'UploadError'
        this.code = code
        this.limit = limit
    }
}

/** 宿主上传完成后返回给编辑器的标准化媒体信息。 */
export interface UploadResult {
    url: string
    alt?: string
    title?: string
    poster?: string
    name?: string
    mimeType?: string
    size?: number
}

/**
 * 上传器配置。
 * upload 负责真正的网络请求；accept 和 maxSize 只负责编辑器侧的前置校验。
 */
export interface UploaderOptions {
    upload: (file: File, context: UploadContext) => Promise<string | UploadResult>
    accept?: Partial<Record<UploadMediaType, string>>
    maxSize?: number | Partial<Record<UploadMediaType, number>>
}

const defaultAccept: Record<UploadMediaType, string> = {
    image: 'image/*',
    audio: 'audio/*',
    video: 'video/*',
    attachment: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z',
}

/** 与具体存储服务无关的上传器；宿主只需实现 upload 回调。 */
export class Uploader {
    private readonly options: UploaderOptions

    constructor(options: UploaderOptions) {
        this.options = options
    }

    /** 获取指定媒体类型的文件选择规则，未配置时使用编辑器默认值。 */
    getAccept(type: UploadMediaType): string {
        return this.options.accept?.[type] ?? defaultAccept[type]
    }

    /** 获取指定媒体类型的字节上限；数字配置会统一作用于所有类型。 */
    getMaxSize(type: UploadMediaType): number | undefined {
        return typeof this.options.maxSize === 'number'
            ? this.options.maxSize
            : this.options.maxSize?.[type]
    }

    /**
     * 校验并上传单个文件，将宿主允许的字符串简写统一转换成 UploadResult。
     * AbortSignal 由调用方传入时沿用调用方生命周期，否则创建一个始终有效的内部信号。
     */
    async uploadFile(
        file: File,
        type: UploadMediaType,
        options: { signal?: AbortSignal; onProgress?: (progress: number | UploadProgress) => void } = {},
    ): Promise<UploadResult> {
        // 在发起网络请求前完成体积和 MIME/扩展名校验，避免无效文件占用上传带宽。
        const maxSize = this.getMaxSize(type)
        if (maxSize && file.size > maxSize) {
            throw new UploadError('file-too-large', `File exceeds the ${formatBytes(maxSize)} size limit.`, maxSize)
        }
        if (!matchesAccept(file, this.getAccept(type))) throw new UploadError('invalid-file-type', 'Unsupported file type.')

        const controller = options.signal ? undefined : new AbortController()
        const result = await this.options.upload(file, {
            type,
            signal: options.signal ?? controller!.signal,
            onProgress: options.onProgress ?? (() => undefined),
        })
        // 字符串是便捷返回格式；最终始终以对象返回，并拒绝不可插入文档的空地址。
        const normalized = typeof result === 'string' ? {url: result} : result
        if (!normalized.url?.trim()) throw new UploadError('empty-url', 'Uploader returned an empty URL.')
        return {...normalized, url: normalized.url.trim()}
    }
}

/** 将字节数格式化为适合错误提示展示的紧凑文本。 */
export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 ** 2) return `${Number((bytes / 1024).toFixed(1))} KB`
    return `${Number((bytes / 1024 ** 2).toFixed(1))} MB`
}

/**
 * 按 input[type=file] 的常见 accept 语义匹配文件。
 * 支持扩展名、完整 MIME 和 image/* 形式的 MIME 通配符。
 */
export function matchesAccept(file: File, accept: string): boolean {
    const rules = accept.split(',').map((rule) => rule.trim().toLowerCase()).filter(Boolean)
    if (!rules.length) return true
    const name = file.name.toLowerCase()
    const mime = file.type.toLowerCase()
    return rules.some((rule) => {
        if (rule.startsWith('.')) return name.endsWith(rule)
        if (rule.endsWith('/*')) return mime.startsWith(rule.slice(0, -1))
        return mime === rule
    })
}
