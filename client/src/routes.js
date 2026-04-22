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

function datasetParams(route) {
  const raw = route.params.d;
  const d = (
    raw == null
      ? ""
      : Array.isArray(raw)
        ? raw.map(String).join("/")
        : String(raw)
  ).trim();
  return {
    d,
    g: route.query.g,
    graph: route.query.graph,
  };
}

function stripDuplicateDatasetGraphQuery(to) {
  if (to.name !== "dataset" || !to.query) return null;
  const gv = to.query.g;
  const graphv = to.query.graph;
  const g = Array.isArray(gv) ? gv[0] : gv;
  const graph = Array.isArray(graphv) ? graphv[0] : graphv;
  if (g == null || g === "" || graph !== g) return null;
  const q = { ...to.query };
  delete q.graph;
  return q;
}

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
      {
        path: "/dataset/:d+",
        name: "dataset",
        component: dataset,
        props: (route) => datasetParams(route),
      },
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

  router.beforeEach((to, _from, next) => {
    const q = stripDuplicateDatasetGraphQuery(to);
    if (q) {
      next({
        name: to.name,
        params: to.params,
        query: q,
        replace: true,
      });
      return;
    }
    next();
  });

  router.afterEach((to) => {
    if (
      to.name === "dataset" &&
      typeof window !== "undefined" &&
      window.location.search &&
      window.location.search.length > 1
    ) {
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${window.location.hash}`
      );
    }
  });

  return router;
}
