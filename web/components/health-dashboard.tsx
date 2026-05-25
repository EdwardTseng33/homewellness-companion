'use client';

import * as React from 'react';
import {
  Heart,
  Activity,
  Moon,
  Pill,
  Phone,
  Siren,
  User2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { MOCK_USER_MEMORY } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export interface FamilyNotification {
  severity: 'info' | 'warning' | 'urgent' | 'emergency';
  message: string;
  channel: string;
  sent_at: string;
}

export interface EmergencyCall {
  condition: string;
  estimated_arrival: string;
  dispatched_at: string;
}

interface Props {
  notifications: FamilyNotification[];
  emergencyCalls: EmergencyCall[];
}

const severityStyles: Record<
  FamilyNotification['severity'],
  { color: string; label: string }
> = {
  info: { color: 'bg-blue-500', label: 'INFO' },
  warning: { color: 'bg-yellow-500', label: 'WARN' },
  urgent: { color: 'bg-orange-500', label: 'URGENT' },
  emergency: { color: 'bg-rose-600', label: 'EMERGENCY' },
};

function Metric({
  icon: Icon,
  label,
  value,
  delta,
  positive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-md bg-cream/60 border border-border">
      <div className="w-8 h-8 rounded-md gradient-amber flex items-center justify-center text-paper shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink-mute font-medium">{label}</p>
        <p className="font-display text-base text-cocoa-deep leading-tight mt-0.5">
          {value}
        </p>
        {delta && (
          <p
            className={cn(
              'text-[10px] font-mono mt-0.5',
              positive ? 'text-emerald-700' : 'text-amber-deep'
            )}
          >
            {delta}
          </p>
        )}
      </div>
    </div>
  );
}

export function HealthDashboard({ notifications, emergencyCalls }: Props) {
  const profile = MOCK_USER_MEMORY.profile;
  const trends = MOCK_USER_MEMORY.health_trends;

  return (
    <div className="space-y-3">
      {/* 阿嬤 persona card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-soft flex items-center justify-center">
              <User2 className="w-5 h-5 text-cocoa-deep" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-base text-cocoa-deep">
                {profile.name}{' '}
                <span className="text-ink-mute text-sm">· {profile.age} 歲</span>
              </p>
              <p className="text-xs text-ink-mute mt-0.5">
                {profile.chronic_conditions.join(' · ')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7 天平均 */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-display text-sm text-cocoa-deep mb-3 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            <span>7 天平均</span>
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <Metric
              icon={Heart}
              label="血壓"
              value={trends.blood_pressure_7d_avg}
              delta="穩定"
              positive
            />
            <Metric
              icon={Activity}
              label="心率"
              value={`${trends.heart_rate_7d_avg} bpm`}
              delta="正常"
              positive
            />
            <Metric
              icon={Moon}
              label="睡眠"
              value={`${trends.sleep_7d_avg_hours} hr`}
              delta="-0.2"
            />
            <Metric
              icon={Pill}
              label="用藥配合"
              value={`${Math.round(trends.medication_adherence_30d * 100)}%`}
              delta="+3%"
              positive
            />
          </div>
        </CardContent>
      </Card>

      {/* 今日用藥 */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-display text-sm text-cocoa-deep mb-2 flex items-center gap-1.5">
            <Pill className="w-3.5 h-3.5" />
            <span>今日用藥</span>
          </h4>
          <ul className="space-y-1.5">
            {profile.medications.map((m) => (
              <li key={m.name} className="text-xs flex justify-between gap-2">
                <span className="text-ink-soft">{m.name}</span>
                <span className="font-mono text-ink-mute">
                  {m.schedule.join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 家屬通知 */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-display text-sm text-cocoa-deep mb-2 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" />
            <span>家屬通知</span>
          </h4>
          {notifications.length === 0 ? (
            <p className="text-xs text-ink-mute italic">(尚無通知)</p>
          ) : (
            <ul className="space-y-2">
              {notifications.slice(-4).map((n, i) => {
                const s = severityStyles[n.severity];
                return (
                  <li
                    key={i}
                    className="text-xs space-y-0.5 animate-fade-in"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'inline-block w-1.5 h-1.5 rounded-full',
                          s.color
                        )}
                      />
                      <span className="font-mono text-[10px] text-ink-mute">
                        {s.label}
                      </span>
                    </div>
                    <p className="text-ink-soft pl-3 leading-snug">
                      {n.message.length > 60
                        ? n.message.slice(0, 60) + '…'
                        : n.message}
                    </p>
                    <p className="text-[10px] text-ink-mute pl-3 font-mono">
                      → {n.channel}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* 119 紀錄 (有才顯示) */}
      {emergencyCalls.length > 0 && (
        <Card className="border-rose-300 bg-rose-50">
          <CardContent className="p-4">
            <h4 className="font-display text-sm text-rose-700 mb-2 flex items-center gap-1.5">
              <Siren className="w-3.5 h-3.5 animate-pulse-soft" />
              <span>119 紀錄</span>
            </h4>
            <ul className="space-y-2">
              {emergencyCalls.map((e, i) => (
                <li key={i} className="text-xs text-rose-800 animate-fade-in">
                  <p className="font-medium">已撥 119: {e.condition}</p>
                  <p className="text-rose-600 text-[10px] font-mono mt-0.5">
                    ETA {e.estimated_arrival}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
