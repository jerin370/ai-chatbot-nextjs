import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function createThread() {
  const thread = await openai.beta.threads.create();
  return thread.id;
}

export async function createMessage(threadId: string, content: string) {
  const message = await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content,
  });
  return message;
}

export async function runAssistant(threadId: string) {
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: process.env.OPENAI_ASSISTANT_ID!,
  });
  return run;
}

export async function getMessages(threadId: string) {
  const messages = await openai.beta.threads.messages.list(threadId);
  return messages.data;
}

export async function waitForCompletion(threadId: string, runId: string) {
  let run = await openai.beta.threads.runs.retrieve(threadId, runId);
  
  while (run.status === 'in_progress' || run.status === 'queued') {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    run = await openai.beta.threads.runs.retrieve(threadId, runId);
  }

  if (run.status === 'completed') {
    return true;
  }

  throw new Error(`Run failed with status: ${run.status}`);
}