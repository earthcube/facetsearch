import Vue from 'vue'
//import Vuex from 'vuex'
import Router from 'vue-router'
import axios from 'axios'
import VueAxios from 'vue-axios'
import { BootstrapVue, IconsPlugin, BootstrapVueIcons } from 'bootstrap-vue'

// Import Bootstrap an BootstrapVue CSS files (order is important)
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

// Make BootstrapVue available throughout your project
Vue.use(BootstrapVue)
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin, BootstrapVueIcons)
Vue.use(VueAxios, axios)
Vue.use(Router)


import App from './App.vue'
import router from './routes'
import {store} from './state.js'


//router.replace(router.currentRoute.fullPath);
//router.go(document.URL)
// router.onReady(() => {
//   router.replace(router.currentRoute.fullPath);
// });
Vue.config.productionTip = false
Vue.config.devtools = true
export const bus = new Vue(); // https://blog.logrocket.com/using-event-bus-in-vue-js-to-pass-data-between-components/
new Vue({
  render: h => h(App),
  router,
  store:store
}).$mount('#app')

