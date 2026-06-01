FROM node:24-alpine AS builder

WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/mock-api/package.json apps/mock-api/package.json
COPY packages/contracts/package.json packages/contracts/package.json

RUN pnpm install --frozen-lockfile

COPY apps/mock-api apps/mock-api
COPY packages/contracts packages/contracts

RUN pnpm --filter @oio/mock-api build

FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/mock-api/package.json ./apps/mock-api/package.json
COPY --from=builder /app/apps/mock-api/dist ./apps/mock-api/dist
COPY --from=builder /app/packages/contracts ./packages/contracts

RUN mkdir -p /app/apps/mock-api/generated-audio

EXPOSE 3001

CMD ["node", "apps/mock-api/dist/server.js"]

