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
        <b>Keywords:</b> {{ item.kw }}
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
export default {
  name: "ResultItem",
  props: ["item"]
}
</script>

<style scoped>

</style>
