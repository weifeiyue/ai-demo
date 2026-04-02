# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## SSE Demo

This project now includes a fetch-based SSE example:

- Client parser: `app/composables/useFetchSse.ts`
- Demo page: `app/app.vue`
- Mock SSE endpoint: `server/api/sse.post.ts`

Why `fetch` instead of `EventSource`:

- Supports `POST`
- Supports custom headers
- Supports request body

You can start the app with `pnpm dev` and test the stream from the page.
