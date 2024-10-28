import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen">
        <div className="text-center space-y-8 max-w-3xl">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Bot className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Your Personal AI Assistant
          </h1>
          <p className="text-xl text-muted-foreground">
            Experience the power of AI with our intelligent chatbot. Get instant
            responses, insights, and assistance whenever you need it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg">
              <Link href="/login">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg">
              <Link href="/signup">Create Account</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
