# AiEditor ChangeLog

## v1.3.9 20250917 （AIEditor Pro 商业版）:
- feat: Added a new LaTeX plugin and supports pasting common LaTeX content, such as Feishu.
- feat: Added support for adding user avatars to Mention.
- feat: Optimized Markdown parsing logic when pasting plain text.
- feat: Added htmlPasteConfig?.pasteProcessor to listen for plain text content pasted.
- feat: Optimized the popup window for "@某" as long as it's not preceded by a letter or number, and doesn't need to be preceded by a required space.
- feat: Optimized LaTeX matching to avoid regular expression negative lookahead issues and support for iOS < 13.
- feat: Added LaTeX compatibility with the span[data-latex] content format.
- feat: Optimized indentation and unindentation. In lists, the indentation is now the list indentation, not the content indentation.
- feat: Optimized the Link plugin to inherit from Link.extend.
- feat: Optimized the table action menu to prevent adding new rows or columns when selecting multiple rows or columns.
- feat: Optimized the table pop-up menu to support adding new rows or columns in the top, bottom, left, or right directions even when multiple rows and columns are selected.
- feat: Fixed typos.
- feat: Upgraded related dependencies to the latest versions.
- fix: Fixed an issue where the "Applying a mismatched transaction" error occurred in some cases.
- fix: Fixed a problem where pressing the Enter key when @Something was unselected would result in @null being displayed (e.g., when there was no data).
---
- 新增: 添加全新的 Latex 插件，以及支持常见的 latex 内容粘贴，比如飞书
- 新增: Mention 添加用户头像的配置支持
- 优化: 优化粘贴纯文本时 markdown 的解析逻辑
- 优化: 添加 htmlPasteConfig?.pasteProcessor 对纯文本内容粘贴的监听处理
- 优化: 优化 @某某 前面只要不是英文和数字，都会触发弹出，不必是必须空格后才会触发
- 优化: 优化 latex 匹配，避免正则表达式负向前瞻，不支持 iOS < 13 的问题
- 优化: latex 兼容 span[data-latex] 内容格式
- 优化: 优化缩进和取消缩进，在列表中是列表缩进，而非内容缩进
- 优化: 优化 Link 插件修改为  Link.extend 继承的方式
- 优化: 优化表格的操作菜单，选择多行多列时不能添加新行或列的问题
- 优化: 优化表格的弹出菜单，在选择多行多列的情况下依然支持在上下左右添加新行或列
- 优化: 修改错别字
- 优化: 升级相关依赖到最新版本
- 修复: 修复在某些情况下出现 Applying a mismatched transaction 错误
- 修复: 修复 @某某 未选中时，按 enter 键时，出现 @null 的情况（比如没有数据的场景）



## v1.3.8 20250829（AIEditor Pro 商业版）:
- feat: Supports coexistence of code and other marks (compatible with FeiShu format)
- feat: Supports content recognition of highlighted blocks in Tencent Docs (when pasting...)
- feat: Optimize TaskItemExt and TaskListExt code
- feat: Support adding images and other content in li
- feat: Optimize setContent and add support for focus parameter
- feat: Advanced Search and Replace Added 'clearSearchFor' Method
- feat: "Link" function adds the ability to modify link content
- feat: Change the 'default' in the link opening method to 'current window'
- feat: Add the function of configuring "defaultTarget" for links
- feat: Support task list pasting in FeiShu
- feat: Container supports pasting content from FeiShu
- feat: Optimize the logic for determining the insertion position of videos
- feat: When optimizing CSS image display (such as URL not being accessible), there is no issue of high visibility of images
- feat: Optimize the issue of not supporting Block elements in ol and ul
- feat: Add support for copied background colors
- feat: Allow images in the table to still be dragged beyond the specified range
- feat: Optimize the insertion position of images
- feat: After dragging images beyond the editor, the drag event should not be canceled
- fix: Fixed the issue where data src takes precedence over src when pasting images in Feishu
- fix: Added LinkExt to fix the issue of unlinking in Chinese after configuring Autolink
- fix: Fixed the issue where images cannot be displayed when inserting certain special markdowns
- fix: Dragging image size does not trigger nChange in some cases
- fix: Fixed the issue where some floating menus still display prompt content even after configuring toolbarTipEnable to false
---
- 新增: 支持 code 和 其他 mark 共存（兼容飞书格式）
- 新增: 支持【腾讯文档】高亮块的内容识别（粘贴时...）
- 新增: 优化 TaskItemExt 和  TaskListExt 代码
- 新增: 支持在 li 中添加图片等内容
- 新增: 优化 setContent，添加 focus 参数的支持
- 新增: 高级搜索和替换新增 'clearSearchFor' 方法
- 新增: ”链接“ 功能新增修改链接内容的功能
- 新增: 修改链接打开方式中的 ”默认“ 为 ”当前窗口“
- 新增: 为 link 添加 "defaultTarget" 配置的功能
- 新增: 支持飞书的 task 列表粘贴
- 新增: Container 支持飞书的内容粘贴
- 优化: 优化视频的插入位置判断逻辑
- 优化: 优化 css 图片展示时（比如 URL 不能访问）图片没有高度看不见的问题
- 优化: 优化 ol 和 ul 下不支持 Block 元素的问题
- 优化: 添加复制过来的背景颜色支持
- 优化: 让表格里的图片拖动超出范围时依然可以拖动
- 优化: 优化图片的插入位置
- 优化: 优化拖动图片超出编辑器后，不应该取消拖动事件
- 修复: 修复飞书粘贴图片时， data-src 优先于 src 的问题
- 修复: 新增 LinkExt 用于修复配置 autolink 后输入中文取消链接的问题
- 修复: 修复在插入某些特殊的 markdown 时无法显示图片的问题
- 修复: 拖动图片大小在某些情况下不触发 onChange 的问题
- 修复: 修复 toolbarTipEnable 配置 false 后，某些浮动菜单依然弹出提示内容的问题




## v1.4.1 20250829:
- feat: add toolbarTipEnable config support 
- feat: optimize setContent() method, add focus param 
- feat: optimize image styles in table
- fix: dragging an image beyond the editor should not cancel the dragging event 
- fix: fixed ai command can not get text in new line 
- fix: video insert position is error 
- fix: fix image use data-src to replace src, and fixed image insert position is error
- fix: insertMarkdown can not show image some cases
- fix: Fix the issue where dragging the image does not trigger onChange in some cases 
---
- 新增：添加 toolbarTipEnable 配置的支持
- 新增：优化 setContent() 方法，添加 focus 参数
- 优化：优化表格中的图片样式问题，优化图片在表格中的大小拖动
- 修复：优化图片拖动超出编辑器范围时取消拖动事件的问题
- 修复：修复 AI 命令在有新行时获取不到文本的问题
- 修复：修复视频插入位置错误问题
- 修复：修复图片在表格中的大小拖动时使用 data-src 替换 src 的问题
- 修复：修复插入 markdown 时图片显示不全的问题
- 修复：图片图片有时不触发 onChange 的问题


## v1.3.7 20250820（AIEditor Pro 商业版）
- feat: Added search and replace functionality
- feat: Added support for more parameter configurations for SearchAndReplaceExt
- feat: Added support for "end" syntax
- feat: Added support for indent units
- fix: Fixed an issue where the AI command failed to obtain context when placed on a new line
- fix: SearchAndReplaceExt did not perform replacements when replace was not configured
---
- 新增: 添加搜素和替换的功能
- 新增: SearchAndReplaceExt 新增更多参数配置的支持
- 新增: 添加对 "end" 对其方式的支持，方便导入 word 的时候居右对齐的适配
- 新增: 缩进添加对 in 单位的支持，方便 word 复制粘贴时识别，word 缩进的大小单位可能是 “in”
- 修复: 修复 AI 命令在新行的时候，获取不到上下文内容的问题
- 修复: SearchAndReplaceExt 未配置 replace 的时候，不进行替换


## v1.4.0 20250625:
- feat: Added video attributes autoplay, loop, muted, preload
- feat: Upgraded related dependencies to the latest version
- fix: Fixed the issue that the video does not display in read-only mode
- fix: Fixed the issue that the video attributes poster and controls do not take effect
- fix: In the code block, the issue that the pasted code does not display
- fix: fixed when pasting images in a table, the table is lost when data is backfilled

---
- 新增：新增视频属性 autoplay, loop, muted, preload
- 优化：升级相关依赖到最新版本
- 修复：修复只读模式下，视频不显示的问题
- 修复：修复视频属性 poster、controls 不生效问题
- 修复：在代码块中，粘贴代码不显示的问题
- 修复：在 table 内粘贴图片时，当数据回填的时候 table 丢失的问题



## v1.3.6 20250625（AIEditor Pro 商业版）
- fix: Upgrade related dependencies to the latest version
- fix: The problem of no borders on the table when exporting
- fix: When inserting a video, it does not display in some cases
- fix: Fix the problem of not pasting html into the code block
- fix: Fix the problem that when there is an image in the table, the table disappears when the content is reset again
---
- 优化：升级相关依赖到最新版本
- 修复：导出时 table 没有边框的问题
- 修复：插入视频时，在某些情况下不显示的问题
- 修复：修复粘贴 html 到代码块时粘贴不进去的问题
- 修复：修复当 table 中有图片，再次充重置内容是 table 消失的问题



## v1.3.9 20250603:
- fix: fixed paste in new line if pasteAsText options enable 
- fix: fix: fixed Uncaught RangeError: Invalid content for node tableCell: `<>` 
- fix: Fix the problem that `p>img` is lost when pasting source code without HTML processing
- fix: Fix the problem that `p>img` is lost when setContent is not processed with HTML
- fix: Pasting in a new line in some cases
- docs: Modify the level of pasteAsText in the basic configuration sample code. There is no pasteAsText under the AiEditorOptions type

---
- 修复: 修复源代码粘贴没有进行 html 处理导致 `p>img` 丢失问题 
- 修复: 修复 setContent 没有进行 html 处理导致 `p>img` 丢失等问题 
- 修复: 粘贴表格出现 RangeError: Invalid content for node tableCell: `<>` 错误的问题
- 修复：粘贴时在某些情况下会粘贴在新行的问题
- 文档: 修改基础配置 示例代码中的 pasteAsText 的层级。AiEditorOptions 类型下没有 pasteAsText


## v1.3.5 20250525（AIEditor Pro 商业版）
- feat: Added imagesEndpoint configuration for users to automatically add prefixes to images when exporting
- fix: Optimized the style of the translation panel
- fix: Fixed the problem of automatic line breaks when pasting when pasteAsText is turned on
- fix: Fixed the problem that the table style was not brought in when pasting a table
- fix: Fixed the problem that an error occurs when the table has blank content when pasting a table
- fix: Fixed the problem that the P tag format of the first row will be removed

---
- 新增: 添加 imagesEndpoint 配置用户用于在导出时自动为图片添加前缀
- 优化: 优化翻译面板的样式问题
- 修复: 修复当开启 pasteAsText 时，粘贴自动换行的问题
- 修复: 修复粘贴表格时，表格样式没有带进来的问题
- 修复: 修复粘贴表格时，表格有空白内容时出错的问题
- 修复：修复首行 P 标签格式会被移除的问题



## v1.3.8 20250422:
- fix: rollback BubbleMenuPlugin plugin to prevent floating menu errors
- refactor: optimize the indentation display when pasting word
---
- 修复: 回退 BubbleMenuPlugin 插件，防止浮动菜单错误
- 优化: 优化 word 粘贴时的缩进显示



## v1.3.7 20250422:
- feat: Added the ability to support background and color configuration in tables, thanks @maonianyou
- feat: Added support for AI configuration of commandsEnable
- refactor: Optimized the configuration and automatic prompts for large models
- refactor: Optimized the problem that pop-up prompts disappear automatically when the mouse moves out of the editor
- refactor: clearDataPmSlice supports pasting code blocks
- refactor: Optimized the code logic of pasting
- refactor: When the table is too long, select the bottom cell of the table, and the table operation pop-up box is above the table header, which will appear hidden and invisible
- refactor: When pasting an image, there will be a blank row above the image, and the mouse will automatically focus on the row
- refactor: When switching between title and text on the mobile phone, the menu automatically hides

---
- 新增：表格添加支持 background 和 color 配置的能力，感谢 @maonianyou
- 新增：添加 commandsEnable 的 AI 配置的支持
- 优化：优化对大模型的配置和自动提示
- 优化：优化弹出提示在鼠标移出编辑器时自动消失的问题
- 优化：clearDataPmSlice 支持粘贴代码块
- 优化：优化粘贴的代码逻辑
- 优化：表格过长的情况下，选中表格最下方单元格，表格操作弹框在表头上方，会出现隐藏看不见的情况
- 优化：粘贴图片时，图片上方会有一个空白的行，且鼠标自动聚焦到该行的问题
- 优化：在手机端切换标题和文本时，菜单自动隐藏的问题



## v1.3.6 20250312:
- feat: Added alwaysEnabledToolbarKeys configuration to specify that certain buttons are always enabled
- feat: Optimized the AI command menu to make its code more concise
- feat: aie-undo duplicate definition problem
- fix: When selecting an existing image in the editor first and then inserting another image, the "Applying a mismatched transaction" error appears
- fix: Fixed some typos in AI prompt words that may cause AI to misunderstand
- fix: Image configuration defaultSize does not work
- fix: Code block does not wrap after AI automatically comments

---
- 新增：添加 alwaysEnabledToolbarKeys 配置，用于指定某些按钮永远处于不被禁用
- 优化：优化 AI 命令菜单，使其代码更加简洁
- 优化：aie-undo 重复定义的问题
- 修复：当先选择编辑器里已存在的图片，再插入一张图片时，出现 "Applying a mismatched transaction" 错误
- 修复：修复 AI 提示词的一些错别字，可能导致 AI 理解错误的问题
- 修复：图片配置 defaultSize 不起作用的问题
- 修复：代码块通过 AI 自动注释之后代码不换行问题修改



## v1.3.5 20250212:
- feat: Optimize the experience and cancel the pop-up of the floating menu in the code block
- feat: Optimize the tools and methods such as organizeHTMLContent
- feat: In read-only mode, do not disable the "Print" and "Full Screen" buttons
- fix: taskList cannot be converted to markdown, and taskList of markdown cannot be converted to html
- fix: The problem that the strikethrough in html cannot be converted to `~~`
- fix: Fix the problem that removeEmptyParagraphs accidentally deletes images in some cases

---
- 优化: 优化体验，取消浮动菜单在代码块的弹出
- 优化：优化 organizeHTMLContent 等工具方法
- 优化：在只读模式下，不禁用 “打印” 和 “全屏” 按钮
- 修复：taskList 无法转换为 markdown，markdown 的 taskList 也无法转换为 html 的问题
- 修复：html 中的删除线无法转换为 `~~` 的问题
- 修复：修复 removeEmptyParagraphs 在某些情况下误删图片的情况



## v1.3.4 20250102:
- feat: Added custom color and color selection functions to the highlight block
- feat: htmlUtil added createElement method
- feat: AIMenu added onClick configuration support
- feat: Added onFullscreen event listener configuration support
- feat: Optimize InnerEditor's options assignment
- feat: Optimize markdown's parsing of highlight blocks
- feat: Optimize AIMenu's default prompt words
- fix: The problem of inserting content in the click event of the custom image in the toolbar reported an error
- fix: The event of AiCommand is undefined
- fix: The mention function cannot display the label

---
- 新增：高亮块新增自定义颜色和选择颜色的功能
- 新增：htmlUtil 添加 createElement 方法
- 新增：AIMenu 添加 onClick 配置的支持
- 新增：添加 onFullscreen 的事件监听的配置支持
- 优化：优化 InnerEditor 的 options 赋值
- 优化：优化 markdown 对高亮块的解析
- 优化：优化 AIMenu 的默认提示词
- 修复：在工具栏的自定义图片的点击事件插入内容报错的问题
- 修复：AiCommand 的 event 为 undefined 的问题
- 修复：提及（mention）功能无法显示 label 的问题



## v1.3.3 20241221:
- feat: Add link configuration to images
- feat: Add alt, title and other attribute configuration to images
- feat: Add onClick configuration support to AIMenu
- fix: When migrating edited data from wangEditor to AIEditor, some images are not displayed
- fix: When there are multiple editor instances on the same page, the number of characters counted is inaccurate
- fix: When the menu is in the active state, the corners are not rounded.
- fix: fix parse init html error if the content is text only
- doc: update ai command docs
- doc: update comment docs

---
- 新增：图片添加链接配置的功能
- 新增：图片添加 alt、title 等属性配置的功能
- 新增：AIMenu 添加 onClick 配置的支持
- 修复：wangEditor 编辑数据迁移到 AIEditor 时，某些图片不显示的问题
- 修复：当同一个页面存在多个编辑器实例时，右下角统计字符数不准确
- 修复：菜单在 active 的状态时，不是圆角的。
- 修复：修复当初始化内容为存文本时 html 解析错误的问题
- 文档：更新 ai command 的相关文档
- 文档：更新评论（批注）的相关文档



## v1.2.9 20241212:
- feat: Added changeTheme() method for dynamic theme switching
- feat: Optimized the color variables related to dark and light themes
- feat: Adjusted the size of emoji to use the toolbarSize configuration
- feat: Optimized the related tool methods of htmlUtil and mdUtil
- fix: When getting markdown, the image content cannot be correctly converted to markdown
- fix: When getting markdown, the table cannot be correctly converted to markdown in some cases

---
- 新增：添加 changeTheme() 方法，用于动态切换主题
- 优化：优化暗色与亮色主题的相关颜色变量
- 优化：调整 emoji 的大小以在使用 toolbarSize 的配置
- 优化：优化 htmlUtil 和 mdUtil 的相关工具方法
- 修复：获取 markdown 时，图片内容无法正确转换为 markdown
- 修复：获取 markdown 时，表格在某些情况下无法正确转换为 markdown



## v1.2.8 20241203:
- feat: Added support for the Shift-Tab de-indentation shortcut key in code blocks
- feat: Added support for the `:::` syntax of Markdown
- feat: Updated related dependencies to the latest version
- feat: Modified the model in OpenaiModelConfig to be required
- fix: The editor cannot be selected when editing is prohibited under the Android operating system
- fix: When inserting an empty ordered list, it cannot be inserted
- fix: The markdown content output by AI cannot be inserted correctly
- doc: Updated some description errors in the document
- doc: Corrected the configuration errors related to openai in the document

---
- 新增：代码块添加 Shift-Tab 取消缩进快捷键的支持
- 新增：添加 Markdown 的 `:::` 语法的支持
- 优化：更新相关依赖到最新版本
- 优化：修改 OpenaiModelConfig 中的 model 为必填
- 修复：编辑器在 Android 操作系统下，且禁止编辑时无法选择的问题
- 修复：当插入一个空的有序列表时，无法被插入的问题
- 修复：AI 输出的 markdown 内容无法被正确插入的问题
- 文档：更新文档的一些描述错误
- 文档：修正文档关于 openai 的相关配置错误



## v1.2.7 20241121:
- fix: When configuring contentIsMarkdown, it may affect the reload problem
- fix: When markdown parses images, the images will be wrapped in p tags, resulting in incorrect parsing
- fix: The problem of prompting domain errors when using spark lite models
- feat: Openai has added a customUrl configuration function to facilitate users to customize the configuration URL
- feat: When there is an empty p tag in the table, its height is incorrect
- feat: Upgrade related dependencies to the latest version

---
- 修复: 当配置 contentIsMarkdown 时，可能会影响再次加载的问题
- 修复: markdown 在解析图片时，图片会被 p 标签包裹导致无法正确解析的问题
- 修复：使用 spark lite 模型提示 domain 错误的问题
- 优化: openai 新增 customUrl 配置的功能，方便用户自定义配置 url
- 优化：table 中存在空的 p 标签时，其高度不正确的问题
- 优化：升级相关依赖到最新版本



## v1.2.6 20241114:
- fix: Fixed the line break issue when AI translation and AI output replacement content
- fix: Fixed the issue of not being able to select content on Android devices (IOS does not have this problem)
- feat: The title of the menu group is changed to an optional configuration, and will not pop up when it is not filled in

---
- 修复: 修复 AI 翻译、AI 输出替换内容时换行的问题
- 修复: 修复在 Android 设备下无法选择内容的问题（IOS 没有这个问题）
- 优化：菜单组的 title 修改为可选配置，当不填写时不弹出显示



## v1.2.5 20241031:
- fix: CodeBlock Extensions error sometime
- fix: optimize paste extension and fix paste with data-pm-slice is error
- fix: fix tab key conflict with ordered lists

---
- 修复：代码插件在某些情况下错处的问题
- 修复：优化粘贴内容插件并修复粘贴文本时独占一行的问题
- 修复：修复 tab 键和列表冲突的问题



## v1.2.3 20241024:
- feat: added more language files for i18n
- feat: custom ai model support http ReadableStream
- feat: Added toolbarSize to control toolbar button size
- fix: When the editor editable is false, disable the toolbar
- chore: update dependencies
- chore: optimize styles

---
- 新增: 新增更多的语言支持，目前已经支持 中文、英文、德语、葡萄牙语、西班牙语、印度语、印尼语、日语、韩语、泰语、越南语
- 新增: 自定义大语言模型支持 http ReadableStream
- 新增: 添加 toolbarSize 配置用于控制工具栏按钮的大小
- 修复: 当编辑器设置 editable 为 false, 禁用工具栏
- 优化: 更新依赖到最新版本
- 优化: 优化样式细节



## v1.2.2 20241018:
- feat: add new option "textCounter"
- feat: add temperature and maxTokens config for aiModel
- refactor: optimize paste extensions and add new option "removeEmptyParagraphs" for paste
- refactor: Optimize ClassNameExt to make the new paragraph does not carry the className of the previous
- refactor: remove align attribute in image
- refactor: use div replace p to wrapper image
- refactor: remove empty value attributes
- fix: image can not show in edit disable
- fix: image border is 1px smaller after resizing
- fix: SparkAiModel error if use v1.1

--- 
- 新增: 添加新的配置 "textCounter" 用于自定义文字数量的统计
- 新增: AI 新增 temperature 和 maxTokens 的配置功能
- 优化: 粘贴的功能添加新的 "removeEmptyParagraphs" 配置，用于移除空段落
- 优化: 优化 ClassNameExt 插件，使之在新的段落里不携带上一个段落的 class 名称
- 优化: 图片移除 align 属性，否则可能发生样式错误的问题
- 优化: 使用 div 替代 p 包裹图片
- 优化: 图片移除空属性值的属性
- 修复: 图片无法在只读模式下显示的问题
- 修复: 图片在拖拽大小后，其宽度会小 1px 的问题
- 修复: 星火大模型无法使用其最低版本 v1.1 的问题



## v1.2.0 20241016:
- feat: Enhanced pasting from Excel, WPS, LibreOffice, Number, and Tencent Docs table content
- feat: add new options "image.bubbleMenuEnable"
- feat: add "htmlPasteConfig.clearLineBreaks" options
- refactor: refactor markdown features
- refactor: add "finished" flag to the SmoothAppender
- refactor: "pasteAsText" feature not remove the "p" tag
- refactor: rename "removeHtmlTag" to htmlUtil
- refactor: optimize textSelectionBubble
- refactor: optimize createAiClient() in AI models
- refactor: optimize initToolbarKeys.ts
- refactor: optimize SparkAiModel.ts
- fix: OpenaiAiModel parse message error sometimes
- fix: fixed "&nbsp" will be attached sometime if pastedAsText config enable

---
- 新增: 增强来至于 Excel, WPS, LibreOffice, Number 和 腾讯文档的表格粘贴功能
- 新增: 添加新的配置 "image.bubbleMenuEnable"
- 新增: 添加新的配置 "htmlPasteConfig.clearLineBreaks"
- 优化: 重构 markdown 的相关功能
- 优化: 优化 SmoothAppender 输入时间过长的问题
- 优化: 优化 "pasteAsText" 功能保留 "p" 标签不被移除
- 优化: 重命名 "removeHtmlTag" 为 htmlUtil
- 优化: 优化 textSelectionBubble
- 优化: 优化 createAiClient() 方法
- 优化: 优化 initToolbarKeys.ts
- 优化: 优化 SparkAiModel.ts
- 修复: 修复 OpenaiAiModel 的消息在某些情况下解析错误的问题
- 修复: 修复在 pastedAsText 配置的情况下，"&nbsp" 会被粘贴的问题



## v1.1.7 20241002:
- feat: add SmoothAppender for textarea
- refactor: optimize AiEditor.onTransaction() method
- refactor: rename "PasteExt" extension Name to adapter v2.8.0
- refactor: optimize BubbleMenuPlugin.ts
- refactor: update linkBubbleMenu pluginKey's name

---
- 新增: 新增 SmoothAppender 使得 AI 输入更加湿滑
- 优化: 优化 AiEditor.onTransaction() 的相关代码
- 优化: 重命名 "PasteExt" 插件的名称以适配 v2.8.0
- 优化: 优化 BubbleMenuPlugin.ts 的核心逻辑
- 优化: 重命名 linkBubbleMenu 插件的名称



## v1.1.6 20240928:
- feat: Hide the emoji panel when clicking an emoji.
- feat: add html paste config and close https://github.com/aieditor-team/AiEditor/issues/92
- refactor: add icons in Translate action buttons
- fix: cat not show bubble menu on Cmd+A text selection command, close https://github.com/aieditor-team/AiEditor/issues/91

---
- 优化：当点击 emoji 表情的时候，隐藏 emoji 面板
- 优化：Html 粘贴添加更多的配置功能
- 优化：为翻译面板的操作按钮添加统一的图标
- 修复：通过快捷键 CMD+A 全选时，无法弹出选择操作浮动菜单的问题



## v1.1.5 20240926:
- refactor: optimize textSelectionBubbleMenu only update at the mouseup event
- refactor: update dependencies
- fix: fixed the translated buttons would trigger form submission

---
- 优化：优化文字选中弹出菜单仅在鼠标松开的时候进行弹出
- 优化：更新相关依赖到最新版本
- 修复：修复翻译的按钮会触发表单提交的问题


## v1.1.4 20240925:
- feat: add ClassName extension for custom node class attribute
- feat: add custom AI icon in bubble menu
- refactor: refactor translate bubble menu
- refactor: refactor ai bubble panel
- refactor: add more common emojis 

--- 
- 新增：新增 ClassName 插件，用于自定义节点的 class 样式
- 新增：添加自定义泡泡菜单的 AI ICON 的功能
- 优化：重构 翻译 功能的交互逻辑
- 优化：重构 AI 弹出菜单的交互细节
- 优化：添加更多场景的 emoji 表情



## v1.1.3 20240923:
- feat: add translate bubble menu items
- feat: add "pasteAsText" config support
- feat: add de and pt langs, thanks to @TobiasKrais
- feat: add Emoji config support
- fix: fix GiteeAiModel parse ai message error
- refactor: optimize AiEditor.ts and Header.ts
- refactor: optimize styles in Emoji.ts/Heading.ts/AbstractDropdownMenuButton.ts, thanks to @TobiasKrais
- refactor: optimize ai panel position
- chore: create npm-publish.yml
- chore: remove comment code

--- 

- 新增: 浮动菜单新增翻译功能，以及自定义翻译语言
- 新增: 新增 "pasteAsText" 配置的功能，在粘贴时自动清除样式
- 新增: 新增德语和葡萄牙语的配置，感谢 @TobiasKrais
- 新增: 新增 emoji 自定义配置的功能
- 修复: 修复 GiteeAiModel 在某些情况下解析错误的问题
- 优化: 优化 AiEditor.ts 及 Header.ts 代码
- 优化: 优化 Emoji.ts/Heading.ts/AbstractDropdownMenuButton.ts 的样式代码, @TobiasKrais
- 优化: 优化 文字选中以及 ai 弹出菜单的位置
- 优化: 创建 npm-publish.yml 用于自动发布的功能
- 优化: 上传部分注释代码



## v1.1.1 20240915:
- feat: Increase the indent to 2em instead of 10px
- feat: add FontSize defaultValue config
- feat: add "align" config with image from server response.
- feat: add server response to config the image and video width
- feat: add custom to set lineHeights support
- feat: add "toolbarExcludeKeys" config
- feat: add resize button in the image bubble menus
- refactor: optimize AbstractDropdownMenuButton.ts height to "fit-content"
- fix: fix the bubble menu is active in table or image
- fix: AbstractDropdownMenuButton active index error when aieditor init
- fix: TableBubbleMenu can not show when double-click the cell
- fix：fix the image Bubble Menus position not correct.
- doc：add line height config docs
- doc：add "toolbarExcludeKeys" config

---

- 新增: 增加缩进改为 2em，而不是 10px
- 新增: 新增默认字号大小的设置的功能
- 新增: 新增支持图片上传时，服务器返回图片的对其方式
- 新增: 新增图片或视频上传时，服务器返回图片的宽度和高度
- 新增: 新增自定义行高设置的功能
- 新增: 新增通过 "toolbarExcludeKeys" 配置自定义排除菜单的功能
- 新增: 新增图片浮动菜单可以快速调整图片大小为 50% 75% 100% 的功能
- 优化: 设置 AbstractDropdownMenuButton 的高度为 "fit-content"
- 修复: 图片和表格的浮动菜单，点击时会处于 “选中” 状态的问题
- 修复: AbstractDropdownMenuButton 在初始化时，默认选中不正确的问题
- 修复: 表格的单元格双击选中时无法弹出表格操作菜单的问题
- 修复：图片弹出的操作浮动菜单不是 100% 居中的问题
- 文档: 添加自定义行高设置的相关文档
- 文档: 添加 "toolbarExcludeKeys" 配置的相关文档



## v1.1.0 20240909:
- feat: add "onClick" config support for ai menu to custom menu item click event.
- feat: add commands() method for aieditor
- fix: onCreateBefore for custom extensions
- fix: remove console.log in gitee ai

---

- 新增: 自定义 AI 菜单添加 "onClick" 配置的支持
- 新增: AIEditor 对象添加 commands() 方法
- 修复: onCreateBefore 自定义扩展不生效的问题
- 修复: Gitee AI 有 console.log 打印的问题




## v1.0.16 20240903:
- feat: add menu group config support
- refactor: optimize image export wrapper in "p" tag
- refactor: rename "uploadFile" to "fileUploader"
- refactor: define a "Uploader" type and refactor extensions
- fix: fix spark ai can not support v4.0
- fix: image pasted from web will insert two images
- fix: lineHeight active is not correct.
- fix: i18n config error：delete-table -> 删除表格

---

- 新增: 工具栏菜单自定义分组的功能
- 优化: 重构导出图片被 p 标签包裹
- 优化: 重命名 "uploadFile" 为 "fileUploader"
- 优化: 定义 "Uploader" 类型并重构相关插件
- 修复: 修复星火大模型无法使用 v4.0 的问题
- 修复: 修复粘贴从网络复制的图片会出现显示 2 张的问题
- 修复: 修复行高回显不正确的问题
- 修复: 修复国际化配置不正确的问题 delete-table -> 删除表格



## v1.0.15 20240828:
- feat: Image custom properties and lazy loading
- feat: add gitee ai model support, use the serverless api
- refactor: optimize ImageExt.ts
- chore: upgrade dependencies

---

- 新增：新增自定义图片属性的支持
- 新增：新增使用 Gitee AI 大模型的支持
- 优化：优化 图片 插件
- 优化：升级相关依赖到最新版本



## v1.0.14 20240812:
- feat: codeBlock add languages and prompts config
- feat: add demos for svelte
- fix: img align not effective if export to html
- chore: upgrade dependencies
- doc: update source-code document
- doc: add svelte docs

---

- 新增：codeBlock 代码块添加自定义代码语言和 prompt 提示词的功能
- 新增：添加 svelte 框架使用的 demo 示例
- 修复：图片对其方式导出为 html 时不生效的问题
- 文档：添加和 svelte 框架集成的相关文档



## v1.0.13 20240714:
- feat: add AIPanelMenus config support
- optimize: update video attribute controls
- fix: AI Menus init error
- docs: add Japanese README

---

- 新增：新增 AIPanelMenus 配置的支持，用于配置 AI 泡泡菜单
- 优化：优化视频节点的控制属性
- 修复：修复 AI 菜单初始化错误的问题
- 文档：新增日文的 readme



## v1.0.11 20240702:
- feat: Added onBlur and onFocus configurations for AIEditor #39
- feat: Added the function of customizing the selected floating menu
- feat: Added the function of AIEditor.getAttributes() method
- optimize: Refactored the international display of AI panel
- optimize: Refactored AbstractBubbleMenu.ts to make it simpler and easier to use
- fix: Fixed the problem of multiple additions of Header under KeepAlive of Vue #37

---

- 新增：新增 AIEditor 的 onBlur 和 onFocus 配置 #39
- 新增：新增自定义选中的浮动菜单的功能
- 新增：新增 AIEditor.getAttributes() 方法的功能
- 优化：重构 AI 面板的国际化显示
- 优化：重构 AbstractBubbleMenu.ts 使之更加简单易用
- 修复：修复 Vue 的 KeepAlive 下 Header 多次添加的问题 #37



## v1.0.10 20240620:
- 新增：新增浮动菜单的开关和菜单项配置功能
- 新增：新增链接的浮动菜单项配置功能
- 新增：新增图片的浮动菜单项配置功能
- 优化：重构 AI 模块，抛出更多的方法类，方便外部直接调用
- 优化：重构 AbstractBubbleMenu.ts 使之更加简单易用
- 文档：现在浮动菜单的相关配置功能



## v1.0.8 20240613:
- 新增：AiModel 添加 chatWithPayload 方法用于传入自定义的 ai 参数信息
- 新增：源码编辑的功能菜单，及其配置。感谢 @jx
- 新增：添加是否可以对整个编辑器拖拽放大缩小的开关配置
- 优化：优化 a 标签在暗色主题下的样式问题，感谢 @lwleen
- 优化：编辑的滚动条样式，感谢 @lwleen
- 优化：移除无用的配置 cbName 和 cbUrl 



## v1.0.6 20240607:
- 新增：AI 大模型新增对 Openai 和 月之暗面 的支持
- 新增：编辑元素新增对 Figure 和 Figcaption 元素的支持
- 新增：AI Prompt 提示词自定义添加对 {content} 占位符的支持
- 优化：修改星火大模型默认版本为 v3.5
- 优化：重构自定义大模型 CustomAiModelConfig 的方法名称和参数
- 优化：重命名 AI 模块里的某些方法和参数，使之更加通俗易懂
- 优化：优化代码里的一些单词拼写错误
- 优化：优化 AIEditor 内部的一些样式名称，防止产生可能的冲突



## v1.0.4 20240528:
- 新增：textSelectionBubbleMenu 添加开关配置的支持
- 优化：在只读模式下，应该关闭掉选中文字菜单的弹出
- 优化：当 AI 大模型配置错误的时候，给出更友好的错误提示
- 优化：选中文字菜单时，自动判断弹出的菜单是否遮挡了顶部菜单，并在下方弹出
- 优化：选中空白内容，但为选中任何文字时，错误的弹出操作菜单的问题
- 优化：更新相关的依赖到最新版本
- 修复：AI 菜单在某些场景下出现错位的问题，感谢 @monksoul
- 文档：添加 React 对 AiEditor 的封装为组件的相关文档，感谢 @monksoul



## v1.0.1 20240522:
- 优化：默认 AIEditor 导出更多的类，方便用户开发
- 修复：图片、附件、视频的 uploadFormName 配置无效的问题
- 修复：CodeBlock 的菜单无法正切换国际化的问题
- 文档：添加和各类 UI 框架集成的相关文档



## v1.0.0 20240329:
- 新增：上传附件、图片、视频添加自定义 formName 的配置能力
- 新增：选择文字内容后，弹出的 AI 菜单添加默认操作项的功能
- 优化：上传附件、图片、视频的 uploadHeaders 支持配置为一个方法
- 优化：升级相关依赖到最新版本
- 文档：添加修改文件、图片和视频的相关错别字
- 文档：添加关于 uploadHeaders 可配置为方法的相关文档



## v1.0.0-rc.9 20240324:
- 新增：自定义大语言模型添加 headers 配置的支持
- 优化：优化 ai 翻译的 prompt 内容，以保证能够正确翻译多国语言
- 优化：移除代码中一些多余的日志输出
- 修复：修正表格的弹出菜单在某些情况下无法正确弹出的问题
- 文档：修正快速开始的 ai 配置不正确（未同步最新版本）的问题
- 文档：添加关于自定义大模型的相关文档



## v1.0.0-rc.8 20240317:
- 新增：添加自定义对接任意大模型的支持
- 新增：添加文心一言大模型的支持，感谢 @bendantada
- 新增：星火大模型添加对 v3.5 的支持
- 新增：AI 客户端新增 SSE 客户端的支持
- 优化：AI 菜单，AI 命令添加自动选择大语言模型的支持
- 文档：修正图片上传的示例错误代码
- 文档：更新配置 models 的相关错误示例



## v1.0.0-rc.7 20240109:
- 新增：添加当 uploader 的 onUploadBefore 返回 false 时，中断文件上传
- 新增：Ai 模块添加自定义 AiModelFactory 的配置，方便引用第三方 Ai 大模型
- 优化：修改  AiEditor.insert 的参数为 any 类型
- 优化：重命名 AiModelFactory 为 AiModelManager
- 修复：修改全屏按钮在某些情况下不起作用的问题，感谢 @ashuicoder
- 修复：高亮块、链接、引用获得焦点时，菜单没有被激活的问题
- 修复：选中文字弹出菜单，菜单内的操作没有根据选择内容激活的问题



## v1.0.0-rc.6 20240102:
- 新增：添加 onSave 的配置，可以用于监听用户按 ctrl + s 的保存操作
- 优化：修改 editable 配置为可选
- 优化：添加 AiModelManager 以及 SparkAiModel 导出
- 修复：修改在 editable 为 false 下，代码块的 ai 功能依然可用的问题
- 文档：修正 onCreateClientUrl



## v1.0.0-rc.5 20240101:
- 新增：CustomMenu 添加 onCreate 方法，方便对自定义菜单进行初始化
- 新增：添加 setContent() 以及 setEditable() 方法
- 优化：重构 AI 菜单功能及其 UI 样式
- 优化：重构 / 弹出 UI 菜单样式以及交互方式
- 优化：重写 AI 模块，重构 AI 抽象菜单
- 样式：@某某某 弹出的 UI 样式
- 样式：优化 taskList 的 ui 样式
- 文档：添加只读模式的相关文档
- 文档：更新 ai 配置的相关文档



## v1.0.0-rc.4 20231222:
- 修复：当 AiEditor 嵌入到 Form 时，点击某些按钮会触发 Form 提交的问题
- 修复：从网页复制的内容粘贴到编辑器，图片无法被粘贴进来的问题
- 修复：点击表格、图片时，会有多个弹出菜单位置冲突的问题



## v1.0.0-rc.2 20231220:
- 新增：自定义菜单添加 id 和 className 类名配置的支持
- 新增：AiEditor 添加 onDestroy 监听的配置支持
- 优化：上传组件重命名 onBeforeUpload 为 onUploadBefore
- 修复：在 React 的 StrictMode 下，无法使用 AiEditor 自定义布局的问题
- 文档：添加自定义布局的相关文档内容



## v1.0.0-rc.1 20231219:
- 新增：AI 功能添加选择文字时，对文字进行在定义 Prompt 操作的功能
- 新增：添加选中文字内容时，弹出操作菜单的功能
- 新增：AiEditor 添加 onCreateBefore 的钩子函数，方便初始化插件
- 修复：同一个页面下，初始化多个 editor 实例时出错的问题
- 修复：修复保持 html 后，通过 html 再次初始化编辑器无法准确解析视频组件的问题
- 优化：重构 AbstractBubbleMenu.ts 的相关属性和逻辑
- 优化：重构 ai 组件，使之能够适配更多的业务场景
- 样式：优化编辑器诸多样式细节
- 文档：添加链接配置 ref/class 等相关配置的文档



## v1.0.0-beta.10 20231213:
- 新增：添加自定义 menu 菜单的支持
- 新增：图片添加 defaultSize 和 allowBase64 配置的支持
- 优化：优化 "getOutline()" 方法的逻辑，添加获取 id 的支持
- 优化：类腾讯文档风格的 demo 实例添加目录显示的功能



## v1.0.0-beta.9 20231208:
- 新增：图片、视频和附件新增 uploaderEvent 监听配置的支持
- 新增：“链接” 功能添加自定义 ref、class 等配置的支持
- 新增：添加头部、编辑区的自定义布局支持
- 新增：添加 “类腾讯文档” 风格的 demo 示例代码
- 新增：AiEditor 添加 "onCreated" 方法用于监听初始化
- 优化：优化 aiEditor 和其他应用使用，在打印内容时可能出现内容错乱的问题
- 优化：重命名 menus 为 header，和 footer 统一命名
- 样式：优化 “表格” 在暗色模式下显示不正确的问题
- 文档：更新关于 uploaderEvent 的相关文档
- 文档：图片添加关于自定义 uploader 的代码示例



## v1.0.0-beta.8 20231207:
- 新增：`代码块` 新增 AI 自动添加注释的功能
- 新增：`代码块` 新增 AI 解释代码含义的功能
- 新增：AiEditor 添加 `getSelectedText()` 用于获取选择的文字
- 新增：图片、视频、附件上传添加 `dataProcessor` 配置用于二次处理服务器请求的功能
- 修复：`代码块` 在第一次初始化时，无法选择代码语言的问题
- 样式：修改 `引用`（`blockquote`）在暗色模式下的样式问题
- 文档：添加关于 `dataProcessor` 的相关文档



## v1.0.0-beta.7 20231204:
- 新增：AiEditor 添加 getMarkdown() 方法，用于获得 markdown 内容
- 新增：AiEditor 添加 getOutline() 方法，用于获得文章的目录内容
- 新增：AiEditor.focusPos(pos) 方法用于定位当前焦点到指定位置
- 新增：添加 "高亮块" 功能，类型 vuepress 的 `:::`
- 修复：修改附件上传时，未配置上传 url 的情况下出现错误的问题
- 修复：字号大小设置菜单无法设置到默认字号的问题
- 修复：自定义 AI 菜单时，添加 4 个以上菜单会出现滚动条的问题
- 优化：AiEditor 类合并 insertHtml 和 insertMarkdown 为 insert 方法
- 优化：优化编辑区的链接、图片、表格的浮动菜单有警告输出的问题
- 优化：重命名工具类的 Title 为 Heading
- 样式：优化链接弹出编辑框网址输入栏不对齐的问题
- 样式：弹出框等元素添加 3px 圆角，使之在 UI 效果上更精致
- 样式：修改内容编辑区的表格有一个横向滚动条的问题
- 样式：优化菜单中插入表格的鼠标移动样式
- 文档：更细 AiEditor 的 API 方法列表
- 文档：readme 添加英文版本的内容



## v1.0.0-beta.6 20231201:
- 新增：增强对 AI 输出自动进行 markdown 转换的功能
- 新增：AiEditor 的相关操作方法支持链式调用的功能
- 新增：添加 "aiEditor.insertMarkdown()" 用于插入 markdown 内容
- 新增：支持直接粘贴 markdown 内容自动转换为可视化编辑的功能
- 新增：增强在输入时更多的 markdown 功能转换
- 优化：重命名 "arEditor.insert()" 方法为 "insertHtml()"
- 文档：添加代码示例的相关链接
- 文档：更新 AI 功能的相关文档



## v1.0.0-beta.5 20231129:
- 新增：为 aieditor 添加全新的 logo
- 新增：添加 1i8n 国际化支持
- 新增：添加 vue 和 aieditor 整合的示例代码和文档
- 新增：添加 react 和 aieditor 整合的示例代码和文档
- 新增：AiEditor 类添加 `insert(html)`、`clear()`、`focus()`、`destroy()` 等更多方法
- 优化：修改菜单中选择的默认样式和图标
- 优化：移除代码中一些无用的 log 输出
- 修复：修复工具栏中下拉菜单无法联动默认样式的问题
- 修复：插入表格时，显示问题 #I8JMYU
- 文档：同步更新许多文档



## v1.0.0-beta.3 20231127:
- 新增：完善文档站点 https://aieditor.dev 并上线
- 新增：添加内容编辑自动保存到 localStorage 功能及其相关 API
- 新增：字体颜色、背景颜色等的最近颜色现在添加自动保存到 localStorage 功能
- 新增：插入表格添加鼠标移动显示行和列的功能
- 优化：重构 ai 菜单的 svg 代码结构
- 优化：重命名 ai 配置中的 command 为 commands
- 优化：优化暗色模式下，一些组件比如 Popover 显示不正确的问题
- 优化：优化许多样式细节



## v1.0.0-beta.2 20231120:
- 新增：添加输入 "/" 时弹出 AI 菜单的功能
- 新增：AiEditor 添加 onChange 的回调配置
- 新增：星火大模型添加 ws 和 wss 协议配置的支持
- 新增：星火大模型添加自定义 URL 数据签名的支持
- 新增：编辑器右下角添加自由拖拽放大或缩小整个编辑器的支持
- 新增：添加传统模式下，比如 Layui 集成的示例
- 新增：顶部菜单以及操作菜单添加鼠标移动有操作提示的支持
- 新增：图片添加多图选择上传显示的功能
- 新增：支持从电脑复制图片到编辑器粘贴上传的功能（之前已支持拖拽上传和选择上传）
- 新增：添加选择某段文字后，点击菜单时选区样式消失的问题
- 优化：优化 @某某某（提及）时的暗色样式错误
- 修复：Base64Uploader 显示模拟上传时显示错误
- 修复：暗色模式下，全屏编辑时，编辑区显示亮色的问题
- 修复：@某某某（提及）通过鼠标点击选择用户时，显示 "@null" 的问题
- 修复：链接弹出菜单点击取消链接时，错误的弹出编辑框的问题
- 修复：Firefox 浏览器下某些 icon 无法显示的问题



## v1.0.0-beta.1 20231110:
完善基本功能
