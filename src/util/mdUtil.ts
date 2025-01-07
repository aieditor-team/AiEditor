import MarkdownIt from 'markdown-it';
import container from 'markdown-it-container';
// @ts-ignore
import taskLists from 'markdown-it-task-lists';
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

md.use(taskLists, {
    enabled: true,
    label: true,
});


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

turndownService.addRule('strikethrough', {
    filter: ['del', 's', 'strike'],
    replacement: function (content:any) {
        return '~~' + content + '~~'
    }
})

turndownService.keep((node: any) => {
    return !(node && node.nodeName === "DIV");
});

turndownService.addRule('checkbox', {
    filter: (node: HTMLElement) => {
        // 匹配 <input type="checkbox"></input>
        if (node.tagName === 'INPUT' && node.getAttribute("type") === 'checkbox') {
            return true
        } else if (node.tagName === "LABEL" && node.firstElementChild?.tagName === 'INPUT'
            && node.firstElementChild?.getAttribute("type") === 'checkbox') {
            return true
        }
    },
    replacement: function (_content: any, node: any) {
        if (node.type === 'checkbox') {
            return node.checked ? '[x]' : '[ ]'
        } else if (node.tagName === "LABEL") {
            if (node.firstElementChild?.type === 'checkbox') {
                return node.firstElementChild.checked ? '[x]' : '[ ]'
            }
        }
        return null
    }
})

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

    // fix task list to markdown
    const lis = doc.querySelectorAll("li");
    lis.forEach(li => {
        const div = li.querySelector("div");
        if (div && div.firstElementChild) {
            const fragment = document.createDocumentFragment();
            fragment.append(" ")
            div.firstElementChild.childNodes.forEach(node => {
                fragment.append(node.cloneNode(true))
            })
            div.replaceWith(fragment)
        }
    })
    const innerHTML = doc.body.innerHTML;
    return turndownService.turndown(innerHTML)
}
