import { TaskList as TTaskList, type TaskListOptions as TTaskListOptions } from '@tiptap/extension-task-list'

/** 任务列表容器节点，内部仅接收 TaskItem。 */
export type TaskListOptions = TTaskListOptions
export const TaskList = TTaskList.extend<TaskListOptions>({})
