FROM node:lts-alpine AS builder

# Create app directory
WORKDIR /app
RUN corepack enable

# Install app dependencies from the yarn lockfile (do not use npm install —
# vue-router^4.2.5 resolves to 4.6.x under npm and requires vue^3.5).
COPY package.json yarn.lock .yarnrc.yml ./
COPY . .

# Clean install to fix rollup native dependency issues
RUN rm -rf node_modules && yarn install
RUN yarn build

FROM node:lts-alpine
RUN corepack enable
# copy built files from builder image to new clean node image without vite
COPY --from=builder /app /app
WORKDIR /app

# Switch to the non-root user before installing global dependencies
# This ensures the http-server executable is in the user's PATH
USER node

EXPOSE 8080
CMD ["yarn", "dlx", "http-server", "dist"]
