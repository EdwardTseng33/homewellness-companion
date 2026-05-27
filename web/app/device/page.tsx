'use client';

// CAREON Companion · 8" 1280×800 Device POC
// 12 screens + 玻璃語言 + Lily mp4 avatar + Dev Panel
// Design tokens 從 Anthropic Design 拆出 (window-primitives.jsx)

import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, Phone, Menu, BarChart3, Pill, Search,
  Thermometer, Users, Radio, User, Mic, Video as VideoIcon,
} from 'lucide-react';

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
  { id: 'companion', label: '06 · 陪伴聊天 · 計時中', mood: 'rose' },
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

// 比照 Anthropic Design 設計稿：每個畫面背景是靜態 lifestyle 真人照片（不是 mp4）
// 只有「說話」場景（engage / companion）才用 mp4 做嘴型對嘴
function screenToBg(s: ScreenId): { type: 'img' | 'video'; src: string } | null {
  if (s === 'standby' || s === 'goodnight' || s === 'family-call' || s === 'menu' || s === 'reflect') return null;
  if (s === 'engage' || s === 'companion') return { type: 'video', src: '/lily/lily-talking.mp4' };
  // 其餘畫面用 lily-portrait.png 靜態（跟設計稿一致）
  return { type: 'img', src: '/lily/lily-portrait.png' };
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

function CircleBtn({ label, sub, icon, bg, size = 72, onClick }: { label: string; sub?: string; icon: React.ReactNode; bg: string; size?: number; onClick?: () => void }) {
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
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 28px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.65), transparent)',
            borderRadius: 999, pointerEvents: 'none',
          }}
        />
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
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
    listening: { color: T.amber, text: '直接說、莉莉在聽', sub: '或說「莉莉、聊聊」「找大華」「該吃藥了」' },
    speaking: { color: T.sage, text: '莉莉正在說話…', sub: '說「等等」可以打斷' },
    thinking: { color: T.rose, text: '莉莉想一下…', sub: '正在查藥單 / 拉血壓' },
  }[state];
  return (
    <div
      style={{
        padding: '14px 28px',
        background: 'rgba(36,28,20,0.78)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        borderRadius: 999,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        boxShadow: '0 10px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.16)',
        border: '1px solid rgba(255,255,255,0.10)',
        minWidth: 280,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* 5 條波形動畫 · 不是靜態圓點 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 18 }}>
          {[0, 1, 2, 1, 0].map((idx, i) => (
            <span
              key={i}
              style={{
                width: 3, height: 14,
                background: config.color,
                borderRadius: 2,
                boxShadow: `0 0 6px ${config.color}aa`,
                animation: `wave${idx} ${1.0 + i * 0.12}s ease-in-out infinite`,
                animationDelay: `${i * 0.08}s`,
                transformOrigin: 'center',
              }}
            />
          ))}
        </div>
        <span style={{
          fontFamily: '"Noto Serif TC", serif',
          fontSize: 19, fontWeight: 500, color: '#fff', letterSpacing: '0.02em',
        }}>{config.text}</span>
      </div>
      <span style={{
        fontFamily: '"Noto Sans TC", sans-serif',
        fontSize: 11, color: 'rgba(255,255,255,0.55)',
        letterSpacing: '0.04em', marginTop: 2,
      }}>{config.sub}</span>
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
    // 整個畫面可點 = 觸碰任意處或說「莉莉」喚醒 · 不放實體大按鈕
    <div
      onClick={onWake}
      style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: T.paper, cursor: 'pointer' }}
    >
      {/* 左上角溫濕度 */}
      <div style={{ position: 'absolute', top: 32, left: 32, display: 'flex', flexDirection: 'column', gap: 4, fontFamily: '"JetBrains Mono", monospace', fontSize: 13, letterSpacing: '0.14em', color: T.paper, opacity: 0.5 }}>
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
      <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.34em', marginTop: 56, opacity: 0.32, color: T.amberSoft }}>
        CAREON COMPANION · 莉莉待機中
      </div>
      {/* 底部極簡語音提示 · 不是按鈕 · 整個畫面都能點 */}
      <div style={{ position: 'absolute', bottom: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.62 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 14 }}>
          {[0, 1, 2, 1, 0].map((idx, i) => (
            <span
              key={i}
              style={{
                width: 2, height: 10,
                background: T.amberSoft,
                borderRadius: 2,
                animation: `wave${idx} ${1.2 + i * 0.1}s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
                transformOrigin: 'center',
              }}
            />
          ))}
        </div>
        <span style={{ fontFamily: '"Noto Serif TC", serif', fontSize: 14, color: T.amberSoft, letterSpacing: '0.08em' }}>
          說「莉莉」喚醒 · 或觸碰螢幕
        </span>
      </div>
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

// 已移除 ScreenCompanionConfirm · 按 Edward 5/27 指令簡化操作
// 點「陪伴聊天」或語音說「聊聊」 = 直接進入計時、不需中間確認彈窗
// 計費規則（NT$2/分、本月剩 82 分）改放在 ScreenCompanion 內角落小字

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
      {/* 暖光室內漸層背景 · 模擬兒子家中環境 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse at 30% 25%, rgba(248,210,165,0.45) 0%, transparent 55%),
          radial-gradient(ellipse at 75% 70%, rgba(201,104,95,0.18) 0%, transparent 50%),
          linear-gradient(160deg, #3D2E22 0%, #2A1F18 45%, #1F1A14 100%)
        `,
      }} />

      {/* 兒子大華頭像 placeholder · 大圓 + 漸層 + 「華」字 + 暖光 ring */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -56%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 220, height: 220, borderRadius: '50%',
          background: 'linear-gradient(135deg, #E5BFB8 0%, #C9685F 60%, #A04A45 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff',
          fontFamily: '"Noto Serif TC", serif',
          fontSize: 96, fontWeight: 500,
          boxShadow: '0 24px 60px rgba(201,104,95,0.45), 0 0 0 6px rgba(255,253,248,0.08), inset 0 3px 0 rgba(255,255,255,0.25)',
        }}>華</div>
        <span style={{
          color: 'rgba(255,253,248,0.92)',
          fontFamily: '"Newsreader", "Noto Serif TC", serif',
          fontSize: 28, fontWeight: 500, letterSpacing: '0.02em',
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}>兒子 · 大華</span>
        <span style={{
          color: 'rgba(255,253,248,0.62)',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 12, letterSpacing: '0.18em',
        }}>HE PICKED UP · 02:14</span>
      </div>

      {/* LIVE 玻璃膠囊 · 紅脈動點 + 計時 · 在主時間 chip 旁 */}
      <div style={{
        position: 'absolute', top: 24, left: 200,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 16px',
        background: 'rgba(216,90,85,0.92)', color: '#fff',
        backdropFilter: 'blur(14px) saturate(140%)',
        WebkitBackdropFilter: 'blur(14px) saturate(140%)',
        borderRadius: 999,
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 12, fontWeight: 700, letterSpacing: '0.18em',
        boxShadow: '0 6px 20px rgba(216,90,85,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: '#fff',
          animation: 'pulse 1.4s ease-in-out infinite',
        }} />
        LIVE · 02:14
      </div>

      {/* PIP 玻璃框 · 阿姨自己鏡頭 placeholder */}
      <div style={{
        position: 'absolute', top: 92, right: 32,
        width: 196, height: 138, borderRadius: 16,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #3A2820 0%, #1F1B17 100%)',
        border: '1.5px solid rgba(255,255,255,0.22)',
        boxShadow: '0 12px 36px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 6,
      }}>
        {/* 阿姨頭像 placeholder · 暖色漸層圓 + 「阿」字 */}
        <div style={{
          width: 54, height: 54, borderRadius: '50%',
          background: 'linear-gradient(135deg, #E5BFB8, #C9685F)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: '"Noto Serif TC", serif',
          fontSize: 22, fontWeight: 500,
          boxShadow: '0 4px 12px rgba(201,104,95,0.4)',
        }}>阿</div>
        <span style={{ color: 'rgba(255,255,255,0.78)', fontFamily: 'Inter', fontSize: 11, letterSpacing: '0.06em' }}>我 · 王阿姨</span>
      </div>

      {/* 中央狀態提示（不擋臉、低調） */}
      <div style={{
        position: 'absolute', top: 80, left: '50%',
        transform: 'translateX(-50%)',
        padding: '6px 16px',
        background: 'rgba(36,28,20,0.55)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 999,
        color: 'rgba(255,255,255,0.88)',
        fontFamily: '"Noto Sans TC", sans-serif',
        fontSize: 13, fontWeight: 500, letterSpacing: '0.04em',
      }}>
        通話中 · 兒子 · 大華
      </div>

      {/* 底部 3 顆按鈕 · 玻璃化圓鈕 + 中央紅膠囊 */}
      <div style={{
        position: 'absolute', bottom: 86, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', gap: 22, alignItems: 'center',
      }}>
        {/* Mic 玻璃圓鈕 */}
        <button style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(36,28,20,0.72)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          border: '1.5px solid rgba(255,255,255,0.20)',
          boxShadow: '0 10px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.20)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="8" y1="22" x2="16" y2="22" />
          </svg>
        </button>

        {/* End call 紅膠囊 */}
        <button onClick={onEnd} style={{
          padding: '20px 42px', borderRadius: 999,
          background: 'linear-gradient(135deg, #D85A55 0%, #C04540 100%)',
          color: '#fff', border: 'none',
          fontFamily: '"Noto Serif TC", serif',
          fontSize: 22, fontWeight: 500, letterSpacing: '0.04em',
          boxShadow: '0 14px 36px rgba(216,90,85,0.55), inset 0 1px 0 rgba(255,255,255,0.25)',
          cursor: 'pointer',
        }}>結束</button>

        {/* Camera 玻璃圓鈕 */}
        <button style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(36,28,20,0.72)',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          border: '1.5px solid rgba(255,255,255,0.20)',
          boxShadow: '0 10px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.20)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>
      </div>

      {/* Demo placeholder note */}
      <div style={{
        position: 'absolute', bottom: 28, left: 32,
        fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
        color: 'rgba(255,255,255,0.55)', letterSpacing: '0.18em',
      }}>● 示範影像 · 真實版接通兒子大華視訊</div>
    </>
  );
}

function ScreenMenu({ onPick }: { onPick: (s: ScreenId) => void }) {
  const items: { label: string; icon: React.ReactNode; tint: string; screen?: ScreenId }[] = [
    { label: '健康報告', icon: <BarChart3 size={28} strokeWidth={1.6} />, tint: T.amber, screen: 'reflect' },
    { label: '今日用藥', icon: <Pill size={28} strokeWidth={1.6} />, tint: T.amber, screen: 'medication' },
    { label: '藥箱監測', icon: <Search size={28} strokeWidth={1.6} />, tint: T.sage },
    { label: '環境感測', icon: <Thermometer size={28} strokeWidth={1.6} />, tint: T.sage },
    { label: '聯絡家人', icon: <Users size={28} strokeWidth={1.6} />, tint: T.rose, screen: 'family-call' },
    { label: '陪伴聊天', icon: <MessageCircle size={28} strokeWidth={1.6} />, tint: T.rose, screen: 'companion' },
    { label: '連線裝置', icon: <Radio size={28} strokeWidth={1.6} />, tint: T.amber },
    { label: '個人資料', icon: <User size={28} strokeWidth={1.6} />, tint: T.sage },
  ];
  return (
    <div style={{
      position: 'absolute', inset: 60,
      background: 'rgba(255,253,248,0.92)',
      backdropFilter: 'blur(28px) saturate(140%)',
      WebkitBackdropFilter: 'blur(28px) saturate(140%)',
      borderRadius: 28,
      padding: 36,
      display: 'flex', flexDirection: 'column', gap: 24,
      boxShadow: '0 24px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.55)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.22em', color: T.ink3 }}>WHAT WOULD YOU LIKE</span>
        <span style={{ fontFamily: '"Newsreader", "Noto Serif TC", serif', fontSize: 30, fontWeight: 500, color: T.ink, letterSpacing: '-0.01em' }}>想做什麼？</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: 16, flex: 1 }}>
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => item.screen && onPick(item.screen)}
            style={{
              background: '#FFFEFA',
              border: '1px solid rgba(31,27,23,0.06)',
              borderRadius: 20, padding: '20px 14px',
              cursor: item.screen ? 'pointer' : 'default',
              opacity: item.screen ? 1 : 0.72,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
              boxShadow: '0 6px 18px rgba(31,27,23,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease',
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: item.tint, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 6px 16px ${item.tint}55`,
            }}>{item.icon}</div>
            <span style={{ fontFamily: '"Noto Serif TC", serif', fontSize: 17, fontWeight: 500, color: T.ink, letterSpacing: '0.01em' }}>{item.label}</span>
          </button>
        ))}
      </div>
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
  const bg = screenToBg(screen);

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
          {/* Lifestyle 真人照片 / 說話 mp4 背景 · 比照設計稿 */}
          {bg && bg.type === 'video' && (
            <video
              key={bg.src}
              autoPlay loop muted playsInline
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            >
              <source src={bg.src} type="video/mp4" />
            </video>
          )}
          {bg && bg.type === 'img' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={bg.src}
              src={bg.src}
              alt="Lily"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}

          {/* Mood Tint · 弱化、不擋臉 */}
          <div style={{ position: 'absolute', inset: 0, background: moodToTint(currentScreen.mood), pointerEvents: 'none', mixBlendMode: 'soft-light', opacity: 0.6 }} />

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
          {screen === 'companion' && <ScreenCompanion onEnd={() => setScreen('aria-here')} />}
          {screen === 'medication' && <ScreenMedication />}
          {screen === 'family-call' && <ScreenFamilyCall onEnd={() => setScreen('aria-here')} />}
          {screen === 'menu' && <ScreenMenu onPick={setScreen} />}
          {screen === 'reflect' && <ScreenReflect />}
          {screen === 'goodnight' && <ScreenGoodnight time={time} />}

          {/* Bottom Floating Buttons */}
          {/* 底部 = 語音優先、按鈕極簡 · 中央 VoicePill 主視覺 / 右下選單最小化 */}
          {screen !== 'standby' && screen !== 'goodnight' && screen !== 'menu' && screen !== 'family-call' && (
            <div style={{ position: 'absolute', bottom: 32, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
              <div style={{ pointerEvents: 'auto' }}><VoicePill /></div>
              <button
                onClick={() => setScreen('menu')}
                aria-label="選單"
                style={{
                  position: 'absolute', right: 32, bottom: 0,
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'rgba(36,28,20,0.55)',
                  backdropFilter: 'blur(14px) saturate(140%)',
                  WebkitBackdropFilter: 'blur(14px) saturate(140%)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  cursor: 'pointer', pointerEvents: 'auto',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                }}
              >
                <Menu size={18} strokeWidth={1.8} color="#fff" />
              </button>
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
