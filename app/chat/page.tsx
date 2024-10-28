'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Send,
  User,
  AlertTriangle,
  Menu,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'error';
}

interface Thread {
  id: string;
  title: string;
  created_at: number;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingThreads, setLoadingThreads] = useState(false);
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
    fetchThreads();
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchThreads = async () => {
    setLoadingThreads(true);
    try {
      const response = await fetch('/api/threads');
      if (!response.ok) throw new Error('Failed to fetch threads');
      const data = await response.json();
      setThreads(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load chat history',
      });
    } finally {
      setLoadingThreads(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    const userInput = input;
    setInput('');

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
      fetchThreads();
    } catch (error) {
      const errorMessage = {
        id: `error-${Date.now()}`,
        content:
          error instanceof Error
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

  const handleThreadSelect = async (selectedThreadId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId: selectedThreadId,
          message: '',
        }),
      });

      const data = await response.json();
      setThreadId(selectedThreadId);
      setMessages(data.messages);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load chat history',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteThread = async (threadIdToDelete: string) => {
    try {
      await fetch('/api/threads', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ threadId: threadIdToDelete }),
      });

      if (threadIdToDelete === threadId) {
        setThreadId(null);
        setMessages([]);
      }

      fetchThreads();
      toast({
        title: 'Success',
        description: 'Chat deleted successfully',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete chat',
      });
    }
  };

  const handleNewChat = () => {
    setThreadId(null);
    setMessages([]);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-card/50 backdrop-blur-sm border-r transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Chat History</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-2">
            <Button
              className="w-full justify-start gap-2"
              onClick={handleNewChat}
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>
          <ScrollArea className="flex-1 px-2">
            <div className="space-y-2 py-2">
              {loadingThreads ? (
                <div className="text-center text-muted-foreground">
                  Loading...
                </div>
              ) : threads.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  No chat history
                </div>
              ) : (
                threads.map((thread) => (
                  <div
                    key={thread.id}
                    className={`group flex items-center justify-between rounded-lg px-3 py-2 hover:bg-accent cursor-pointer ${
                      thread.id === threadId ? 'bg-accent' : ''
                    }`}
                    onClick={() => handleThreadSelect(thread.id)}
                  >
                    <div className="flex-1 truncate">
                      <p className="truncate">{thread.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(
                          new Date(thread.created_at * 1000),
                          'MMM d, yyyy'
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteThread(thread.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl h-[85vh] flex flex-col shadow-lg">
          <CardHeader className="border-b p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </Button>
                <Bot className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">AI Assistant</h1>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-4 overflow-hidden">
            <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      Welcome to AI Assistant
                    </h3>
                    <p>Start a conversation by typing a message below.</p>
                  </div>
                )}
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
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      </div>
                    )}
                    <div
                      className={`rounded-lg p-4 max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : message.role === 'error'
                          ? 'bg-destructive/10 text-red-500'
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
                    <div className="bg-muted rounded-lg p-4">Thinking...</div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex gap-4 w-full">
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
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
