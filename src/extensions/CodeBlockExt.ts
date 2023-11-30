import {CodeBlockLowlight, CodeBlockLowlightOptions} from "@tiptap/extension-code-block-lowlight";
import tippy from "tippy.js";
import {isActive} from "../util/isActive.ts";
import {TextSelection} from "prosemirror-state";
import {textblockTypeInputRule} from "../util/textblockTypeInputRule.ts";
import {Selection} from '@tiptap/pm/state';
import {Node} from '@tiptap/pm/model';


export type LanguageItem = {
    name: string;
    value: string;
    alias?: string[];
};

export const languages = [
    {name: 'Auto', value: ''},
    {name: 'Plain Text', value: 'plaintext', alias: ['text', 'txt']},
    {name: 'Bash', value: 'bash', alias: ['sh']},
    {name: 'BASIC', value: 'basic', alias: []},
    {name: 'C', value: 'c', alias: ['h']},
    {name: 'Clojure', value: 'clojure', alias: ['clj', 'edn']},
    {name: 'CMake', value: 'cmake', alias: ['cmake.in']},
    {
        name: 'CoffeeScript',
        value: 'coffeescript',
        alias: ['coffee', 'cson', 'iced'],
    },
    {
        name: 'C++',
        value: 'cpp',
        alias: ['cc', 'c++', 'h++', 'hpp', 'hh', 'hxx', 'cxx'],
    },
    {name: 'C#', value: 'csharp', alias: ['cs', 'c#']},
    {name: 'CSS', value: 'css', alias: []},
    {name: 'Dart', value: 'dart', alias: []},
    {name: 'Delphi', value: 'delphi', alias: ['dpr', 'dfm', 'pas', 'pascal']},
    {name: 'Dockerfile', value: 'dockerfile', alias: ['docker']},
    {name: 'Erlang', value: 'erlang', alias: ['erl']},
    {name: 'Go', value: 'go', alias: ['golang']},
    {name: 'GraphQL', value: 'graphql', alias: ['gql']},
    {name: 'Groovy', value: 'groovy', alias: []},
    {name: 'Java', value: 'java', alias: ['jsp']},
    {
        name: 'JavaScript',
        value: 'javascript',
        alias: ['js', 'jsx', 'mjs', 'cjs'],
    },
    {name: 'JSON', value: 'json', alias: []},
    {name: 'Kotlin', value: 'kotlin', alias: ['kt', 'kts']},
    {name: 'Lua', value: 'lua', alias: []},
    {name: 'Makefile', value: 'makefile', alias: ['mk', 'mak', 'make']},
    {name: 'Markdown', value: 'markdown', alias: ['md', 'mkdown', 'mkd']},
    {name: 'Matlab', value: 'matlab', alias: []},
    {
        name: 'Objective-C',
        value: 'objectivec',
        alias: ['mm', 'objc', 'obj-c', 'obj-c++', 'objective-c++'],
    },
    {name: 'PHP', value: 'php', alias: []},
    {name: 'Properties', value: 'properties', alias: []},
    {name: 'Python', value: 'python', alias: ['py', 'gyp', 'ipython']},
    {
        name: 'Ruby',
        value: 'ruby',
        alias: ['rb', 'gemspec', 'podspec', 'thor', 'irb'],
    },
    {name: 'Rust', value: 'rust', alias: ['rs']},
    {name: 'Scala', value: 'scala', alias: []},
    {name: 'SCSS', value: 'scss', alias: []},
    {name: 'Shell', value: 'shell', alias: ['console', 'shellsession']},
    {name: 'SQL', value: 'sql', alias: []},
    {name: 'Swift', value: 'swift', alias: []},
    {name: 'TypeScript', value: 'typescript', alias: ['ts', 'tsx']},
    {name: 'WebAssembly', value: 'wasm', alias: []},
    {
        name: 'HTML, XML',
        value: 'xml',
        alias: [
            'html',
            'xhtml',
            'rss',
            'atom',
            'xjb',
            'xsd',
            'xsl',
            'plist',
            'wsf',
            'svg',
        ],
    },
    {name: 'YAML', value: 'yaml', alias: ['yml']},
] as LanguageItem[];


export const getLanguageByValueOrAlias = (
    valueOrAlias: string
): LanguageItem | null => {
    if (!valueOrAlias) {
        return null;
    }
    const v = valueOrAlias.toLocaleLowerCase();
    const language = languages.find(
        (language) => language.value === v || (language.alias && language.alias.includes(v))
    );
    return language!;
};

export const getLanguageByValue = (value: string): LanguageItem | null => {
    if (!value) {
        return null;
    }
    return languages.find((language) => language.value === value)!;
};

export function getSelectedLineRange(
    selection: Selection,
    codeBlockNode: Node
) {
    const {$from, from, to} = selection;
    const text = codeBlockNode.textContent || '';
    const lines = text.split('\n');

    const lineLastIndexMap = lines.reduce((acc, line, index) => {
        acc[index] = (acc[index - 1] || 0) + line.length + (index === 0 ? 0 : 1);
        return acc;
    }, {} as { [key: number]: number });

    const selectedTextStart = $from.parentOffset;
    const selectedTextEnd = $from.parentOffset + to - from;
    const lineKeys = Object.keys(lineLastIndexMap) as unknown as number[];
    const selectedLineStart: number | undefined = lineKeys.find(
        (index) => lineLastIndexMap[index] >= selectedTextStart
    );
    const selectedLineEnd: number | undefined = lineKeys.find(
        (index) => lineLastIndexMap[index] >= selectedTextEnd
    );
    return {
        start: selectedLineStart,
        end: selectedLineEnd,
    };
}

export const backtickInputRegex = /^[`·]{3}([a-z]+)?[\s\n]$/;
export const tildeInputRegex = /^[~～]{3}([a-z]+)?[\s\n]$/;

export interface MyCodeBlockLowlightOptions extends CodeBlockLowlightOptions {
    lowlight: any,
    defaultLanguage: string | null | undefined,
    languages: LanguageItem[]
}

export const CodeBlockExt = CodeBlockLowlight.extend<MyCodeBlockLowlightOptions>({
    addOptions() {
        return {
            ...this.parent?.(),
            lowlight: {},
            defaultLanguage: null,
            languages,
        }
    },


    addCommands() {
        return {
            ...this.parent?.(),
            toggleCodeBlock:
                (attributes) =>
                    ({commands, editor, chain}) => {
                        const {state} = editor;
                        const {from, to} = state.selection;

                        // 如果选中范围是连续段落，则合并后转成一个 codeBlock
                        if (!isActive(state, this.name) && !state.selection.empty) {
                            let isSelectConsecutiveParagraphs = true;
                            const textArr: string[] = [];
                            state.doc.nodesBetween(from, to, (node, pos) => {
                                if (node.isInline) {
                                    return false;
                                }
                                if (node.type.name !== 'paragraph') {
                                    if (pos + 1 <= from && pos + node.nodeSize - 1 >= to) {
                                        // 不要返回 false, 否则会中断遍历子节点
                                        return;
                                    } else {
                                        isSelectConsecutiveParagraphs = false;
                                        return false;
                                    }
                                } else {
                                    const selectedText = (node.textContent || '').slice(
                                        pos + 1 > from ? 0 : from - pos - 1,
                                        pos + node.nodeSize - 1 < to
                                            ? node.nodeSize - 1
                                            : to - pos - 1
                                    );
                                    textArr.push(selectedText || '');
                                }
                            });
                            // 仅处理选择连续多个段落的情况
                            if (isSelectConsecutiveParagraphs && textArr.length > 1) {
                                return chain()
                                    .command(({state, tr}) => {
                                        tr.replaceRangeWith(
                                            from,
                                            to,
                                            this.type.create(
                                                attributes,
                                                state.schema.text(textArr.join('\n'))
                                            )
                                        );
                                        return true;
                                    })
                                    .setTextSelection({
                                        from: from + 2,
                                        to: from + 2,
                                    })
                                    .run();
                            }
                        }

                        return commands.toggleNode(this.name, 'paragraph', attributes);
                    },
        };
    },

    addKeyboardShortcuts() {
        return {
            ...this.parent?.(),
            Tab: ({editor}) => {
                const {state, view} = editor;
                if (!isActive(state, this.name)) {
                    return false;
                }
                const {selection, tr} = state;
                const tab = '  ';
                if (selection.empty) {
                    view.dispatch(tr.insertText(tab));
                } else {
                    const {$from, from, to} = selection;
                    const node = $from.node(); // code block node
                    if (node.type !== this.type) {
                        return false;
                    }

                    const {start: selectedLineStart, end: selectedLineEnd} =
                        getSelectedLineRange(selection, node);

                    //replace tab string
                    if (selectedLineStart === undefined || selectedLineEnd === undefined) {
                        view.dispatch(tr.replaceSelectionWith(state.schema.text(tab)));
                        return true;
                    }

                    const text = node.textContent || '';
                    const lines = text.split('\n');
                    const newLines = lines.map((line, index) => {
                        if (
                            index >= selectedLineStart &&
                            index <= selectedLineEnd &&
                            line
                        ) {
                            return tab + line;
                        }
                        return line;
                    });
                    const codeBlockTextNode = $from.node(1);
                    const codeBlockTextNodeStart = $from.start(1);
                    tr.replaceWith(
                        codeBlockTextNodeStart,
                        codeBlockTextNodeStart + codeBlockTextNode.nodeSize - 2,
                        state.schema.text(newLines.join('\n'))
                    );
                    tr.setSelection(
                        TextSelection.between(
                            tr.doc.resolve(from + tab.length),
                            tr.doc.resolve(
                                to + (selectedLineEnd - selectedLineStart + 1) * tab.length
                            )
                        )
                    );
                    view.dispatch(tr);
                }
                return true;
            },
        };
    },

    addInputRules() {
        return [
            textblockTypeInputRule({
                find: backtickInputRegex,
                type: this.type,
                getAttributes: (match) => ({
                    language:
                        getLanguageByValueOrAlias(match[1])?.value ||
                        this.options.defaultLanguage,
                })
            }),
            textblockTypeInputRule({
                find: tildeInputRegex,
                type: this.type,
                getAttributes: (match) => ({
                    language:
                        getLanguageByValueOrAlias(match[1])?.value ||
                        this.options.defaultLanguage,
                })
            }),
        ];
    },

    addNodeView() {
        return (e) => {
            const container = document.createElement('div')
            container.classList.add("aie-codeblock-wrapper")
            const {language} = e.node.attrs;

            container.innerHTML = `
                <div class="aie-codeblock-tools" contenteditable="false">
                    <div class="aie-codeblock-tools-lang" contenteditable="false"><span>${language || this.options.defaultLanguage}</span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 16L6 10H18L12 16Z"></path></svg></div>
                </div>
                <pre class="hljs"><code></code></pre>
                `

            const createEL = () => {
                const div = document.createElement("div") as HTMLDivElement;
                div.classList.add("aie-codeblock-langs")
                div.innerHTML = `
                ${this.options.languages.map((lang) => {
                    return `<div class="aie-codeblock-langs-item" data-item="${lang.value}">${lang.name}</div>`
                }).join("")}`

                div.addEventListener("click", (event) => {
                    const target: HTMLDivElement = (event.target as HTMLElement).closest('.aie-codeblock-langs-item')!;
                    if (target) {
                        const language = target.getAttribute("data-item")!;
                        e.editor.chain().setCodeBlock({language}).run();
                    }
                });

                return div;
            }


            const instance = tippy(container.querySelector(".aie-codeblock-tools-lang")!, {
                content: createEL(),
                appendTo: e.editor.view.dom.closest(".aie-container")!,
                placement: 'bottom-end',
                trigger: 'click',
                interactive: true,
                arrow: false,
                aria: {
                    content: null,
                    expanded: false,
                },
            });


            return {
                dom: container,
                contentDOM: container.querySelector("code")!,
                destroy: () => {
                    instance.destroy();
                },
            }
        }
    },


})
