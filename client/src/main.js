//import Vue from 'vue'
import { createApp, configureCompat } from 'vue'

//import Vuex from 'vuex'
//import Router from 'vue-router'
import {createRouter} from "./routes"
import axios from 'axios'
import VueAxios from 'vue-axios'
import { BootstrapVue, IconsPlugin, BootstrapVueIcons } from 'bootstrap-vue'

// Import Bootstrap an BootstrapVue CSS files (order is important)
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import localForage from 'localforage';
// Make BootstrapVue available throughout your project
import App from './App.vue'
//import router from './routes'
//import {store} from './state.js'

import {storeRemoteConfig as createStore} from './state.js'

const app = createApp(App)
configureCompat({
    MODE: 2 // move to 3 later
})

app.use(BootstrapVue)
// Optionally install the BootstrapVue icon components plugin
app.use(IconsPlugin, BootstrapVueIcons)
app.use(VueAxios, axios)
const router = createRouter()
app.use(router)
import VueGtag from "vue-gtag";






app.use(VueGtag, {
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
//app.config.productionTip = false // removed in vue3
app.config.devtools = true
//export const bus = new Vue(); // https://blog.logrocket.com/using-event-bus-in-vue-js-to-pass-data-between-components/
export const bus =  createApp({});

const store = createStore()

app.use(store)

// store().then((s)=>{
//     new createApp({
//         render: h => h(App),
//         router,
//         store:  s
//     }).$mount('#app')
//     }
// )

app.mount('#app')
