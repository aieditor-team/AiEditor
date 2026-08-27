import {Editor} from '@tiptap/core'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Bold from '@tiptap/extension-bold'
import {afterEach, describe, expect, it} from 'vitest'
import {SearchDocumentTool} from '../../src/ai/tools/implementations/SearchDocumentTool'

const editors: Editor[] = []

function search(content: string, query: string, options: Record<string, unknown> = {}) {
    const editor = new Editor({extensions: [Document, Paragraph, Text, Bold], content})
    editors.push(editor)
    const execution = new SearchDocumentTool().execute({query, ...options}, {
        editor,
        html: editor.getHTML(),
        text: editor.getText(),
        selectedText: '',
        selection: {from: 1, to: 1},
        documentVersion: 0,
    })
    return execution.output as {count: number; matches: Array<{from: number; to: number; text: string}>}
}

afterEach(() => editors.splice(0).forEach((editor) => editor.destroy()))

describe('SearchDocumentTool', () => {
    it('能够跨越 mark 分割的相邻文本节点匹配', () => {
        const result = search('<p>hel<strong>lo wo</strong>rld</p>', 'hello world')
        expect(result).toMatchObject({count: 1, matches: [{from: 1, to: 12, text: 'hello world'}]})
    })

    it('不会跨段落匹配', () => {
        expect(search('<p>hello</p><p>world</p>', 'helloworld').count).toBe(0)
    })

    it('大小写转换长度变化时仍返回原始文档坐标', () => {
        const result = search('<p>İx and ix</p>', 'x')
        expect(result.matches.map(({from, to, text}) => ({from, to, text}))).toEqual([
            {from: 2, to: 3, text: 'x'},
            {from: 9, to: 10, text: 'x'},
        ])
    })

    it('支持大小写敏感和最大结果数', () => {
        expect(search('<p>A a A</p>', 'A', {case_sensitive: true, max_results: 1})).toMatchObject({
            count: 1,
            matches: [{text: 'A'}],
        })
    })
})
