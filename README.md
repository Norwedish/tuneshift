# TuneShift

**One library. Every platform.**

TuneShift is a music-converter web app: search the track you have on one
service and get working YouTube Music (or Spotify) links for it — or drop in a
Spotify/YouTube Music link and convert it.

- **Search** tracks on Spotify or YouTube Music and cross-match them.
- **Link converter** takes a Spotify or YouTube Music track / album / playlist
  URL and converts it to the other platform.
- **Batch converters** walk an album or playlist track-by-track with progress,
  confidence scores, alternatives, and per-track retries.

## Stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4** + **Lucide** icons
- Design system in `app/globals.css`, themed "Signal": Syne display + DM Sans body +
  JetBrains Mono data, cool bone/slate neutrals, cobalt brand and electric-cyan
  signal colour, glass rails and lit-from-above surfaces.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

### Environment variables

Copy `.env.local.example` → `.env.local` (see `lib/config/env.ts`):

```bash
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
YOUTUBE_API_KEY=...
```

All three are optional. The app degrades honestly: with no credentials it runs
fine and reports a `not_configured` status instead of showing fake results.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (also type-checks) |
| `npm run start` | Serve the production build |
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | `tsc --noEmit` |

## Docker

A production-ready, multi-stage `Dockerfile` is included, plus a
`docker-compose.yml` for one-command deployment.

### Run with Docker Compose

```bash
# Provide your API keys as host env vars
export SPOTIFY_CLIENT_ID=your_client_id
export SPOTIFY_CLIENT_SECRET=your_client_secret
export YOUTUBE_API_KEY=your_youtube_api_key

docker compose up --build
```

The app is then available at **http://localhost:3000**.

### Run with plain Docker

```bash
docker build -t tuneshift .
docker run --rm -p 3000:3000 \
  -e SPOTIFY_CLIENT_ID -e SPOTIFY_CLIENT_SECRET -e YOUTUBE_API_KEY \
  tuneshift
```

## What it does

- **Search** — query Spotify or YouTube Music, keep the best weighted match.
- **Link converter** — paste a Spotify or YouTube Music link, get the other
  platform ready to play.
- **Converters** — album / playlist batch conversion with live progress,
  per-track confidence, and export to TXT / CSV / JSON.

## Limitations

- No sign-in / OAuth. Saved collections live in the browser only; there is no
  server-side library to persist to.
- YouTube Music **album pages** (`/browse/MP…`) cannot be read through the
  official API and are reported as unsupported — use the playlist link instead.
- YouTube auto-generated **radio mixes** (`RD…`) and private lists are
  refused.

## License

MIT
