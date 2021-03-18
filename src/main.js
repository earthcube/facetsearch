import Vue from 'vue'
//import Vuex from 'vuex'
import Router from 'vue-router'
import axios from 'axios'
import VueAxios from 'vue-axios'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'

// Import Bootstrap an BootstrapVue CSS files (order is important)
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

// Make BootstrapVue available throughout your project
Vue.use(BootstrapVue)
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin)
Vue.use(VueAxios, axios)
Vue.use(Router)


import App from './App.vue'
import landing from './components/landing/landing.vue'
import Search from './components/facetsearch/Search.vue'
import dataset from './components/dataset/dataset.vue'
import {store} from './state.js'

const router=new Router({
  mode: "history",
  hash: false,
  routes:[
      {path:'/landing',name:'landing',component:landing,},
    // {path:'/search/?q=:q',name:'Search',component:Search,props:true},
    // {path:'/dataset/?o=id',name:'dataset',component:dataset,props:true,},
    {path:'/search/',name:'Search',component:Search,props: route => ({ q: route.query.q })},
    {path:'/dataset/:o',name:'dataset',component:dataset,props:true},
// catch all case
    { path: '*'},
  ]
})
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

