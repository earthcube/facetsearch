<template>
  <b-form class="keyword-autocomplete" @submit.prevent="submit()">
    <b-input-group>
      <b-form-input
        id="q"
        v-model="q"
        name="q"
        placeholder="Search"
        aria-label="Search"
        role="combobox"
        aria-autocomplete="list"
        autocomplete="off"
        aria-controls="keyword-autocomplete-listbox"
        :aria-expanded="suggestions.length > 0 ? 'true' : 'false'"
        :aria-activedescendant="highlighted >= 0 ? `keyword-autocomplete-option-${highlighted}` : null"
        @input="onInput"
        @keydown.down.prevent="moveHighlight(1)"
        @keydown.up.prevent="moveHighlight(-1)"
        @keydown.enter.exact.prevent="onEnter"
        @keydown.esc.prevent="closeSuggestions"
        @blur="onBlur"
      ></b-form-input>

      <b-input-group-append>
        <b-button variant="primary" type="submit" class="mr-2" aria-label="Submit search"
          ><svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            class="bi bi-search"
            viewBox="0 0 16 16"
          >
            <path
              d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"
            /></svg
        ></b-button>
        <b-button id="search-info-btn" variant="outline-secondary" type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
          </svg>
        </b-button>
        <b-popover target="search-info-btn" triggers="click blur" placement="bottom" title="Search Tips">
          <div>
            <p><strong>AND search (default):</strong> Multiple words are all required.<br/>
            <em>Example:</em> <code>water chemistry</code> → results must contain both words.</p>
            <p><strong>OR search:</strong> Use <code> or </code> (lowercase, with spaces) between terms.<br/>
            <em>Example:</em> <code>Atlantic or Pacific</code> → results containing either term.</p>
            <p><strong>Combined:</strong> <code>sediment North Atlantic or North Pacific</code><br/>
            → must contain "sediment" AND ("North Atlantic" OR "North Pacific").</p>
            <p class="mb-0"><strong>Exact match checkbox:</strong> When unchecked, each word becomes a separate OR branch instead of requiring all words.</p>
          </div>
        </b-popover>
      </b-input-group-append>
    </b-input-group>

    <ul
      v-if="suggestions.length > 0"
      id="keyword-autocomplete-listbox"
      class="suggestion-list list-unstyled shadow-sm"
      role="listbox"
    >
      <li
        v-for="(s, index) in suggestions"
        :key="s.word"
        :id="`keyword-autocomplete-option-${index}`"
        role="option"
        :aria-selected="index === highlighted"
        :class="['suggestion-item', { active: index === highlighted }]"
        @mousedown.prevent="submit(s.word)"
        @mousemove="highlighted = index"
      >
        <span>{{ s.word }}</span>
        <small class="text-muted ml-2">{{ s.count }}</small>
      </li>
    </ul>
  </b-form>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import _ from 'lodash';
import { useConfig } from '@/composables/useConfig.js';
import { createSearchService } from '@/services/SearchService.js';

export default {
  name: 'KeywordAutocomplete',
  setup() {
    const router = useRouter();
    const { config } = useConfig();

    const q = ref('');
    const suggestions = ref([]);
    const highlighted = ref(-1);

    // One service per config object; only used for getAutocompleteSuggestions
    // (its query LRU cache), never for executing a search from this page.
    let service = null;
    let serviceConfig = null;
    const getService = () => {
      const cfg = config.value;
      if (!cfg) return null;
      if (!service || serviceConfig !== cfg) {
        service = createSearchService(cfg);
        serviceConfig = cfg;
      }
      return service;
    };

    // Only the last in-flight request may update the list (stale-response guard).
    let generation = 0;

    const closeSuggestions = () => {
      suggestions.value = [];
      highlighted.value = -1;
    };

    const loadSuggestions = async (text) => {
      const svc = getService();
      if (!svc) return;
      const requestId = ++generation;
      try {
        const words = await svc.getAutocompleteSuggestions(text);
        if (requestId !== generation) return;
        suggestions.value = words;
        highlighted.value = -1;
      } catch (err) {
        if (requestId !== generation) return;
        console.warn('Autocomplete query failed:', err?.message || err);
        closeSuggestions();
      }
    };

    const debouncedLoad = _.debounce(loadSuggestions, 300);

    const onInput = () => {
      // The last whitespace-separated token is what gets completed, so
      // "ocean seis" suggests seismic/seismicity/... to append.
      const token = String(q.value || '').trim().split(/\s+/).pop() || '';
      if (token.replace(/[^a-zA-Z0-9]/g, '').length < 3) {
        debouncedLoad.cancel();
        closeSuggestions();
        return;
      }
      debouncedLoad(token);
    };

    const moveHighlight = (step) => {
      if (suggestions.value.length === 0) return;
      const n = suggestions.value.length;
      highlighted.value = (highlighted.value + step + n) % n;
    };

    const submit = (word) => {
      debouncedLoad.cancel();
      let text = String(q.value || '').trim();
      if (word) {
        // Replace the token being completed with the chosen suggestion.
        const parts = text.split(/\s+/);
        parts[parts.length ? parts.length - 1 : 0] = word;
        text = parts.join(' ');
        q.value = text;
      }
      closeSuggestions();
      if (!text) return;
      // Default: AND / all terms (structured search); use ` or ` in the query for OR.
      router.push({
        name: 'Search2',
        query: { q: text, searchExactMatch: 'true' },
      });
    };

    const onEnter = () => {
      if (highlighted.value >= 0 && suggestions.value[highlighted.value]) {
        submit(suggestions.value[highlighted.value].word);
      } else {
        submit();
      }
    };

    const onBlur = () => {
      // Delay so a mousedown on a suggestion wins over the blur.
      setTimeout(closeSuggestions, 150);
    };

    return {
      q,
      suggestions,
      highlighted,
      onInput,
      onEnter,
      onBlur,
      moveHighlight,
      closeSuggestions,
      submit,
    };
  },
};
</script>

<style scoped lang="scss">
@import "@/assets/bootstrapcss/custom";

.keyword-autocomplete {
  position: relative;

  .suggestion-list {
    position: absolute;
    z-index: 1000;
    left: 0;
    right: 0;
    top: 100%;
    margin: 2px 0 0;
    padding: 0;
    background: $white;
    border: 1px solid $gray-300;
    border-radius: $border-radius;
    max-height: 320px;
    overflow-y: auto;
  }

  .suggestion-item {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 0.375rem 0.75rem;
    cursor: pointer;

    &.active {
      background: $gray-200;
    }
  }
}
</style>
