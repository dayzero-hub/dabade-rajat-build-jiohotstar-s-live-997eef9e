// JioHotstar live scoreboard — a ball-by-ball score feed.
//
// Updates arrive one ball at a time, with bursts (a wicket and the next ball together) and
// delays. Your brief is about the scoreboard updating without re-rendering the video player —
// see `src/components/VideoPlayerPlaceholder.tsx`, which counts its own renders so you can prove
// it.
import { startStream, type StreamHandle, type StreamHandlers, type StreamSchedule } from './stream'

export type BallOutcome = 'dot' | '1' | '2' | '3' | '4' | '6' | 'wicket' | 'wide' | 'no-ball'

export interface BallEvent {
  /** e.g. "14.3" — over.ball */
  ball: string
  outcome: BallOutcome
  /** Running total after this ball. */
  runs: number
  wickets: number
  /** The batter on strike after this ball. */
  striker: string
  bowler: string
  /** Present on a wicket. */
  dismissal?: string
  commentary: string
}

export const match = {
  home: 'India',
  away: 'Australia',
  venue: 'Wankhede Stadium, Mumbai',
  format: 'T20I',
}

const outcomes: BallOutcome[] = ['dot', '1', '1', '2', 'dot', '4', '1', 'dot', '6', '1', 'wide', 'dot', '2', 'wicket', '1', '4', 'dot', 'no-ball', '1', 'dot']
const strikers = ['Shubman Gill', 'Suryakumar Yadav', 'Hardik Pandya', 'Rinku Singh']
const bowlers = ['Pat Cummins', 'Adam Zampa', 'Josh Hazlewood']

const runsFor = (outcome: BallOutcome): number => {
  switch (outcome) {
    case 'dot': case 'wicket': return 0
    case 'wide': case 'no-ball': return 1
    default: return Number(outcome)
  }
}

/** Subscribes to the ball feed. Call `close()` on unmount. */
export function subscribeScore(handlers: StreamHandlers<BallEvent>, schedule: StreamSchedule = {}): StreamHandle {
  let runs = 0
  let wickets = 0
  let legalBalls = 0

  return startStream<BallEvent>(sequence => {
    const outcome = outcomes[(sequence - 1) % outcomes.length]
    runs += runsFor(outcome)
    if (outcome === 'wicket') wickets += 1
    if (outcome !== 'wide' && outcome !== 'no-ball') legalBalls += 1

    const striker = strikers[Math.floor(legalBalls / 7) % strikers.length]
    const bowler = bowlers[Math.floor(legalBalls / 6) % bowlers.length]

    return {
      ball: `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`,
      outcome,
      runs,
      wickets,
      striker,
      bowler,
      dismissal: outcome === 'wicket' ? `${striker} c Warner b ${bowler}` : undefined,
      commentary: `${bowler} to ${striker}, ${outcome}`,
    }
  }, handlers, { intervalMs: 1200, burstEvery: 9, burstSize: 3, ...schedule })
}
