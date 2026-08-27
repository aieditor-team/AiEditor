import { TaskItem as TTaskItem, type TaskItemOptions as TTaskItemOptions } from '@tiptap/extension-task-item'

/** 带完成状态的任务列表项节点。 */
export type TaskItemOptions = TTaskItemOptions
export const TaskItem = TTaskItem.extend<TaskItemOptions>({})
