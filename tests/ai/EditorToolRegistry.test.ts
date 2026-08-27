import {afterEach, describe, expect, it} from 'vitest'
import {EditorToolRegistry, rebaseEditorToolProposal} from '../../src/ai/tools/core/EditorToolRegistry'
import {Mapping, StepMap} from '@tiptap/pm/transform'
import {ReplaceSelectionTool} from '../../src/ai/tools/implementations/ReplaceSelectionTool'
import type {AiEditorToolProposal} from '../../src/ai/types'
import {createTestEditor} from '../helpers/editor'

const editors: ReturnType<typeof createTestEditor>[] = []
afterEach(() => editors.splice(0).forEach((editor) => editor.destroy()))

function proposal(overrides: Partial<AiEditorToolProposal> = {}): AiEditorToolProposal {
    return {
        id: 'p1',
        tool: 'replace_selection',
        title: 'Replace',
        description: 'Replace selection',
        arguments: {text: 'hi', _selection_from: 1, _selection_to: 6},
        documentVersion: 2,
        status: 'pending',
        ...overrides,
    }
}

describe('EditorToolRegistry', () => {
    it('拒绝重复工具并报告未知工具', () => {
        expect(() => new EditorToolRegistry([new ReplaceSelectionTool(), new ReplaceSelectionTool()])).toThrow('Duplicate')
        const registry = new EditorToolRegistry([])
        expect(registry.execute('missing', '{}', {} as never).output).toMatchObject({ok: false})
    })

    it('拒绝已处理和过期提案', () => {
        const editor = createTestEditor('<p>hello</p>')
        editors.push(editor)
        const registry = new EditorToolRegistry([new ReplaceSelectionTool()])
        expect(registry.apply(editor, 2, proposal({status: 'discarded'}))).toMatchObject({ok: false})
        expect(registry.apply(editor, 3, proposal())).toMatchObject({ok: false, message: expect.stringContaining('changed')})
        expect(editor.getText()).toBe('hello')
    })

    it('应用有效提案并更新状态', () => {
        const editor = createTestEditor('<p>hello</p>')
        editors.push(editor)
        const registry = new EditorToolRegistry([new ReplaceSelectionTool()])
        const pending = proposal()
        expect(registry.apply(editor, 2, pending)).toMatchObject({ok: true})
        expect(pending.status).toBe('applied')
        expect(editor.getText()).toBe('hi')
    })

    it('重定位内置工具的范围和多处编辑坐标', () => {
        const pending = proposal({
            arguments: {
                _selection_from: 8,
                _selection_to: 13,
                _insert_position: 13,
                _range_from: 8,
                _range_to: 13,
                edits: [{from: 8, to: 13, old_text: 'Hello', new_text: 'Hi'}],
            },
        })
        const mapping = new Mapping([new StepMap([1, 5, 1])])
        rebaseEditorToolProposal(pending, mapping, 3)
        expect(pending.documentVersion).toBe(3)
        expect(pending.arguments).toMatchObject({
            _selection_from: 4,
            _selection_to: 9,
            _insert_position: 9,
            _range_from: 4,
            _range_to: 9,
            edits: [{from: 4, to: 9}],
        })
    })
})
