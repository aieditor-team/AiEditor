# What is AiEditor


## Preface


In the age of AI, AIGC is booming. As a CMS vendor, we are also actively seeking the iterative direction of the next generation of CMS to adapt to the upcoming new era. One of the core competencies of the CMS is the ability to edit C (Content), which is embodied through the "editor". So for us, the editor is indispensable.


However, it is unfortunate that many good open source editors such as UEditor, KingEditor, WangEditor, etc., without exception, have stopped or paused updates. The reason for this is nothing more than two points:

- Difficult to develop (editor development has always been referred to as the Ancient Crater).
- Lack of a good business model.

Recently, I was very emotional to see the news that the authors of WangEditor announced the suspension of updates. They have left an indelible mark on the path of open source editors, they are predecessors and role models on this path, salute to the author!


## Decision

**Editor** is the cornerstone of almost all text editing applications, in almost all domestic open source editors have stopped updating today, we decided to carry this banner, spend 5 ~ 10 years, to create a AI-oriented next-generation rich text editor, which not only helps us to build our own market barriers, but also a thing that benefits the country and the people.


So, `'Next Generation'` what does the definition look like? I think there should be these characteristics:

- 1. Complete and stable data structure and algorithm support
- 2. Compatible with Word, WPS, PDF and other formats for import and export
- 3. Perfect teamwork ability
- 4. Complete AI assistance capabilities
- 5. **The most important thing is** : there is a good business model support

For `Point 1` (perfect and stable data structure and algorithm support), we finally chose the open source ProseMirror as the editor kernel after a lot of technical research, it is designed with a stable data structure, and has a rich algorithm API, and more importantly: it has a good reputation and community, and there are many commercial products that use it as a kernel for secondary development, and have been successful in the market (such as Confluence).

`In the business model` , we have an already profitable CMS to support and complement each other. In the future, we will launch more CMS-related products, so the business model is valid: the more we invest in AiEditor, the more it will feed back to our commercial products, and there is a high probability that AiEditor will not be interrupted.



## Open Source

After a period of development, AiEditor has finally released its first open source version, and it already has the basic features that an editor should have, such as:



| function            | description                                                                    |
|---------------|-----------------------------------------------------------------------|
| **Basic features**      |Heading, body, font, font size, bold, italic, underline, strikethrough, link, inline code, superscript, subscript, divider, citation, print                    |
| **Enhanced Features**      | Undo, Redo, Format Painter, Eraser (Clear Formatting), To-Do Items, Font Color, Background Color, Emoji, Alignment, Line Height, With (Without) Sequence List, Paragraph Indentation, Force Line Break |
| **Attachment function**      | Support picture, video, file function, support selective upload, paste upload, drag and drop upload, support drag and resize...                          |
| **Code functionality**      | Inline code, code blocks, language type selection, **AI auto-annotation**, **AI code interpretation**...                           |
| **Markdown**  | Titles, citations, tables, images, code blocks, **highlight blocks (similar to vuepress ::: )**, various lists, bold, italics, strikethrough...          |
| **AI capabilities**     | AI Resume, AI Optimization, AI Proofreading, AI Translation, Custom AI Menus and their Prompts                          |
| **More features**      | Internationalization, Light Theme, Dark Theme, Mobile Version Adaptation, Full Screen Editing, @XXX (Mention)...                               |

Next, we will also launch a series of functions that are more suitable for localization, such as:

* Teamwork
* AI Insert Image
* AI Image Optimization
* AI One-Click Formatting
* The paste function has been further enhanced
* Upload a video to get thumbnails automatically
* WORD import, export
* PDF export, PDF preview
* Similar to Tencent Docs UI style
* Notion-like drag-and-drop function
* More large-scale model docking: Wenxin Yiyan, ChatGPT

 Let's witness together, a better text editor.

### Open source address
- Gitee: https://gitee.com/aieditor-team/aieditor
- Github: https://github.com/aieditor-team/aieditor
