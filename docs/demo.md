---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

#hero:
#  name: "AIEditor"
#  text: a next-gen rich text editor for AI
#  tagline: Out-of-the-box, Fully Framework Supported, Markdown Friendly
#  image:
#    src: /assets/image/index-banner.png
#    alt: AiEditor
#  actions:
#    - theme: brand
#      text: Quick Start
#      link: /getting-started
#    - theme: alt
#      text: Live Preview
#      link: http://aieditor.jpress.cn



#features:
#  - title: Lightweight
#    details: AiEditor is ready to use out of the box, Development based on Web Components, and does not depend on any rendering framework such as VUE, React or Angular, making it compatible with almost any framework.
#  - title: Intelligent
#    details: AiEditor supports AI continuation, AI optimization, AI proofreading, AI translation, and custom AI menus with their respective Prompts. It supports integration with models like ChatGPT, Spark and private LLMs.
#  - title: Powerful
#    details: In addition to basic functions, AiEditor also supports features that many top editors do not have, such as format painting, merging and unmerging of cells, light and dark themes, mobile adaptation, and more.
---

<style >


.VPContent> .VPHome {
    margin-bottom: 0;
}

.VPContent> .VPHome> .container{
    width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
    max-width: 100%;
}

.VPContent> .VPHome> .container .feature{
   text-align: center;
   margin: 40px;
}

.VPContent> .VPHome> .container .feature p{
   color: #999;
}

.VPContent> .VPHome> .vp-doc  table{
    display: inline-block;
    background: none;
    border-collapse: separate;
    border-spacing: 30px 10px;
    max-width:980px;
}

.VPContent> .VPHome> .vp-doc  table th{
     background: none;
     border: none;
}

.VPContent> .VPHome> .vp-doc  thead tr :not(:first-child){
     border-bottom: solid 1px #ddd;
     margin: 10px;
     font-weight: bold;
     font-size: 16px;
}

.VPContent> .VPHome> .vp-doc  table tr{
     background: none;
     border: none;
}

.VPContent> .VPHome> .vp-doc  table tr{
     height: 40px;
}

.VPContent> .VPHome> .vp-doc  table  tbody tr:first-child{
     height: 20px;
}

.VPContent> .VPHome> .vp-doc  table td{
    background: none;
    border: none;
}

.VPContent> .VPHome> .vp-doc  table td svg{
    margin: -7px 0;
}

.VPContent> .VPHome> .vp-doc table td:nth-of-type(1){
    color: #999;
}


.VPContent> .VPHome> .vp-doc table td:nth-of-type(2) svg{
    fill: #8C8C8C;
    margin-right:10px;
    width: 20px;
    margin:-4px 0;
   
    /* padding: 0px; */
}

.VPContent> .VPHome> .vp-doc table td:nth-of-type(3) svg{
    fill: #646cff;
}
.feature-content{
    width: 50%;    
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 50px;
}

.feature-content>h1{
  margin-bottom:30px;
}

.feature-content>p{
  color:#666;
}

.aie-menu-item{
  margin: 0 2px;
}
</style>





<div style="text-align: center;background-color: #f8f9fa;padding: 80px">

# AIEditor 在线体验

<div style="margin: 30px 0 40px;color: #999">
By choosing AiEditor, you will have a rich text editor that is truly your own.
</div>



<div style="display: flex;justify-content: center;">
<MyEditor lang="en" />
</div>

</div>

