import {describe, expect, it, vi} from 'vitest'
import {formatBytes, matchesAccept, UploadError, Uploader} from '../../src/uploader/Uploader'

describe('Uploader', () => {
    it('校验 MIME、通配符和扩展名', () => {
        expect(matchesAccept(new File(['x'], 'photo.PNG', {type: 'image/png'}), 'image/*')).toBe(true)
        expect(matchesAccept(new File(['x'], 'report.PDF'), '.pdf,.docx')).toBe(true)
        expect(matchesAccept(new File(['x'], 'script.js', {type: 'text/javascript'}), '.pdf')).toBe(false)
    })

    it('在上传前拒绝超限和类型错误', async () => {
        const upload = vi.fn()
        const uploader = new Uploader({upload, maxSize: {image: 1}, accept: {image: 'image/*'}})
        await expect(uploader.uploadFile(new File(['xx'], 'a.png', {type: 'image/png'}), 'image'))
            .rejects.toMatchObject<Partial<UploadError>>({code: 'file-too-large', limit: 1})
        await expect(uploader.uploadFile(new File(['x'], 'a.txt', {type: 'text/plain'}), 'image'))
            .rejects.toMatchObject<Partial<UploadError>>({code: 'invalid-file-type'})
        expect(upload).not.toHaveBeenCalled()
    })

    it('透传取消和进度，并标准化返回地址', async () => {
        const controller = new AbortController()
        const onProgress = vi.fn()
        const upload = vi.fn(async (_file: File, context: {signal: AbortSignal; onProgress: (value: number) => void}) => {
            expect(context.signal).toBe(controller.signal)
            context.onProgress(50)
            return ' https://cdn.example/a.png '
        })
        const uploader = new Uploader({upload})
        await expect(uploader.uploadFile(new File(['x'], 'a.png', {type: 'image/png'}), 'image', {
            signal: controller.signal,
            onProgress,
        })).resolves.toEqual({url: 'https://cdn.example/a.png'})
        expect(onProgress).toHaveBeenCalledWith(50)
    })

    it('拒绝空上传地址并格式化字节数', async () => {
        const uploader = new Uploader({upload: async () => '   '})
        await expect(uploader.uploadFile(new File(['x'], 'a.png', {type: 'image/png'}), 'image'))
            .rejects.toMatchObject<Partial<UploadError>>({code: 'empty-url'})
        expect([formatBytes(12), formatBytes(1536), formatBytes(2 * 1024 ** 2)]).toEqual(['12 B', '1.5 KB', '2 MB'])
    })
})
