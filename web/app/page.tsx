'use client';

import * as React from 'react';
import { Home, Heart, Menu, X } from 'lucide-react';
import { ChatInterface } from '@/components/chat-interface';
import { ScenarioSelector } from '@/components/scenario-selector';
import { IoTTriggers } from '@/components/iot-triggers';
import {
  HealthDashboard,
  type FamilyNotification,
  type EmergencyCall,
} from '@/components/health-dashboard';
import { SCENARIOS } from '@/lib/scenarios';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const [selectedScenario, setSelectedScenario] = React.useState<string | null>(
    null
  );
  const [pendingTrigger, setPendingTrigger] = React.useState<{
    id: number;
    payload: string;
    label: string;
  } | null>(null);
  const [pendingScenarioMessages, setPendingScenarioMessages] = React.useState<{
    id: number;
    messages: { role: 'user' | 'assistant'; content: string }[];
  } | null>(null);
  const [clearChatTick, setClearChatTick] = React.useState(0);
  const [notifications, setNotifications] = React.useState<FamilyNotification[]>(
    []
  );
  const [emergencyCalls, setEmergencyCalls] = React.useState<EmergencyCall[]>(
    []
  );
  const [leftOpen, setLeftOpen] = React.useState(false);
  const [rightOpen, setRightOpen] = React.useState(false);

  const handleToolResult = React.useCallback(
    (toolName: string, result: Record<string, unknown>) => {
      if (toolName === 'notifyFamily') {
        setNotifications((prev) => [
          ...prev,
          {
            severity: (result.severity as FamilyNotification['severity']) ?? 'info',
            message: (result.message as string) ?? '',
            channel: (result.channel as string) ?? 'LINE',
            sent_at: (result.sent_at as string) ?? '',
          },
        ]);
      }
      if (toolName === 'emergency119') {
        setEmergencyCalls((prev) => [
          ...prev,
          {
            condition: (result.condition as string) ?? 'unknown',
            estimated_arrival: (result.estimated_arrival as string) ?? '',
            dispatched_at: (result.dispatched_at as string) ?? '',
          },
        ]);
      }
    },
    []
  );

  const handleTrigger = (payload: string, label: string) => {
    setPendingTrigger({ id: Date.now(), payload, label });
    setLeftOpen(false);
  };

  const handleRunScenario = (id: string) => {
    const s = SCENARIOS.find((x) => x.id === id);
    if (!s) return;
    setPendingScenarioMessages({
      id: Date.now(),
      messages: s.sampleDialog,
    });
    setLeftOpen(false);
  };

  const handleClearChat = () => {
    setClearChatTick((t) => t + 1);
    setNotifications([]);
    setEmergencyCalls([]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-paper/80 backdrop-blur sticky top-0 z-30">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3 max-w-[1600px] mx-auto w-full">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setLeftOpen((v) => !v)}
              aria-label="toggle left panel"
            >
              {leftOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
            <div className="w-9 h-9 rounded-md gradient-amber flex items-center justify-center text-paper shadow-soft">
              <Home className="w-4.5 h-4.5" strokeWidth={2.4} />
            </div>
            <div>
              <h1 className="font-display text-lg sm:text-xl text-cocoa-deep leading-tight">
                HomeWellness <span className="display-italic">Companion</span>
              </h1>
              <p className="text-[11px] text-ink-mute font-mono leading-tight">
                家暖 · 銀髮陪伴 AI · Claude Sonnet 4.5
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setRightOpen((v) => !v)}
            aria-label="toggle dashboard"
          >
            <Heart className="w-5 h-5 text-amber-deep" />
          </Button>
        </div>
      </header>

      {/* Main 3-column layout */}
      <main className="flex-1 flex max-w-[1600px] mx-auto w-full">
        {/* LEFT panel · scenarios + IoT triggers */}
        <aside
          className={cn(
            'w-60 shrink-0 border-r border-border bg-cream/40 p-4 space-y-5 overflow-y-auto',
            'hidden lg:block',
            leftOpen && 'fixed lg:relative inset-y-0 left-0 z-20 block w-64 bg-paper'
          )}
        >
          <ScenarioSelector
            selectedId={selectedScenario}
            onSelect={setSelectedScenario}
            onRunScenario={handleRunScenario}
          />
          <div className="border-t border-border" />
          <IoTTriggers
            onTrigger={handleTrigger}
            onClear={handleClearChat}
          />
        </aside>

        {/* CENTER · chat */}
        <section className="flex-1 min-w-0 p-3 sm:p-4">
          <div className="h-[calc(100vh-7rem)]">
            <ChatInterface
              onToolResult={handleToolResult}
              pendingTrigger={pendingTrigger}
              pendingScenarioMessages={pendingScenarioMessages}
              onClearChat={clearChatTick}
            />
          </div>
        </section>

        {/* RIGHT panel · health dashboard */}
        <aside
          className={cn(
            'w-80 shrink-0 border-l border-border bg-cream/40 p-4 overflow-y-auto',
            'hidden lg:block',
            rightOpen && 'fixed lg:relative inset-y-0 right-0 z-20 block w-80 bg-paper'
          )}
        >
          <HealthDashboard
            notifications={notifications}
            emergencyCalls={emergencyCalls}
          />
        </aside>
      </main>

      {/* Mobile overlay */}
      {(leftOpen || rightOpen) && (
        <button
          type="button"
          className="fixed inset-0 bg-black/40 z-10 lg:hidden"
          onClick={() => {
            setLeftOpen(false);
            setRightOpen(false);
          }}
          aria-label="close panel"
        />
      )}

      {/* Footer */}
      <footer className="border-t border-border bg-paper/60 py-2 text-center">
        <p className="text-[10px] text-ink-mute font-mono">
          Castle Intelligence · 2026 · Claude Sonnet 4.5 · 5 tools · 4 scenarios
        </p>
      </footer>
    </div>
  );
}
