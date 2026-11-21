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

The app boots with **no keys at all**: every provider reports `not_configured`
and the UI says what to add. Nothing is faked and nothing is stubbed. To get live
results, open the two free consoles below.

### Getting the keys

#### Spotify → `SPOTIFY_CLIENT_ID` + `SPOTIFY_CLIENT_SECRET`

TuneShift authenticates with the **client credentials** grant
(`grant_type=client_credentials`, see `lib/providers/spotify.ts`): the app pair
talks to the Web API as itself, so there is no user sign-in, no consent screen,
and no review app to wait for.

1. Log in at <https://developer.spotify.com/dashboard> with any Spotify account.
2. Click **Create app**. Name and description are free text. In **Redirect URI**
   put `http://localhost:3000/callback` — Spotify requires at least one URI to
   save the entry, but TuneShift never uses it.
3. On the app's **Settings** page copy the **Client ID**, then click the **Client
   Secret** row to reveal it.
4. Paste both values into `.env.local`. They must be a matching pair: Spotify
   counts as configured only when both are present.

Public endpoints (search, tracks, albums) work the moment you create the app.
Endpoints marked *Only for authenticated* would need an approved application —
TuneShift does not call any of them.

#### YouTube → `YOUTUBE_API_KEY`

The app only calls `https://www.googleapis.com/youtube/v3` (Data API v3), so a
plain API key is enough — no OAuth, no YouTube channel, no account linkage.

1. Open <https://console.cloud.google.com/> and create a project (any name).
2. In **APIs → Library**, enable **YouTube Data API v3** and leave every other
   API off, so a leaked key can only ever reach YouTube search.
3. In **APIs & Services → Credentials**, click **Create API key** (the value
   starts with `AIza…`).
4. Edit the key and restrict it to **YouTube Data API v3 only**. Leave the
   HTTP-referrer and IP boxes empty for local development: the key is sent from
   the server, so a browser-referrer rule would reject every request.
5. Paste it as `YOUTUBE_API_KEY`.

**Quota:** the free quota is 10 000 units per key per day, and a `search.list`
call costs 100 units while a known-`videoId` lookup costs 1. Plan on roughly
100 searches a day per key. TuneShift caches provider responses for
`TUNESHIFT_CACHE_TTL_SECONDS` (default 300 s) and self-throttles at
`TUNESHIFT_RATE_LIMIT_PER_MINUTE` (default 60) requests/minute, so re-running the
same search costs nothing. Keep the key server-side: it is read from the
environment in `lib/config/env.ts` and never lands in the browser bundle.

#### Install them

```powershell
Copy .env.local.example .env.local   # PowerShell
```

```bash
cp .env.local.example .env.local     # bash / zsh
```

Fill in the three values, then **restart the dev server** — Next.js reads the
file at startup, so a running server will not pick up a new key:

```bash
npm run dev
```

Confirm with <http://localhost:3000/api/status> (each provider should report
`"configured": true, "ok": true`) or read the rail's provider pills in the app,
which move from **not set** to **live** once the credentials load, alongside the
Setup page's **Not set** → **Connected** state.

#### Env contract (`lib/config/env.ts`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `SPOTIFY_CLIENT_ID` | unset | Spotify app pair — turns on Spotify search + metadata |
| `SPOTIFY_CLIENT_SECRET` | unset | must be present with the ID, or Spotify stays off |
| `YOUTUBE_API_KEY` | unset | YouTube Data API v3 key — turns on YouTube search + metadata |
| `TUNESHIFT_CACHE_TTL_SECONDS` | `300` | provider response cache lifetime |
| `TUNESHIFT_RATE_LIMIT_PER_MINUTE` | `60` | requests per minute TuneShift will issue |

Only `.env.local.example` and `.env.example` are tracked in git, and both hold
placeholders. `.env.local` is git-ignored.

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

The compose file forwards the keys through `${...}` placeholders, so give them
from your shell or from a `.env` file next to `docker-compose.yml` (git-ignored,
filled in, not placeholders).

```powershell
# PowerShell
$env:SPOTIFY_CLIENT_ID = "your_client_id"
$env:SPOTIFY_CLIENT_SECRET = "your_client_secret"
$env:YOUTUBE_API_KEY = "your_youtube_api_key"
docker compose up --build
```

```bash
# bash / zsh
export SPOTIFY_CLIENT_ID=your_client_id
export SPOTIFY_CLIENT_SECRET=your_client_secret
export YOUTUBE_API_KEY=your_youtube_api_key
docker compose up --build
```

Both forms take the optional tunables as well —
`TUNESHIFT_CACHE_TTL_SECONDS` (default `300`) and
`TUNESHIFT_RATE_LIMIT_PER_MINUTE` (default `60`). The app is then available at
**http://localhost:3000**.

Compose also runs a healthcheck that polls `/api/status`, so `docker compose ps`
tells you the container is serving before you open the browser.

### Run with plain Docker

```bash
docker build -t tuneshift .
docker run --rm -p 3000:3000 \
  -e SPOTIFY_CLIENT_ID -e SPOTIFY_CLIENT_SECRET -e YOUTUBE_API_KEY \
  tuneshift
```

Keys are read from the environment in both cases; nothing is baked into the image.

## What it does

- **Search** — query Spotify or YouTube Music, keep the best weighted match.
- **Link converter** — paste a Spotify or YouTube Music link, get the other
  platform ready to play.
- **Converters** — album / playlist batch conversion with live progress,
  per-track confidence, and export to TXT / CSV / JSON.
- **Appearance** — Light, Dark or System on the Settings page; **System is the
  default**, so the app follows your OS (and your OS changes) until you pin a
  theme. Applied live, kept in this browser.

## Limitations

- No sign-in / OAuth. Saved collections live in the browser only; there is no
  server-side library to persist to.
- YouTube Music **album pages** (`/browse/MP…`) cannot be read through the
  official API and are reported as unsupported — use the playlist link instead.
- YouTube auto-generated **radio mixes** (`RD…`) and private lists are
  refused.

## License

MIT
