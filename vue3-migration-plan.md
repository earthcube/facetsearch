# Vue 3 Migration Plan

## Current State Analysis

### Vue 2 Compatibility Configuration
- **@vue/compat**: Currently using `~3.3.4` with MODE 2 compatibility
- **Vite config**: Vue alias points to `@vue/compat` with compatConfig MODE 2
- **Main.js**: Using `configureCompat({ MODE: 2 })` for compatibility mode

### Vuex Store Structure  
- Large centralized store in `/client/src/state.js` with 780+ lines
- Heavy use of mutations, actions, and getters
- Complex async operations for SPARQL queries and data fetching
- Store uses maps, caches, and complex state management

### Vue 2 Specific Dependencies
- **Bootstrap Vue**: Heavily used throughout components (`b-container`, `b-button`, etc.)
- **Router patterns**: Using `this.$router` and `this.$route` in 10+ components
- **Store access**: Components using `$store`, `mapState`, `mapMutations` etc.

## Migration Plan

### Phase 1: Upgrade Dependencies & Remove Compatibility Mode
1. **Remove Vue 2 compatibility**:
   - Remove `@vue/compat` dependency
   - Update Vue alias to point to `vue` instead of `@vue/compat`
   - Remove `configureCompat` and `compatConfig` from main.js and vite.config.js

2. **Bootstrap Vue replacement**:
   - Replace Bootstrap Vue with **Bootstrap Vue Next** (Vue 3 compatible)
   - Alternative: Migrate to **PrimeVue** or **Quasar** for better Vue 3 support
   - Update all `b-*` component usage across 27+ files

### Phase 2: Vuex to Pinia Migration
1. **Install Pinia**: `npm install pinia`
2. **Create Pinia stores**:
   - Break down monolithic Vuex store into focused Pinia stores:
     - `useSearchStore` - search queries, results, facets
     - `useDatasetStore` - JSON-LD data, dataset details  
     - `useCollectionStore` - collection management
     - `useConfigStore` - configuration and tenant data
     - `useCacheStore` - LRU cache and microCache

3. **Migrate store patterns**:
   - Convert mutations → direct state updates
   - Convert actions → store methods  
   - Convert getters → computed properties
   - Update all `mapState`, `mapActions` usage to Pinia composables

### Phase 3: Component Modernization
1. **Router updates**:
   - Replace `this.$router` with `useRouter()` composable
   - Replace `this.$route` with `useRoute()` composable
   - Update 10+ affected components

2. **Composition API adoption**:
   - Gradually migrate components from Options API to Composition API
   - Focus on complex components first (Search, Results, Dataset views)

### Phase 4: Testing & Validation
1. **Functionality testing**: Ensure SPARQL queries, data fetching still work
2. **UI testing**: Verify Bootstrap components render correctly
3. **Performance testing**: Compare before/after performance
4. **Browser compatibility**: Test across target browsers

## Estimated Timeline
- **Phase 1**: 2-3 days (dependency upgrades, compatibility removal)
- **Phase 2**: 4-5 days (Vuex to Pinia migration)
- **Phase 3**: 3-4 days (component updates, router migration)  
- **Phase 4**: 2-3 days (testing and validation)

**Total**: 11-15 days for complete migration

## Risk Mitigation
- Create feature branch for migration work
- Test incrementally after each phase
- Keep detailed rollback plan
- Consider gradual rollout strategy