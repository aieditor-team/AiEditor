// https://vitepress.dev/guide/custom-theme
import {h} from 'vue'
import Theme from 'vitepress/theme'
import './style.css'
import MyLayout from "./MyLayout.vue";
import Check from "./Check.vue";
import Question from "./Question.vue";
import Close from "./Close.vue";
import Unhappy from "./Unhappy.vue";

export default {
    ...Theme,
    Layout: MyLayout,
    enhanceApp({app, router, siteData}) {
        app.component('Check', Check)
        app.component('Close', Close)
        app.component('Question', Question)
        app.component('Unhappy', Unhappy)
    }
}
