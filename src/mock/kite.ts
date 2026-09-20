// Zerodha Kite live watchlist — a mock market-data socket.
//
// Prices move on every tick. The connection bursts, drops and reconnects on the schedule you pass
// in, and nothing is replayed across a gap: the whole point of your brief is a price that is
// still correct after the feed misbehaves.
import { startStream, type StreamHandle, type StreamHandlers, type StreamSchedule } from './stream'

export interface Instrument {
  /** Trading symbol, as Kite shows it. */
  symbol: string
  exchange: 'NSE' | 'BSE'
  name: string
  /** Yesterday's close, in rupees. Change is measured against this. */
  previousClose: number
}

export interface Tick {
  symbol: string
  /** Rupees, two decimal places. */
  lastPrice: number
  /** Milliseconds since epoch, from the exchange. Ticks CAN arrive out of order after a burst. */
  timestamp: number
  /** Cumulative volume for the day. */
  volume: number
}

/** The starting instrument set. */
export const instruments: Instrument[] = [
  { symbol: 'RELIANCE',   exchange: 'NSE', name: 'Reliance Industries',  previousClose: 2987.4 },
  { symbol: 'TCS',        exchange: 'NSE', name: 'Tata Consultancy',     previousClose: 4120.9 },
  { symbol: 'HDFCBANK',   exchange: 'NSE', name: 'HDFC Bank',            previousClose: 1678.25 },
  { symbol: 'INFY',       exchange: 'NSE', name: 'Infosys',              previousClose: 1842.6 },
  { symbol: 'ITC',        exchange: 'NSE', name: 'ITC',                  previousClose: 448.15 },
  { symbol: 'TATAMOTORS', exchange: 'NSE', name: 'Tata Motors',          previousClose: 1015.7 },
  { symbol: 'ZOMATO',     exchange: 'NSE', name: 'Zomato',               previousClose: 268.9 },
  { symbol: 'SBIN',       exchange: 'NSE', name: 'State Bank of India',  previousClose: 842.35 },
]

const last = new Map<string, number>(instruments.map(i => [i.symbol, i.previousClose]))
const volume = new Map<string, number>(instruments.map(i => [i.symbol, 0]))

/**
 * Subscribes to ticks for `symbols`. Returns the handle — call `close()` on unmount, or the
 * stream keeps pushing into a component that no longer exists.
 */
export function subscribeTicks(
  symbols: string[],
  handlers: StreamHandlers<Tick>,
  schedule: StreamSchedule = {},
): StreamHandle {
  return startStream<Tick>(sequence => {
    const symbol = symbols[sequence % symbols.length]
    const previous = last.get(symbol) ?? 100
    // A small random walk, and occasionally a jump — a watchlist has to stay readable through both.
    const drift = (Math.random() - 0.48) * previous * (Math.random() < 0.05 ? 0.02 : 0.002)
    const price = Math.max(1, Number((previous + drift).toFixed(2)))
    last.set(symbol, price)
    volume.set(symbol, (volume.get(symbol) ?? 0) + Math.floor(Math.random() * 900 + 100))

    return {
      symbol,
      lastPrice: price,
      // Deliberately jittered: a tick can carry a timestamp slightly older than the one before it,
      // which is what makes "ignore a stale tick" a real requirement rather than a theoretical one.
      timestamp: Date.now() - Math.floor(Math.random() * 300),
      volume: volume.get(symbol) ?? 0,
    }
  }, handlers, { intervalMs: 450, ...schedule })
}
