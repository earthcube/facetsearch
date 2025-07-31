# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GeoCODES Faceted Search Application - A Vue.js/Node.js web application for scientific data discovery through faceted search over SPARQL endpoints. Deployed at https://geocodes.earthcube.org

## Development Commands

### Setup & Development
```bash
# Terminal 1 - Server (runs on port 3000)
cd server
yarn install
yarn dev

# Terminal 2 - Client (runs on port 5413) 
cd client
yarn install
yarn dev
```

### Client Commands
```bash
cd client
yarn build           # Production build
yarn fullbuild       # Build with linting and type checking
yarn lint            # ESLint with auto-fix
```

### Server Commands
```bash
cd server
yarn start           # Production mode
yarn dev             # Development with nodemon
```

## Architecture

**Frontend**: Vue.js 3 (compatibility mode) + Vuex + Vue Router + Vite
**Backend**: Node.js/Express API server  
**Data**: SPARQL endpoints (Blazegraph), S3-compatible storage (MinIO)
**UI**: Bootstrap Vue

### Key Directories
- `/client/src/components/facetsearch/` - Core search interface
- `/client/src/components/dataset/` - Dataset detail views
- `/client/src/state.js` - Vuex store with remote config loading
- `/server/api/` - API controllers for datasets, tools, utilities
- `/client/public/config/` - Environment-specific YAML configurations

## Configuration System

### Client Configuration
Set via environment variable (defaults to `config/config.yaml`):
```bash
VITE_APP_FACETS_CONFIG_FILE=config/config_dev.yaml
```

Configuration files in `/client/public/config/` define:
- SPARQL endpoints and queries
- UI branding and logos  
- Available facets and filters
- Repository-specific settings

### Server Configuration
Required environment variables (see `server/env.minimal.example`):
```bash
S3ADDRESS="oss.geocodes-aws.earthcube.org"
S3KEY=your_key
S3SECRET=your_secret
BUCKET=your_bucket
```

## Data Flow Architecture

1. **Search**: Vue components → Vuex store → SPARQL queries → Blazegraph endpoints
2. **Facets**: Dynamic facet generation from configuration → Real-time filtering
3. **Dataset Details**: S3 JSON-LD retrieval → JSON-LD processing → Vue rendering
4. **Tool Discovery**: Federated SPARQL queries across multiple endpoints

## Key Features

### Faceted Search
- Text filters (keywords, place names, publishers)
- Range filters (dates, numeric values) 
- Dynamic facet configuration per deployment
- LRU caching for performance

### Multi-tenant Support
- Environment-specific configurations via YAML files
- Customizable branding, logos, and UI elements
- Multiple repository/endpoint support per configuration

### JSON-LD Processing
- Metadata stored as JSON-LD in S3
- Client-side JSON-LD expansion and normalization
- Support for multiple schema formats

## Development Notes

- Uses Vite for client builds (migrated from Vue CLI webpack)
- Vue 3 with Vue 2 compatibility mode for Bootstrap Vue
- LocalForage for client-side collection storage
- Microservices architecture with decoupled frontend/backend