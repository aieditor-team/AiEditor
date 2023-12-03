# 工具栏配置

```typescript
new AiEditor({
    element: "#aiEditor",
    toolbarKeys: ["undo", "redo", "brush", "eraser", 
        "|", "heading", "font-family", "font-size", 
        "|", "bold", "italic", "underline", "strike", "link", "code", "subscript", "superscript", "hr", "todo", "emoji", 
        "|", "highlight", "font-color",
        "|", "align", "line-height", 
        "|", "bullet-list", "ordered-list", "indent-decrease", "indent-increase", "break", 
        "|", "image", "video", "attachment", "quote", "code-block", "table", 
        "|", "printer", "fullscreen", "ai"
    ],
})
```

以上的配置为 AiEditor 工具类的默认配置，`"|"` 代表的是分割线，其他的含义如下：

- undo: 撤销
- redo: 重做
- brush: 格式刷
- eraser: 清除格式
- heading: 正文/标题
- font-family: 字体
- font-size: 字号
- bold: 加粗
- italic: 斜体
- underline: 下划线
- strike: 删除线
- link: 链接
- code: 行内代码
- subscript: 下标
- superscript: 上标
- hr: 分割线
- todo: 任务列表
- emoji: 表情
- highlight: 高亮
- font-color: 字体颜色
- align: 对齐
- line-height: 行高
- bullet-list: 无序列表
- ordered-list: 有序列表
- indent-decrease: 减少缩进
- indent-increase: 增加缩进
- break: 强制换行
- image: 图片
- video: 视频
- attachment: 附件
- quote: 引用
- container: 高亮块
- code-block: 代码块
- table: 表格
- printer: 打印
- fullscreen: 全屏
- ai: 人工智能