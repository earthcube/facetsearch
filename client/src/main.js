import { createApp, configureCompat } from "vue";
import { createRouter } from "./routes";
import axios from "axios";
import VueAxios from "vue-axios";
import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "bootstrap-vue/dist/bootstrap-vue-icons.min.css";
import localForage from "localforage";
import App from "./App.vue";
import { storeRemoteConfig as createStore } from "./state.js";

const app = createApp(App);
configureCompat({
  MODE: 2, // move to 3 later
});

app.use(BootstrapVue);
app.use(IconsPlugin);
app.use(VueAxios, axios);

const router = createRouter();
app.use(router);

import { default as VueSelect } from "vue-select";
app.component("VSelect", VueSelect);

import { createGtag } from "vue-gtag";
const gtag = createGtag({
  tagId: "G-15XD8YBF5L",
});
app.use(gtag);

localForage.setDriver([
  localForage.INDEXEDDB,
  localForage.LOCALSTORAGE,
  localForage.WEBSQL,
]);

localForage.config({
  driver: [localForage.INDEXEDDB, localForage.LOCALSTORAGE, localForage.WEBSQL],
  name: "ec",
  version: 1.0,
});

app.config.devtools = true;
export const bus = createApp({});

const configfile = import.meta.env.VITE_FACETS_CONFIG_FILE
  ? import.meta.env.VITE_FACETS_CONFIG_FILE
  : "config/config.yaml";
const store = await createStore(configfile);
app.use(store);
await store.dispatch("fetchTenantData");
app.mount("#app");