---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
title: 面向 AI 的下一代富文本编辑器

hero:
  name: AIEditor
  text: 一个面向 AI 的下一代           富文本编辑器
  tagline: 开箱即用、全框架支持、Markdown 友好
  actions:
    - theme: brand
      text: 快速开始 
      link: /zh/getting-started
    - theme: alt
      text: 在线体验
      link: /zh/demo
---

<style>
.VPContent> .VPHome> .container{
    width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
    max-width: 100%;
}
</style>

<style scoped>

.VPHome svg{
    width: 24px;
    display: inline-block;
    margin: 0 5px;
}

.VPContent> .VPHome {
    margin-bottom: 0;
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
    border-spacing: 30px 0px;
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
.feature-list{
    display: flex;
    padding: 20px 0;
    max-width: 1280px;
}
.feature-right{
    width:50%;
}
.feature-left{
    width:50%;
}
.excellent{
    display: flex;
    padding: 20px 0;
    max-width: 1280px;
}
.excellent-list{
    width: 46%;
    background: #f8f9fa;
    margin: 2%; 
    padding:30px;
    border-radius: 15px;
    margin-right: 15px;
}
.version{
    display: flex;
    padding: 20px 0;
    max-width: 1280px
}
.version-list{
    width: 440px;
    background: #eeeff0;
    padding: 20px;
    border-radius: 5px;
    margin-right: 15px;
}
.subtitle{
    margin: 30px 0 40px;
    color: #999;
}
.aieditor-content{
    text-align: center;
    background-color: #f8f9fa;
    padding: 80px;
}

@media only screen and (max-width: 750px){ 
.feature-list{
    display:flex;
    flex-direction: column;
    padding: 20px 0;
    max-width:100%;
}

.feature-image{
    width:96%;
    padding:0 2%;
    order:2;
   
}

.feature-content{
    width:96%;
    padding:0 2%;
    text-align:center;
    order:1;
}
.feature-content>h1{
    margin-bottom:10px;
    font-size:22px;
    line-height:20px;

}
.feature-content>p{
    margin:6px 0;

}
.excellent{
    display: block;
    padding: 20px 0;
    max-width:100%;
}
.excellent-list{
    width: 90%;   
    margin: 5%; 
    padding:30px;
    border-radius: 15px;
    margin-right: 15px;
}
.version{
    display: block;
    padding: 20px 0;
    width: 100%;
}
.version-list{
    width: 90%;   
    margin: 5%; 
    padding: 20px;
}
.subtitle{
    margin: 10px 0 20px;
    color: #999;
}
.aieditor-content{

    padding: 20px;
}
.VPContent> .VPHome> .vp-doc table{
    width: 100%; 
    border-collapse: collapse; 
    border-spacing:0;
  }
  th, td {
    text-align: left; 
  }
  
}


</style>

<div class="aieditor-content">

# 为什么选择 AiEditor

<div class="subtitle">
简单、好用、开源协议友好，无用户数量和应用数量限制，文档丰富。
</div>

|           | 其他编辑器                  | AiEditor                                       |
|-----------|:-----------------------|:-----------------------------------------------|
|           |
| 开源协议      | <Unhappy /> GPL，具有传染性  | <Check />  LGPL，通过 NPM 安装不具有传染性                |
| 开箱即用      | <Unhappy /> 使用复杂麻烦     | <Check />  通过 `npm install aieditor` 即可使用      |
| 框架支持      | <Unhappy /> 特定少量框架     | <Check />  AIEditor 基于 Web Component 开发，支持任意框架 |
| 服务端私有化部署  | <Unhappy /> 不支持        | <Check />  开源版和商业版都支持私有化部署，保证数据和隐私安全           |
| 大模型类型     | <Unhappy />  少量支持      | <Check /> 支持接入市面上任意大模型，包括私有大模型                 |
| 私有 Apikey | <Unhappy />  不支持       | <Check /> 支持，保证数据隐私安全，把控自己的消费                  |
| 用户数限制     | <Unhappy />  按用户数量收费   | <Check /> 不限制用户数量                              |
| 应用数限制     | <Unhappy />  按应用数量收费   | <Check /> 不限制应用数量                              |

</div>



<div class="feature">

# 特性
<div class="subtitle">
一款 AI 驱动的富文本编辑器，助你快速构建知识写作类产品。
</div>
</div>


<div style="display: flex;justify-content: center">
<div class="feature-list">

<div class="feature-image">

![](/assets/image/install.png)

</div>

<div class="feature-content">

<h1>开箱即用</h1>

无需一堆准备工作，几行代码立马运行起来。

</div>
</div>
</div>





<div style="display: flex;justify-content: center">
<div class="feature-list">



<div class="feature-content">

<h1>Markdown 友好</h1>

能够识别并正确渲染 Markdown 的基本语法，实时查看文章效果。

</div>

<div class="feature-image">

![](/assets/image/markdown.png)

</div>

</div>
</div>



<div style="display: flex;justify-content: center">
<div class="feature-list">

<div class="feature-image">

![](/assets/image/ai.png)

</div>

<div class="feature-content">

<h1>强大的 AI 能力</h1>

AI 帮你检查拼写与语法错误；将 10 个字扩写成 200 字；也能将 500 字提炼成 100 字；可以一键翻译；还可以让 AI 总结核心内容...

而这一切完成都不需要离开编辑器。

更多AI能力研发中...

</div>
</div>
</div>





<div style="display: flex;justify-content: center">
<div class="feature-list">



<div class="feature-content">

<h1>多人协作</h1>

允许多个用户同时在同一文档上工作，每个操作人能实时看到彼此的输入和更改。适用于软件开发、市场营销、法律文件审查、项目管理、教学、新闻报道、医疗研究等等行业的协作场景。

</div>

<div class="feature-image">

![](/assets/image/feature1.png)

</div>

</div>
</div>

<div style="display: flex;justify-content: center">
<div class="feature-list">

<div class="feature-image">

![](/assets/image/comment1.png)

</div>

<div class="feature-content">

<h1 >批注功能</h1>

允许审稿人，在文档的特定部分添加评论或建议，也可以标记文档中的疑问、错误或需要改进的地方，方便后续的修订。

</div>
</div>
</div>


<div class="feature">

#  集成优秀产品
<div class="subtitle">
我们将优秀的开源作品集成到 AiEditor，比如虚拟白板，手绘草图，图表编辑器等。
</div>
</div>

<div style="display: flex;justify-content: center">
<div class="excellent">

<div class="excellent-list">
<span style="font-weight:700;font-size: 24px;">drawio</span>
<div style="font-size: 16px;color:#666;height: 60px;padding-top: 10px">
一个用于常规图表的 JavaScript 客户端编辑器。
</div>
<img src="/assets/image/drawio.jpg" />
</div>


<div class="excellent-list">
<span style="font-weight:700;font-size: 24px">excalidraw</span>
<div style="font-size: 16px;color:#666;height: 60px;padding-top: 10px;">
一个虚拟手绘风格的白板，创建如图表、线框图或任何您喜欢的东西。
</div>
<img src="/assets/image/excalidraw.jpg" />
</div>



</div>
</div>




<div class="aieditor-content">

# 准备好了吗？

<div class="subtitle">
接下来，无论你使用开源版，还是商业版，都会收获惊喜!
</div>

<div style="display: flex;justify-content: center">
<div class="version">

<div class="version-list">
<span style="font-weight:700;">开源版</span><br />
<a href="https://github.com/aieditor-team/aieditor" target="_blank" style="background: #1b1b1f;color: #fff;padding: 10px 50px;border-radius: 5px;font-weight: bold;font-size: 14px;margin: 20px 0 40px 0;text-decoration:none;display:inline-block">立马下载</a>
<div style="font-size: 14px;color:#666;">
基于更为宽松的 LGPL 协议开源<br />
不限制用户数量<br />
不限制应用数量
</div>
</div>


<div class="version-list">
<span style="font-weight:700;">商业版</span><br />
<a href="contact-us" target="_blank" style="background: #1b1b1f;color: #fff;padding: 10px 50px;border-radius: 5px;font-weight: bold;font-size: 14px;margin: 20px 0 40px 0;text-decoration:none;display:inline-block">联系我们</a>
<div style="font-size: 14px;color:#666;">
价格超低<br />
不限制用户数量<br />
不限制应用数量
</div>
</div>


</div>
</div>
</div>

