<template>
  <b-nav-item
    :to="to"
    :href="href"
    :class="{ active: isActive($root.currentRoute.value) }"
    @click="go"
  >
    <slot></slot>
  </b-nav-item>
</template>

<script>
import routes from "@/routes";

export default {
  name: "NavBarToLink",
  props: {
    to: {
      type: Object,
      required: true,
    },
    href: {
      type: String,
    },
  },

  // computed: {
  //
  // },
  methods: {
    isActive() {
      return this.to === this.$root.currentRoute.value;
    },
    go(event) {
      event.preventDefault();
      this.$root.currentRoute = this.to;
      window.history.pushState(null, routes[this.to], this.href);
    },
  },
};
</script>

<style scoped>
.active {
  color: cornflowerblue;
}
</style>
