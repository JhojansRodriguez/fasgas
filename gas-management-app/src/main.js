import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './assets/css/global.css' // Import global styles

const app = createApp(App)

// These will be created in later steps, but we set up the use() calls now.
// If router/index.js or store/index.js are not created yet, this will
// cause a runtime error when running the dev server.
// For now, we are just setting up the file structure.
app.use(router)
app.use(store)

app.mount('#app')
