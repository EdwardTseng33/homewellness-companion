'use client';

import * as React from 'react';
import {
  Radio,
  Pill,
  Activity,
  AlertTriangle,
  Calendar,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IOT_TRIGGERS } from '@/lib/scenarios';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  radio: Radio,
  pill: Pill,
  activity: Activity,
  'alert-triangle': AlertTriangle,
  calendar: Calendar,
};

interface Props {
  onTrigger: (payload: string, label: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function IoTTriggers({ onTrigger, onClear, disabled }: Props) {
  return (
    <div className="space-y-2">
      <h3 className="font-display text-sm font-medium text-cocoa-deep mb-2">
        模擬 IoT 觸發
      </h3>
      <p className="text-xs text-ink-mute mb-2">
        實際 device 由感測器自動觸發、demo 用按鈕
      </p>

      <div className="space-y-1.5">
        {IOT_TRIGGERS.map((t) => {
          const Icon = iconMap[t.icon] ?? Radio;
          return (
            <Button
              key={t.id}
              onClick={() => onTrigger(t.payload, t.label)}
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              disabled={disabled}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </Button>
          );
        })}
      </div>

      <div className="pt-3 border-t border-border">
        <Button
          onClick={onClear}
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs text-ink-mute hover:text-rose-600"
          disabled={disabled}
        >
          <Trash2 className="w-3.5 h-3.5" />
          清空對話
        </Button>
      </div>
    </div>
  );
}
