<!--
  -  Copyright (c) 2022-2023, Mybatis-Flex (fuhai999@gmail.com).
  -  <p>
  -  Licensed under the Apache License, Version 2.0 (the "License");
  -  you may not use this file except in compliance with the License.
  -  You may obtain a copy of the License at
  -  <p>
  -  http://www.apache.org/licenses/LICENSE-2.0
  -  <p>
  -  Unless required by applicable law or agreed to in writing, software
  -  distributed under the License is distributed on an "AS IS" BASIS,
  -  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  -  See the License for the specific language governing permissions and
  -  limitations under the License.
  -->

<!--.vitepress/theme/MyLayout.vue-->


<script setup>
import DefaultTheme from 'vitepress/theme'
import {useData} from "vitepress";

const {Layout} = DefaultTheme

const {lang} = useData()


// console.log(">>>data",data)

</script>


<template>
  <Layout>

    <template #nav-bar-content-after>
      <div style="padding-left: 20px;">
        <a href="https://www.producthunt.com/posts/aieditor?embed=true&utm_source=badge-top-post-badge&utm_medium=badge&utm_souce=badge-aieditor"
           target="_blank"><img
            src="https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=469676&theme=light&period=daily"
            alt="AiEditor - An&#0032;open&#0032;source&#0032;AI&#0045;powered&#0032;rich&#0032;text&#0032;editor | Product Hunt"
            style="width: 250px; height: 54px;" width="250" height="54"/></a>
      </div>
    </template>


    <template #home-hero-image>
      <div style="z-index: 9999">
        <img v-if="lang === 'en'" src="/assets/image/ai-en.png">
        <img v-else src="/assets/image/ai.png">
      </div>
    </template>


    <template #doc-before>
      <div v-if="lang === 'zh'"  style="z-index: 9999;margin-bottom: 40px">
        <a href="https://ai.gitee.com/events/iluvatar-ai-app-contest/detail?app=6" target="_blank">
          <img src="/assets/image/gitee-ai.png">
        </a>
      </div>
    </template>

    <!--    <template #home-features-after>-->
    <!--      <div class="banner-home">-->
    <!--        <a href="https://aiadmin.cc" target="_blank">-->
    <!--          <img src="/assets/image/admin-banner.jpg">-->
    <!--        </a>-->
    <!--      </div>-->
    <!--    </template>-->

  </Layout>
</template>
