import Link from 'next/link'

export const metadata = {
  title: 'Freeswarm – Effortless PR Previews',
  description:
    'Live, shareable deployments for every pull request in your multi-agent repository.'
}

export default function Landing() {
  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      {/* HERO */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center gap-8 border-b border-pixel">
        <h1 className="font-bold uppercase tracking-tight leading-none text-[clamp(3rem,10vw,8rem)] text-mono">
          Freeswarm
        </h1>
        <p className="max-w-xl text-mono text-sm md:text-base">
          The review platform built for autonomous agents. Spin up live previews for every
          pull request—automatically.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link
            href="/"
            className="border-pixel border px-6 py-2 uppercase hover:bg-foreground hover:text-background transition-colors"
          >
            Open App
          </Link>
          <a
            href="#why"
            className="border-pixel border px-6 py-2 uppercase bg-foreground text-background hover:bg-transparent hover:text-foreground transition-colors"
          >
            Why Freeswarm?
          </a>
        </div>
      </section>

      {/* PROBLEM & SOLUTION */}
      <section
        id="why"
        className="grid grid-cols-1 md:grid-cols-2 border-b border-pixel"
      >
        <div className="p-8 border-b md:border-b-0 md:border-r border-pixel flex flex-col justify-center">
          <h2 className="text-2xl md:text-3xl font-bold uppercase mb-4 text-mono">
            Too many agents. Too little time.
          </h2>
          <p className="text-sm md:text-base text-mono">
            Modern AI development involves fleets of autonomous agents—each iterating,
            forking and opening pull requests at machine speed. Reviewers face an
            overwhelming backlog, unsure which change set is worth their attention.
          </p>
        </div>
        <div className="p-8 flex flex-col justify-center">
          <h2 className="text-2xl md:text-3xl font-bold uppercase mb-4 text-mono">
            Freeswarm hosts for you.
          </h2>
          <p className="text-sm md:text-base text-mono">
            For every PR, Freeswarm spins up an isolated, shareable deployment in seconds.
            No manual CI tweaks. No local checkouts. Just click the link and experience the
            change live. Review, comment and merge with confidence.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="grid grid-cols-1 md:grid-cols-3 border-b border-pixel">
        {[
          {
            title: 'Zero-config previews',
            body:
              'Connect your repo and we detect the framework, build and publish automatically.'
          },
          {
            title: 'Agent-aware dashboard',
            body:
              'Group PRs by agent identity, surface conflicts and highlight the best performing branches.'
          },
          {
            title: 'Pixel-perfect diff viewer',
            body:
              'Side-by-side deployments let you spot visual regressions instantly—no code digging.'
          }
        ].map((f) => (
          <div
            key={f.title}
            className="p-8 border-b md:border-b-0 md:border-r last:border-r-0 border-pixel flex flex-col gap-2"
          >
            <h3 className="font-bold uppercase text-lg text-mono">{f.title}</h3>
            <p className="text-sm text-mono">{f.body}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="p-12 flex flex-col items-center gap-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold uppercase text-mono">
          Ready to tame the swarm?
        </h2>
        <Link
          href="/"
          className="border-pixel border px-8 py-3 uppercase bg-foreground text-background hover:bg-transparent hover:text-foreground transition-colors"
        >
          Get Started
        </Link>
      </section>
    </main>
  )
}