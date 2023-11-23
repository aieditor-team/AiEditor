# 字号配置


## 示例代码

```typescript
new AiEditor({
    element: "#aiEditor",
    fontSize:{
        values:[
            {name: "初号", value: 56},
            {name: "小初", value: 48},
            {name: "一号", value: 34.7},
            {name: "小一", value: 32},
            {name: "二号", value: 29.3},
            {name: "小二", value: 24},
            {name: "三号", value: 21.3},
            {name: "小三", value: 20},
            {name: "四号", value: 18.7},
            {name: "小四", value: 16},
            {name: "五号", value: 14},
            {name: "小五", value: 12},
        ]
    },
})
```
以上代码中，name 表示字号名称，value 表示字号大小，单位为：px。


