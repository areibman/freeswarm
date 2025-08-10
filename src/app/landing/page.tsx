"use client"

import { useState, useEffect } from 'react'
import { ChevronDown, GitBranch, Users, Zap, Shield, Terminal, ArrowRight, Play, Pause, RotateCcw } from 'lucide-react'

export default function LandingPage() {
  const [activeDemo, setActiveDemo] = useState<'chaos' | 'solution' | null>(null)
  const [prCount, setPrCount] = useState(0)
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'ready'>('idle')
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    if (activeDemo === 'chaos') {
      const interval = setInterval(() => {
        setPrCount(prev => prev < 12 ? prev + 1 : 0)
      }, 500)
      return () => clearInterval(interval)
    } else if (activeDemo === 'solution') {
      setDeploymentStatus('deploying')
      const timeout = setTimeout(() => {
        setDeploymentStatus('ready')
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [activeDemo])

  const agents = [
    { name: 'Devin', color: '#FF6B6B', angle: 0 },
    { name: 'Cursor', color: '#4ECDC4', angle: 72 },
    { name: 'Claude', color: '#FFE66D', angle: 144 },
    { name: 'GPT-4', color: '#95E1D3', angle: 216 },
    { name: 'Copilot', color: '#A8E6CF', angle: 288 }
  ]

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] font-mono overflow-x-hidden">
      {/* Cursor follower */}
      <div 
        className="fixed w-4 h-4 bg-[#FF6B6B] rounded-full pointer-events-none z-50 mix-blend-multiply transition-transform duration-75"
        style={{
          transform: `translate(${mousePosition.x - 8}px, ${mousePosition.y - 8}px)`
        }}
      />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center px-8 md:px-16 lg:px-24">
        {/* Geometric background pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-64 h-64 border-4 border-[#1A1A1A] rotate-12 opacity-10" />
          <div className="absolute bottom-20 right-10 w-96 h-96 border-4 border-[#1A1A1A] -rotate-6 opacity-10" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-4 border-[#1A1A1A] rotate-45 opacity-5" />
        </div>

        <div className="relative z-10 max-w-6xl">
          <div className="mb-8">
            <span className="inline-block px-4 py-2 bg-[#1A1A1A] text-[#F5F5F0] text-xs font-bold tracking-wider">
              FREESWARM
            </span>
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black leading-[0.85] mb-8">
            WHEN<br />
            AGENTS<br />
            <span className="text-[#FF6B6B]">COLLIDE</span>
          </h1>
          
          <p className="text-xl md:text-2xl max-w-2xl mb-12 leading-tight">
            Multiple AI agents. One codebase. Total chaos? 
            <span className="block mt-2 font-bold">Not anymore.</span>
          </p>

          <div className="flex flex-wrap gap-4">
            <button className="group px-8 py-4 bg-[#1A1A1A] text-[#F5F5F0] font-bold hover:bg-[#FF6B6B] transition-all duration-300 flex items-center gap-2">
              GET STARTED
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 border-2 border-[#1A1A1A] font-bold hover:bg-[#1A1A1A] hover:text-[#F5F5F0] transition-all duration-300">
              WATCH DEMO
            </button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8" />
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-8 md:px-16 lg:px-24 bg-[#1A1A1A] text-[#F5F5F0]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-6xl font-black mb-8 leading-[0.9]">
                THE<br />
                AGENT<br />
                <span className="text-[#FF6B6B]">PROBLEM</span>
              </h2>
              
              <div className="space-y-6 text-lg">
                <p className="flex items-start gap-3">
                  <span className="text-[#FF6B6B] text-2xl font-black">01</span>
                  <span>Five different AI agents submit PRs to your repo simultaneously</span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-[#FF6B6B] text-2xl font-black">02</span>
                  <span>Each uses different approaches, patterns, and dependencies</span>
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-[#FF6B6B] text-2xl font-black">03</span>
                  <span>Manual review becomes impossible. Conflicts everywhere.</span>
                </p>
              </div>
            </div>

            {/* Interactive Demo - Agent Chaos */}
            <div className="relative h-[400px] bg-[#F5F5F0] rounded-none border-4 border-[#F5F5F0] p-8">
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setActiveDemo(activeDemo === 'chaos' ? null : 'chaos')}
                  className="p-2 bg-[#1A1A1A] text-[#F5F5F0] hover:bg-[#FF6B6B] transition-colors"
                >
                  {activeDemo === 'chaos' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative w-full h-full flex items-center justify-center">
                {/* Central repository */}
                <div className="absolute w-24 h-24 bg-[#1A1A1A] flex items-center justify-center">
                  <GitBranch className="w-12 h-12 text-[#F5F5F0]" />
                </div>

                {/* Orbiting agents */}
                {agents.map((agent, i) => (
                  <div
                    key={agent.name}
                    className={`absolute w-16 h-16 flex items-center justify-center transition-all duration-1000 ${
                      activeDemo === 'chaos' ? 'animate-pulse' : ''
                    }`}
                    style={{
                      backgroundColor: agent.color,
                      transform: `rotate(${activeDemo === 'chaos' ? (agent.angle + prCount * 30) : agent.angle}deg) translateX(120px) rotate(-${activeDemo === 'chaos' ? (agent.angle + prCount * 30) : agent.angle}deg)`
                    }}
                  >
                    <span className="text-xs font-bold text-[#1A1A1A]">{agent.name}</span>
                  </div>
                ))}

                {/* PR counter */}
                {activeDemo === 'chaos' && (
                  <div className="absolute top-0 left-0 bg-[#FF6B6B] text-[#F5F5F0] px-3 py-1">
                    <span className="font-bold">{prCount} PRs</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 px-8 md:px-16 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-4">
              THE <span className="text-[#4ECDC4]">SOLUTION</span>
            </h2>
            <p className="text-xl max-w-2xl mx-auto">
              Auto-deployed preview environments for every PR. See it. Test it. Ship it.
            </p>
          </div>

          {/* Interactive Solution Demo */}
          <div className="bg-[#1A1A1A] text-[#F5F5F0] p-8 md:p-12">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-[#4ECDC4] flex items-center justify-center">
                  <GitBranch className="w-10 h-10 text-[#1A1A1A]" />
                </div>
                <h3 className="font-bold mb-2">PR DETECTED</h3>
                <p className="text-sm opacity-80">Agent submits code</p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-[#FFE66D] flex items-center justify-center animate-spin-slow">
                  <Zap className="w-10 h-10 text-[#1A1A1A]" />
                </div>
                <h3 className="font-bold mb-2">AUTO DEPLOY</h3>
                <p className="text-sm opacity-80">Instant preview env</p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-[#95E1D3] flex items-center justify-center">
                  <Shield className="w-10 h-10 text-[#1A1A1A]" />
                </div>
                <h3 className="font-bold mb-2">SAFE REVIEW</h3>
                <p className="text-sm opacity-80">Test in isolation</p>
              </div>
            </div>

            <div className="mt-12 p-6 bg-[#F5F5F0] text-[#1A1A1A]">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold">DEPLOYMENT STATUS</span>
                <button
                  onClick={() => {
                    setActiveDemo('solution')
                    setDeploymentStatus('idle')
                  }}
                  className="p-2 bg-[#1A1A1A] text-[#F5F5F0] hover:bg-[#4ECDC4] hover:text-[#1A1A1A] transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                <div className={`p-3 border-2 border-[#1A1A1A] ${deploymentStatus === 'idle' ? 'opacity-100' : 'opacity-50'}`}>
                  <span className="font-mono">→ PR #1337 from devin/feature-auth</span>
                </div>
                <div className={`p-3 border-2 border-[#1A1A1A] ${deploymentStatus === 'deploying' ? 'opacity-100 animate-pulse' : 'opacity-50'}`}>
                  <span className="font-mono">→ Building preview environment...</span>
                </div>
                <div className={`p-3 border-2 border-[#1A1A1A] ${deploymentStatus === 'ready' ? 'bg-[#4ECDC4]' : 'opacity-50'}`}>
                  <span className="font-mono">✓ Preview ready at pr-1337.freeswarm.dev</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-8 md:px-16 lg:px-24 bg-[#F5F5F0]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black mb-16 text-center">
            BUILT FOR <span className="text-[#FF6B6B]">CHAOS</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="w-8 h-8" />,
                title: "MULTI-AGENT",
                desc: "Handle PRs from Devin, Cursor, Claude, and more",
                color: "#FF6B6B"
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "INSTANT DEPLOY",
                desc: "Preview environments in seconds, not minutes",
                color: "#4ECDC4"
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "ISOLATED",
                desc: "Each PR runs in its own sandboxed environment",
                color: "#FFE66D"
              },
              {
                icon: <GitBranch className="w-8 h-8" />,
                title: "GIT NATIVE",
                desc: "Works with your existing GitHub workflow",
                color: "#95E1D3"
              },
              {
                icon: <Terminal className="w-8 h-8" />,
                title: "FULL ACCESS",
                desc: "SSH into any deployment for debugging",
                color: "#A8E6CF"
              },
              {
                icon: <RotateCcw className="w-8 h-8" />,
                title: "AUTO CLEANUP",
                desc: "Environments destroyed when PRs close",
                color: "#FFAAA5"
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative bg-white border-4 border-[#1A1A1A] p-8 hover:translate-y-[-4px] transition-transform cursor-pointer"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  e.currentTarget.style.boxShadow = `8px 8px 0 ${feature.color}`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div 
                  className="w-16 h-16 mb-4 flex items-center justify-center"
                  style={{ backgroundColor: feature.color }}
                >
                  {feature.icon}
                </div>
                <h3 className="font-black text-xl mb-2">{feature.title}</h3>
                <p className="text-sm opacity-80">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-8 md:px-16 lg:px-24 bg-[#1A1A1A] text-[#F5F5F0]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black mb-16 text-center">
            HOW IT <span className="text-[#4ECDC4]">WORKS</span>
          </h2>

          <div className="space-y-8">
            {[
              { step: "01", title: "CONNECT", desc: "Link your GitHub repository to FreeSwarm" },
              { step: "02", title: "CONFIGURE", desc: "Set deployment rules and resource limits" },
              { step: "03", title: "AUTOMATE", desc: "Every PR gets its own preview environment" },
              { step: "04", title: "REVIEW", desc: "Test changes in isolation before merging" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-8 group">
                <span className="text-6xl font-black text-[#4ECDC4] group-hover:text-[#FF6B6B] transition-colors">
                  {item.step}
                </span>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-1">{item.title}</h3>
                  <p className="opacity-80">{item.desc}</p>
                </div>
                <div className="w-24 h-1 bg-[#4ECDC4] group-hover:w-32 transition-all duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-8 md:px-16 lg:px-24 bg-[#FF6B6B] text-[#F5F5F0]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-8">
            STOP THE CHAOS
          </h2>
          <p className="text-xl mb-12 max-w-2xl mx-auto">
            Join developers who've tamed their multi-agent workflows with FreeSwarm.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-12 py-4 bg-[#1A1A1A] text-[#F5F5F0] font-bold hover:bg-[#F5F5F0] hover:text-[#1A1A1A] transition-all duration-300">
              START FREE TRIAL
            </button>
            <button className="px-12 py-4 border-2 border-[#F5F5F0] font-bold hover:bg-[#F5F5F0] hover:text-[#FF6B6B] transition-all duration-300">
              VIEW DOCS
            </button>
          </div>

          <p className="mt-8 text-sm opacity-80">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 md:px-16 lg:px-24 bg-[#1A1A1A] text-[#F5F5F0]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <span className="font-black text-2xl">FREESWARM</span>
            <p className="text-sm opacity-60 mt-2">© 2024 • Built with chaos in mind</p>
          </div>
          
          <div className="flex gap-8 text-sm">
            <a href="#" className="hover:text-[#FF6B6B] transition-colors">GitHub</a>
            <a href="#" className="hover:text-[#FF6B6B] transition-colors">Docs</a>
            <a href="#" className="hover:text-[#FF6B6B] transition-colors">Discord</a>
            <a href="#" className="hover:text-[#FF6B6B] transition-colors">Status</a>
          </div>
        </div>
      </footer>
    </div>
  )
}