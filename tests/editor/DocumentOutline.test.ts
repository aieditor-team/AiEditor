import {afterEach, describe, expect, it} from 'vitest'
import {createDocumentOutline} from '../../src/editor/AiEditorDocumentOutline'
import {createTestEditor} from '../helpers/editor'

const editors: ReturnType<typeof createTestEditor>[] = []
afterEach(() => editors.splice(0).forEach((editor) => editor.destroy()))

describe('createDocumentOutline', () => {
    it('构建层级、允许级别跳跃并忽略空标题', () => {
        const editor = createTestEditor('<h1>一</h1><h3>一.1</h3><h2>一.2</h2><h2></h2><h1>二</h1>')
        editors.push(editor)
        const outline = createDocumentOutline(editor.state.doc)
        expect(outline.map((item) => item.text)).toEqual(['一', '二'])
        expect(outline[0].children.map((item) => [item.text, item.level])).toEqual([['一.1', 3], ['一.2', 2]])
        expect(outline[0].position.from).toBe(0)
        expect(outline[0].position.to).toBeGreaterThan(outline[0].position.from)
    })
})
