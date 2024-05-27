# AiEditor integrates with React

In React, we get the dom node by using `useRef` a hook, and then instantiate it with `new AiEditor` , the sample code is as follows:

```jsx
import {useEffect, useRef} from 'react'
import {AiEditor} from "aieditor";
import "aieditor/dist/style.css"

function App() {

    //Define Ref
    const divRef = useRef(null);

    //Initialization AiEditor
    useEffect(() => {
        if (divRef.current) {
            const aiEditor = new AiEditor({
                element: divRef.current,
                placeholder: "Click to Input Content...",
                content: 'AiEditor is an Open Source Rich Text Editor Designed for AI. ',
            })
            return ()=>{
                aiEditor.destroy();
            }
        }
    }, [])

    return (
        <>
            <div>
                <h1>AiEditor， an Open Source Rich Text Editor Designed for AI</h1>
            </div>
            <div ref={divRef} style={{height: "600px"}} />
        </>
    )
}

export default App
```

## React Component

```jsx
// "use client"; // Next.JS

import { AiEditor, AiEditorOptions } from "aieditor";
import "aieditor/dist/style.css";

import { HTMLAttributes, forwardRef, useEffect, useRef } from "react";

type AIEditorProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (val: string) => void;
  options?: Omit<AiEditorOptions, "element">;
};

export default forwardRef<HTMLDivElement, AIEditorProps>(function AIEditor(
  {
    placeholder,
    defaultValue,
    value,
    onChange,
    options,
    ...props
  }: AIEditorProps,
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
        ...options,
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

### Example

```jsx
const [value, setValue] = useState("");

<AIEditor
    placeholder="描述代码的作用，支持 Markdown 语法.."
    style={{ height: 220 }}
    value={value}
    onChange={(val) => setValue(val)}
/>
```

**in `Next.JS`：**

```jsx
const AIEditor = dynamic(() => import("./AIEditor"), {
  ssr: false,
  loading: () => <Spin style={{ margin: "0 0 0 10px" }} />,
});

function App(){
    const [value, setValue] = useState("");

    return (<AIEditor
        placeholder="描述代码的作用，支持 Markdown 语法.."
        style={{ height: 220 }}
        value={value}
        onChange={(val) => setValue(val)}
    />);
}
```

For more examples of React integration, please refer to：https://gitee.com/aieditor-team/aieditor/tree/main/demos/react-ts 