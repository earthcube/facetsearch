<template>
  <a
      v-bind:to="to"
      v-bind:href="href"
      v-bind:class="{ active: isActive }"
      v-on:click="go"
  >
    <slot></slot>
  </a>
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
  computed: {
    isActive () {
      return this.to === this.$root.currentRoute
    }
  },
  methods: {
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
