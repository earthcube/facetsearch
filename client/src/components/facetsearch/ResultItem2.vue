<template>
  <b-card class="result-item">
    <div class="d-flex">
      <div class="flex-grow-1">
        <h6 class="result-title">
          <router-link
            :to="getResultLink(result)"
            class="text-decoration-none"
          >
            {{ result.name || 'Untitled' }}
          </router-link>
          <b-badge
            :variant="getResourceTypeVariant(result.resourceType)"
            class="ms-2"
          >
            {{ result.resourceType || 'data' }}
          </b-badge>
        </h6>

        <p class="result-description text-muted">
          {{ truncateText(result.description || 'No description available', 200) }}
        </p>

        <div class="result-metadata">
          <small class="text-muted">
            <span v-if="result.pubname" class="me-3">
              <i class="fas fa-building me-1"></i>
              {{ result.pubname }}
            </span>
            <span v-if="result.datep" class="me-3">
              <i class="fas fa-calendar me-1"></i>
              {{ formatDate(result.datep) }}
            </span>
            <span v-if="result.placename && result.placename !== 'No Placenames'" class="me-3">
              <i class="fas fa-map-marker-alt me-1"></i>
              {{ result.placename }}
            </span>
          </small>
        </div>

        <div v-if="result.keywords && result.keywords.length > 0" class="result-keywords mt-2">
          <b-badge
            v-for="keyword in result.keywords.slice(0, 5)"
            :key="keyword"
            variant="light"
            class="me-1 mb-1"
          >
            {{ keyword }}
          </b-badge>
          <span v-if="result.keywords.length > 5" class="text-muted">
            +{{ result.keywords.length - 5 }} more
          </span>
        </div>
      </div>

      <div class="result-actions ms-3">
        <b-dropdown
          right
          variant="outline-secondary"
          size="sm"
          toggle-class="text-decoration-none"
          no-caret
        >
          <template #button-content>
            <i class="fas fa-ellipsis-v"></i>
          </template>

          <b-dropdown-item
            :href="result.url"
            target="_blank"
            v-if="result.url"
          >
            <i class="fas fa-external-link-alt me-2"></i>
            View Source
          </b-dropdown-item>

          <b-dropdown-item @click="$emit('add-to-collection', result)">
            <i class="fas fa-plus me-2"></i>
            Add to Collection
          </b-dropdown-item>

          <b-dropdown-item @click="shareResult(result)">
            <i class="fas fa-share me-2"></i>
            Share
          </b-dropdown-item>
        </b-dropdown>
      </div>
    </div>
  </b-card>
</template>

<script>
export default {
  name: "ResultItem2",
  props: {
    result: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      default: 0
    }
  },
  methods: {
    getResultLink(result) {
      const resourceType = result.resourceType || 'data';
      const id = result.id || result.subj;
      if (!id) return { name: 'dataset', params: { d: '' } };
      if (resourceType === 'tool') {
        return { name: 'tool', params: { t: id } };
      }
      return { name: 'dataset', params: { d: id } };
    },
    getResourceTypeVariant(resourceType) {
      const variants = {
        data: 'primary',
        tool: 'success',
        person: 'info',
        researchProject: 'warning',
        event: 'secondary'
      };
      return variants[resourceType] || 'primary';
    },
    truncateText(text, maxLength) {
      if (!text || text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    },
    formatDate(dateString) {
      // Fallback-safe formatting
      try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        return d.toLocaleDateString();
      } catch {
        return dateString;
      }
    },
    async shareResult(result) {
      const url = window.location.href;
      if (navigator.share) {
        try {
          await navigator.share({
            title: result.name || 'Result',
            text: result.description || '',
            url
          });
        } catch {
          // ignore cancellation
        }
      } else {
        try {
          await navigator.clipboard.writeText(url);
        } catch {
          // ignore clipboard issues
        }
      }
    }
  }
};
</script>

<style scoped>
.result-item {
  transition: box-shadow 0.2s ease;
}
.result-item:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
.result-title {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}
.result-title a {
  color: #0d6efd;
}
.result-title a:hover {
  color: #0a58ca;
}
.result-description {
  line-height: 1.4;
  margin-bottom: 0.5rem;
}
.result-metadata {
  margin-bottom: 0.5rem;
}
.result-keywords .badge {
  font-size: 0.75em;
}
.result-actions {
  flex-shrink: 0;
}
</style>