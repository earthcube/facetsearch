import Vue from 'vue'
//import Vuex from 'vuex'
import Router from 'vue-router'
import axios from 'axios'
import VueAxios from 'vue-axios'
import { BootstrapVue, IconsPlugin, BootstrapVueIcons } from 'bootstrap-vue'

// Import Bootstrap an BootstrapVue CSS files (order is important)
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import localForage from 'localforage';
// Make BootstrapVue available throughout your project
Vue.use(BootstrapVue)
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin, BootstrapVueIcons)
Vue.use(VueAxios, axios)
Vue.use(Router)
import VueGtag from "vue-gtag";




import App from './App.vue'
import router from './routes'
//import {store} from './state.js'
import {storeRemoteConfig as store} from './state.js'

Vue.use(VueGtag, {
  config: { id: "G-15XD8YBF5L" ,
    'custom_map': {'dimension2': 'fulltext', 'metric2': 'querytime'}
         }
         }, router);
//router.replace(router.currentRoute.fullPath);
//router.go(document.URL)
// router.onReady(() => {
//   router.replace(router.currentRoute.fullPath);
// });


// Using setDriver()
localForage.setDriver([
    localForage.INDEXEDDB,
    localForage.LOCALSTORAGE,
    localForage.WEBSQL,
]);

// Using config()
localForage.config({
    driver: [
        localForage.INDEXEDDB,
        localForage.LOCALSTORAGE,
        localForage.WEBSQL,
    ],
    name: 'ec',     // These fields
    version: 1.0,      // are totally optional
});
Vue.config.productionTip = false
Vue.config.devtools = true
export const bus = new Vue(); // https://blog.logrocket.com/using-event-bus-in-vue-js-to-pass-data-between-components/
store().then((s)=>{
    new Vue({
        render: h => h(App),
        router,
        store:  s
    }).$mount('#app')
    }
)


