<template>
  <div>
    <b-button v-b-toggle="'accordion_text_' + cartMenu.type" block squared>
      {{ cartMenu.title }}
      <b-icon
        icon="square"
        class="when-open"
        scale="0.8"
        aria-hidden="true"
      ></b-icon>
      <b-icon
        icon="plus-square"
        class="when-closed"
        scale="0.8"
        aria-hidden="true"
      ></b-icon>
    </b-button>

    <b-collapse
      :id="'accordion_text_' + cartMenu.type"
      :visible="cartMenu.open"
    >
      <div>Menu</div>
      <div>Menu</div>
    </b-collapse>
  </div>
</template>

<script>
export default {
  name: "Menu",
  data() {
    return {
      cartMenu: {
        title: "test",
        type: "collection",
        open: true,
      },
    };
  },
};
</script>

<style scoped></style>
