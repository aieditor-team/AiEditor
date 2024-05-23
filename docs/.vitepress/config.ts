import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    lang: 'zh-CN',
    title: "AiEditor",
    description: "A next-generation rich text editor for AI, open-source rich text editor, modern rich text editor",
    titleTemplate: ':title - AiEditor',
    lastUpdated: true,
    sitemap: {
        hostname: "https://aieditor.dev"
    },


    locales:{
        root: {
            label: 'English',
            lang: 'en'
        },
        zh:{
            title: "AiEditor 富文本编辑器",
            description: "一个面向 AI 的下一代富文本编辑器，开源富文本编辑器，现代富文本编辑器",
            titleTemplate: ':title - AiEditor 富文本编辑器',
            label: '简体中文',
            lang: 'zh', // 可选，将作为 `lang` 属性添加到 `html` 标签中


            themeConfig: {
                outline: {
                    label: "章节"
                },
                editLink: {
                    pattern: 'https://github.com/agents-flex/agents-flex/edit/main/docs/:path',
                    text: '编辑当前页面'
                },

                nav: [
                    {text: '首页', link: '/'},
                    {text: '开发文档', link: 'zh/what-is-ai-editor'},
                    {
                        text: '在线 Demo', items: [
                            {text: '经典/传统风格', link: 'http://aieditor.jpress.cn'},
                            {text: '类腾讯文档风格', link: 'http://aieditor1.jpress.cn'},
                        ]
                    },
                    {text: 'AiEditor Pro', link: 'zh/pro'},
        
                    {
                        text: '获取源码', items: [
                            {text: 'Gitee', link: 'https://gitee.com/aieditor-team/aieditor'},
                            {text: 'Github', link: 'https://github.com/aieditor-team/aieditor'},
                            {text: '示例代码', link: 'https://gitee.com/aieditor-team/aieditor/tree/main/demos'},
                            {text: 'ChangeLog', link: 'zh/changes'},
                        ]
                    },
                    {text: 'AiMP', link: 'https://aimp.cc'},
                ],
        
                sidebar: [
                    {
                        text: '简介',
                        items: [
                            {text: 'AiEditor 是什么', link: '/zh/what-is-ai-editor'},
                            {text: '快速开始', link: '/zh/getting-started'},
                            {text: '与 React 整合', link: '/zh/aieditor-with-react'},
                            {text: '与 Vue3 整合', link: '/zh/aieditor-with-vue3'},
                            {text: '与 Vue2 整合', link: '/zh/aieditor-with-vue2'},
                            {text: '与 Layui 整合', link: '/zh/aieditor-with-layui'},
                        ]
                    },
                    {
                        text: '配置',
                        items: [
                            {text: '基础', link: '/zh/config/base'},
                            {text: '工具栏', link: '/zh/config/toolbar'},
                            {text: '图片', link: '/zh/config/image'},
                            {text: '视频', link: '/zh/config/video'},
                            {text: '附件', link: '/zh/config/attachment'},
                            {text: '字体', link: '/zh/config/fontFamily'},
                            {text: '字号', link: '/zh/config/fontSize'},
                            {text: '提及', link: '/zh/config/mention'},
                            {text: '超链接', link: '/zh/config/link'},
                            {text: '国际化', link: '/zh/config/i18n'},
                            {text: '只读模式', link: '/zh/config/editable'},
                            {text: '自定义布局', link: '/zh/config/layout'},
                        ]
                    },
                    {
                        text: 'AI 配置',
                        items: [
                            {text: 'AI 配置', link: '/zh/ai/base'},
                            {text: 'AI 菜单', link: '/zh/ai/menu'},
                            {text: 'AI 命令', link: '/zh/ai/command'},
                            {text: '代码块 AI', link: '/zh/ai/codeblock'},
                            {text: '大语言模型', link: '/zh/ai/llm'},
                        ]
                    },
                    {
                        text: 'API',
                        items: [
                            {text: 'AiEditor', link: '/zh/api/aieditor'},
                        ]
                    },
                ],
            }

        },
    },

    themeConfig: {
        logo: '/assets/image/logo.png',
        editLink: {
            pattern: 'https://gitee.com/aieditor-team/aieditor/edit/main/docs/:path',
        },
        socialLinks: [
            { icon: 'github', link: 'https://github.com/aieditor-team/aieditor' },
        ],

        search: {
            provider: 'local'
        },
        nav: [
            {text: 'Home', link: '/'},
            {text: 'Document', link: '/what-is-ai-editor'},
            {
                text: 'Live Preview', items: [
                    {text: 'Classic Style', link: 'http://aieditor.jpress.cn'},
                    {text: 'Modern style', link: 'http://aieditor1.jpress.cn'},
                ]
            },
        ],

        sidebar: [
            {
                text: 'introduction',
                items: [
                    {text: 'What is AiEditor', link: '/what-is-ai-editor'},
                    {text: 'Quick Start', link: '/getting-started'},
                    {text: 'Integrate with React', link: '/aieditor-with-react'},
                    {text: 'Integrate with Vue3', link: '/aieditor-with-vue3'},
                    {text: 'Integrate with Vue2', link: '/aieditor-with-vue2'},
                ]
            },
            {
                text: 'Configuration',
                items: [
                    {text: 'Basic', link: '/config/base'},
                    {text: 'ToolBar', link: '/config/toolbar'},
                    {text: 'Image', link: '/config/image'},
                    {text: 'Video', link: '/config/video'},
                    {text: 'Attachment', link: '/config/attachment'},
                    {text: 'FontFamily', link: '/config/fontFamily'},
                    {text: 'FontSize', link: '/config/fontSize'},
                    {text: 'Mention', link: '/config/mention'},
                    {text: 'Link', link: '/config/link'},
                    {text: 'I18N', link: '/config/i18n'},
                    {text: 'Readonly Mode', link: '/config/editable'},
                    {text: 'Custom Layout', link: '/config/layout'},
                ]
            },
            {
                text: 'AI',
                items: [
                    {text: 'AI Configuration', link: '/ai/base'},
                    {text: 'AI Menus', link: '/ai/menu'},
                    {text: 'AI Commands', link: '/ai/command'},
                    {text: 'CodeBlock AI', link: '/ai/codeblock'},
                    {text: 'LLMs', link: '/ai/llm'},
                ]
            },
            {
                text: 'API',
                items: [
                    {text: 'AiEditor', link: '/api/aieditor'},
                ]
            },
        ],

        footer: {
            message: 'Released under the LGPL-v2.1 License.',
            copyright: 'Copyright © 2023-present AiEditor. ',
        },
    },

    head: [
        ['link', {rel: 'icon', href: '/assets/image/logo.png'}],
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
