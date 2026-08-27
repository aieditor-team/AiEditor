// Tool 抽象层的统一出口，避免具体实现依赖更深的文件路径。
export { EditorMutationTool } from './EditorMutationTool'
export { EditorTool, type EditorToolExecution } from './EditorTool'
export { EditorToolRegistry, rebaseEditorToolProposal } from './EditorToolRegistry'
