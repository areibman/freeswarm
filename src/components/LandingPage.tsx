"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  GitBranch, 
  Users, 
  Zap, 
  Eye, 
  ArrowRight, 
  Terminal,
  CheckCircle,
  Clock,
  AlertTriangle,
  Code
} from 'lucide-react'
import { PRManager } from '@/components/PRManager'

export function LandingPage() {
  const [showApp, setShowApp] = useState(false)

  if (showApp) {
    return <PRManager />
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <header className="border-b border-gray-800 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold tracking-wider">FREESWARM</span>
          </div>
          <Button 
            onClick={() => setShowApp(true)}
            variant="outline" 
            className="border-white text-white hover:bg-white hover:text-black"
          >
            <Terminal className="w-4 h-4 mr-2" />
            LAUNCH APP
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h1 className="text-6xl font-bold leading-tight mb-8 tracking-tight">
                MULTI-AGENT
                <br />
                PR MANAGEMENT
                <br />
                <span className="text-gray-400">SIMPLIFIED</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                When multiple AI agents contribute to your codebase, pull request reviews become chaotic. 
                FreeSwarm auto-hosts deployments for every PR, giving you instant visual feedback.
              </p>
              <div className="flex space-x-4">
                <Button 
                  onClick={() => setShowApp(true)}
                  size="lg"
                  className="bg-white text-black hover:bg-gray-200 px-8 py-3"
                >
                  START MANAGING
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-black px-8 py-3"
                >
                  VIEW DEMO
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gray-900 border border-gray-800 p-8 rounded-lg">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">agent-feature-branch</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">agent-bugfix-123</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">agent-optimization</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">agent-refactor</span>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <div className="text-xs text-gray-400 mb-2">DEPLOYMENT STATUS</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>4 Active</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span>2 Pending</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 tracking-tight">THE PROBLEM</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Multiple AI agents creating pull requests simultaneously creates a review bottleneck. 
              Traditional PR management becomes overwhelming and inefficient.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-black border border-gray-800 p-8">
              <Users className="w-12 h-12 text-red-500 mb-6" />
              <h3 className="text-xl font-bold mb-4">MULTIPLE AGENTS</h3>
              <p className="text-gray-300">
                AI agents work simultaneously on different features, bugs, and optimizations, 
                creating a flood of pull requests.
              </p>
            </div>
            
            <div className="bg-black border border-gray-800 p-8">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mb-6" />
              <h3 className="text-xl font-bold mb-4">REVIEW CHAOS</h3>
              <p className="text-gray-300">
                Manual review of each PR becomes time-consuming and error-prone. 
                Context switching between different changes is overwhelming.
              </p>
            </div>
            
            <div className="bg-black border border-gray-800 p-8">
              <Clock className="w-12 h-12 text-blue-500 mb-6" />
              <h3 className="text-xl font-bold mb-4">SLOW FEEDBACK</h3>
              <p className="text-gray-300">
                Waiting for manual deployment and testing of each PR slows down 
                the development cycle and reduces productivity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 tracking-tight">THE SOLUTION</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              FreeSwarm automatically hosts deployments for every pull request, 
              giving you instant visual feedback and streamlined review process.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-500 flex items-center justify-center rounded-full flex-shrink-0">
                  <Zap className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">AUTO-DEPLOYMENTS</h3>
                  <p className="text-gray-300">
                    Every pull request automatically gets a live deployment URL. 
                    No manual setup required.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-500 flex items-center justify-center rounded-full flex-shrink-0">
                  <Eye className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">VISUAL REVIEWS</h3>
                  <p className="text-gray-300">
                    See changes in action before merging. Test functionality 
                    directly in the browser.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-500 flex items-center justify-center rounded-full flex-shrink-0">
                  <Code className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">REAL-TIME UPDATES</h3>
                  <p className="text-gray-300">
                    WebSocket-powered live updates keep you informed of 
                    deployment status and PR changes.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900 border border-gray-800 p-8 rounded-lg">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">PR #123</span>
                  <span className="text-sm bg-green-500 text-black px-2 py-1 rounded">DEPLOYED</span>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-gray-800 rounded"></div>
                  <div className="h-2 bg-gray-800 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-800 rounded w-1/2"></div>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-green-500">✓ Build Success</span>
                  <span className="text-blue-500">🔗 preview.freeswarm.lol/pr-123</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 tracking-tight">FEATURES</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-black border border-gray-800 p-6">
              <div className="text-2xl font-bold mb-2">∞</div>
              <h3 className="font-bold mb-2">UNLIMITED PRS</h3>
              <p className="text-sm text-gray-300">Handle any number of concurrent pull requests</p>
            </div>
            
            <div className="bg-black border border-gray-800 p-6">
              <div className="text-2xl font-bold mb-2">⚡</div>
              <h3 className="font-bold mb-2">REAL-TIME</h3>
              <p className="text-sm text-gray-300">Live updates via WebSocket connections</p>
            </div>
            
            <div className="bg-black border border-gray-800 p-6">
              <div className="text-2xl font-bold mb-2">🔒</div>
              <h3 className="font-bold mb-2">SECURE</h3>
              <p className="text-sm text-gray-300">GitHub App integration with proper auth</p>
            </div>
            
            <div className="bg-black border border-gray-800 p-6">
              <div className="text-2xl font-bold mb-2">📊</div>
              <h3 className="font-bold mb-2">ANALYTICS</h3>
              <p className="text-sm text-gray-300">Track deployment and review metrics</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 tracking-tight">READY TO STREAMLINE YOUR PR WORKFLOW?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join developers who've eliminated PR review chaos with FreeSwarm.
          </p>
          <Button 
            onClick={() => setShowApp(true)}
            size="lg"
            className="bg-white text-black hover:bg-gray-200 px-12 py-4 text-lg"
          >
            LAUNCH FREESWARM
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-white flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold tracking-wider">FREESWARM</span>
          </div>
          <div className="text-sm text-gray-400">
            © 2024 FreeSwarm. Built for developers, by developers.
          </div>
        </div>
      </footer>
    </div>
  )
}