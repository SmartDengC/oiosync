# OIO Sync

OIO Lab V1 monorepo scaffold.

## Apps

- `apps/web`: Vue 3 + Vite frontend prototype
- `apps/mock-api`: mock REST API for local integration
- `packages/contracts`: shared zod contracts and TypeScript types

## Scripts

- `pnpm dev:web`
- `pnpm dev:api`
- `pnpm build`
- `pnpm test`
- `pnpm typecheck`

## TTS

The mock API now supports real text-to-speech generation with Xiaomi MiMo `mimo-v2.5-tts`.

1. Copy `apps/mock-api/.env.example` to `apps/mock-api/.env`
2. Fill in `MIMO_API_KEY`
3. Start the API with `pnpm dev:api`

Notes:

- When `MIMO_API_KEY` is configured, `POST /api/generations` will generate a real wav file and store it under `apps/mock-api/generated-audio/`
- Generated audio metadata is persisted locally in `apps/mock-api/generated-audio/records.json`
- When no API key is configured, the app automatically falls back to the existing mock generation flow
- The frontend practice player will use real audio when `audioUrl` is available, otherwise it keeps using the simulated playback flow
- This integration uses Xiaomi MiMo `mimo-v2.5-tts` via `https://api.xiaomimimo.com/v1/chat/completions`
- The voice dropdown now uses the official preset English voices `Mia`, `Chloe`, `Milo`, and `Dean`
