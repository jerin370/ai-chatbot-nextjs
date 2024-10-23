import { NextResponse } from 'next/server';
import {
  createThread,
  createMessage,
  runAssistant,
  getMessages,
  waitForCompletion,
} from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const { message, threadId: existingThreadId } = await req.json();

    // Create or reuse thread
    const threadId = existingThreadId || (await createThread());

    // Add user message to thread
    await createMessage(threadId, message);

    // Run the assistant
    const run = await runAssistant(threadId);

    // Wait for completion
    await waitForCompletion(threadId, run.id);

    // Get all messages
    const messages = await getMessages(threadId);

    return NextResponse.json({
      threadId,
      messages: messages.map((msg) => ({
        id: msg.id,
        content: msg.content[0].text.value,
        role: msg.role,
      })),
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}