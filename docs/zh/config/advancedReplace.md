# 高级替换功能

高级替换功能，可以标识和替换多个字符串，经常用在 AI 审批、AI 内容审核等场景中。

>PS：此功能在 Pro 版本才有，开源版没有这个功能。 Pro 版预览地址：http://pro.aieditor.com.cn


**支持特性**

* 多关键词同时搜索、高亮和替换
* 支持区分大小写选项
* 支持正则或字面量搜索
* 高亮当前匹配项（.search-result-current）
* 跨关键词循环跳转
* 单个/批量替换
* 滚动到当前结果
* 可自定义关键字区域的 HTML 属性（如 class, style, data-* 等）


## ⚙️ 配置选项（Options）

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `disableRegex` | `boolean` | `true` | 是否禁用正则表达式，启用后按字面量精确匹配 |
| `searchResultClass` | `string` | `"search-result"` | 匹配关键词的高亮 CSS 类名 |
| `onKeywordActivated` | `(term: SearchTerm, range: Range, resultIndex: number) => void` | `undefined` | 当用户选中某个高亮关键词时触发的回调 |

> 🔔 提示：`onKeywordActivated` 在每次光标进入某个匹配区域时触发一次（去重处理）。

示例代码：

```ts
new AiEditorPro({
    element: "#aiEditor",
    search: {
        disableRegex: false,
        searchResultClass: "search-result",
        onKeywordActivated: (term: SearchTerm, range: Range, resultIndex: number) => {
        },
    },
})
```

##  🧩 开始搜索

### 设置搜索项

#### `setSearchTerms(terms: SearchTerm[])`

设置要搜索的关键词列表。

```ts
aieditor.commands().setSearchTerms([
  {
    keyword: "AIEditor",
    replace: "AIEditorPro",
    caseSensitive: false,
    attrs: { class: "highlight-vue", 'data-type': 'framework' }
  },
  {
    keyword: "React",
    replace: "React.js",
    caseSensitive: true,
    attrs: { style: "background: yellow; font-weight: bold;" }
  }
]);
```

> 调用后会自动重新计算所有匹配结果并高亮。 attrs 支持自定义属性，如 class, style, data-* 等。

### SearchTerm 接口详解

```ts
interface SearchTerm {
  keyword: string;           // 必填：要搜索的关键词
  replace: string;           // 非必填：替换内容，不填写的时候不进行替换，如要替换为空字符串，请填写 ""
  caseSensitive?: boolean;   // 是否区分大小写，默认 false
  disableRegex?: boolean;    // 是否禁用正则转义，默认使用全局 disableRegex
  attrs?: Record<string, string | undefined>; // 自定义 HTML 属性
}
```

### 示例：带样式的高亮

```ts
{
  keyword: "bug",
  replace: "fix",
  attrs: {
    class: "error-highlight",
    style: "color: red; text-decoration: wavy underline;",
    'data-tooltip': 'Known issue'
  }
}
```

更多的方法

## 🧪 使用示例：完整搜索替换流程

```ts
// 1. 设置搜索项
editor.commands().setSearchTerms([
  { keyword: "hello", replace: "hi", attrs: { class: "greeting" } },
  { keyword: "world", replace: "earth", caseSensitive: true }
]);

// 2. 跳转到下个搜索结果
editor.commands().resetSearchIndex();

// 3. 滚动到该位置
editor.commands().scrollToSearchResult();

// 4. 替换当前项
editor.commands().replace();

// 5. 替换所有 "hello"
editor.commands().replaceAllForKey("hello");

// 6. 清除搜索
editor.commands().clearSearch();
```


## 📚 API 总览

| 命令 | 参数 | 说明 |
|------|------|------|
| `setSearchTerms(terms)` | `SearchTerm[]` | 设置搜索关键词 |
| `setReplaceForTerm(i, r)` | `number`, `string` | 更新某关键词的替换文本 |
| `resetSearchIndex()` | — | 跳转到第一个匹配 |
| `setSearchIndex(i)` | `number` | 跳转到指定索引 |
| `nextSearchResult()` | — | 下一个匹配（循环） |
| `previousSearchResult()` | — | 上一个匹配 |
| `replace()` | — | 替换当前项 |
| `replaceAll()` | — | 替换所有匹配 |
| `nextSearchResultFor(k)` | `string` | 下一个指定关键词 |
| `previousSearchResultFor(k)` | `string` | 上一个指定关键词 |
| `replaceAllForKey(k)` | `string` | 替换所有某关键词 |
| `clearSearch()` | — | 清除所有搜索状态 |
| `scrollToSearchResult()` | — | 滚动到当前匹配 |


## 🎨 样式建议

默认类名为 `.search-result` 和 `.search-result-current`。你可以添加 CSS 来美化高亮效果：

```css
.aie-content .search-result {
    background-color: #fffb00;
    border-bottom: 2px solid #fffb0080;
    cursor: pointer;
}

.aie-content .search-result-current {
    background-color: #ff69b4;
    color: white;
}
```
