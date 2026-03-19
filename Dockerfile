# Dockerfile

# 1. Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock* pnpm-lock.yaml* ./
RUN npm install # or yarn install / pnpm install

# 2. Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build # or yarn build / pnpm build

# 3. Production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy built artifacts
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
