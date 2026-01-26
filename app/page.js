'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, ArrowRight, Layers, AlertTriangle, Lightbulb } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <span className="font-semibold text-lg">Context</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/app">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-24 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Save the context behind your choices
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
            See where life went stale. Get perspective before regret.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/app">
              <Button size="lg" className="gap-2">
                Get started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="lg" variant="outline">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Receipts */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-8 pb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Receipts</h3>
              <p className="text-muted-foreground leading-relaxed">
                Log the WHY behind decisions. Intent, assumptions, constraints, emotions. 
                Not just what you decided—why you decided it.
              </p>
            </CardContent>
          </Card>

          {/* DeadZone */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-8 pb-6">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">DeadZone</h3>
              <p className="text-muted-foreground leading-relaxed">
                Detect stale zones where weeks look the same. 
                No meaningful decisions or moments logged. Life on autopilot.
              </p>
            </CardContent>
          </Card>

          {/* One Last Time */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-8 pb-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
                <Lightbulb className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3">One Last Time</h3>
              <p className="text-muted-foreground leading-relaxed">
                Gentle perspective prompts based on time and patterns. 
                "This might be one of the last times you do this."
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-6 py-16 md:py-24 border-t border-border/40">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">How it works</h2>
          <p className="text-muted-foreground">
            A serious tool for capturing context, not a self-help app.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                  1
                </div>
                <div>
                  <h4 className="font-medium mb-2">Log decisions as Receipts</h4>
                  <p className="text-sm text-muted-foreground">
                    Capture the full context: what assumptions you made, what constraints you faced, 
                    how confident you felt, what would change your mind.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                  2
                </div>
                <div>
                  <h4 className="font-medium mb-2">Capture Moments</h4>
                  <p className="text-sm text-muted-foreground">
                    Lightweight entries for things you want to remember. 
                    Moments that might be "one of the last times."
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                  3
                </div>
                <div>
                  <h4 className="font-medium mb-2">Detect DeadZones</h4>
                  <p className="text-sm text-muted-foreground">
                    See when life goes stale. Silence gaps, repetitive patterns, 
                    single-category lock. Wake up before it's too late.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                  4
                </div>
                <div>
                  <h4 className="font-medium mb-2">Get Perspective</h4>
                  <p className="text-sm text-muted-foreground">
                    Prompts that surface at the right time. Revisit old decisions. 
                    Check if your assumptions still hold.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-16 md:py-24 border-t border-border/40">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Start capturing context</h2>
          <p className="text-muted-foreground mb-8">
            No streaks. No gamification. No preachy copy. Just a calm space for reflection.
          </p>
          <Link href="/app">
            <Button size="lg" className="gap-2">
              Open Context <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>Context — A serious tool for life reflection</p>
        </div>
      </footer>
    </div>
  )
}
