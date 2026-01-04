# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
# ติดตั้ง libc6-compat เพื่อให้ใช้งานกับบาง library ได้ดีขึ้นบน Alpine
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
# ถ้ามี package-lock.json จะใช้ npm ci (เร็วกว่าและแน่นอนกว่า) ถ้าไม่มีให้ใช้ npm install
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  else npm install; \
  fi

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ปิด Next.js Telemetry เพื่อความเร็วในการ Build
ENV NEXT_TELEMETRY_DISABLED=1

# Build โปรเจกต์
RUN npm run build

# Stage 3: Production Server
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# ENV NEXT_TELEMETRY_DISABLED=1

# สร้าง User เพื่อความปลอดภัย (ไม่รันด้วย Root)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy file ที่จำเป็นจาก Builder stage
COPY --from=builder /app/public ./public

# Copy โฟลเดอร์ .next/standalone (เกิดขึ้นจากการตั้งค่า output: 'standalone')
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]