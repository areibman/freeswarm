import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Background grid */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, currentColor, currentColor 1px, transparent 1px, transparent 12px), repeating-linear-gradient(90deg, currentColor, currentColor 1px, transparent 1px, transparent 12px)",
        }}
      />

      {/* Header */}
      <header className="border-b border-foreground/40">
        <div className="container flex h-12 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 bg-foreground" />
            <span className="text-xs uppercase tracking-widest">Freeswarm</span>
            <span className="ml-2 rounded-sm border border-foreground/40 px-1 py-[1px] text-[9px] uppercase tracking-wider">Beta</span>
          </div>
          <nav className="flex items-center gap-3 text-[10px] uppercase tracking-wider">
            <Link className="underline-offset-4 hover:underline" href="/app">Open App</Link>
            <a className="underline-offset-4 hover:underline" href="#how">How it works</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-16 md:py-24">
        <div className="grid items-start gap-8 md:grid-cols-12">
          <div className="md:col-span-7">
            <h1 className="mb-4 text-3xl uppercase leading-tight tracking-tight">
              Stop drowning in agent PRs
            </h1>
            <p className="max-w-[52ch] text-sm text-foreground/80">
              Multi‑agent development creates PR floods: overlapping branches, stale screenshots, and endless local spins. Freeswarm auto‑builds and hosts every agent proposal so you can review live, side‑by‑side, and merge with confidence.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/app" className="inline-flex items-center border border-foreground bg-foreground px-3 py-2 text-[10px] uppercase tracking-wider text-background hover:bg-foreground/90">
                Open the app
              </Link>
              <a href="#problem" className="inline-flex items-center border border-foreground px-3 py-2 text-[10px] uppercase tracking-wider hover:bg-accent">
                Why this matters
              </a>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="border border-foreground">
              <div className="border-b border-foreground bg-secondary px-3 py-2 text-[10px] uppercase tracking-wider">Preview</div>
              <div className="grid grid-cols-2 gap-0">
                <div className="border-r border-foreground p-3">
                  <div className="mb-2 text-[10px] uppercase tracking-wider">Agent A</div>
                  <div className="aspect-video border border-dashed border-foreground/60" />
                </div>
                <div className="p-3">
                  <div className="mb-2 text-[10px] uppercase tracking-wider">Agent B</div>
                  <div className="aspect-video border border-dashed border-foreground/60" />
                </div>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-foreground/60">Live ephemeral previews per PR. Compare changes visually before you click merge.</p>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="container py-8">
        <div className="grid gap-6 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="border border-foreground">
              <div className="border-b border-foreground bg-secondary px-3 py-2 text-[10px] uppercase tracking-wider">Problem</div>
              <div className="p-4 text-sm">
                <ul className="space-y-2">
                  <li>• Parallel agents open dozens of PRs at once</li>
                  <li>• Overlapping diffs and duplicated commits</li>
                  <li>• Reviewers context‑switch across branches</li>
                  <li>• Local spins for every PR waste hours</li>
                  <li>• Screenshots lie; environments drift</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="md:col-span-7">
            <div className="border border-foreground">
              <div className="border-b border-foreground bg-secondary px-3 py-2 text-[10px] uppercase tracking-wider">Why it’s hard</div>
              <div className="p-4 text-sm text-foreground/80">
                Multi‑agent systems multiply proposal volume and shrink reviewer attention. Traditional CI assumes a human developer per PR. With agents, you need deterministic previews, unified triage, and fast comparison to pick winners without yak‑shaving infra.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container py-12">
        <div className="mb-4 text-xs uppercase tracking-widest">How it works</div>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="border border-foreground p-4">
            <div className="mb-2 text-[10px] uppercase tracking-wider">1 • Connect</div>
            <p className="text-sm text-foreground/80">Point Freeswarm at your repo. We watch issues and agent PRs.</p>
          </div>
          <div className="border border-foreground p-4">
            <div className="mb-2 text-[10px] uppercase tracking-wider">2 • Build</div>
            <p className="text-sm text-foreground/80">Each PR gets an isolated, deterministic preview environment.</p>
          </div>
          <div className="border border-foreground p-4">
            <div className="mb-2 text-[10px] uppercase tracking-wider">3 • Compare</div>
            <p className="text-sm text-foreground/80">Review live UIs side‑by‑side. No local setup. No stale screenshots.</p>
          </div>
          <div className="border border-foreground p-4">
            <div className="mb-2 text-[10px] uppercase tracking-wider">4 • Decide</div>
            <p className="text-sm text-foreground/80">Approve the best proposal. We gate, clean up, and tear down.</p>
          </div>
        </div>
      </section>

      {/* Feature callouts */}
      <section className="container pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="border border-foreground">
            <div className="border-b border-foreground bg-secondary px-3 py-2 text-[10px] uppercase tracking-wider">Unified triage</div>
            <div className="p-4 text-sm text-foreground/80">Issues group competing PRs from all agents. One queue, zero chaos.</div>
          </div>
          <div className="border border-foreground">
            <div className="border-b border-foreground bg-secondary px-3 py-2 text-[10px] uppercase tracking-wider">Live previews</div>
            <div className="p-4 text-sm text-foreground/80">Ephemeral URLs per PR with predictable, reproducible builds.</div>
          </div>
          <div className="border border-foreground">
            <div className="border-b border-foreground bg-secondary px-3 py-2 text-[10px] uppercase tracking-wider">Fast decisions</div>
            <div className="p-4 text-sm text-foreground/80">Side‑by‑side diffing and one‑click approve/merge workflows.</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-foreground/40">
        <div className="container flex flex-col items-center gap-3 py-10 text-center">
          <div className="text-xs uppercase tracking-widest">Ready</div>
          <h2 className="text-2xl uppercase tracking-tight">Review agent PRs the way agents work: parallel</h2>
          <Link href="/app" className="mt-2 inline-flex items-center border border-foreground bg-foreground px-4 py-2 text-[10px] uppercase tracking-wider text-background hover:bg-foreground/90">
            Open the app
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-foreground/40">
        <div className="container flex h-12 items-center justify-between text-[10px] uppercase tracking-wider text-foreground/60">
          <span>© {new Date().getFullYear()} Freeswarm</span>
          <span>Monochrome • Pixel‑perfect • Deterministic</span>
        </div>
      </footer>
    </main>
  )
}