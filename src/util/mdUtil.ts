import MarkdownIt from 'markdown-it';
import container from 'markdown-it-container';


// @ts-ignore
import TurndownService from 'turndown'


const md = MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
});


const containerClasses = ['info', 'tip', 'warning', 'danger'];
containerClasses.forEach(name => {
    md.use(container, name, {
        validate: function (params: any) {
            params = params.trim()
            if (params === '') return true;
            return params.indexOf(name) >= 0;
        },
        render: function (tokens: any, idx: any) {
            if (tokens[idx].nesting === 1) {
                // opening tag
                return `<div class="container-wrapper ${name}">`;
            } else {
                // closing tag
                return '</div>';
            }
        }
    })
})


//options https://github.com/mixmark-io/turndown?tab=readme-ov-file#options
const turndownService = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '_',
    strongDelimiter: '**',
    linkStyle: 'inlined',
    linkReferenceStyle: 'full',
    preformattedCode: false,
});

turndownService.keep((node: any) => {
    return !(node && node.nodeName === "DIV");
});
turndownService.addRule("container", {
    // match <div class="container-wrapper warning">...</div>
    filter: ['div'],
    tokenizer: (token: any, _context: any) => {
        if (token.tag === 'div' && token.attribs.class === 'container-wrapper') {
            return token;
        }
    },
    replacement: function (content: any, _token: HTMLElement) {
        let className = '';
        for (let containerClass of containerClasses) {
            if (_token.classList.contains(containerClass)) {
                className = ' ' + containerClass;
                break;
            }
        }
        return `:::${className}\n` + content.trim() + '\n:::\n';
    }
})

export const mdToHtml = (markdown: string) => {
    if (!markdown) return markdown;
    const renderHtml = md.render(markdown).trim();
    if (!renderHtml) return markdown;
    const parser = new DOMParser();
    const doc = parser.parseFromString(renderHtml, 'text/html');
    const lis = doc.querySelectorAll("li");

    //"tiptap" does not support empty list items. Here to fill in the gaps
    if (lis) lis.forEach(li => {
        if (!li.innerHTML) li.innerHTML = "<p></p>"
    })

    let html = '';
    for (let i = 0; i < doc.body.children.length; i++) {
        const element = doc.body.children[i];
        if (i == 0 && element.tagName === "P") {
            html += element.innerHTML;
        } else {
            // https://gitee.com/aieditor-team/aieditor/pulls/10
            html += element.querySelector("img")
                ? element.innerHTML : element.outerHTML;
        }
    }
    return html;
}


export const htmlToMd = (html: string) => {
    if (!html) return html;
    return turndownService.turndown(html)
}
