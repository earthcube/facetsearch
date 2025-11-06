# ---- Base Stage ----
# Use the specific Node.js version from your package.json engines field
FROM node:22-alpine AS base

# Enable Corepack, which is the standard way to use Yarn

WORKDIR /usr/src/app
RUN corepack enable

# Yarn requires .yarnrc.yml, copy it with other project definition files.
# Copying them separately allows for better layer caching.
COPY package.json yarn.lock .yarnrc.yml* ./
# -----------------------------
# ---- Dependencies Stage ----
# -----------------------------
FROM base AS dependencies

# Install only production dependencies to keep the final image lean.
# Use Yarn 4 syntax for production installs
RUN yarn install

# -----------------------------
# ---- Release Stage ----
# -----------------------------
FROM base AS release

WORKDIR /usr/src/app

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy application source code first
COPY . .

# Copy artifacts from the dependencies stage. This includes node_modules
# and the package files, overwriting any from the source copy to ensure consistency.
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY --from=dependencies /usr/src/app/package.json ./package.json
COPY --from=dependencies /usr/src/app/yarn.lock ./yarn.lock

# Change ownership of the files to the non-root user
RUN chown -R appuser:appgroup /usr/src/app

# Switch to the non-root user
USER appuser

# Expose the port the app runs on
EXPOSE 3000

#CMD ["yarn", "start"]
CMD ["node", "./bin/www"]
