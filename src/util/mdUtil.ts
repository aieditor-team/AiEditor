import MarkdownIt from 'markdown-it';
import container from 'markdown-it-container';


// @ts-ignore
import TurndownService from 'turndown'
// @ts-ignore
import {gfm, tables} from 'joplin-turndown-plugin-gfm';
import {organizeHTMLContent} from './htmlUtil';


const md = MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
});

md.use(container, 'container-wrapper', {
    validate: function (_: any) {
        return true;
    },
    render: function (tokens: any, idx: any) {
        if (tokens[idx].nesting === 1) {
            const className = tokens[idx].info.trim().split(' ')[0];
            // opening tag
            return `<div class="container-wrapper ${className}">`;
        } else {
            // closing tag
            return '</div>';
        }
    }
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
turndownService.use(gfm);
turndownService.use(tables);

turndownService.keep((node: any) => {
    return !(node && node.nodeName === "DIV");
});
turndownService.addRule("container", {
    // match <div class="container-wrapper warning">...</div>
    // filter: ['div'],
    filter: (node: HTMLElement) => {
        return node.tagName === "DIV" && node.classList.contains('container-wrapper');
    },
    replacement: function (content: any, _token: HTMLElement) {
        let className = '';
        for (let c of _token.classList) {
            if (c != 'container-wrapper') {
                className = c;
                break
            }
        }
        return `:::${className}\n` + content.trim() + '\n:::\n';
    }
})

export const mdToHtml = (markdown: string) => {
    if (!markdown) return markdown;
    const renderHtml = md.render(markdown).trim();
    if (!renderHtml) return markdown;
    return organizeHTMLContent(renderHtml);
}

export const htmlToMd = (html: string) => {
    if (!html) return html;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const colGroupList = doc.querySelectorAll("colgroup");
    colGroupList.forEach(colgroup => colgroup.remove())

    const innerHTML = doc.body.innerHTML;
    return turndownService.turndown(innerHTML)
}
