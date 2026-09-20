// The stream harness. Kite's market socket and Hotstar's score feed are both built on it, so a
// drop, a burst and a reconnect behave the same way in either project.
//
// It is NOT a WebSocket. There is no server to run: it is a subscription that pushes messages on
// a schedule you control, including the awkward parts of a real connection — bursts that arrive
// faster than a render, a drop in the middle of a session, and a reconnect that replays nothing.

export type StreamState = 'connecting' | 'open' | 'dropped' | 'reconnecting' | 'closed'

export interface StreamHandlers<T> {
  onMessage: (message: T) => void
  /** Every state change, so your UI can say what the connection is doing. */
  onState?: (state: StreamState) => void
}

export interface StreamSchedule {
  /** Milliseconds between ordinary messages. */
  intervalMs?: number
  /** Every so often, send this many messages at once instead of one. 1 disables bursts. */
  burstSize?: number
  /** A burst roughly every N messages. 0 disables bursts. */
  burstEvery?: number
  /** Drop the connection roughly every N messages. 0 never drops. */
  dropEvery?: number
  /** How long a drop lasts before reconnecting. */
  reconnectAfterMs?: number
  /** Milliseconds to spend "connecting" before the first message. */
  connectDelayMs?: number
}

const defaults: Required<StreamSchedule> = {
  intervalMs: 700,
  burstSize: 6,
  burstEvery: 14,
  dropEvery: 40,
  reconnectAfterMs: 2500,
  connectDelayMs: 400,
}

export interface StreamHandle {
  /** Stop for good. Always call this when the component unmounts. */
  close: () => void
  /** Force a drop now — the state your brief asks you to survive. */
  drop: () => void
  state: () => StreamState
}

/**
 * Starts a stream. `next()` is called for every message the schedule asks for; return the payload
 * your project needs.
 *
 * A dropped stream sends nothing until it reconnects, and **nothing is replayed** — a real feed
 * does not tell you what you missed, which is exactly why your screen has to stay correct across
 * a gap rather than assuming every message arrived.
 */
export function startStream<T>(next: (sequence: number) => T, handlers: StreamHandlers<T>, schedule: StreamSchedule = {}): StreamHandle {
  const s = { ...defaults, ...schedule }
  let sequence = 0
  let state: StreamState = 'connecting'
  let timer: ReturnType<typeof setTimeout> | undefined
  let closed = false

  const setState = (value: StreamState) => {
    state = value
    handlers.onState?.(value)
  }

  const send = (count: number) => {
    for (let i = 0; i < count; i++) {
      sequence += 1
      handlers.onMessage(next(sequence))
    }
  }

  const tick = () => {
    if (closed) return

    const burst = s.burstEvery > 0 && sequence > 0 && sequence % s.burstEvery === 0
    send(burst ? s.burstSize : 1)

    if (s.dropEvery > 0 && sequence > 0 && sequence % s.dropEvery === 0) {
      setState('dropped')
      timer = setTimeout(() => {
        if (closed) return
        setState('reconnecting')
        timer = setTimeout(() => {
          if (closed) return
          setState('open')
          tick()
        }, s.connectDelayMs)
      }, s.reconnectAfterMs)
      return
    }

    timer = setTimeout(tick, s.intervalMs)
  }

  timer = setTimeout(() => {
    if (closed) return
    setState('open')
    tick()
  }, s.connectDelayMs)

  return {
    close: () => {
      closed = true
      if (timer) clearTimeout(timer)
      setState('closed')
    },
    drop: () => {
      if (closed) return
      if (timer) clearTimeout(timer)
      setState('dropped')
      timer = setTimeout(() => {
        if (closed) return
        setState('reconnecting')
        timer = setTimeout(() => {
          if (closed) return
          setState('open')
          tick()
        }, s.connectDelayMs)
      }, s.reconnectAfterMs)
    },
    state: () => state,
  }
}
