<template>
  <b-nav-item
      v-bind:to="to"
      v-bind:href="href"
      v-bind:class="{ active: isActive($root.currentRoute) }"
      v-on:click="go"
  >
    <slot></slot>
  </b-nav-item>
</template>

<script>
import routes from '../routes'

export default {
  name: "navBarToLink",
  props: {
    to: {
      type:Object,
      required: true
    },
    href: {
      type: String
    }
  },

  // computed: {
  //
  // },
  methods: {
    isActive () {
      return this.to === this.$root.currentRoute
    },
    go (event) {
      event.preventDefault()
      this.$root.currentRoute = this.to
      window.history.pushState(
          null,
          routes[this.to],
          this.href
      )
    }
  }
}
</script>

<style scoped>
.active {
  color: cornflowerblue;
}
</style>
