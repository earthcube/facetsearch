//import Router from "vue-router";
import {
  createRouter as _createRouter,
  createWebHashHistory,
} from "vue-router";

import landing from "@/components/landing/landing.vue";
import dataset from "@/components/dataset/dataset.vue";
import tool from "@/components/tools/tool.vue";
import about from "@/components/help/about.vue";
import report from "@/components/help/report.vue";
import collection from "@/components/collection/Collection.vue";
import configuration from "@/components/configuration.vue";
import Search2 from "@/components/facetsearch/Search2.vue";

export function createRouter() {
  const router = _createRouter({
    history: createWebHashHistory(),
    hash: true,
    routes: [
      {
        path: "/",
        redirect: "/Search2",
      },
      { path: "/landing", name: "landing", component: landing },
      // {path:'/search/?q=:q',name:'Search',component:Search,props:true},
      // {path:'/dataset/?o=id',name:'dataset',component:dataset,props:true,},
      {
        path: "/search2/",
        name: "Search2",
        component: Search2,
        props: (route) => ({
          textQuery: route.query.q,
          resourceType: route.query.resourceType,
          exact: route.query.searchExactMatch,
        }),
      },
      { path: "/dataset/:d", name: "dataset", component: dataset, props: true },
      // t tool object id, d dataset object id
      {
        path: "/tool/:t",
        name: "tool",
        component: tool,
        props: (route) => ({
          d: route.query.d,
          t: route.params.t,
        }),
      },
      // {path:'/dataset/:o',name:'dataset',component:dataset,props:true},
      //{path:'/tool/:o',name:'tool',component:tool,props:true},
      { path: "/about", name: "about", component: about },
      {
        path: "/report/:source",
        name: "report",
        component: report,
        props: true,
      },
      { path: "/collection", name: "collection", component: collection },

      { path: "/config", name: "configuration", component: configuration },
      // catch all case
      //  {path: '*'},
    ],
    scrollBehavior() {
      return { x: 0, y: 0 };
    },
  });

  router.afterEach((to) => {
    if (to.name !== "dataset" || typeof window === "undefined") return;
    const search = window.location.search;
    if (search && search.length > 1) {
      const path = window.location.pathname || "/";
      const hash = window.location.hash || "";
      window.history.replaceState({}, "", path + hash);
    }
  });

  return router;
}
