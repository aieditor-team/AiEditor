import { ListTodo } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 任务列表菜单项，封装对应的 Tiptap 命令。 */
export class TaskListMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'task-list', label: 'Task list', icon: ListTodo,
      execute: ({ editor }) => { editor.chain().focus().toggleTaskList().run() },
      isActive: ({ editor }) => editor.isActive('taskList'),
    })
  }
}
