'use client';

import * as React from 'react';
import { Play, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SCENARIOS } from '@/lib/scenarios';
import { cn } from '@/lib/utils';

interface Props {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRunScenario: (id: string) => void;
}

export function ScenarioSelector({ selectedId, onSelect, onRunScenario }: Props) {
  return (
    <div className="space-y-2">
      <h3 className="font-display text-sm font-medium text-cocoa-deep mb-2">
        Demo 場景
      </h3>

      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm transition-colors',
          selectedId === null
            ? 'bg-soft text-cocoa-deep border border-amber/40'
            : 'text-ink-soft hover:bg-soft/60 border border-transparent'
        )}
      >
        <MessageCircle className="w-4 h-4" />
        <span>自由對話</span>
      </button>

      {SCENARIOS.map((s) => (
        <div key={s.id} className="space-y-1">
          <button
            type="button"
            onClick={() => onSelect(s.id)}
            className={cn(
              'w-full flex items-start gap-2 px-3 py-2 rounded-md text-left text-sm transition-colors',
              selectedId === s.id
                ? 'bg-soft text-cocoa-deep border border-amber/40'
                : 'text-ink-soft hover:bg-soft/60 border border-transparent'
            )}
          >
            <span className="leading-tight">{s.label}</span>
          </button>
          {selectedId === s.id && (
            <div className="px-3 py-2 space-y-2 animate-fade-in">
              <p className="text-xs text-ink-mute leading-relaxed">
                {s.description}
              </p>
              <Button
                onClick={() => onRunScenario(s.id)}
                size="sm"
                className="w-full"
              >
                <Play className="w-3.5 h-3.5" />
                自動跑場景
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
