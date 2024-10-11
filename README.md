# facetsearch
This is the Vue2 codebase for Earthcube Gocodes UI.
vue2 is unsupported as of December 2023

The master branch has been update to vue3.

## Overall
There are two portions, a node server for services, and a vue client.

ports:
node: 3000
vue: 8080

Generally,
run server,
run client.

## Quick Instructions:
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
yarn serve
```

## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### Lints and fixes files
```
yarn lint
```

### configuration
in client/src/config there are configurationfiles
If you add one, it need to be added to client/src/config.json


### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

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
yarn start
```

### Lints and fixes files
```
yarn lint
```

# Docker
If all you want to do is test, then a 'dockerized' component is available in docker.
docker-compose up -d -f docker-compose_dev.yaml

For using with a stack and traefik, docker-compose_prod_example.yaml
