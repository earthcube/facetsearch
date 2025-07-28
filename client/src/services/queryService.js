class QueryService {
  constructor() {
    this.queryCache = new Map()
    this.loadingPromises = new Map()
  }

  /**
   * Load a SPARQL query from the configured path
   * @param {string} configKey - The configuration key (e.g., 'SPARQL_QUERY')
   * @param {Object} facetsConfig - The configuration object
   * @returns {Promise<string>} The query text
   */
  async loadQuery(configKey, facetsConfig) {
    // Check cache first
    if (this.queryCache.has(configKey)) {
      return this.queryCache.get(configKey)
    }

    // Check if already loading to prevent duplicate requests
    if (this.loadingPromises.has(configKey)) {
      return this.loadingPromises.get(configKey)
    }

    // Get the query path from configuration
    const queryPath = facetsConfig?.[configKey]
    if (!queryPath) {
      throw new Error(`Query configuration key '${configKey}' not found in FacetsConfig`)
    }

    // Create loading promise
    const loadingPromise = this.fetchQuery(queryPath, configKey, facetsConfig)
    this.loadingPromises.set(configKey, loadingPromise)

    try {
      const queryText = await loadingPromise
      return queryText
    } finally {
      // Clean up loading promise
      this.loadingPromises.delete(configKey)
    }
  }

  /**
   * Fetch query from assets using dynamic import
   * @param {string} queryPath - Path to query file (just filename)
   * @param {string} configKey - Configuration key for caching
   * @param {Object} facetsConfig - The configuration object
   * @returns {Promise<string>} The query text
   */
  async fetchQuery(queryPath, configKey, facetsConfig) {
    try {
      // Get query engine from config, default to 'blazegraph'
      const queryEngine = facetsConfig?.QUERY_ENGINE || 'blazegraph'
      
      // Build the full import path
      // Use /* @vite-ignore */ to suppress Vite's dynamic import warning
      const fullPath = `/src/assets/sparql/${queryEngine}/${queryPath}`
      const queryModule = await import(/* @vite-ignore */ `${fullPath}?raw`)
      const queryText = queryModule.default

      // Cache the result
      this.queryCache.set(configKey, queryText)
      
      return queryText
    } catch (error) {
      console.error(`Failed to load query from assets: ${queryPath}:`, error)
      throw new Error(`Failed to load SPARQL query: ${configKey}`)
    }
  }

  /**
   * Clear cached queries (useful for development/testing)
   */
  clearCache() {
    this.queryCache.clear()
    this.loadingPromises.clear()
  }

  /**
   * Preload commonly used queries
   * @param {Object} facetsConfig - The configuration object
   */
  async preloadQueries(facetsConfig) {
    const commonQueries = [
      'SPARQL_QUERY',
      'SPARQL_HASTOOLS',
      'SPARQL_TOOLS_WEBSERVICE',
      'SPARQL_TOOLS_DOWNLOAD',
      'SPARQL_RELATED_DATA'
    ]

    const loadPromises = commonQueries
      .filter(key => facetsConfig[key])
      .map(key => this.loadQuery(key, facetsConfig).catch(error => {
        console.warn(`Failed to preload query ${key}:`, error)
      }))

    await Promise.allSettled(loadPromises)
  }
}

// Export singleton instance
export const queryService = new QueryService()
export default queryService