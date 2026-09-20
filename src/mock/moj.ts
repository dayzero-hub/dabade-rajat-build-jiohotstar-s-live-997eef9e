// Moj short-video feed — a paginated clip feed.
//
// The clips are real MP4 files in `public/clips/`, served by Vite from `/clips/…`, so the feed
// plays with no network. They are three-second solid colours on purpose: you are building feed
// behaviour, and a 3KB clip makes an off-screen player that is still decoding obvious.
export interface Clip {
  id: string
  /** Served from `public/`. Use it as-is in a <video src>. */
  videoUrl: string
  creator: string
  caption: string
  likes: number
  /** Seconds. Every sample clip is the same length. */
  durationSec: number
}

export interface FeedPage {
  clips: Clip[]
  /** Pass back to `fetchPage` for the next page. null means the end. */
  nextCursor: string | null
}

const captions = [
  'Monsoon evening in Bandra',
  'Chai break at the site',
  'Trying the new bike lane',
  'Ganpati decorations, Lalbaug',
  'Street food run, Indore',
  'Sunday cleaning, sped up',
  'First time on a longboard',
  'Kitchen garden update',
  'Delhi metro, 7am',
  'Dog meets the sprinkler',
  'Terrace sunset, Jaipur',
  'Cycling to Nandi Hills',
  'Making filter coffee properly',
  'Repainting the scooter',
  'Rain on the tin roof',
  'Fresh haircut, Chandni Chowk',
  'Kerala backwaters, slow',
  'Night shift, Hyderabad',
  'Football at Shivaji Park',
  'Packing an order, 60 seconds',
]
const creators = ['@aarti.builds', '@rider_sanju', '@kitchen.kiran', '@velocity_vik', '@mumbai.mornings']

// A hundred clips over six files. The feed is long enough that keeping it flat is a real
// question: your brief is evaluated on memory not climbing as you scroll.
const clips: Clip[] = Array.from({ length: 100 }, (_, i) => ({
  id: `clip-${String(i + 1).padStart(3, '0')}`,
  videoUrl: `/clips/clip-0${(i % 6) + 1}.mp4`,
  creator: creators[i % creators.length],
  caption: captions[i % captions.length],
  likes: 120 + ((i * 37) % 8800),
  durationSec: 3,
}))

const PAGE_SIZE = 8

/** One page of the feed, after a realistic delay. */
export function fetchPage(cursor: string | null = null): Promise<FeedPage> {
  const start = cursor ? Number(cursor) : 0
  return new Promise(resolve => {
    setTimeout(() => {
      const next = start + PAGE_SIZE
      resolve({
        clips: clips.slice(start, next).map(c => ({ ...c })),
        nextCursor: next < clips.length ? String(next) : null,
      })
    }, 300 + Math.random() * 500)
  })
}
