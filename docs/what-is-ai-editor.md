# What is AiEditor



## Introduction

> AiEditor is a next-generation rich text editor for AI. It is developed based on Web Component and therefore supports almost any front-end framework such as  Vue, React, Angular, Svelte, etc. It is adapted to PC Web and mobile terminals, and provides two themes: light and dark. In addition, it also provides flexible configuration, and developers can easily use it to develop any text editing application.



## Why develop AiEditor

Now, the AI era has arrived, and AIGC is booming.

In 2023, we started to choose a suitable AI rich text editor for our products, and we found excellent products such as CKEditor, TinyMCE, and Tiptap. However, they have more or less the following problems:

- CKEditor and TinyMCE are both based on the GPL open source agreement, and the open source agreement is not friendly.
- Tiptap is a headless editor, and a lot of additional development work needs to be done based on it when using it.

**The most important thing is:**
> When using the AI functions of editors such as CKEditor, TinyMCE, and Tiptap, you must use their **_paid_** plug-ins and AI cloud services. In this case, the applications will face many limitations if we develop based on it.
> For example: we cannot be deployed privately and not use private LLM apiKey, etc.

Therefore, I decided to develop AiEditor to solve the above problems.

## Positioning of AiEditor

1. Our original intention in developing AiEditor was to solve AI editing problems. Therefore, in terms of AI, AiEditor supports the use of private apiKey to connect to any LLMs, including ChatGPT, iFlytek Spark and any privatized LLM.
2. We hope that AiEditor has more usage scenarios and is not limited to any UI rendering framework, such as Vue, React, Angular, Svelte, etc.  Therefore, we developed it based on Web Component, which can be well integrated with any framework.
3. We provide a friendly UI, support two themes, light and dark, support the writing habit of using Markdown, support flexible function configuration and custom layout, and use the open source protocol LGPL, which is more friendly than CKEditor and TinyMCE.
4. In addition, we will continue to learn from excellent products, such as Notion, etc., to provide a series of useful AI functions... Of course, AiEditor is still evolving, and we need your support.


## Open source

After a period of development, AiEditor finally released its first open source version, and it already has the basic functions that an editor should have, such as:

| Function | Description                                                                                                                                                                                           |
|------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Basic functions** | Title, text, font, font size, bold, italics, underline, strikethrough, link, inline code, superscript, subscript, dividing line, quote, print                                                         |
| **Enhanced Features** | Undo, Redo, Format Painter, Eraser (clear format), To-Do List, Font Color, Background Color, Emoji, Alignment, Line Height, With (or without) Sequence List, Paragraph Indentation, forced line breaks |
| **Attachment function** | Supports pictures, videos, and file functions, supports selection upload, paste upload, drag and drop upload, and drag resize...                                                                      |
| **Code function** | Inline code, code block, language type selection, **AI automatic annotation**, **AI code explanation**...                                                                                             |
| **Markdown** | Titles, quotes, tables, pictures, code blocks, **highlight blocks (similar to vuepress's `:::` )**, various lists, bold, italics, strikethrough...                                                    |
| **AI Function** | AI continuation, AI optimization, AI proofreading, AI translation, customized AI menu and its Prompts                                                                                                 |
| **More features** | Internationalization, light theme, dark theme, mobile adaptation, full-screen editing, @someone (mentioned)...                                                                                 |


Next, we will also launch a series of features, such as:

* Collaboration
* insert image by AI
* image-generating by AI
* one-click layout by AI
* Automatically obtain thumbnails for uploaded videos
* WORD import and export
* PDF export, and preview
* Notion-like drag and drop features
* etc

### Github
-  https://github.com/aieditor-team/aieditor