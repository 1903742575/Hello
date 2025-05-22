import { createApp } from 'vue'
import './style.css'
import router from './routes/index'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn' // 导入中文语言包
import permission from '@/utils/common'; // 导入自定义指令


const app = createApp(App);
app.use(router).use(ElementPlus, {
    locale: zhCn, // 设置为中文
})
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}
// 注册全局指令
app.directive('permission', permission);
app.mount('#app');