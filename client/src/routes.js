//import Router from "vue-router";
import { createRouter as _createRouter, createWebHashHistory } from 'vue-router'

import landing from "./components/landing/landing";
import Search from "./components/facetsearch/Search";
import dataset from "./components/dataset/dataset";
import tool from "./components/tools/tool"
import about from "./components/help/about"
import report from "./components/help/report"
import collection from "./components/collection/Collection"
import configuration from "./components/configuration"

export function createRouter() {
    return _createRouter({
          history: createWebHashHistory(),
            hash: true,
            routes: [
                {
                    path: '/',
                    redirect: '/landing'
                },
                {path: '/landing', name: 'landing', component: landing,},
                // {path:'/search/?q=:q',name:'Search',component:Search,props:true},
                // {path:'/dataset/?o=id',name:'dataset',component:dataset,props:true,},
                {
                    path: '/search/', name: 'Search', component: Search,
                    props: route => ({textQuery: route.query.q, resourceType: route.query.resourceType})
                },
                {path: '/dataset/:d', name: 'dataset', component: dataset, props: true},
                // t tool object id, d dataset object id
                {
                    path: '/tool/:t', name: 'tool',
                    component: tool,
                    props:
                        route => ({
                            d: route.query.d,
                            t: route.params.t
                        })
                    ,
                },
                // {path:'/dataset/:o',name:'dataset',component:dataset,props:true},
                //{path:'/tool/:o',name:'tool',component:tool,props:true},
                {path: '/about', name: 'about', component: about,},
                {path: '/report/:source', name: 'report', component: report, props: true},
                {path: '/collection', name: 'collection', component: collection,},

                {path: '/config', name: 'configuration', component: configuration},
// catch all case
              //  {path: '*'},
            ],
            scrollBehavior() {
                return {x: 0, y: 0}
            },
        }
    )
}
