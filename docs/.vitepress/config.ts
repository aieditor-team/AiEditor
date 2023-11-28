import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    lang: 'zh-CN',
    title: "AiEditor",
    description: "一个面向 AI 的下一代富文本编辑器",
    titleTemplate: ':title - AiEditor 官方网站',
    lastUpdated: true,

    // logo: '/assets/images/logo02.png',

    themeConfig: {
        search: {
            provider: 'local'
        },
        outline: {
            label: '章节',
        },
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            {text: '首页', link: '/'},
            {text: '文档', link: 'zh/what-is-ai-editor'},
            // {text: 'Demo', link: 'zh/demo'},
            {text: '在线 Demo', link: 'http://aieditor.jpress.cn'},
            {
                text: '获取源码', items: [
                    {text: 'Gitee', link: 'https://gitee.com/aieditor-team/aieditor'},
                    {text: 'Github', link: 'https://github.com/aieditor-team/aieditor'},
                ]
            },
        ],

        sidebar: [
            {
                text: '简介',
                items: [
                    {text: 'AiEditor 是什么', link: '/zh/what-is-ai-editor'},
                    {text: '快速开始', link: '/zh/getting-started'}
                ]
            },
            {
                text: '配置',
                items: [
                    {text: '基础', link: '/zh/config/base'},
                    {text: 'AI 功能', link: '/zh/config/ai'},
                    {text: '工具栏', link: '/zh/config/toolbar'},
                    {text: '国际化', link: '/zh/config/i18n'},
                    {text: '图片', link: '/zh/config/image'},
                    {text: '视频', link: '/zh/config/video'},
                    {text: '附件', link: '/zh/config/attachment'},
                    {text: '字体', link: '/zh/config/fontFamily'},
                    {text: '字号', link: '/zh/config/fontSize'},
                    {text: '提及', link: '/zh/config/mention'},
                ]
            },
            {
                text: 'API',
                items: [
                    {text: 'AiEditor', link: '/zh/api/aieditor'},
                ]
            },
        ],

        footer: {
            message: 'Released under the LGPL-v2.1 License.',
            copyright: 'Copyright © 2023-present AiEditor. ',
        },
    },

    head: [
        ['link', {rel: 'icon', href: '/assets/images/logo02.png'}],
        ["script",
            {},
            `var _hmt = _hmt || [];
            (function() {
              var hm = document.createElement("script");
              hm.src = "https://hm.baidu.com/hm.js?9fd447a0f9e62a84d1b752a2cacb2c6b";
              var s = document.getElementsByTagName("script")[0];
              s.parentNode.insertBefore(hm, s);
            })();`
        ],
    ],
})
