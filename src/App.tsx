/**
 * The starting point, and deliberately nothing more.
 *
 * This template is shared by several projects. It gives you a React + TypeScript app that runs, a
 * token file for colours and spacing, and a stream harness under `src/mock/` that bursts, drops
 * and reconnects — the awkward parts of a live feed, which is what your project is actually about.
 *
 * Replace this component. It exists so `npm run dev` shows something on the first run, which is
 * how you tell "my environment is broken" from "my code is wrong" later on.
 */
export default function App() {
  return (
    <main className="app">
      <header className="app-header">
        <h1 className="app-title">Your project runs</h1>
        <p className="app-sub">React + TypeScript + Vite · edit <code>src/App.tsx</code> and this page updates</p>
      </header>

      <section className="panel">
        <h2 style={{ marginTop: 0, fontSize: 'var(--t-lg)' }}>Next</h2>
        <ol className="next-steps">
          <li>Finish your setup ticket — it asks what <code>node --version</code> printed and whether this page loaded.</li>
          <li>Open <code>src/mock/</code> and read the module named for your project, and <code>stream.ts</code> with it.</li>
          <li>Open issue #1 on your repository and build the first ticket. Replace this component as you go.</li>
        </ol>
        <p style={{ color: 'var(--ink-muted)', fontSize: 'var(--t-sm)', marginBottom: 0 }}>
          Every stream takes a schedule — interval, bursts, drops, reconnect delay — so you can
          reproduce a bad connection on demand instead of waiting for one.
        </p>
      </section>
    </main>
  )
}
