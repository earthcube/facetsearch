<template>
  <b-form inline @submit.prevent="submit">
    <label class="sr-only" for="temporal-from">From year</label>
    <b-form-input
      id="temporal-from"
      v-model.number="fromYear"
      type="number"
      :min="minYear"
      :max="maxYear"
      class="year-input mr-2"
      aria-label="From year"
    ></b-form-input>
    <span class="mr-2">to</span>
    <label class="sr-only" for="temporal-to">To year</label>
    <b-form-input
      id="temporal-to"
      v-model.number="toYear"
      type="number"
      :min="minYear"
      :max="maxYear"
      class="year-input mr-2"
      aria-label="To year"
    ></b-form-input>
    <b-button variant="primary" type="submit">Search this period</b-button>
  </b-form>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

// Mirrors the hardcoded bounds of the RangeSliderYear2 facet the user lands on.
const MIN_YEAR = 1990;
const MAX_YEAR = new Date().getFullYear();

export default {
  name: 'TemporalEntryTile',
  setup() {
    const router = useRouter();
    const fromYear = ref(MIN_YEAR);
    const toYear = ref(MAX_YEAR);

    const clamp = (v, fallback) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return fallback;
      return Math.min(MAX_YEAR, Math.max(MIN_YEAR, Math.round(n)));
    };

    const submit = () => {
      let from = clamp(fromYear.value, MIN_YEAR);
      let to = clamp(toYear.value, MAX_YEAR);
      if (from > to) [from, to] = [to, from];
      fromYear.value = from;
      toYear.value = to;
      router.push({
        path: '/search2/',
        query: { temporalCoverage: `${from},${to}` },
      });
    };

    return {
      fromYear,
      toYear,
      submit,
      minYear: MIN_YEAR,
      maxYear: MAX_YEAR,
    };
  },
};
</script>

<style scoped>
.year-input {
  width: 6.5em;
}
</style>
