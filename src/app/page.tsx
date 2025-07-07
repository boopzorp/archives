
"use client";

import Link from 'next/link';
import { ArrowRight, Link as LinkIcon, Star, Folder, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LandingPage() {
  const { user, loading: authLoading } = useAuth();

  const renderAuthButtons = () => {
    if (authLoading) {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }
    if (user) {
      return (
        <Button asChild>
          <Link href="/dashboard">
            Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      );
    }
    return (
      <>
        <Link href="/login" className="transition-colors hover:text-primary">
          Log In
        </Link>
        <Button asChild>
          <Link href="/signup">
            Sign Up <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </>
    );
  };
  
  const renderCtaButtons = () => {
    if (authLoading) {
      return <div className="h-11 w-full" />; // Placeholder to prevent layout shift
    }
    if (user) {
      return (
        <Button size="lg" asChild>
          <Link href="/dashboard">Go to Your Dashboard</Link>
        </Button>
      );
    }
    return (
      <>
        <Button size="lg" asChild>
          <Link href="/signup">Get Started for Free</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/login">I have an account</Link>
        </Button>
      </>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center gap-2 mr-6">
            <LinkIcon className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">archives</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm ml-auto">
            <ThemeToggle />
            {renderAuthButtons()}
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
              The cozy corner of the internet for all your links.
            </h1>
            <p
              className="max-w-lg text-lg text-muted-foreground animate-fade-in"
              style={{ animationDelay: '0.4s' }}
            >
              Tired of endless bookmarks and lost tabs? archives is your fun, ridiculously simple way to save, organize, and actually *find* the cool stuff you discover online.
            </p>
            <div
              className="flex flex-col sm:flex-row gap-4 animate-fade-in"
              style={{ animationDelay: '0.6s' }}
            >
              {renderCtaButtons()}
            </div>
          </div>
          <div className="relative animate-fade-in" style={{ animationDelay: '0.5s' }}>
             <Card className="p-6 bg-card/80 backdrop-blur-sm transform transition-transform duration-500 hover:scale-105 hover:-rotate-1">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <LinkIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold">Effortless Saving</h3>
                        <p className="text-sm text-muted-foreground">Just paste a link. We'll grab the title, description, and preview for you.</p>
                    </div>
                </div>
            </Card>
            <Card className="p-6 bg-card/80 backdrop-blur-sm mt-4 ml-8 transform transition-transform duration-500 hover:scale-105 hover:rotate-1">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Folder className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                        <h3 className="font-bold">Organize Your Way</h3>
                        <p className="text-sm text-muted-foreground">Use folders and tags to create a system that makes perfect sense to you.</p>
                    </div>
                </div>
            </Card>
             <Card className="p-6 bg-card/80 backdrop-blur-sm mt-4 -ml-4 transform transition-transform duration-500 hover:scale-105 hover:rotate-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-yellow-400/10 flex items-center justify-center">
                        <Star className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                        <h3 className="font-bold">Rediscover Your Gems</h3>
                        <p className="text-sm text-muted-foreground">Favorite your top finds and use our powerful search to unearth treasures.</p>
                    </div>
                </div>
            </Card>
          </div>
        </section>
      </main>
      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} archives. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
