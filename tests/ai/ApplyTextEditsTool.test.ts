import {afterEach, describe, expect, it} from 'vitest'
import {ApplyTextEditsTool} from '../../src/ai/tools/implementations/ApplyTextEditsTool'
import {createTestEditor} from '../helpers/editor'

const editors: ReturnType<typeof createTestEditor>[] = []
afterEach(() => editors.splice(0).forEach((editor) => editor.destroy()))

describe('ApplyTextEditsTool', () => {
    it('从后向前原子应用多处不同长度替换', () => {
        const editor = createTestEditor('<p>one two three</p>')
        editors.push(editor)
        const tool = new ApplyTextEditsTool()
        tool.apply(editor, {edits: [
            {from: 1, to: 4, old_text: 'one', new_text: '1'},
            {from: 9, to: 14, old_text: 'three', new_text: '333'},
        ]})
        expect(editor.getText()).toBe('1 two 333')
        editor.commands.undo()
        expect(editor.getText()).toBe('one two three')
    })

    it('拒绝重叠、越界和原文已变化的编辑', () => {
        const editor = createTestEditor('<p>abcdef</p>')
        editors.push(editor)
        const tool = new ApplyTextEditsTool()
        expect(() => tool.apply(editor, {edits: [
            {from: 1, to: 4, old_text: 'abc', new_text: ''},
            {from: 3, to: 5, old_text: 'cd', new_text: ''},
        ]})).toThrow('overlap')
        expect(() => tool.apply(editor, {edits: [{from: -1, to: 2, old_text: '', new_text: ''}]})).toThrow('outside')
        expect(() => tool.apply(editor, {edits: [{from: 1, to: 2, old_text: 'z', new_text: 'x'}]})).toThrow('no longer matches')
        expect(editor.getText()).toBe('abcdef')
    })
})
