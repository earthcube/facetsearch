import Router from "vue-router";
import landing from "./components/landing/landing";
import Search from "./components/facetsearch/Search";
import dataset from "./components/dataset/dataset";

export default  new Router({
    //mode: "history",
    hash: true,
    routes:[
        {path:'/landing',name:'landing',component:landing,},
        // {path:'/search/?q=:q',name:'Search',component:Search,props:true},
        // {path:'/dataset/?o=id',name:'dataset',component:dataset,props:true,},
        {path:'/search/',name:'Search',component:Search,
            props: route => ({ textQuery :route.query.q, resourceType : route.query.resourceType})},
        {path:'/dataset/:o',name:'dataset',component:dataset,props:true},
// catch all case
        { path: '*'},
    ]
})
