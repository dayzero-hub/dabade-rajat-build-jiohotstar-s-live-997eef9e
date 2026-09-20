import { useRef } from 'react'

/**
 * The placeholder "video player" your brief provides, and its whole job is to be NOISY about
 * being re-rendered.
 *
 * A real player re-mounting mid-over is the failure your project is about: the stream restarts,
 * the picture stutters, and nothing on screen says why. You cannot see that with a component
 * that renders silently — so this one counts its renders, shows the count, and logs to the
 * console every time.
 *
 * Keep the count at 1 while the scoreboard beside it updates on every ball. If it climbs with
 * the score, the player is re-rendering with its neighbour and you have found the bug.
 */
export default function VideoPlayerPlaceholder({ label = 'Live' }: { label?: string }) {
  const renders = useRef(0)
  renders.current += 1

  // eslint-disable-next-line no-console
  console.log(`[VideoPlayerPlaceholder] render #${renders.current}`)

  return (
    <div
      style={{
        aspectRatio: '16 / 9',
        background: 'linear-gradient(135deg, #101319, #1c2230)',
        color: '#e8ecf3',
        borderRadius: 'var(--r-3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--s-2)',
        border: '1px solid var(--line)',
      }}
    >
      <strong style={{ fontSize: 'var(--t-lg)' }}>{label}</strong>
      <span style={{ fontSize: 'var(--t-sm)', opacity: 0.8 }}>
        renders: <output style={{ fontVariantNumeric: 'tabular-nums' }}>{renders.current}</output>
      </span>
      <span style={{ fontSize: 'var(--t-xs)', opacity: 0.6, maxWidth: '28ch', textAlign: 'center' }}>
        This number must not climb while the score updates.
      </span>
    </div>
  )
}
