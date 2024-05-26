# AiEditor 与 React 整合

在 React 中，我们通过使用 `useRef` Hook 得到 dom 节点，然后再通过 `new AiEditor` 进行实例化，示例代码如下：

```jsx
import {useEffect, useRef} from 'react'
import {AiEditor} from "aieditor";
import "aieditor/dist/style.css"

function App() {

    //定义 ref
    const divRef = useRef(null);

    //初始化 AiEditor
    useEffect(() => {
        if (divRef.current) {
            const aiEditor = new AiEditor({
                element: divRef.current,
                placeholder: "点击输入内容...",
                content: 'AiEditor 是一个面向 AI 的开源富文本编辑器。 ',
            })
            return ()=>{
                aiEditor.destroy();
            }
        }
    }, [])

    return (
        <>
            <div>
                <h1>AiEditor，一个面向 AI 的富文本编辑器</h1>
            </div>
            <div ref={divRef} style={{height: "600px"}} />
        </>
    )
}

export default App
```

## React 组件

```jsx
import { AiEditor } from "aieditor";
import "aieditor/dist/style.css";

import { HTMLAttributes, forwardRef, useEffect, useRef } from "react";

type AIEditorProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (val: string) => void;
};

export default forwardRef<HTMLDivElement, AIEditorProps>(function AIEditor(
  { placeholder, defaultValue, value, onChange, ...props }: AIEditorProps,
  ref
) {
  const divRef = useRef<HTMLDivElement>(null);
  const aiEditorRef = useRef<AiEditor | null>(null);

  useEffect(() => {
    if (!divRef.current) return;

    if (!aiEditorRef.current) {
      const aiEditor = new AiEditor({
        element: divRef.current,
        placeholder: placeholder,
        content: defaultValue,
        onChange: (ed) => {
          if (typeof onChange === "function") {
            onChange(ed.getMarkdown());
          }
        },
      });

      aiEditorRef.current = aiEditor;
    }

    return () => {
      if (aiEditorRef.current) {
        aiEditorRef.current.destroy();
        aiEditorRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ref) {
      if (typeof ref === "function") {
        ref(divRef.current);
      } else {
        ref.current = divRef.current;
      }
    }
  }, [ref]);

  useEffect(() => {
    if (aiEditorRef.current && value !== aiEditorRef.current.getMarkdown()) {
      aiEditorRef.current.setContent(value || "");
    }
  }, [value]);

  return <div ref={divRef} {...props} />;
});
```

### 使用

```jsx
const [value, setValue] = useState("");

<AIEditor
    placeholder="描述代码的作用，支持 Markdown 语法.."
    style={{ height: 220 }}
    value={value}
    onChange={(val) => setValue(val)}
/>
```

更多 react 集成示例请参考：https://gitee.com/aieditor-team/aieditor/tree/main/demos/react-ts 