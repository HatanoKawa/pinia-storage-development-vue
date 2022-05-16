import { createApp } from 'vue'
import { createPinia } from "pinia"
import App from './App.vue'
import { syncStorage } from "./plugin";
import { bindStorage } from "./plugin/plugin";

createApp(App)
  .use(
    createPinia()
      .use(bindStorage())
  )
  .mount('#app')
