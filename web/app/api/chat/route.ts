// API Route · ai-sdk streaming + tool calling
// 對齊 streamlit_chatbot.py 的 LangGraph-style workflow
// 無 API key 時 fallback 回 mock reply (符合紀律 5)

import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToCoreMessages, type Message } from 'ai';
import { SYSTEM_PROMPT } from '@/lib/system-prompt';
import { ALL_TOOLS } from '@/lib/tools';

export const maxDuration = 30;
export const runtime = 'nodejs';

interface ChatBody {
  messages: Message[];
}

// 取最後一條 user message · fallback 模式用
function lastUserText(messages: Message[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m && m.role === 'user') {
      return typeof m.content === 'string' ? m.content : '';
    }
  }
  return '';
}

// 無 API key 時的 mock streaming reply
function mockStreamResponse(userText: string): Response {
  const reply = `[Demo Fallback 未設 API key] 阿嬤、我先用備用對話回你。你剛說「${userText.slice(0, 40)}」我聽到了。若要看 tool calling、請設 ANTHROPIC_API_KEY。`;

  // 用 ai-sdk data stream protocol 格式 ("0:" prefix + JSON string + 換行)
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const chars = Array.from(reply);
      for (const ch of chars) {
        const chunk = `0:${JSON.stringify(ch)}\n`;
        controller.enqueue(encoder.encode(chunk));
        await new Promise((r) => setTimeout(r, 15));
      }
      // finish message part
      const finish = `d:${JSON.stringify({
        finishReason: 'stop',
        usage: { promptTokens: 0, completionTokens: chars.length },
      })}\n`;
      controller.enqueue(encoder.encode(finish));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'x-vercel-ai-data-stream': 'v1',
    },
  });
}

export async function POST(req: Request) {
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const messages = body.messages ?? [];

  // Fallback: 沒 API key 走 mock
  if (!process.env.ANTHROPIC_API_KEY) {
    return mockStreamResponse(lastUserText(messages));
  }

  try {
    const result = streamText({
      model: anthropic('claude-sonnet-4-5'),
      system: SYSTEM_PROMPT,
      messages: convertToCoreMessages(messages),
      tools: ALL_TOOLS,
      maxSteps: 5,
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    console.error('[chat api]', msg);
    return mockStreamResponse(
      `[API 錯誤 fallback] ${lastUserText(messages).slice(0, 40)}`
    );
  }
}
