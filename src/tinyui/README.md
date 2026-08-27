# TinyUI

TinyUI 是 AiEditor 开源核心内置的轻量 DOM 模板运行时，适合菜单、弹窗、AI 助手面板等小型界面。
它把可信模板解析成真实 DOM，并为插值、属性、Property、事件、结构指令和组件建立细粒度 Binding。
调用 `update()` 后，只检查依赖本次变化字段的 Binding。

TinyUI 的目标不是复刻 Vue、React，也不提供虚拟 DOM、编译器、深层响应式、路由或完整组件生态。
业务计算应放在 TypeScript 中，模板只负责声明 DOM 和读取状态。

## 快速开始

`html` 已从 `aieditor` 包公共入口导出：

```ts
import {html, type TinyUIView} from 'aieditor'

type AssistantState = {
    title: string
    message: string
    count: number
    increment: () => void
}

let view: TinyUIView<AssistantState>
view = html(`
    <section>
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
        <button @click="increment">Count: {{ count }}</button>
    </section>
`, {
    title: 'AI Assistant',
    message: 'Hello',
    count: 0,
    increment() {
        view.update({count: view.context.count + 1})
    },
})

view.mount(document.querySelector('#app')!)
```

## 模板语法

| 能力 | 语法 | 行为 |
| --- | --- | --- |
| HTML | `<div>...</div>` | 交给浏览器原生 HTML 解析器处理 |
| 文本插值 | `{{ name }}` | 写入 Text 节点，`null`/`undefined` 输出空字符串 |
| 属性插值 | `title="{{ title }}"` | 用 `setAttribute` 更新字符串属性 |
| DOM Property | `:value="value"` | 直接写入元素 Property，保留值的原始类型 |
| 事件 | `@click="click"` | 事件发生时从最新 context 读取处理函数 |
| 事件修饰符 | `@submit.prevent="submit"` | 支持 `prevent`、`stop`、`self`、`once`、`capture`、`passive` |
| Ref | `#input` | 将元素保存到 `view.refs.input` |
| 组件 | `<Icon name="send" />` | 渲染已注册的函数组件或对象组件 |
| 条件 DOM | `if="visible"` | 假值时销毁整棵子树，真值时重新创建 |
| 条件隐藏 | `hidden="collapsed"` | 保留 DOM，只更新原生 `hidden` Property |
| 列表 | `each="item, index in items"` | 为数组的每项创建独立子 Runtime |
| 状态 | `view.update({count: 1})` | 浅合并状态，并按顶层变化键增量刷新 |
| 调度状态 | `view.scheduleUpdate({text})` | 合并同一微任务中的高频更新 |

事件修饰符可以组合，例如 `@click.self.once="select"`。`passive` 与 `prevent` 互斥，未知、重复
或互斥修饰符会在模板创建阶段抛错。省略事件表达式时，事件名同时作为处理函数名，`@click`
等价于 `@click="click"`。

普通属性始终得到字符串。需要向 `value`、`checked`、`disabled`、`readOnly`、`tabIndex` 或组件
传递对象等非字符串值时，应使用 `:property="expression"`。HTML 解析器会把模板属性名转成小写，
TinyUI 会在普通 DOM 元素的原型链上恢复 `readOnly`、`maxLength` 等 camelCase Property 名。

## 表达式

TinyUI 只支持属性路径和字面量：

```text
user
user.profile.name
true  false  null  undefined
42  -3.5
'ready'  "ready"
```

不支持函数调用、运算符、数组下标、可选链、赋值或任意 JavaScript，例如下面的表达式都会被拒绝：

```text
increment()
count + 1
items[0]
user?.name
```

这个限制保证解析器不使用 `eval` 或 `Function`。格式化、条件计算和事件参数处理应在状态更新前完成，
再把结果字段交给模板。

## 状态和更新

`view.update(patch)` 使用 `Object.assign` 浅合并到创建视图时传入的同一个 context 对象。Patch 中的
顶层键决定本轮检查哪些 Binding：

```ts
view.update({message: 'Done'})
```

上面的调用不会重新写入只依赖 `title` 或 `count` 的文本和属性。即使依赖字段被传入相同值，各 Binding
仍会用 `Object.is` 比较缓存并跳过重复 DOM 写入。无参数 `view.update()` 表示执行一次全量检查，适合调用方
直接修改了 `view.context` 后主动同步。

TinyUI 不代理对象，也不自动侦测深层变更。特别是组件 Props 使用浅层 `Object.is` 签名避免重复渲染，
更新嵌套数据时应替换引用：

```ts
view.update({user: {...view.context.user, name: 'Ada'}})
```

AI 流式文本等高频场景可以使用 `scheduleUpdate()`：context 会立即浅合并，但 DOM 会等当前同步任务结束后
统一刷新。同一微任务中的多个 Patch 会合并；期间调用同步 `update()` 会立即冲刷全部待处理字段，之后不会
重复渲染：

```ts
view.scheduleUpdate({message: 'Hel'})
view.scheduleUpdate({message: 'Hello'})
// 此处 view.context.message 已是 Hello，DOM 将在微任务中只更新一次。
```

组件 `render()` 正在执行时不能同步调用同一个 UIView 的 `update()`，否则旧 render 结果可能覆盖内层新状态；
TinyUI 会明确抛错。需要从 render 触发后续状态时使用 `scheduleUpdate()`，让它进入下一个微任务。更新另一个
独立 UIView（例如组件自行持有的子 UIView）不受此限制。

## 视图生命周期

`html()` 返回尚未挂载的 `UIView`：

```ts
view.mount(container) // 把稳定的根元素追加到容器
view.unmount()        // 只移出 DOM，可再次 mount
view.update(patch)    // 浅合并状态并刷新
view.scheduleUpdate(patch) // 合并同一微任务内的高频刷新
view.destroy()        // 永久清理事件、组件、子 Runtime、Ref 和 DOM
```

`destroy()` 可重复调用。视图销毁后不能再次 `mount()` 或 `update()`。

## 自定义组件

组件可以是函数，也可以是包含 `render()` 的对象。注册名匹配不区分大小写；可放在 context 的
`components` 字段中，也可通过第三个参数显式传入。组件优先级为内置默认、context、显式 options，
后者可以覆盖前者：

```ts
import {
    html,
    type TinyUIComponent,
    type TinyUIComponentContext,
    type UIComponent,
} from 'aieditor'

const Icon: TinyUIComponent = (props, context) => {
    const icon = context.document.createElement('span')
    icon.className = 'icon'
    icon.dataset.name = String(props.name)
    icon.style.fontSize = `${Number(props.size ?? 16)}px`
    return icon
}

const Messages: TinyUIComponent = (_props, context) => {
    const list = context.document.createElement('div')
    list.className = 'messages'
    return list
}

const Composer: TinyUIComponent = (props, context) => {
    const form = context.document.createElement('form')
    const input = context.document.createElement('input')
    input.placeholder = String(props.placeholder ?? '')
    form.append(input)
    return form
}

const state = {
    placeholder: '输入消息',
    composerConfig: {multiline: true},
    clear() {},
    send(event: Event) {
        event.preventDefault()
    },
}

const view = html(`
    <section>
        <header>
            <h3>AI Assistant</h3>
            <button @click="clear">
                <Icon name="brush-cleaning" size="16" />
            </button>
        </header>

        <Messages #messages />
        <Composer :config="composerConfig" placeholder="{{ placeholder }}" @submit="send" />
    </section>
`, state, {
    components: {Icon, Messages, Composer},
})
```

### LucideIcon

TinyUI 默认注册了通用 `LucideIcon` 组件，使用时无需重复传入 `components`。`icon` 接收调用方
按需导入的 Lucide 图标定义，不使用字符串查询完整图标表，因此打包器仍可移除未使用的图标：

```ts
import {SendHorizontal, Square} from 'lucide'
import {html} from 'aieditor'

const view = html(`
    <button aria-label="{{ label }}">
        <LucideIcon :icon="icon" size="16" />
    </button>
`, {
    icon: SendHorizontal,
    label: '发送',
})

view.update({icon: Square, label: '停止'})
```

组件还支持 `class`、`stroke`、`stroke-width`、`aria-label`、`aria-hidden`、`focusable` 和 `role`。
默认图标为装饰内容（`aria-hidden="true"`）；直接给图标提供 `aria-label` 时，会自动设置
`role="img"` 并取消隐藏。建议优先把交互名称放在外层按钮上，让按钮内图标保持装饰语义。

组件收到两个参数：

- `props`：静态属性、插值属性和 `:property` 组成的对象。
- `context.children`：组件标签原始子节点的新克隆，是尚未由 TinyUI 编译的 `DocumentFragment`。
- `context.document`：当前视图使用的 `Document`，组件应使用它创建 DOM。
- `context.state`：父视图状态对象的引用。

组件的响应式输入默认只有 Props。组件若在 render 中直接读取 `context.state`，应在组件上声明相应属性路径，
否则普通 Patch 不会触发它重渲染；无参数 `update()` 仍可作为强制全量检查的兼容兜底：

```ts
type AppState = {theme: string, status: string}

const ThemeLabel: UIComponent<AppState> = {
    dependencies: ['theme'],
    render(_props, context) {
        return context.state.theme
    },
}

const Status = Object.assign(
    (_props: Record<string, unknown>, context: TinyUIComponentContext<AppState>) => context.state.status,
    {dependencies: ['status'] as const},
)
```

依赖允许使用 `user.profile` 这样的路径，调度仍以顶层 `user` 字段为单位。声明值也参与组件的 `Object.is`
签名缓存，因此无关 Patch 和相同值都不会重新 render。

组件可以返回 `Node`、`DocumentFragment`、`UIView`、`string`、`number`、`null` 或 `undefined`。字符串和数字
会成为 Text 节点；空值会清除组件输出；嵌套 `UIView` 会随父组件一起销毁。组件返回跨 Document 节点时，
浏览器会在插入时按 DOM 规则接管节点。若组件自行更新并重复返回同一个 Node 或 `UIView`，TinyUI 会保留
现有 DOM、事件和 Ref，不执行移除再插入，也不会误销毁仍在复用的子视图。

组件标签上的 `#ref` 和 `@event` 指向返回结果中的第一个 Element，支持 HTML 和 SVG 元素。声明了事件的
组件必须返回至少一个 Element。组件返回多个根节点时，其余节点仍属于该组件，会在更新或销毁时一并移除。

组件 Props 名会经过 HTML 解析器并转为小写，因此推荐使用小写或 kebab-case 名称。组件标签内容只是原始
DOM 克隆，TinyUI 不会自动编译其中的插值和指令；组件若要让 children 参与渲染，需要自行消费它们或返回
一个新的 `UIView`。

## 条件和列表

`if` 会真实创建、销毁 DOM 与其事件；`hidden` 只切换元素原生隐藏状态：

```html
<p if="hasMessage" #message>{{ message }}</p>
<aside hidden="collapsed">Details</aside>
```

列表表达式支持 `item in items` 和 `item, index in items`。省略索引名时可用 `$index`：

```html
<ul>
    <li each="item, index in items">{{ index }}: {{ item.name }}</li>
</ul>
```

`items` 必须是数组；`null` 和 `undefined` 视为空列表。传入新数组时，TinyUI 会按 `Object.is` 复用从头连续
相同的条目，只编译变化后的后缀，因此不可变的 append 操作只创建新增 DOM。改变已有条目时应同时替换对应
对象引用。传入同一个数组引用会完整重建，保留原地修改后显式刷新的兼容行为。

当前还没有任意位置的 keyed diff；列表中部插入、重排或首项变化仍会重建其后的条目。只更新其他全局字段时，
变化会转发到现有条目的子 Runtime，不会重建列表。

## 架构

```text
html(template, context, options)
  -> UITemplate              有界 LRU 复用解析 DOM，并导入目标 Document
  -> UITemplateParser        遍历 DOM，创建 Binding
  -> UIRuntime               持有依赖索引、共享 Resolver、Ref 注册表和更新队列
  -> UIView                  暴露 mount/update/unmount/destroy

src/tinyui/
├── core/                    门面、UIView、Runtime、更新队列、Ref 注册表和公共类型
├── template/                模板解析与 Binding 构建
├── resolver/                受限表达式和插值解析
├── binding/                 文本、属性、Property、事件和结构 Binding
├── component/               组件契约与组件 Binding
└── index.ts                 TinyUI 公共导出边界
```

`if`、`each` 和组件更新采用“先构建、后提交”的方式。新结构会先在脱离页面的 Fragment 中编译；组件也会
先完成 render、结果校验、事件和 Ref 准备。组件候选输出或列表新后缀会先插入旧输出之前，插入成功后才销毁
旧 Runtime 和 DOM。发生异常时，TinyUI 销毁临时 Runtime、恢复 Ref 并保留原有 DOM，调用方修复
状态后可以再次 `update()`。若某个 Binding 抛错导致同一队列的后续 Binding 尚未执行，队列会保留这些
未执行项，并在下一次更新中以全量语义补刷；已经抛错的 Binding 则继续遵循自身依赖或结构转发规则。

列表使用稳定的起止锚点和条目锚点定位 DOM，因此 `each` 可以直接作用于会替换原标签的组件。调用方不应
移动或删除 TinyUI 管理的注释锚点；若外部 DOM 操作破坏锚点，后续结构提交会明确报错并保留仍存在的旧输出。

Ref 使用 UIView 内共享的双向所有权表维护。同名 Ref 仍由最后注册且存活的元素对外可见，但条件卸载、列表
缩短或失败回滚时会恢复前一个存活元素。注册和注销都是常数时间，结构更新不再为回滚复制完整 `refs` 对象。

每个根 UIView 拥有一个 Resolver 缓存，条件和列表子 Runtime 共享其中预编译的表达式与插值访问器；缓存随
UIView 一起释放。模板 DOM 缓存则按 Document 隔离并限制为最近使用的 100 项，避免动态模板无限占用内存。

## 安全边界

TinyUI 模板必须来自可信的开发者源码，不能直接接收用户输入、AI 输出或远程 HTML。模板初次创建时仍会由
浏览器当作 HTML 解析；TinyUI 不是 HTML、URL 或 CSS 清洗器。

文本插值和普通属性通过 Text 与 `setAttribute` 写入，不会被再次解释为 HTML；受限表达式也不会执行任意
JavaScript。但 DOM Property 遵循浏览器自身语义，`:innerHTML`、`:outerHTML`、`:srcdoc` 等内容型 Property
仍可能解析 HTML，不应绑定不可信值。`href`、`src` 和 `style` 等值也需要业务层校验。用户或 AI 生成的 HTML
必须继续经过 AiEditor 既有的 DOMPurify 安全流程，不能用 TinyUI 绕过。

## 当前限制

- 模板必须恰好包含一个普通 HTML 根元素，根元素不能使用 `if`、`each`，也不能是注册组件。
- 不支持多根视图、虚拟 DOM、任意位置 keyed list diff 或自动深层响应式。
- 表达式只允许属性路径和字面量，不支持方法调用及运算。
- 组件 children 是未编译的原始 DOM 克隆。
- HTML 会把组件 Prop 名转成小写，建议使用小写或 kebab-case。
- 重复 Ref 名只暴露最后注册且仍存活的元素；需要同时访问列表中的全部元素时，应由组件自行维护集合。

## 测试

TinyUI 测试覆盖正常流程、无效表达式、事件修饰符、跨 Document/SVG、重复更新、列表与条件回滚、组件
渲染失败、提交阶段异常、调度重入与失败恢复、同名 Ref 所有权、LRU/Document 缓存隔离、确定性工作量及
资源清理等场景。运行专项测试、全量测试和覆盖率：

```bash
npx vitest run tests/tinyui
npm run test:run
npm run test:coverage
```

当前 TinyUI 专项测试覆盖缓存、增量列表、组合失败回滚、调度重入和资源销毁等场景。新增语法或公共行为时，
应同步增加正常、边界、失败回滚、缓存复用、更新工作量和销毁场景测试；具体数量与覆盖率以验证命令输出为准。
