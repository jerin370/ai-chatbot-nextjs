'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Send, User, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'error';
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    const userInput = input;
    setInput('');

    // Add user message immediately
    const userMessage = {
      id: Date.now().toString(),
      content: userInput,
      role: 'user' as const,
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          threadId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setThreadId(data.threadId);
      setMessages(data.messages);
    } catch (error) {
      // Add error message to chat
      const errorMessage = {
        id: `error-${Date.now()}`,
        content: error instanceof Error 
          ? error.message 
          : 'Failed to connect to AI assistant. Please try again.',
        role: 'error' as const,
      };
      setMessages((prev) => [...prev, errorMessage]);

      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send message. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">AI Assistant</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 overflow-hidden">
        <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="p-2 rounded-full bg-primary/10">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                {message.role === 'error' && (
                  <div className="p-2 rounded-full bg-destructive/10">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  </div>
                )}
                <div
                  className={`rounded-lg p-4 max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.role === 'error'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-muted'
                  }`}
                >
                  {message.content}
                </div>
                {message.role === 'user' && (
                  <div className="p-2 rounded-full bg-primary/10">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Bot className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <div className="bg-muted rounded-lg p-4">
                  Thinking...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </main>

      <footer className="border-t p-4">
        <div className="container mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              <Send className="w-4 h-4" />
              <span className="ml-2">Send</span>
            </Button>
          </form>
        </div>
      </footer>
    </div>
  );
}