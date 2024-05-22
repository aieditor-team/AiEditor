# What is AiEditor


## Preface


In the era of AI, AIGC (AI-generated content) is flourishing. As a CMS (Content Management System) provider, we are actively seeking the next-generation CMS to adapt to this new era. One core capability of CMS is content editing, which is implemented through an "editor." Thus, an editor is indispensable for us.

Unfortunately, many excellent open-source editors such as UEditor, KingEditor, and WangEditor have either ceased or paused updates. This is primarily due to two reasons: 

- the high development difficulty (editor development has long been considered a massive challenge) .
- the lack of a good business model. 

Recently, WangEditor’s author announced a pause in updates, which deeply moved me. Their contributions have left an indelible mark on the path of open-source editors, making them pioneers and role models. We salute the author!



## Decision

Editors are the cornerstone of nearly all text editing applications. With almost all domestic open-source editors ceasing updates, we have decided to take up this mantle. We plan to spend the next 5 to 10 years developing a next-generation rich text editor aimed at AI. This effort will not only help us build market barriers but also benefit society as a whole.

So, what defines the "next generation"? I believe it should have the following characteristics:

1. Comprehensive and stable data structures and algorithm support
2. Compatibility with formats such as Word, WPS, and PDF for import and export
3. Comprehensive team collaboration capabilities
4. Comprehensive AI assistance capabilities
5. Most importantly: a good business model

For the first point (comprehensive and stable data structures and algorithm support), after extensive technical research, we chose the open-source ProseMirror as the editor's core. Its stable data structure, rich algorithm API, good reputation, and community support make it a suitable choice. Many commercial products using ProseMirror as their core have already achieved market success (e.g., Confluence).

Regarding the business model, we have a profitable CMS to support and complement this project. In the future, we will launch more CMS-related products, making our business model viable. The more we invest in AiEditor, the more it will benefit our commercial products, reducing the likelihood of AiEditor discontinuation.



## Open Source

After a period of development, AiEditor has released its first open-source version, featuring basic functionalities expected of an editor. 



| function            | description                                                                    |
|---------------|-----------------------------------------------------------------------|
| **Basic features**      |Heading, body, font, font size, bold, italic, underline, strikethrough, link, inline code, superscript, subscript, divider, citation, print                    |
| **Enhanced Features**      | Undo, Redo, Format Painter, Eraser (Clear Formatting), To-Do Items, Font Color, Background Color, Emoji, Alignment, Line Height, With (Without) Sequence List, Paragraph Indentation, Force Line Break |
| **Attachment function**      | Support picture, video, file function, support selective upload, paste upload, drag and drop upload, support drag and resize...                          |
| **Code functionality**      | Inline code, code blocks, language type selection, **AI auto-annotation**, **AI code interpretation**...                           |
| **Markdown**  | Titles, citations, tables, images, code blocks, **highlight blocks (similar to vuepress ::: )**, various lists, bold, italics, strikethrough...          |
| **AI capabilities**     | AI Resume, AI Optimization, AI Proofreading, AI Translation, Custom AI Menus and their Prompts                          |
| **More features**      | Internationalization, Light Theme, Dark Theme, Mobile Version Adaptation, Full Screen Editing, @XXX (Mention)...                               |



 Next, we will introduce a series of features that are more suited for localization, such as:

- Team Collaboration
- AI Image Insertion
- AI Image-to-Image Optimization
- One-Click AI Formatting
- Enhanced Paste Functionality
- Automatic Video Thumbnail Generation
- WORD Import and Export
- PDF Export and Preview
- Tencent Docs-like UI Style
- Notion-like Drag-and-Drop Functionality
- Integration with More Large Language Models

Let’s witness together the development of a better text editor.

### Open source address
- Gitee: https://gitee.com/aieditor-team/aieditor
- Github: https://github.com/aieditor-team/aieditor
