import { createApp } from 'vue'
import { createPinia } from "pinia"
import App from './App.vue'
import { syncStorage } from "./plugin";

createApp(App)
  .use(
    createPinia()
      .use(syncStorage())
  )
  .mount('#app')
