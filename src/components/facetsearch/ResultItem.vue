<template>
  <div class="item card rounded mt-2 w-100">
    <div class="card-header">
      <div class="card-title">{{ item.name }}</div>
      <div class="card-subtitle mb-2 text-muted">{{ item.pubname }}</div>
    </div>
    <div class="tags card-body overflow-auto">
      <div v-show="item.description" class="card-text">
        {{ item.description }}
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
                     <span class="tool " hidden="true">{{ item.g }}  </span>
                  </span>
        <span class="col-auto ">

                        <a v-show="item.disurl" class="card-link " target="_blank"
                           :href="item.disurl">{{ item.disurl }}  </a>
        </span>
        <span class="col-auto">

                        <a v-show="item.s3endpoint" class="card-link " target="_blank"
                           :href="'dataset.html?o=' + item.s3endpoint + '.jsonld'">Details</a>

        </span>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'

export default {
  name: "ResultItem",
  props: ["item", "state"],
  data () {
    return {
      filters : this.state.filters
    }
  }
  , methods: {
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
  }
}

</script>

<style scoped>

</style>
