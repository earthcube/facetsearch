FROM node:22

RUN npm install -g http-server

# Create app directory
WORKDIR /usr/src/app
RUN corepack enable

# Copy manifests + source before yarn install so COPY does not overwrite PnP files
COPY package.json yarn.lock .yarnrc.yml ./
COPY . .

# Install from yarn.lock (npm install breaks: vue-router@4.6 needs vue@^3.5)
RUN yarn install
# If you are building your code for production
# RUN npm ci --only=production

RUN yarn build

EXPOSE 8080
CMD [ "http-server", "/usr/src/app/dist" ]
