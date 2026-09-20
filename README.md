# fe-v2-react-ts-realtime

A React + TypeScript starter with a **mock live feed** — messages that arrive on a schedule, in
bursts, with drops and reconnects you can force — plus a token file for colours and spacing.
There is no server to run and no socket to connect: `src/mock/` is the feed.

## Run it

```bash
npm install
npm run dev
```

The dev server prints **http://localhost:5173**. Do this before you change anything: if it starts,
anything that breaks later is your code rather than your setup.

Node **18+** and npm **9+** (`node --version`, `npm --version`; install the LTS build from
https://nodejs.org if either is missing, then open a new terminal).

```bash
npm run build     # type-check the whole project and build for production
npm run preview   # serve that build locally
```

## The stream harness

`src/mock/stream.ts` pushes messages on a schedule and reports its own state — `connecting`,
`open`, `dropped`, `reconnecting`, `closed`. Every schedule value is yours to set:

```ts
subscribeTicks(symbols, { onMessage, onState }, {
  intervalMs: 250,      // faster than a render, on purpose
  burstEvery: 8,        // every 8th message arrives as a burst
  burstSize: 12,
  dropEvery: 30,        // drop the connection every 30 messages
  reconnectAfterMs: 4000,
})
```

Two things it does that a happy-path mock would not, and both are in your brief:

- **Nothing is replayed after a drop.** A real feed does not tell you what you missed, so your
  screen has to stay correct across a gap rather than assume every message arrived.
- **Timestamps are jittered.** A message can carry a time slightly older than the one before it,
  which is what makes "ignore a stale update" a real requirement.

`handle.close()` stops it. Call it on unmount — a stream that outlives its component keeps
pushing into something that no longer exists, and that is the leak your brief is looking for.

## Find your module

| Project | File | What it does |
|---|---|---|
| Zerodha Kite — live watchlist | `src/mock/kite.ts` | market ticks for a starting instrument set, with bursts, drops and reconnects |
| JioHotstar — live scoreboard | `src/mock/hotstar.ts` | ball-by-ball updates, bursts and delays |
| Moj — short-video feed | `src/mock/moj.ts` | a paginated clip feed; the clips are real files in `public/clips/` |
| Delhivery — offline sync | `src/mock/delhivery.ts` | a sync API you can flip offline, delay, or make fail *after* succeeding |

`src/components/VideoPlayerPlaceholder.tsx` is the placeholder player the JioHotstar brief names.
It counts its own renders and logs each one, so "the scoreboard updates without re-rendering the
player" is something you can prove rather than assume.

## What is deliberately NOT in here

The screen you were asked to build. The subscription lifecycle, the batching, the reconnection
handling, the idempotency and the states your tickets describe are the project — this repository
is the starting point, not a worked example.
