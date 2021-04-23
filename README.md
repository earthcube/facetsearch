# facetsearch

## Overall
There are two portions, a node server for services, and a vue client.

ports:
node: 3000
vue: 8080

Generally,
run server,
run client.

# client
cd client
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
If you add one, it need to be added to client/src/config.js


### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

# server
cd server
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

# Docker
If all you want to do is test, then a 'dockerized' component is available in docker.
docker-compose up -d -f docker-compose_dev.yaml

For using with a stack and traefik, docker-compose_prod_example.yaml
