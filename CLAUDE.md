# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FacetSearch is a Vue.js + Node.js application for searching and exploring scientific datasets and tools in the EarthCube ecosystem. It consists of two main components:

- **Client**: Vue 3 application with TypeScript support running on port 5413
- **Server**: Express.js API server running on port 3000

The application provides faceted search functionality over linked data using SPARQL queries to explore scientific datasets and connected tools.

## Development Commands

### Client (Vue.js Frontend)
```bash
cd client
yarn install
yarn dev          # Development server with hot reload
yarn build        # Production build
yarn lint         # Lint and fix TypeScript/Vue files
```

### Server (Node.js API)
```bash
cd server
yarn install
yarn dev          # Development server with nodemon
yarn start        # Production server
```

## Configuration

### Client Configuration
- Config files located in `client/public/config/` (YAML format)
- Available configs must be registered in `client/public/config.yaml`
- Select config via environment variable: `VITE_APP_FACETS_CONFIG_FILE=config/config_dev.yaml`
- Default config: `config/config.yaml`

### Server Configuration
- Environment variables control server configuration
- Required variables in `server/env.minimal.example`:
  - `S3ADDRESS` - S3 storage endpoint
  - `S3KEY` - S3 access key
  - `S3SECRET` - S3 secret key
  - `BUCKET` - S3 bucket name
- Full configuration example in `server/env.full.example`

## Architecture

### Client Architecture
- **Vue 3** with Composition API compatibility mode
- **Vue Router** for navigation with hash-based routing
- **Vuex** for state management with remote config loading
- **Bootstrap Vue** for UI components
- **Leaflet** for geospatial mapping
- **Axios** for API calls

Key directories:
- `src/components/facetsearch/` - Main search interface and facets
- `src/components/dataset/` - Dataset detail views
- `src/components/collection/` - Collection management
- `src/state.js` - Vuex store with SPARQL query handling
- `src/routes.js` - Application routing configuration

### Server Architecture
- **Express.js** REST API
- **MinIO** client for S3-compatible storage
- Routes in `server/routes/index.js`:
  - `/dataset/*` - Dataset metadata retrieval
  - `/tools/*` - Tool metadata retrieval  
  - `/config` - Configuration endpoint

### Data Flow
1. Client loads remote YAML configuration on startup
2. User searches trigger SPARQL queries via Vuex actions
3. Server proxies requests to triple store and S3 storage
4. Results cached in client-side LRU cache
5. Linked data (JSON-LD) processed for display

## Key Technologies

- **SPARQL**: Query language for RDF data
- **JSON-LD**: Linked data format for metadata
- **Blazegraph**: Triple store database
- **S3**: Object storage for dataset files
- **Vite**: Build tool for client
- **LocalForage**: Client-side storage for collections

## Testing and Linting

- Client uses ESLint with Vue.js rules
- TypeScript checking: `vue-tsc --noEmit`
- No test framework currently configured

## Common Issues

- Ensure both client and server are running for full functionality
- Check environment variables are properly set for server
- Verify SPARQL endpoint connectivity in configuration
- Client requires specific Node.js version (>=20.0.0) and Yarn 4+