FROM node:lts-alpine as builder

# Create app directory
WORKDIR /app
RUN corepack enable

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY ./package*.json ./

#RUN  rm -rf node_modules && yarn install

# If you are building your code for production
# RUN yarn build:ci --only=production


# Bundle app source
COPY . .

# Clean install to fix rollup native dependency issues
RUN rm -rf node_modules && yarn install
# http-server will be installed globally in the runtime image
RUN yarn build

FROM node:lts-alpine
# copy built files from builder image to new clean node image without vite
COPY --from=builder  /app /app
WORKDIR /app

# Enable corepack to manage yarn
RUN corepack enable

# Switch to the non-root user before installing global dependencies
# This ensures the http-server executable is in the user's PATH
USER node


EXPOSE 8080
CMD [ "http-server", "dist" ]
