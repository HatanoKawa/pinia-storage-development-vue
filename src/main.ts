import { createApp } from 'vue'
import { createPinia } from "pinia"
import { piniaStorage } from "pinia-storage"
import App from './App.vue'

createApp(App)
  .use(
    createPinia()
      .use(piniaStorage)
  )
  .mount('#app')
