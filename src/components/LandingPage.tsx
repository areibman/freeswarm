"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  GitPullRequest, 
  Eye, 
  Zap, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Monitor,
  Sparkles,
  Bot,
  Link2
} from 'lucide-react'
import Link from 'next/link'

export function LandingPage() {
  const [activeAgent, setActiveAgent] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Initialize dark mode from localStorage and system preference
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored) {
      setIsDarkMode(stored === 'dark')
      if (stored === 'dark') {
        document.documentElement.classList.add('dark')
      }
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(prefersDark)
      if (prefersDark) {
        document.documentElement.classList.add('dark')
      }
    }
  }, [])

  const agents = [
    { name: 'DEVIN', color: 'bg-orange-500', status: 'REVIEWING' },
    { name: 'CURSOR', color: 'bg-blue-500', status: 'DEPLOYED' },
    { name: 'CODEX', color: 'bg-green-500', status: 'TESTING' },
    { name: 'CLAUDE', color: 'bg-purple-500', status: 'PENDING' }
  ]

  // Rotate active agent every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAgent((prev) => (prev + 1) % agents.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [agents.length])

  const problemPoints = [
    { icon: Clock, text: "Setting up local environments for each PR takes 15+ minutes" },
    { icon: Users, text: "Multiple agents create conflicting review environments" },
    { icon: XCircle, text: "Inconsistent testing conditions lead to missed bugs" },
    { icon: Monitor, text: "Non-technical stakeholders can't review visual changes" }
  ]

  const solutionPoints = [
    { icon: Zap, text: "Instant deployment on every PR commit" },
    { icon: Link2, text: "Unique preview URL for each pull request" },
    { icon: CheckCircle2, text: "Consistent environments across all reviews" },
    { icon: Eye, text: "Live previews accessible to entire team" }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <div className="text-center space-y-8">
            {/* Logo/Brand */}
            <div className="inline-flex items-center gap-3 px-4 py-2 border border-border rounded-none bg-card">
              <div className="w-3 h-3 bg-primary rounded-none"></div>
              <span className="text-sm font-bold uppercase tracking-[0.2em]">FREESWARM</span>
              <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">PR MANAGER</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tight leading-none">
                STOP FIGHTING
                <br />
                <span className="text-muted-foreground">AGENT CHAOS</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Multiple AI agents creating pull requests? FreeSwarm auto-deploys every PR 
                so your team can review changes instantly—no local setup required.
              </p>
            </div>

                         {/* Agent Status Display */}
             <div className="flex justify-center">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border border-border bg-card rounded-none relative">
                 {/* Animated connection lines */}
                 <div className="absolute inset-0 pointer-events-none">
                   <svg className="w-full h-full" viewBox="0 0 400 200">
                     <defs>
                       <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                         <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                         <stop offset="50%" stopColor="currentColor" stopOpacity="0.3" />
                         <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                       </linearGradient>
                     </defs>
                     {/* Horizontal connection line */}
                     <line 
                       x1="50" y1="100" x2="350" y2="100" 
                       stroke="url(#connectionGradient)" 
                       strokeWidth="1"
                       className="animate-pulse"
                     />
                   </svg>
                 </div>
                 
                 {agents.map((agent, index) => (
                   <div 
                     key={agent.name}
                     className={`flex flex-col items-center gap-2 p-4 border transition-all duration-500 relative ${
                       index === activeAgent 
                         ? 'border-primary bg-accent scale-105' 
                         : 'border-muted bg-background'
                     }`}
                   >
                     {/* Pulse effect for active agent */}
                     {index === activeAgent && (
                       <div className="absolute inset-0 border border-primary animate-ping"></div>
                     )}
                     
                     <div className={`w-8 h-8 ${agent.color} rounded-none flex items-center justify-center relative`}>
                       <Bot className="w-4 h-4 text-white" />
                       {index === activeAgent && (
                         <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-bounce"></div>
                       )}
                     </div>
                     <span className="text-xs font-bold uppercase tracking-wider">{agent.name}</span>
                     <span className={`text-xs px-2 py-1 rounded-none font-mono ${
                       agent.status === 'DEPLOYED' ? 'bg-green-500 text-white' :
                       agent.status === 'REVIEWING' ? 'bg-orange-500 text-white' :
                       agent.status === 'TESTING' ? 'bg-blue-500 text-white' :
                       'bg-muted text-muted-foreground'
                     }`}>
                       {agent.status}
                     </span>
                   </div>
                 ))}
               </div>
             </div>

                       {/* CTA Buttons */}
           <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
             <Link href="/app">
               <Button size="lg" className="uppercase tracking-wider font-bold px-8 py-6 rounded-none group">
                 <GitPullRequest className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                 Launch Manager
                 <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
               </Button>
             </Link>
             <Button variant="outline" size="lg" className="uppercase tracking-wider font-bold px-8 py-6 rounded-none group">
               <Eye className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
               View Demo
             </Button>
           </div>
          </div>
        </div>
      </div>

      {/* Problem Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-destructive text-destructive rounded-none text-xs font-bold uppercase tracking-wider">
                <XCircle className="w-3 h-3" />
                PROBLEM
              </div>
              <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight">
                AGENT REVIEW
                <br />
                <span className="text-muted-foreground">NIGHTMARE</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Your AI agents are productive, but reviewing their work is chaos. 
                Each PR requires manual environment setup, creating bottlenecks 
                and inconsistent testing conditions.
              </p>
            </div>

            <div className="space-y-4">
              {problemPoints.map((point, index) => (
                <div key={index} className="flex items-start gap-4 p-4 border border-border bg-card rounded-none">
                  <div className="w-8 h-8 border border-destructive text-destructive rounded-none flex items-center justify-center flex-shrink-0">
                    <point.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm leading-relaxed">{point.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Problem Visualization */}
          <div className="relative">
            <div className="border border-border bg-card p-6 rounded-none">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider">TRADITIONAL WORKFLOW</span>
                  <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
                </div>
                
                <div className="space-y-3">
                  {['PR Created', 'Clone Repository', 'Install Dependencies', 'Build Project', 'Test Changes', 'Leave Review'].map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 border border-muted text-muted-foreground rounded-none flex items-center justify-center text-xs">
                        {index + 1}
                      </div>
                      <span className="text-sm text-muted-foreground">{step}</span>
                      <div className="flex-1 border-b border-dashed border-muted"></div>
                      <span className="text-xs text-destructive">15m+</span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-border">
                  <div className="text-center">
                    <span className="text-xs text-destructive font-bold uppercase tracking-wider">
                      TOTAL: 90+ MINUTES PER REVIEW
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Solution Section */}
      <div className="border-t border-border bg-accent/30">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Solution Visualization */}
            <div className="relative order-2 lg:order-1">
              <div className="border border-border bg-card p-6 rounded-none">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">FREESWARM WORKFLOW</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-3">
                    {['PR Created', 'Auto-Deploy Triggered', 'Live Preview Ready'].map((step, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-6 h-6 border border-green-500 text-green-500 rounded-none flex items-center justify-center text-xs">
                          ✓
                        </div>
                        <span className="text-sm">{step}</span>
                        <div className="flex-1 border-b border-dashed border-green-500"></div>
                        <span className="text-xs text-green-500">30s</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t border-border bg-green-500/10 p-3 rounded-none">
                    <div className="text-center">
                      <span className="text-xs text-green-500 font-bold uppercase tracking-wider">
                        INSTANT REVIEW ACCESS
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8 order-1 lg:order-2">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-green-500 text-green-500 rounded-none text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3" />
                  SOLUTION
                </div>
                <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight">
                  AUTO-DEPLOY
                  <br />
                  <span className="text-primary">EVERYTHING</span>
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  FreeSwarm automatically creates live preview environments for every 
                  pull request. Your team gets instant access to test changes without 
                  any setup—just click and review.
                </p>
              </div>

              <div className="space-y-4">
                {solutionPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 border border-border bg-card rounded-none">
                    <div className="w-8 h-8 border border-green-500 text-green-500 rounded-none flex items-center justify-center flex-shrink-0">
                      <point.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm leading-relaxed">{point.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center space-y-12">
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">
                BUILT FOR
                <br />
                <span className="text-primary">MULTI-AGENT TEAMS</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Designed specifically for development teams using multiple AI coding agents. 
                Manage the chaos, streamline reviews, ship faster.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="border border-border bg-card p-8 rounded-none space-y-6">
                <div className="w-12 h-12 border border-primary text-primary rounded-none flex items-center justify-center mx-auto">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold uppercase tracking-wider">AGENT DETECTION</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Automatically identifies which AI agent created each PR. 
                    Supports Devin, Cursor, Codex, and custom patterns.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="border border-border bg-card p-8 rounded-none space-y-6">
                <div className="w-12 h-12 border border-primary text-primary rounded-none flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold uppercase tracking-wider">INSTANT PREVIEWS</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Every PR gets a live deployment within 30 seconds. 
                    No configuration, no waiting, no manual setup.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="border border-border bg-card p-8 rounded-none space-y-6">
                <div className="w-12 h-12 border border-primary text-primary rounded-none flex items-center justify-center mx-auto">
                  <GitPullRequest className="w-6 h-6" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold uppercase tracking-wider">SMART MANAGEMENT</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Group PRs by issue, track status changes, and manage 
                    multiple agents from a single dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Demo Section */}
      <div className="border-t border-border bg-accent/20">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center space-y-12">
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">
                SEE IT IN
                <br />
                <span className="text-primary">ACTION</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Watch how FreeSwarm transforms chaotic multi-agent PR reviews 
                into a streamlined, efficient process.
              </p>
            </div>

            {/* Mock Interface Preview */}
            <div className="border border-border bg-card p-6 rounded-none max-w-4xl mx-auto">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-primary rounded-none"></div>
                    <span className="text-sm font-bold uppercase tracking-wider">FREESWARM</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>LIVE</span>
                  </div>
                </div>

                {/* Mock PR Cards */}
                <div className="space-y-3">
                  {[
                    { agent: 'DEVIN', title: 'Add user authentication', url: 'pr-auth-2847.freeswarm.app', status: 'DEPLOYED' },
                    { agent: 'CURSOR', title: 'Fix responsive layout', url: 'pr-layout-2848.freeswarm.app', status: 'TESTING' },
                    { agent: 'CODEX', title: 'Optimize database queries', url: 'pr-db-2849.freeswarm.app', status: 'PENDING' }
                  ].map((pr, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-border bg-background rounded-none">
                      <div className="flex items-center gap-4">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-none flex items-center justify-center text-xs font-bold">
                          {pr.agent[0]}
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{pr.title}</div>
                          <div className="text-xs text-muted-foreground font-mono">{pr.url}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-none font-bold uppercase tracking-wider ${
                          pr.status === 'DEPLOYED' ? 'bg-green-500 text-white' :
                          pr.status === 'TESTING' ? 'bg-blue-500 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {pr.status}
                        </span>
                        <Button size="sm" variant="outline" className="rounded-none">
                          <Eye className="w-3 h-3 mr-1" />
                          VIEW
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center space-y-12">
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">
                HOW IT
                <br />
                <span className="text-primary">WORKS</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  title: 'AGENT CREATES PR',
                  description: 'Your AI agent pushes code and opens a pull request',
                  icon: GitPullRequest
                },
                {
                  step: '02', 
                  title: 'AUTO-DEPLOY TRIGGERS',
                  description: 'FreeSwarm detects the PR and instantly deploys to a unique URL',
                  icon: Zap
                },
                {
                  step: '03',
                  title: 'TEAM REVIEWS LIVE',
                  description: 'Everyone accesses the same live environment to test and review',
                  icon: Users
                }
              ].map((item, index) => (
                <div key={index} className="space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-2 border-primary text-primary rounded-none flex items-center justify-center mx-auto">
                      <item.icon className="w-8 h-8" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-none flex items-center justify-center text-xs font-bold">
                      {item.step}
                    </div>
                  </div>
                  <div className="space-y-2 text-center">
                    <h3 className="font-bold uppercase tracking-wider">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-8 left-full w-8 h-px bg-border transform translate-x-4"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t border-border bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight">
              READY TO TAME
              <br />
              THE CHAOS?
            </h2>
            <p className="text-lg opacity-90 leading-relaxed">
              Join teams already using FreeSwarm to streamline their AI agent workflows. 
              Setup takes less than 5 minutes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/app">
              <Button 
                size="lg" 
                variant="secondary"
                className="uppercase tracking-wider font-bold px-8 py-6 rounded-none"
              >
                <GitPullRequest className="w-5 h-5 mr-2" />
                Start Managing PRs
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="uppercase tracking-wider font-bold px-8 py-6 rounded-none border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              View Documentation
            </Button>
          </div>

          <div className="pt-8 border-t border-primary-foreground/20">
            <p className="text-sm opacity-70 uppercase tracking-wider">
              Open Source • MIT License • Built for Developers
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-primary rounded-none"></div>
              <span className="text-sm font-bold uppercase tracking-[0.2em]">FREESWARM</span>
            </div>
            
            <div className="flex items-center gap-6 text-xs text-muted-foreground uppercase tracking-wider">
              <Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link>
              <Link href="/github" className="hover:text-foreground transition-colors">GitHub</Link>
              <Link href="/support" className="hover:text-foreground transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </div>

             {/* Background Grid Pattern */}
       <style jsx>{`
         .bg-grid-pattern {
           background-image: 
             linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
             linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);
           background-size: 20px 20px;
         }
         
         /* Teenage Engineering inspired animations */
         @keyframes te-glow {
           0%, 100% { box-shadow: 0 0 5px rgba(0,0,0,0.1); }
           50% { box-shadow: 0 0 20px rgba(0,0,0,0.2), 0 0 30px rgba(0,0,0,0.1); }
         }
         
         .te-glow:hover {
           animation: te-glow 2s ease-in-out infinite;
         }
         
         /* Subtle scan line effect */
         @keyframes scan-line {
           0% { transform: translateX(-100%); }
           100% { transform: translateX(100vw); }
         }
         
         .scan-line {
           position: fixed;
           top: 0;
           left: 0;
           width: 2px;
           height: 100vh;
           background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent);
           animation: scan-line 8s linear infinite;
           pointer-events: none;
           z-index: 1;
         }
       `}</style>
       
       {/* Subtle scan line effect */}
       <div className="scan-line"></div>
    </div>
  )
}