'use client';

// CAREON Companion · 8" 1280×800 Device POC
// 12 screens + 玻璃語言 + Lily mp4 avatar + Dev Panel
// Design tokens 從 Anthropic Design 拆出 (window-primitives.jsx)

import { useState, useEffect, useRef } from 'react';

// === Design Tokens ===
const T = {
  void: '#1a1612',
  ink: '#1F1B17',
  ink2: '#5A4F46',
  ink3: '#8A7F73',
  glass: 'rgba(255,253,248,0.78)',
  glassDeep: 'rgba(255,253,248,0.94)',
  glassDark: 'rgba(36,28,20,0.55)',
  glassDarkDeep: 'rgba(36,28,20,0.78)',
  amber: '#D4712A',
  amberSoft: '#F3D7B8',
  sage: '#7A9482',
  sageSoft: '#C7D7CC',
  rose: '#E5BFB8',
  red: '#D85A55',
  paper: '#eaddc7',
} as const;

type ScreenId =
  | 'standby' | 'aria-here' | 'nudge' | 'engage' | 'health'
  | 'companion-confirm' | 'companion' | 'medication'
  | 'family-call' | 'menu' | 'reflect' | 'goodnight';

const SCREENS: { id: ScreenId; label: string; mood: 'sage' | 'amber' | 'rose' | 'dark' }[] = [
  { id: 'standby', label: '01 · 待機 Standby', mood: 'dark' },
  { id: 'aria-here', label: '02 · 莉莉在 Aria Here', mood: 'sage' },
  { id: 'nudge', label: '03 · 主動關懷 Nudge', mood: 'rose' },
  { id: 'engage', label: '04 · 純語音對話 Engage', mood: 'amber' },
  { id: 'health', label: '05 · 健康關心 Check-in', mood: 'sage' },
  { id: 'companion-confirm', label: '06 · 陪伴聊天 · 確認', mood: 'amber' },
  { id: 'companion', label: '07 · 陪伴聊天 · 計時中', mood: 'rose' },
  { id: 'medication', label: '08 · 用藥提醒', mood: 'amber' },
  { id: 'family-call', label: '09 · 家人視訊', mood: 'amber' },
  { id: 'menu', label: '10 · 選單', mood: 'sage' },
  { id: 'reflect', label: '11 · 今日回顧', mood: 'sage' },
  { id: 'goodnight', label: '12 · 晚安模式', mood: 'dark' },
];

function moodToTint(mood: string) {
  if (mood === 'sage') return 'rgba(122,148,130,0.18)';
  if (mood === 'amber') return 'rgba(212,113,42,0.16)';
  if (mood === 'rose') return 'rgba(229,191,184,0.18)';
  return 'rgba(0,0,0,0)';
}

function screenToVideo(s: ScreenId) {
  if (s === 'standby' || s === 'goodnight') return null;
  if (s === 'engage' || s === 'companion') return '/lily/lily-talking.mp4';
  if (s === 'health' || s === 'nudge') return '/lily/lily-greeting.mp4';
  if (s === 'medication') return '/lily/lily-listening.mp4';
  return '/lily/lily-idle.mp4';
}

const FONTS_LINK = (
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,300;6..72,400;6..72,500;6..72,600&family=Inter:wght@300;400;500;600;700&family=Noto+Serif+TC:wght@300;400;500;600&family=Noto+Sans+TC:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
  />
);

// ===== Reusable Components =====
function GlassBubble({
  children, side = 'left', dark = false, accent,
}: { children: React.ReactNode; side?: 'left' | 'right'; dark?: boolean; accent?: string }) {
  return (
    <div
      style={{
        background: dark ? T.glassDarkDeep : T.glassDeep,
        color: dark ? '#fff' : T.ink,
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        borderRadius: 24,
        padding: '20px 24px',
        maxWidth: 480,
        fontFamily: '"Noto Serif TC", "Newsreader", serif',
        fontSize: 22,
        lineHeight: 1.55,
        boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        borderLeft: accent ? `4px solid ${accent}` : 'none',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0, left: 12, right: 12, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)',
          borderRadius: 999,
          pointerEvents: 'none',
        }}
      />
      {children}
    </div>
  );
}

function SummaryPanel({ title, rows }: { title: string; rows: { label: string; value: string; unit?: string; tone?: string }[] }) {
  return (
    <div
      style={{
        background: T.glass,
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        borderRadius: 22,
        padding: '20px 22px',
        minWidth: 280,
        position: 'relative',
        boxShadow: '0 12px 32px rgba(0,0,0,0.20)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0, left: 12, right: 12, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)',
          borderRadius: 999,
        }}
      />
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11,
          letterSpacing: '0.22em',
          color: T.ink3,
          fontWeight: 700,
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '6px 0', borderTop: i > 0 ? '1px solid rgba(36,28,20,0.08)' : 'none' }}>
          <span style={{ flex: '0 0 64px', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: T.ink2 }}>
            {r.label}
          </span>
          <span style={{ flex: 1, fontFamily: '"Newsreader", serif', fontSize: 22, fontWeight: 500, color: T.ink, display: 'flex', alignItems: 'baseline', gap: 5 }}>
            {r.value}
            {r.unit && <span style={{ fontSize: 12, color: T.ink3 }}>{r.unit}</span>}
          </span>
          {r.tone && (
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: r.tone, textTransform: 'uppercase' }}>
              ●
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function CircleBtn({ label, sub, icon, bg, size = 72, onClick }: { label: string; sub?: string; icon: string; bg: string; size?: number; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        background: 'transparent', border: 'none', cursor: 'pointer',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          width: size, height: size, borderRadius: '50%',
          background: bg,
          color: '#fff',
          backdropFilter: 'blur(18px) saturate(130%)',
          WebkitBackdropFilter: 'blur(18px) saturate(130%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.42,
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
            borderRadius: 999, pointerEvents: 'none',
          }}
        />
        <span>{icon}</span>
      </div>
      <span style={{ color: '#fff', fontFamily: '"Noto Sans TC", sans-serif', fontSize: 14, fontWeight: 600, letterSpacing: '0.02em', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
        {label}
      </span>
      {sub && (
        <span style={{ color: T.amberSoft, fontFamily: '"JetBrains Mono", monospace', fontSize: 11, marginTop: -4, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
          {sub}
        </span>
      )}
    </button>
  );
}

function VoicePill({ state = 'listening' }: { state?: 'listening' | 'speaking' | 'thinking' }) {
  const config = {
    listening: { color: T.amber, text: '直接說、莉莉在聽' },
    speaking: { color: T.sage, text: '莉莉正在說話…' },
    thinking: { color: T.rose, text: '莉莉想一下…' },
  }[state];
  return (
    <div
      style={{
        padding: '11px 22px',
        background: T.glassDarkDeep,
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderRadius: 999,
        display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: '"Noto Sans TC", sans-serif', fontSize: 16, fontWeight: 500,
        color: '#fff',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}
    >
      <span
        style={{
          width: 10, height: 10, borderRadius: '50%',
          background: config.color,
          boxShadow: `0 0 12px ${config.color}`,
          animation: 'pulse 1.6s ease-in-out infinite',
        }}
      />
      {config.text}
    </div>
  );
}

function LiquidButton({ children, color, big, onClick }: { children: React.ReactNode; color?: string; big?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: big ? '18px 36px' : '14px 28px',
        background: color || T.glassDeep,
        color: color ? '#fff' : T.ink,
        backdropFilter: 'blur(18px) saturate(130%)',
        WebkitBackdropFilter: 'blur(18px) saturate(130%)',
        borderRadius: 999,
        border: 'none',
        cursor: 'pointer',
        fontFamily: '"Noto Sans TC", sans-serif',
        fontSize: big ? 19 : 16,
        fontWeight: 600,
        letterSpacing: '0.02em',
        boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <span style={{
        position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)',
        borderRadius: 999, pointerEvents: 'none',
      }} />
      {children}
    </button>
  );
}

// ===== Screens =====
function ScreenStandby({ time, onWake }: { time: string; onWake: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: T.paper }}>
      {/* 左上角溫濕度 */}
      <div style={{ position: 'absolute', top: 32, left: 32, display: 'flex', flexDirection: 'column', gap: 4, fontFamily: '"JetBrains Mono", monospace', fontSize: 13, letterSpacing: '0.14em', color: T.paper, opacity: 0.55 }}>
        <span>室溫 24.2° · 濕度 58%</span>
        <span>WIFI · 連線正常</span>
      </div>
      {/* 大時鐘 */}
      <div style={{ fontFamily: '"Newsreader", serif', fontSize: 220, fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 1, color: T.paper }}>
        {time}
      </div>
      <div style={{ fontFamily: '"Noto Serif TC", serif', fontSize: 22, marginTop: 14, opacity: 0.7, color: T.paper }}>
        5 月 26 日 · 週二 · 晚上
      </div>
      <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.34em', marginTop: 50, opacity: 0.4, color: T.amberSoft }}>
        CAREON COMPANION · 莉莉待機中
      </div>
      <button
        onClick={onWake}
        style={{
          marginTop: 60,
          padding: '20px 56px',
          background: 'transparent',
          color: T.amberSoft,
          border: `1px solid ${T.amberSoft}`,
          borderRadius: 999,
          fontFamily: '"Noto Serif TC", serif',
          fontSize: 22,
          fontWeight: 500,
          cursor: 'pointer',
          letterSpacing: '0.06em',
        }}
      >
        點我喚醒 · 或說「莉莉」
      </button>
    </div>
  );
}

function ScreenAriaHere() {
  return (
    <>
      <div style={{ position: 'absolute', top: '32%', left: 60 }}>
        <GlassBubble accent={T.sage}>
          <span style={{ display: 'block', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.16em', fontWeight: 700, color: T.sage, marginBottom: 8 }}>
            ● 莉莉 · 早安問候
          </span>
          王阿姨早！今天感覺有沒有比昨天好一點？
        </GlassBubble>
      </div>
      <div style={{ position: 'absolute', top: 90, right: 32 }}>
        <SummaryPanel
          title="今日健康"
          rows={[
            { label: '血壓', value: '128 / 78', unit: 'mmHg', tone: T.sage },
            { label: '心跳', value: '72', unit: 'bpm', tone: T.sage },
            { label: '血糖', value: '105', unit: 'mg/dL', tone: T.sage },
            { label: '用藥', value: '早 ✓ · 午 -', tone: T.amber },
            { label: '睡眠', value: '6.5 hr', tone: T.amber },
          ]}
        />
      </div>
    </>
  );
}

function ScreenNudge() {
  return (
    <>
      <div style={{ position: 'absolute', top: '34%', left: 60 }}>
        <GlassBubble accent={T.rose}>
          <span style={{ display: 'block', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.16em', fontWeight: 700, color: T.rose, marginBottom: 8 }}>
            ● 莉莉 · 主動關懷
          </span>
          王阿姨、今天活動量不太夠。要不要出去走走？再走個 1,000 步、心情會好喔。
        </GlassBubble>
      </div>
      <div style={{ position: 'absolute', top: 90, right: 32 }}>
        <SummaryPanel
          title="今日活動"
          rows={[
            { label: '步數', value: '2,348', unit: '/ 6,000', tone: T.rose },
            { label: '心跳', value: '68', unit: 'bpm 平均', tone: T.sage },
            { label: '有氧分鐘', value: '8', unit: '/ 30', tone: T.rose },
          ]}
        />
      </div>
    </>
  );
}

function ScreenEngage() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {[10, 18, 26, 14, 22, 32, 16, 20, 28, 12, 24, 18, 26, 14, 20].map((h, i) => (
          <span key={i} style={{ width: 6, height: h * 2, borderRadius: 3, background: T.amber, opacity: 0.65 + (i % 3) * 0.1, animation: `wave${i % 3} 1.2s ease-in-out infinite` }} />
        ))}
      </div>
      <div style={{ fontFamily: '"Noto Serif TC", serif', fontSize: 26, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
        莉莉正在說話…
      </div>
    </div>
  );
}

function ScreenHealth() {
  return (
    <>
      <div style={{ position: 'absolute', top: '30%', left: 60 }}>
        <GlassBubble accent={T.sage}>
          <span style={{ display: 'block', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.16em', fontWeight: 700, color: T.sage, marginBottom: 8 }}>
            ● 莉莉 · 早晨關心
          </span>
          王阿姨、昨晚睡得怎麼樣？有沒有半夜醒來過？
        </GlassBubble>
      </div>
      <div style={{ position: 'absolute', top: 90, right: 32 }}>
        <SummaryPanel
          title="今早摘要"
          rows={[
            { label: '睡眠', value: '6 hr 30', tone: T.amber },
            { label: '感覺', value: '還可以', tone: T.sage },
            { label: '用藥', value: '尚未確認', tone: T.rose },
            { label: '血壓', value: '128 / 78', tone: T.sage },
            { label: '心率', value: '72 bpm', tone: T.sage },
          ]}
        />
      </div>
    </>
  );
}

function ScreenCompanionConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(26,22,18,0.55)', backdropFilter: 'blur(8px)' }}>
      <div style={{ background: T.glassDeep, backdropFilter: 'blur(24px)', borderRadius: 28, padding: '40px 52px', maxWidth: 540, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.22em', fontWeight: 700, color: T.amber, marginBottom: 14 }}>
          ● 陪伴聊天 · 計費確認
        </div>
        <div style={{ fontFamily: '"Noto Serif TC", serif', fontSize: 28, color: T.ink, marginBottom: 18, fontWeight: 500 }}>
          要跟莉莉聊聊嗎？
        </div>
        <div style={{ fontFamily: '"Noto Sans TC", sans-serif', fontSize: 17, color: T.ink2, lineHeight: 1.6, marginBottom: 28 }}>
          這個會用到你的聊天時間
          <br />
          <span style={{ color: T.amber, fontWeight: 600 }}>本月還剩 90 分鐘</span> · 每分鐘 NT$2
        </div>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          <LiquidButton onClick={onCancel}>等一下</LiquidButton>
          <LiquidButton color={T.amber} big onClick={onConfirm}>開始聊聊</LiquidButton>
        </div>
      </div>
    </div>
  );
}

function ScreenCompanion({ onEnd }: { onEnd: () => void }) {
  return (
    <>
      <div style={{ position: 'absolute', top: 90, right: 32 }}>
        <SummaryPanel
          title="陪伴聊天 · 計時中"
          rows={[
            { label: '已使用', value: '00:08:32', tone: T.amber },
            { label: '剩餘', value: '82 分鐘', tone: T.sage },
            { label: '費用', value: 'NT$ 17', unit: '已計', tone: T.rose },
          ]}
        />
      </div>
      <div style={{ position: 'absolute', bottom: 130, left: '50%', transform: 'translateX(-50%)' }}>
        <button
          onClick={onEnd}
          style={{
            padding: '16px 38px',
            background: T.red,
            color: '#fff',
            border: 'none',
            borderRadius: 999,
            fontFamily: '"Noto Sans TC", sans-serif',
            fontSize: 17,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: `0 8px 24px ${T.red}99`,
            letterSpacing: '0.04em',
          }}
        >
          ⏹ 結束陪伴
        </button>
      </div>
    </>
  );
}

function ScreenMedication() {
  return (
    <>
      <div style={{ position: 'absolute', top: '30%', left: 60 }}>
        <GlassBubble accent={T.amber}>
          <span style={{ display: 'block', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.16em', fontWeight: 700, color: T.amber, marginBottom: 8 }}>
            ● 莉莉 · 用藥提醒
          </span>
          王阿姨、現在 8 點、早餐藥的時間到了。配藥槽已經彈出。
          <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
            <LiquidButton color={T.sage}>我吃了</LiquidButton>
            <LiquidButton>等 15 分</LiquidButton>
          </div>
        </GlassBubble>
      </div>
      <div style={{ position: 'absolute', top: 90, right: 32 }}>
        <SummaryPanel
          title="早餐用藥"
          rows={[
            { label: '降壓藥', value: 'Amlodipine 5mg', tone: T.amber },
            { label: '控糖藥', value: 'Metformin 500mg', tone: T.amber },
            { label: '時段', value: '8:00 早餐後' },
            { label: '本月配合', value: '92%', tone: T.sage },
          ]}
        />
      </div>
    </>
  );
}

function ScreenFamilyCall({ onEnd }: { onEnd: () => void }) {
  return (
    <>
      <div style={{ position: 'absolute', top: 60, right: 32, width: 200, height: 150, background: T.glassDarkDeep, borderRadius: 16, border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.paper, fontFamily: 'Inter', fontSize: 12 }}>
        我（PIP）
      </div>
      <div style={{ position: 'absolute', top: 32, left: 80, padding: '6px 14px', background: T.red, color: '#fff', borderRadius: 999, fontFamily: '"JetBrains Mono", monospace', fontSize: 12, fontWeight: 700, letterSpacing: '0.16em' }}>
        🔴 LIVE · 02:14
      </div>
      <div style={{ position: 'absolute', bottom: 130, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 16 }}>
        <LiquidButton color={T.glassDarkDeep as any}>🎤</LiquidButton>
        <LiquidButton color={T.red} big onClick={onEnd}>結束</LiquidButton>
        <LiquidButton color={T.glassDarkDeep as any}>📷</LiquidButton>
      </div>
    </>
  );
}

function ScreenMenu({ onPick }: { onPick: (s: ScreenId) => void }) {
  const items: { label: string; emoji: string; screen?: ScreenId }[] = [
    { label: '健康報告', emoji: '📊', screen: 'reflect' },
    { label: '今日用藥', emoji: '💊', screen: 'medication' },
    { label: '藥箱監測', emoji: '🔍' },
    { label: '環境感測', emoji: '🌡️' },
    { label: '聯絡家人', emoji: '👨‍👩‍👧', screen: 'family-call' },
    { label: '陪伴聊天', emoji: '💬', screen: 'companion-confirm' },
    { label: '連線裝置', emoji: '📡' },
    { label: '個人資料', emoji: '👤' },
  ];
  return (
    <div style={{ position: 'absolute', inset: 80, background: T.glassDeep, backdropFilter: 'blur(24px)', borderRadius: 24, padding: 32, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: 18 }}>
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => item.screen && onPick(item.screen)}
          style={{ background: '#fff', border: 'none', borderRadius: 18, padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
        >
          <span style={{ fontSize: 38 }}>{item.emoji}</span>
          <span style={{ fontFamily: '"Noto Serif TC", serif', fontSize: 18, fontWeight: 500, color: T.ink }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function ScreenReflect() {
  const timeline = [
    { time: '07:30', label: '起床', tone: T.sage },
    { time: '08:00', label: '早餐用藥 ✓', tone: T.sage },
    { time: '09:15', label: '量血壓 128/78', tone: T.sage },
    { time: '10:30', label: '跟莉莉聊了 12 分鐘', tone: T.amber },
    { time: '12:00', label: '午餐用藥 ✓', tone: T.sage },
    { time: '14:30', label: '跟兒子大華視訊 5 分鐘', tone: T.amber },
    { time: '17:00', label: '步數 4,820 (今天目標 6,000)', tone: T.rose },
    { time: '21:00', label: '晚餐用藥 ✓', tone: T.sage },
  ];
  return (
    <div style={{ position: 'absolute', top: 90, right: 60, bottom: 130, left: 60, background: T.glassDeep, backdropFilter: 'blur(20px)', borderRadius: 24, padding: 36, overflowY: 'auto' }}>
      <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, letterSpacing: '0.22em', color: T.amber, fontWeight: 700, marginBottom: 8 }}>
        ● 今日回顧 · 5/26 週二
      </div>
      <div style={{ fontFamily: '"Newsreader", serif', fontSize: 28, color: T.ink, marginBottom: 24, fontWeight: 500 }}>
        王阿姨今天的一天
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {timeline.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 14, color: T.ink3, fontWeight: 600, width: 60 }}>{item.time}</span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.tone }} />
            <span style={{ fontFamily: '"Noto Serif TC", serif', fontSize: 18, color: T.ink }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenGoodnight({ time }: { time: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #0a0807 0%, #1a1612 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: '"Newsreader", serif', fontSize: 180, fontWeight: 300, color: T.amberSoft, opacity: 0.7, lineHeight: 1 }}>
        {time}
      </div>
      <div style={{ fontFamily: '"Noto Serif TC", serif', fontSize: 22, color: T.amberSoft, opacity: 0.55, marginTop: 32 }}>
        晚安、王阿姨。明天見。
      </div>
      <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.32em', color: T.red, marginTop: 80, opacity: 0.55 }}>
        SOS 緊急按鈕 · 長按 3 秒
      </div>
    </div>
  );
}

// ===== Dev Panel =====
function DevPanel({ currentScreen, onSelect, onClose }: { currentScreen: ScreenId; onSelect: (s: ScreenId) => void; onClose: () => void }) {
  return (
    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 340, background: 'rgba(10,8,7,0.92)', backdropFilter: 'blur(20px)', borderLeft: '1px solid rgba(212,113,42,0.3)', padding: 22, overflowY: 'auto', color: T.paper, fontFamily: 'Inter, sans-serif', zIndex: 100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, letterSpacing: '0.22em', color: T.amber, fontWeight: 700 }}>● DEV PANEL · 演示控制</span>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: T.paper, fontSize: 18, cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ fontFamily: '"Noto Sans TC", sans-serif', fontSize: 13, color: T.ink3, marginBottom: 14 }}>按 D 鍵切換 · 點下方跳到任意畫面</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {SCREENS.map(s => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            style={{
              padding: '10px 14px', textAlign: 'left', cursor: 'pointer',
              background: currentScreen === s.id ? T.amber : 'rgba(255,253,248,0.06)',
              color: currentScreen === s.id ? '#fff' : T.paper,
              border: 'none', borderRadius: 10,
              fontFamily: '"Noto Sans TC", sans-serif', fontSize: 13.5, fontWeight: 500,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,253,248,0.1)' }}>
        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.18em', color: T.sage, fontWeight: 700, marginBottom: 10 }}>● 模擬 IOT 事件</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <button onClick={() => onSelect('nudge')} style={{ padding: '8px', background: 'rgba(229,191,184,0.15)', color: T.rose, border: '1px solid rgba(229,191,184,0.3)', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter' }}>PIR 觸發</button>
          <button onClick={() => onSelect('medication')} style={{ padding: '8px', background: 'rgba(212,113,42,0.15)', color: T.amberSoft, border: '1px solid rgba(212,113,42,0.3)', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter' }}>用藥時間</button>
          <button onClick={() => onSelect('engage')} style={{ padding: '8px', background: 'rgba(212,113,42,0.15)', color: T.amberSoft, border: '1px solid rgba(212,113,42,0.3)', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter' }}>語音輸入</button>
          <button onClick={() => onSelect('family-call')} style={{ padding: '8px', background: 'rgba(122,148,130,0.15)', color: T.sageSoft, border: '1px solid rgba(122,148,130,0.3)', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter' }}>家人來電</button>
        </div>
      </div>
      <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,253,248,0.1)' }}>
        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.18em', color: T.rose, fontWeight: 700, marginBottom: 8 }}>● ABOUT</div>
        <div style={{ fontFamily: '"Noto Sans TC", sans-serif', fontSize: 12, color: T.ink3, lineHeight: 1.6 }}>
          CAREON Companion · POC v0.1<br />
          AI 智慧身心照護 + 智能給藥機<br />
          12 畫面 · 暗色玻璃 · Newsreader<br />
          Lily mp4 動態 avatar<br />
          基於 Anthropic Design Directions
        </div>
      </div>
    </div>
  );
}

// ===== Main =====
export default function DevicePage() {
  const [screen, setScreen] = useState<ScreenId>('standby');
  const [devOpen, setDevOpen] = useState(false);
  const [time, setTime] = useState('20:25');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    };
    update();
    const timer = setInterval(update, 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') setDevOpen(v => !v);
      if (e.key === 'Escape') setDevOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const currentScreen = SCREENS.find(s => s.id === screen)!;
  const videoSrc = screenToVideo(screen);

  return (
    <>
      {FONTS_LINK}
      <style jsx global>{`
        body { margin: 0; padding: 0; background: ${T.void}; }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes wave0 { 0%, 100% { transform: scaleY(0.6); } 50% { transform: scaleY(1); } }
        @keyframes wave1 { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.5); } }
        @keyframes wave2 { 0%, 100% { transform: scaleY(0.8); } 50% { transform: scaleY(1.2); } }
      `}</style>
      <div style={{ background: T.void, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div
          style={{
            width: 1280, height: 800, maxWidth: '100%', maxHeight: 'calc(100vh - 40px)', aspectRatio: '1280 / 800',
            borderRadius: 28, overflow: 'hidden', position: 'relative', background: T.void,
            boxShadow: '0 60px 120px rgba(0,0,0,0.6), 0 0 0 8px #2A201A, 0 0 0 10px #14100D',
          }}
        >
          {/* Lily Video Background */}
          {videoSrc && (
            <video
              key={videoSrc}
              autoPlay loop muted playsInline
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.85)' }}
            >
              <source src={videoSrc} type="video/mp4" />
            </video>
          )}

          {/* Mood Tint */}
          <div style={{ position: 'absolute', inset: 0, background: moodToTint(currentScreen.mood), pointerEvents: 'none', mixBlendMode: 'overlay' }} />

          {/* Status Bar (top-left time + date) */}
          {screen !== 'standby' && screen !== 'goodnight' && (
            <div style={{ position: 'absolute', top: 22, left: 32, display: 'flex', flexDirection: 'column', color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
              <span style={{ fontFamily: '"Newsreader", serif', fontSize: 30, fontWeight: 500, letterSpacing: '-0.01em' }}>{time}</span>
              <span style={{ fontFamily: 'Inter', fontSize: 13, opacity: 0.85, fontWeight: 500 }}>5/26 週二 · 室溫 24° · 📶</span>
            </div>
          )}

          {/* Screen Content */}
          {screen === 'standby' && <ScreenStandby time={time} onWake={() => setScreen('aria-here')} />}
          {screen === 'aria-here' && <ScreenAriaHere />}
          {screen === 'nudge' && <ScreenNudge />}
          {screen === 'engage' && <ScreenEngage />}
          {screen === 'health' && <ScreenHealth />}
          {screen === 'companion-confirm' && <ScreenCompanionConfirm onConfirm={() => setScreen('companion')} onCancel={() => setScreen('aria-here')} />}
          {screen === 'companion' && <ScreenCompanion onEnd={() => setScreen('aria-here')} />}
          {screen === 'medication' && <ScreenMedication />}
          {screen === 'family-call' && <ScreenFamilyCall onEnd={() => setScreen('aria-here')} />}
          {screen === 'menu' && <ScreenMenu onPick={setScreen} />}
          {screen === 'reflect' && <ScreenReflect />}
          {screen === 'goodnight' && <ScreenGoodnight time={time} />}

          {/* Bottom Floating Buttons */}
          {screen !== 'standby' && screen !== 'goodnight' && screen !== 'menu' && screen !== 'family-call' && screen !== 'companion-confirm' && (
            <div style={{ position: 'absolute', bottom: 26, left: 26, right: 26, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pointerEvents: 'none' }}>
              <CircleBtn label="陪伴聊天" sub="剩 82 分" icon="💬" bg={T.amber} onClick={() => setScreen('companion-confirm')} />
              <VoicePill />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end', pointerEvents: 'auto' }}>
                <CircleBtn label="呼叫家人" icon="📞" bg={T.sage} size={56} onClick={() => setScreen('family-call')} />
                <CircleBtn label="選單" icon="☰" bg="rgba(36,28,20,0.78)" size={56} onClick={() => setScreen('menu')} />
              </div>
            </div>
          )}

          {/* Dev Panel toggle */}
          {!devOpen && (
            <button
              onClick={() => setDevOpen(true)}
              style={{
                position: 'absolute', bottom: 12, right: 12, width: 36, height: 36, borderRadius: '50%',
                background: T.glassDarkDeep, color: T.amber, fontFamily: '"JetBrains Mono", monospace', fontSize: 12, fontWeight: 700,
                border: '1px solid rgba(212,113,42,0.4)', cursor: 'pointer', opacity: 0.6, zIndex: 50,
              }}
              title="開發者面板 · 按 D 切換"
            >
              D
            </button>
          )}

          {/* Dev Panel */}
          {devOpen && <DevPanel currentScreen={screen} onSelect={setScreen} onClose={() => setDevOpen(false)} />}
        </div>
      </div>
    </>
  );
}
