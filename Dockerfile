# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package definition & optional local tarballs
COPY package.json yarn.lock axzy_ui_system-*.tg[z] ./

# Configure yarn cache path
RUN yarn config set cache-folder /root/.yarn-cache

# Install dependencies using BuildKit cache mount for faster builds
RUN --mount=type=cache,target=/root/.yarn-cache \
    yarn install --frozen-lockfile --prefer-offline

# Copy source code
COPY . .

# Build for production
RUN yarn build:prod

# Production Stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from builder stage (Vite outputs to 'dist' by default)
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
