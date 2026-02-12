<template>
  <div class="filter_card">
    <b-button v-b-toggle="'accordion_text_' + facetSetting.field" block squared>
      {{ facetSetting.title }}
      <b-icon icon="square" class="when-open" scale="0.8" aria-hidden="true" />
      <b-icon icon="plus-square" class="when-closed" scale="0.8" aria-hidden="true" />
    </b-button>

    <b-collapse
      :id="'accordion_text_' + facetSetting.field"
      :visible="facetSetting.open"
    >
      <b-list-group flush>
        <!-- Wrap each item so we can reliably catch click in Vue 3 -->
        <b-list-group-item
          v-for="(info, term) in facetItems"
          :key="info.id"
          button
          class="facet-row d-flex align-items-center justify-content-between"
          @click="onToggle(term, !info.isActive)"
        >
          <FacetTextItem
            :id="info.id"
            :term="term"
            :count="info.count"
            :facet-setting="facetSetting"
            :is-active="info.isActive"
            :fieldname="fieldname"
            class="w-100"
          />
        </b-list-group-item>

      </b-list-group>
    </b-collapse>
  </div>
</template>

<script>
import { event as gtagevent } from "vue-gtag";
import FacetTextItem from "@/components/facetsearch/FacetTextItem.vue";

export default {
  name: "FacetText",
  components: { FacetTextItem },

  inject: ["toggleFilter"],

  props: {
    facetSetting: { type: Object, required: true },
    facetStore: { type: Object, required: true },
    fieldname: String,
  },

  computed: {
    // Reactive view into facetStore[field]
    facetItems() {
      const field = this.facetSetting?.field;
      return field && this.facetStore && this.facetStore[field]
        ? this.facetStore[field]
        : {};
    },
  },

  methods: {
    onToggle(term, nextActive) {
      const field = this.facetSetting.field;

      console.log("FacetText onToggle:", { field, term, nextActive });

      // IMPORTANT: pass boolean 3rd arg
      this.toggleFilter(field, term, !!nextActive);

      // analytics (optional)
      gtagevent("select_content", {
        content_type: field,
        item_id: term,
      });
      gtagevent("select_facet", {
        event_category: "engagement",
        event_label: "facet_clicked",
        value: `${field}:${term}`,
      });
    },
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";

.filter_card {
  background: {
    color: #f5f5f5;
  }

  border: 1px solid rgba(0, 0, 0, 0.125);

  & + .filter_card {
    margin: {
      top: $spacer / 2;
    }
  }

  & > .btn {
    display: flex;
    justify-content: space-between;
    align-items: center;

    &:not(:hover) {
      color: $gray-700;
      background: {
        color: $gray-300;
      }
    }

    border: 0px;
  }

  .facet-row {
      padding: 0.1rem 0.1rem !important;   // smaller padding
      min-height: unset !important;
      line-height: 0.5;
      border: 0 !important;
      border-bottom: 0 !important;
      border-radius: 0 !important;
    }

    // If bootstrap adds extra focus/outline spacing
    .facet-row:focus {
      box-shadow: none !important;
    }

  .list-group {
    overflow: {
      y: auto;
    }

    max: {
      height: 170px;
    }
  }
}

.btn-secondary,
.btn-secondary:hover {
  background: {
    image: none;
  }
}

.collapsed > .when-open,
.not-collapsed > .when-closed {
  display: none;
}
</style>
