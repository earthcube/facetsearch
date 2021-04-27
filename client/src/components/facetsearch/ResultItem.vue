<template>
    <b-card tag="article" class="rounded-0" v-on:click="showDetails">
        <b-card-title class="name" v-html="item.name"></b-card-title>
        <b-card-title class="publisher" v-if="item.pubname" v-html="item.pubname"></b-card-title>

        <b-card-text class="small mb-2" v-if="item.description" v-html="item.description"></b-card-text>

        <div class="keywords" v-if="item.kw">
            <div class="label">Keywords</div>
            <div class="values">
                <div class="keyword" v-html="highlightKw(filters, item.kw)"></div>
            </div>
        </div>

        <div class="badges mt-2">
            <b-badge variant="secondary" class="mr-1">{{item.resourceType}}</b-badge>
            <b-badge variant="secondary" class="mr-1" v-if="connectedTools">Connected Tools</b-badge>
            <b-badge variant="secondary" class="mr-1" v-if="item.disurl">
                <a class="card-link" target="_blank" :href="item.disurl">{{ item.disurl }}</a>
            </b-badge>
            <b-badge variant="outline-primary" class="mr-1" v-on:click="showDetails">View Details</b-badge>
        </div>
    </b-card>
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
    showDetails() {
        this.$router.push({
            name: 'dataset',
            params: {
                d: this.item.g
            }
        });
    }
    ,highlightKw(filters, keywords) {
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

<style scoped lang="scss">
    @import '~/src/assets/bootstrapcss/custom';

article {
    cursor: pointer;

    border: {
        right: 0px;
        left: 0px;
    }

    &:hover {
        background: {
            color: $gray-300;
        }
    }

    .card-body {
        padding: ($spacer * 1.5) $spacer;
    }
}

.keywords {
    display: flex;

    font: {
        size: 80%;
    }

    .label {
        font: {
            weight: bold;
        }
        text: {
            transform: uppercase;
        }
    }

    .values {
        display: flex;
        flex-wrap: wrap;

        .keyword {
            padding: {
                left: $spacer / 2;
            }
        }
    }
}

.name {
    color: $primary;

    font: {
        weight: 600;
        size: 120%;
    }
    line: {
        height: 120%;
    }
}

.publisher {
    color: $gray-700;

    margin: {
        top: -($spacer * .4);
    }

    font: {
        style: italic;
        size: 90%;
    }
}

</style>
