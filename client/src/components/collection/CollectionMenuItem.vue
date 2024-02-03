<template>
  <b-list-group-item v-bind:class="{active: isActive}" @click="$emit('click')">
    {{term}}
  </b-list-group-item>
</template>

<script>


export default {
  name: "CollectionMenuItem",
  props: ['facetSetting',"term", "isActive"],


}
</script>

<style scoped lang="scss">
@import '@/assets/bootstrapcss/custom';

.list-group-item {
  cursor: pointer;
  text-transform: capitalize;
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: ($spacer * .4) ($spacer * .75);

  font: {
    size: 85%;
  }
  line: {
    height: 120%;
  }

  border: 0px;

  &:not(.active) {
    background: none;

    &:hover {
      color: $white;
      background: {
        color: $gray-500;
      }
    }
  }

  &.active {
    color: $white;
    background: {
      color: $primary;
    }

    border: {
      color: #aaa;
    }

    .badge {
      color: $primary;
      background: {
        color: $white;
      }
    }
  }

  .badge {
    min: {
      width: 1rem;
    }

    text: {
      align: center;
    }
  }
}

</style>
