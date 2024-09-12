# facetsearch

Deployed as: https://geocodes.earthcube.org

master branch here  is deployed as https://geocodes.geocodes-aws-dev.earthcube.org/

## Overall
There are two portions, a node server for services, and a vue client.

ports:
node: 3000
vue: 5413

Generally,
run server,
run client.


## Quick Instructions:
### client configuration
in client/public/config there are configuration files. If you add one, it need to be added to client/public/config.yaml

To select a config file, you use the environment variable:

`VITE_APP_FACETS_CONFIG_FILE=config/config_dev.yaml`

### server configuration
in server/config/services.js environment variables set the configuration.
these need to be set: [env.minimal.example](server/env.minimal.example)
S3ADDRESS="oss.geocodes-aws.earthcube.org"
S3KEY=
S3SECRET=
BUCKET='test'

The others have basic defaults. [env.full.example](server/env.full.example)

### Terminal 1 server:
```
cd server
yarn install
yarn dev 
```
### Terminal 2 client:
```
cd client
```

# client
```
cd client
yarn install
yarn dev
```

## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn dev
```

### Compiles and minifies for production
```
yarn build
```

### Lints and fixes files
```
yarn lint
```



# server
```cd server
yarn install
yarn dev
```
# Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn dev
```

## Compiles and minifies for production
```
yarn build
```
## run for production
```
yarn build
```

### Lints and fixes files
```
yarn lint
```

# Docker
A docker-compose file is included [docker-compose_dev.yaml](docker/docker-compose_dev.yaml)
The geocodes repository has the latest  [docker-compose file](https://github.com/earthcube/geocodes/blob/main/deployment/geocodes-compose-local.yaml)
