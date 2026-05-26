'use client';

import * as React from 'react';
import { useChat } from '@ai-sdk/react';
import { Send, Wrench, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type {
  FamilyNotification,
  EmergencyCall,
} from './health-dashboard';

interface Props {
  onToolResult: (
    toolName: string,
    result: Record<string, unknown>
  ) => void;
  pendingTrigger: { id: number; payload: string; label: string } | null;
  pendingScenarioMessages: { id: number; messages: { role: 'user' | 'assistant'; content: string }[] } | null;
  onClearChat: number;
}

interface ToolCallView {
  toolName: string;
  state: 'partial-call' | 'call' | 'result';
}

function extractToolCalls(message: {
  toolInvocations?: Array<{
    toolName: string;
    state: 'partial-call' | 'call' | 'result';
    result?: unknown;
  }>;
}): ToolCallView[] {
  if (!message.toolInvocations) return [];
  return message.toolInvocations.map((t) => ({
    toolName: t.toolName,
    state: t.state,
  }));
}

export function ChatInterface({
  onToolResult,
  pendingTrigger,
  pendingScenarioMessages,
  onClearChat,
}: Props) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    append,
    setMessages,
    isLoading,
  } = useChat({
    api: '/api/chat',
    onToolCall: () => {
      // 樂觀回饋 · server 端 execute tool 後會回 result
    },
    onFinish: (msg) => {
      // 從 toolInvocations 取 result 餵右側 dashboard
      if (msg.toolInvocations) {
        for (const inv of msg.toolInvocations) {
          if (inv.state === 'result' && inv.result) {
            onToolResult(inv.toolName, inv.result as Record<string, unknown>);
          }
        }
      }
    },
  });

  const scrollRef = React.useRef<HTMLDivElement>(null);

  // auto-scroll
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading]);

  // 響應 IoT 觸發按鈕
  const lastTriggerId = React.useRef<number>(0);
  React.useEffect(() => {
    if (pendingTrigger && pendingTrigger.id !== lastTriggerId.current) {
      lastTriggerId.current = pendingTrigger.id;
      append({ role: 'user', content: pendingTrigger.payload });
    }
  }, [pendingTrigger, append]);

  // 響應自動跑場景
  const lastScenarioId = React.useRef<number>(0);
  React.useEffect(() => {
    if (
      pendingScenarioMessages &&
      pendingScenarioMessages.id !== lastScenarioId.current
    ) {
      lastScenarioId.current = pendingScenarioMessages.id;
      // 直接 setMessages 注入腳本對話 · 不打 API (示意對話)
      const injected = pendingScenarioMessages.messages.map((m, i) => ({
        id: `scenario-${pendingScenarioMessages.id}-${i}`,
        role: m.role,
        content: m.content,
      }));
      setMessages(injected);
    }
  }, [pendingScenarioMessages, setMessages]);

  // 響應清空對話
  const lastClearId = React.useRef<number>(0);
  React.useEffect(() => {
    if (onClearChat !== lastClearId.current) {
      lastClearId.current = onClearChat;
      setMessages([]);
    }
  }, [onClearChat, setMessages]);

  return (
    <div className="flex flex-col h-full bg-paper rounded-lg border border-border shadow-warm overflow-hidden">
      {/* header */}
      <div className="px-5 py-3 border-b border-border bg-cream/60 backdrop-blur">
        <h2 className="font-display text-base text-cocoa-deep">
          跟阿嬤的對話
        </h2>
        <p className="text-xs text-ink-mute mt-0.5">
          CAREON Companion 24h 主動陪伴 · 阿嬤打字模擬語音輸入
        </p>
      </div>

      {/* messages */}
      <ScrollArea className="flex-1 px-5 py-4">
        <div ref={scrollRef} className="space-y-4 max-w-2xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center py-12 text-ink-mute">
              <p className="font-display italic text-base text-cocoa">
                從左邊選場景、按 IoT 觸發、或直接打字跟阿嬤對話
              </p>
              <p className="text-xs mt-2">5 個 tool · 4 個場景 · 即時 stream</p>
            </div>
          )}

          {messages.map((m) => {
            const isUser = m.role === 'user';
            const toolCalls = extractToolCalls(m);
            return (
              <div
                key={m.id}
                className={cn(
                  'flex flex-col gap-1.5 animate-fade-in',
                  isUser ? 'items-end' : 'items-start'
                )}
              >
                <span className="text-[10px] font-mono text-ink-mute px-1">
                  {isUser ? '阿嬤' : 'CAREON'}
                </span>
                {m.content && (
                  <div
                    className={cn(
                      'px-4 py-2.5 max-w-[85%] text-sm leading-relaxed shadow-soft',
                      isUser ? 'bubble-elder' : 'bubble-device'
                    )}
                  >
                    {m.content}
                  </div>
                )}
                {toolCalls.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-1">
                    {toolCalls.map((tc, i) => (
                      <span key={i} className="tool-chip">
                        <Wrench className="w-3 h-3" />
                        {tc.toolName}
                        {tc.state !== 'result' && (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex items-start gap-2 animate-fade-in">
              <div className="bubble-device px-4 py-2.5 shadow-soft flex items-center gap-2 text-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-ink-mute">思考中…</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* input */}
      <form
        onSubmit={handleSubmit}
        className="px-5 py-3 border-t border-border bg-cream/60 backdrop-blur flex gap-2"
      >
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="打字模擬阿嬤說話 (例: 我頭有點暈)"
          disabled={isLoading}
          className="flex-1 h-10 px-3 rounded-md border border-border bg-paper text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">送出</span>
        </Button>
      </form>
    </div>
  );
}
