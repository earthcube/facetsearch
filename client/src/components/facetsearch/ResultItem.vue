<template>
  <div class="item card rounded mt-2 w-100">
    <div class="card-header">
      <div class="card-title" v-html="item.name"></div>
      <div class="card-subtitle mb-2 text-muted">{{ item.pubname }}</div>
    </div>
    <div class="tags card-body overflow-auto">
      <div v-show="item.description" class="card-text" v-html="item.description">

      </div>
      <div v-show="item.kw" class="card-text pt-2">
        <b>Keywords:</b> <span v-html="highlightKw(filters,item.kw)">
      </span>
        </div>
    </div>
    <div class="card-footer">
      <div class="row">
                <span class="col-auto mr-auto">
                     <span class="badge badge-secondary">{{ item.resourceType }}  </span>
                  <span  ref="tool" class="tool " v-if="connectedTools">
                    <span class="badge badge-info">Connected Tools</span>
                  </span>
                  </span>
        <span class="col-auto ">

                        <a v-show="item.disurl" class="card-link " target="_blank"
                           :href="item.disurl">{{ item.disurl }}  </a>
        </span>
        <span class="col-auto">

<!--                        <a v-show="item.s3endpoint" class="card-link " target="_blank"-->
<!--                           :href="'dataset.html?o=' + item.s3endpoint + '.jsonld'">Details</a>-->
<!--              <router-link  :to="{ name: 'dataset', params: { o: item.s3endpoint+'.jsonld' } }">Details</router-link>-->
              <router-link  :to="{ name: 'dataset', params: { o: item.g } }">Details</router-link>
       </span>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import {mapActions,mapGetters} from "vuex";

export default {
  name: "ResultItem",
  props: ["item", "state"],
  data () {
    return {
      filters : this.state.filters,
      connectedTools: false

    }
  }, computed: {
    ...mapGetters ([
                  'getConnectedTool'])
}
  ,mounted() {
   this.hasTool();

  }
  , methods: {
    ...mapActions([
       'hasConnectedTools']),
    highlightKw(filters, keywords) {
      if (keywords) {
        let kwList = [];
        if (_.isArray(keywords)) {
          kwList = keywords.map(function (kw) {
            if (_.includes(filters['kw'], kw)) {
              return `<b>${kw}</b>`;
            } else {
              return kw
            }
          })
        } else {
          if (_.includes(filters, keywords)) {
            return [`<b>${keywords}<b/>`];
          } else {
            kwList = [keywords]
          }
        }
        return kwList;
      }

    }
    ,hasTool() {
      var self = this;
      let gg = self.item.g ;
      if (self.getConnectedTool(gg)) {
        self.connectedTools=self.getConnectedTool(gg);

      } else {
        self.hasConnectedTools(gg).then(
            function(o){

                self.connectedTools=o;

            }
        ).catch((err) => {
          console.error(err);
        })
      }

    }
  }
}

</script>

<style scoped>

</style>
