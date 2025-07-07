"use client";

import Link from 'next/link';
import { ArrowRight, Link as LinkIcon, Star, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center gap-2 mr-6">
            <LinkIcon className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Linkflow</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm ml-auto">
            <Link href="/login" className="transition-colors hover:text-primary">
              Log In
            </Link>
            <Button asChild>
              <Link href="/signup">
                Sign Up <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="container grid lg:grid-cols-2 gap-10 items-center py-20 md:py-32">
          <div className="space-y-6">
            <h1
              className="text-4xl md:text-6xl font-bold tracking-tighter animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              Your personal link <br />
              <span className="text-primary">command center.</span>
            </h1>
            <p
              className="max-w-lg text-lg text-muted-foreground animate-fade-in"
              style={{ animationDelay: '0.4s' }}
            >
              Stop losing track of valuable links. Linkflow helps you save, organize, and rediscover your digital world with smart tagging and beautiful organization.
            </p>
            <div
              className="flex flex-col sm:flex-row gap-4 animate-fade-in"
              style={{ animationDelay: '0.6s' }}
            >
              <Button size="lg" asChild>
                <Link href="/signup">Get Started for Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">I have an account</Link>
              </Button>
            </div>
          </div>
          <div className="relative animate-fade-in" style={{ animationDelay: '0.5s' }}>
             <Card className="p-6 bg-card/80 backdrop-blur-sm transform transition-transform duration-500 hover:scale-105 hover:-rotate-1">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <LinkIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold">AI-Powered Tagging</h3>
                        <p className="text-sm text-muted-foreground">Automatically get title, description, and tags.</p>
                    </div>
                </div>
            </Card>
            <Card className="p-6 bg-card/80 backdrop-blur-sm mt-4 ml-8 transform transition-transform duration-500 hover:scale-105 hover:rotate-1">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Folder className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                        <h3 className="font-bold">Organize with Folders</h3>
                        <p className="text-sm text-muted-foreground">Group your links into custom categories.</p>
                    </div>
                </div>
            </Card>
             <Card className="p-6 bg-card/80 backdrop-blur-sm mt-4 -ml-4 transform transition-transform duration-500 hover:scale-105 hover:rotate-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-yellow-400/10 flex items-center justify-center">
                        <Star className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                        <h3 className="font-bold">Never Lose a Gem</h3>
                        <p className="text-sm text-muted-foreground">Favorite your most important links.</p>
                    </div>
                </div>
            </Card>
          </div>
        </section>
      </main>
      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Linkflow. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
