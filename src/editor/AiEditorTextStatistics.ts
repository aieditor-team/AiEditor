export interface AiEditorTextStatistics {
    /** 适用于自然语言展示的词语数量。 */
    words: number
    /** 用户视觉上感知到的字符数量，而不是 UTF-16 代码单元数量。 */
    characters: number
}

type SegmenterConstructor = new (
    locales?: string | string[],
    options?: {granularity: 'grapheme' | 'word'},
) => {segment(input: string): Iterable<{segment: string; isWordLike?: boolean}>}

/**
 * 统计状态栏使用的词数和字符数。
 *
 * Intl.Segmenter 能正确处理中文分词、emoji 和组合字符。旧环境缺少该 API 时，
 * 字符数退化为 Unicode code point，词数则将连续拉丁文本和单个中日韩字符计为词。
 */
export function getTextStatistics(text: string, locale?: string): AiEditorTextStatistics {
    const normalized = text.trim()
    if (!normalized) return {words: 0, characters: 0}

    const Segmenter = (Intl as typeof Intl & {Segmenter?: SegmenterConstructor}).Segmenter
    if (Segmenter) {
        const words = Array.from(new Segmenter(locale, {granularity: 'word'}).segment(normalized))
            .filter((part) => part.isWordLike === true).length
        const characters = Array.from(new Segmenter(locale, {granularity: 'grapheme'}).segment(normalized)).length
        return {words, characters}
    }

    const fallbackWords = normalized.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]|[\p{L}\p{N}\p{M}]+/gu)
    return {words: fallbackWords?.length ?? 0, characters: Array.from(normalized).length}
}
