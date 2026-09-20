// The mock API harness. Every endpoint in this folder goes through it, so latency and failure
// behave the same way everywhere and you can turn them up while you build the states.
//
// It is deliberately not a network client: there is no server to run and nothing to configure.
// What it gives you is a call that TAKES TIME and can FAIL, which is what a loading state, a
// stale response and an error state need in order to be real.

/** Thrown when a mock call fails. Catch it the way you would a failed fetch. */
export class MockApiError extends Error {
  constructor(message: string, readonly status = 503) {
    super(message)
    this.name = 'MockApiError'
  }
}

export interface MockOptions {
  /** Milliseconds. Real-ish by default; raise it while you build the loading state. */
  minLatencyMs?: number
  maxLatencyMs?: number
  /** 0–1. The share of calls that reject with a MockApiError. */
  failureRate?: number
}

/** Change these at runtime from the console to exercise your slow and broken states. */
export const mockConfig: Required<MockOptions> = {
  minLatencyMs: 250,
  maxLatencyMs: 900,
  failureRate: 0,
}

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

/**
 * Runs `produce` after a realistic delay, sometimes failing instead.
 *
 * `signal` is honoured: an aborted call rejects with an `AbortError`, which is what lets you
 * cancel a request whose answer you no longer want. Several of these projects are evaluated on
 * exactly that — a slow first response must not overwrite a fast second one.
 */
export async function mockCall<T>(produce: () => T, options: MockOptions = {}, signal?: AbortSignal): Promise<T> {
  const { minLatencyMs, maxLatencyMs, failureRate } = { ...mockConfig, ...options }
  const delay = minLatencyMs + Math.random() * Math.max(0, maxLatencyMs - minLatencyMs)

  await wait(delay)

  if (signal?.aborted) {
    throw new DOMException('The operation was aborted.', 'AbortError')
  }
  if (Math.random() < failureRate) {
    throw new MockApiError('The service did not respond in time. Try again.')
  }
  return produce()
}
