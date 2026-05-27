'use client';

// CAREON Companion · 8" 1280×800 Device POC
// 12 screens + 玻璃語言 + Lily mp4 avatar + Dev Panel
// Design tokens 從 Anthropic Design 拆出 (window-primitives.jsx)

import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, Phone, Menu, BarChart3, Pill, Search,
  Thermometer, Users, Radio, User, Mic, Video as VideoIcon,
  AlertCircle, X,
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
  { id: 'companion-confirm', label: '06 · 陪伴聊天 · 確認', mood: 'rose' },
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

// 比照 Anthropic Design 設計稿：每個畫面背景是靜態 lifestyle 真人照片（不是 mp4）
// 只有「說話」場景（engage / companion）才用 mp4 做嘴型對嘴
// 選單 menu 設計稿也是莉莉在背景 + 玻璃磁磚浮上（窗景哲學）
function screenToBg(s: ScreenId): { type: 'img' | 'video'; src: string } | null {
  if (s === 'standby' || s === 'goodnight' || s === 'family-call' || s === 'reflect') return null;
  if (s === 'engage' || s === 'companion') return { type: 'video', src: '/lily/lily-talking.mp4' };
  if (s === 'companion-confirm') return { type: 'img', src: '/lily/lily-portrait.png' };
  // 其餘畫面（含 menu）用 lily-portrait.png 靜態
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
    listening: { color: T.amber, text: '直接說、莉莉在聽' },
    speaking: { color: T.sage, text: '莉莉正在說話…' },
    thinking: { color: T.rose, text: '莉莉想一下…' },
  }[state];
  return (
    <div
      style={{
        padding: '12px 24px',
        background: 'rgba(36,28,20,0.72)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        borderRadius: 999,
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.14)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* 5 條波形動畫 · 不是靜態圓點 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 16 }}>
        {[0, 1, 2, 1, 0].map((idx, i) => (
          <span
            key={i}
            style={{
              width: 3, height: 12,
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
        fontSize: 17, fontWeight: 500, color: '#fff', letterSpacing: '0.02em',
      }}>{config.text}</span>
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
      {/* 中央 CAREON Companion logo · 待機時的品牌主軸 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 28, opacity: 0.78 }}>
        <div style={{
          fontFamily: '"Newsreader", serif',
          fontSize: 26, fontWeight: 400, letterSpacing: '0.18em',
          color: T.amberSoft,
        }}>
          CAREON
        </div>
        <div style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10, fontWeight: 500, letterSpacing: '0.42em',
          color: T.paper, opacity: 0.5,
        }}>
          COMPANION
        </div>
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
  // 純語音 TTS · 設計稿明定無文字 transcript · 只有中央音頻 bar 動畫
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {[10, 18, 26, 14, 22, 32, 16, 20, 28, 12, 24, 18, 26, 14, 20].map((h, i) => (
          <span key={i} style={{ width: 6, height: h * 2, borderRadius: 3, background: T.amber, opacity: 0.65 + (i % 3) * 0.1, animation: `wave${i % 3} 1.2s ease-in-out infinite` }} />
        ))}
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

// 06 · 陪伴聊天 · 進入確認彈窗（5/27 還原 · 對齊 DESIGN_NOTES）
function ScreenCompanionConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      {/* 背景遮罩 · 莉莉照片透出 */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(31,27,23,0.38)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
      }} />
      {/* 中央玻璃確認卡 */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -52%)',
        width: 460,
        background: T.glassDeep,
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        borderRadius: 28,
        padding: '32px 36px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.55)',
        border: '1px solid rgba(255,255,255,0.4)',
      }}>
        {/* 頂緣高光 */}
        <div style={{
          position: 'absolute', top: 0, left: 16, right: 16, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)',
          borderRadius: 999,
        }} />
        {/* mono 標籤 */}
        <span style={{
          display: 'block',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 11, letterSpacing: '0.22em',
          fontWeight: 700, color: T.rose,
          marginBottom: 12,
        }}>
          ● 陪伴聊天 · 確認進入
        </span>
        {/* 主問句 */}
        <div style={{
          fontFamily: '"Newsreader", "Noto Serif TC", serif',
          fontSize: 28, fontWeight: 500,
          color: T.ink, lineHeight: 1.35,
          letterSpacing: '-0.01em',
          marginBottom: 18,
        }}>
          要跟莉莉聊聊嗎？
        </div>
        {/* 副說明 · 費率 + 額度 */}
        <div style={{
          fontFamily: '"Noto Serif TC", serif',
          fontSize: 17, color: T.ink2, lineHeight: 1.6,
          marginBottom: 28,
        }}>
          本月還剩 <span style={{ color: T.amber, fontWeight: 600 }}>82 分鐘</span> · 每分鐘 <span style={{ color: T.amber, fontWeight: 600 }}>NT$ 2</span>
        </div>
        {/* 兩鈕 · 等一下（次要）+ 開始聊聊（主要 amber） */}
        <div style={{ display: 'flex', gap: 14 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '15px 24px',
            background: 'rgba(31,27,23,0.06)',
            color: T.ink, border: '1px solid rgba(31,27,23,0.10)',
            borderRadius: 999,
            fontFamily: '"Noto Serif TC", serif',
            fontSize: 17, fontWeight: 500,
            cursor: 'pointer',
            letterSpacing: '0.02em',
          }}>
            等一下
          </button>
          <button onClick={onConfirm} style={{
            flex: 1.2, padding: '15px 24px',
            background: `linear-gradient(135deg, ${T.amber} 0%, #B85F1F 100%)`,
            color: '#fff', border: 'none',
            borderRadius: 999,
            fontFamily: '"Noto Serif TC", serif',
            fontSize: 17, fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '0.02em',
            boxShadow: `0 10px 24px ${T.amber}66, inset 0 1px 0 rgba(255,255,255,0.25)`,
          }}>
            開始聊聊
          </button>
        </div>
      </div>
    </>
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

      {/* 左側直立式音量條 · 通話音量 8 格 · 對齊 DESIGN_NOTES L83 */}
      <div style={{
        position: 'absolute', top: '50%', left: 36,
        transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
        <span style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10, letterSpacing: '0.20em',
          color: 'rgba(255,253,248,0.62)', fontWeight: 700,
          writingMode: 'vertical-rl', textOrientation: 'mixed',
          transform: 'rotate(180deg)',
        }}>VOLUME · 6 / 10</span>
        <div style={{
          width: 8, height: 220, borderRadius: 6,
          background: 'rgba(36,28,20,0.45)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: 4,
          display: 'flex', flexDirection: 'column-reverse', gap: 3,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.10)',
        }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
            <span key={i} style={{
              flex: 1, borderRadius: 2,
              background: i < 6 ? T.amber : 'rgba(255,253,248,0.12)',
              boxShadow: i < 6 ? `0 0 6px ${T.amber}77` : 'none',
            }} />
          ))}
        </div>
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
    { label: '健康報告', icon: <BarChart3 size={26} strokeWidth={1.6} />, tint: T.amber, screen: 'reflect' },
    { label: '今日用藥', icon: <Pill size={26} strokeWidth={1.6} />, tint: T.amber, screen: 'medication' },
    { label: '藥箱監測', icon: <Search size={26} strokeWidth={1.6} />, tint: T.sage },
    { label: '環境感測', icon: <Thermometer size={26} strokeWidth={1.6} />, tint: T.sage },
    { label: '聯絡家人', icon: <Users size={26} strokeWidth={1.6} />, tint: T.rose, screen: 'family-call' },
    { label: '陪伴聊天', icon: <MessageCircle size={26} strokeWidth={1.6} />, tint: T.rose, screen: 'companion-confirm' },
    { label: '連線裝置', icon: <Radio size={26} strokeWidth={1.6} />, tint: T.amber },
    { label: '個人資料', icon: <User size={26} strokeWidth={1.6} />, tint: T.sage },
  ];
  return (
    <>
      {/* 莉莉照片半透明遮罩 · 讓選單磁磚可讀但仍看得到背後莉莉（窗景哲學） */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(31,27,23,0.32)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        pointerEvents: 'none',
      }} />

      {/* 玻璃面板 · 透出莉莉 + 8 磁磚 · inset 留底部空間給浮鈕 */}
      <div style={{
        position: 'absolute', top: 60, left: 80, right: 80, bottom: 110,
        background: 'rgba(255,253,248,0.62)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        borderRadius: 28,
        padding: '28px 36px',
        display: 'flex', flexDirection: 'column', gap: 20,
        boxShadow: '0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.55)',
        border: '1px solid rgba(255,255,255,0.4)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.22em', color: T.ink3 }}>WHAT WOULD YOU LIKE</span>
          <span style={{ fontFamily: '"Newsreader", "Noto Serif TC", serif', fontSize: 28, fontWeight: 500, color: T.ink, letterSpacing: '-0.01em' }}>想做什麼？</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: 14, flex: 1 }}>
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => item.screen && onPick(item.screen)}
              style={{
                background: '#FFFEFA',
                border: '1px solid rgba(31,27,23,0.06)',
                borderRadius: 18, padding: '16px 12px',
                cursor: item.screen ? 'pointer' : 'default',
                opacity: item.screen ? 1 : 0.72,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 6px 18px rgba(31,27,23,0.10), inset 0 1px 0 rgba(255,255,255,0.8)',
                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: item.tint, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 6px 16px ${item.tint}55`,
              }}>{item.icon}</div>
              <span style={{ fontFamily: '"Noto Serif TC", serif', fontSize: 16, fontWeight: 500, color: T.ink, letterSpacing: '0.01em' }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3 顆常駐浮鈕 · 左下緊急聯絡 / 右下底層呼叫家人 / 右下上層返回 */}
      {/* 左下 · 緊急聯絡（紅膠囊） */}
      <button
        onClick={() => alert('（demo）緊急聯絡已撥出、人工確認後通報 119')}
        style={{
          position: 'absolute', bottom: 26, left: 32,
          padding: '14px 24px', borderRadius: 999,
          background: 'linear-gradient(135deg, #D85A55 0%, #C04540 100%)',
          color: '#fff', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: '"Noto Serif TC", serif', fontSize: 16, fontWeight: 500,
          boxShadow: '0 12px 32px rgba(216,90,85,0.50), inset 0 1px 0 rgba(255,255,255,0.22)',
        }}
      >
        <AlertCircle size={20} strokeWidth={2.2} />緊急聯絡
      </button>

      {/* 右下底層 · 呼叫家人（sage 玻璃圓鈕） */}
      <button
        onClick={() => onPick('family-call')}
        aria-label="呼叫家人"
        style={{
          position: 'absolute', bottom: 26, right: 92,
          width: 56, height: 56, borderRadius: '50%',
          background: T.sage,
          backdropFilter: 'blur(18px) saturate(140%)',
          WebkitBackdropFilter: 'blur(18px) saturate(140%)',
          border: '1px solid rgba(255,255,255,0.20)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 22px rgba(122,148,130,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
        }}
      >
        <Phone size={20} strokeWidth={1.8} color="#fff" />
      </button>

      {/* 右下上層 · 返回 X */}
      <button
        onClick={() => onPick('aria-here')}
        aria-label="返回"
        style={{
          position: 'absolute', bottom: 26, right: 32,
          width: 48, height: 48, borderRadius: '50%',
          background: 'rgba(36,28,20,0.62)',
          backdropFilter: 'blur(14px) saturate(140%)',
          WebkitBackdropFilter: 'blur(14px) saturate(140%)',
          border: '1px solid rgba(255,255,255,0.16)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
        }}
      >
        <X size={18} strokeWidth={2} color="#fff" />
      </button>
    </>
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
      {/* 可傳給家人按鈕 · 對齊 DESIGN_NOTES L89 */}
      <div style={{ marginTop: 28, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={() => alert('（demo）今日回顧已分享給兒子大華')}
          style={{
            padding: '13px 26px',
            background: `linear-gradient(135deg, ${T.sage} 0%, #62806A 100%)`,
            color: '#fff', border: 'none',
            borderRadius: 999,
            fontFamily: '"Noto Serif TC", serif',
            fontSize: 16, fontWeight: 500,
            letterSpacing: '0.04em',
            cursor: 'pointer',
            boxShadow: `0 8px 22px ${T.sage}66, inset 0 1px 0 rgba(255,255,255,0.25)`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <Users size={18} strokeWidth={1.8} />傳給家人
        </button>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: T.ink3, letterSpacing: '0.04em' }}>
          兒子 · 大華 收到 LINE 摘要
        </span>
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
        長按 3 秒 · 緊急聯絡
      </div>
      {/* SOS 實體按鈕 · 底部唯一互動 · 對齊 DESIGN_NOTES L90「只留 SOS」*/}
      <button
        onClick={() => alert('（demo）SOS 已啟動 · 真實版長按 3 秒會撥出緊急聯絡')}
        aria-label="SOS 緊急聯絡"
        style={{
          position: 'absolute', bottom: 48, left: '50%',
          transform: 'translateX(-50%)',
          width: 84, height: 84, borderRadius: '50%',
          background: `radial-gradient(circle at 32% 28%, #E97570 0%, ${T.red} 60%, #A03832 100%)`,
          color: '#fff', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Newsreader", serif',
          fontSize: 22, fontWeight: 600, letterSpacing: '0.16em',
          boxShadow: `0 16px 40px ${T.red}55, inset 0 2px 0 rgba(255,255,255,0.28), 0 0 0 2px rgba(216,90,85,0.18)`,
        }}
      >
        SOS
      </button>
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

          {/* Status Bar · 純文字浮在莉莉照片上、不加 chip 框 · 比照設計稿 */}
          {screen !== 'standby' && screen !== 'goodnight' && (
            <div style={{
              position: 'absolute', top: 22, left: 32,
              display: 'flex', flexDirection: 'column', gap: 2,
              color: '#fff',
              textDecoration: 'none',
              textShadow: '0 2px 12px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.4)',
            }}>
              <span style={{ fontFamily: '"Newsreader", serif', fontSize: 30, fontWeight: 500, letterSpacing: '-0.01em', textDecoration: 'none', lineHeight: 1.1 }}>{time}</span>
              <span style={{ fontFamily: 'Inter, "Noto Sans TC", sans-serif', fontSize: 13, opacity: 0.92, fontWeight: 500, letterSpacing: '0.02em', textDecoration: 'none' }}>5/26 週二 · 室溫 24°</span>
            </div>
          )}

          {/* Screen Content */}
          {screen === 'standby' && <ScreenStandby time={time} onWake={() => setScreen('aria-here')} />}
          {screen === 'aria-here' && <ScreenAriaHere />}
          {screen === 'nudge' && <ScreenNudge />}
          {screen === 'engage' && <ScreenEngage />}
          {screen === 'health' && <ScreenHealth />}
          {screen === 'companion-confirm' && (
            <ScreenCompanionConfirm
              onConfirm={() => setScreen('companion')}
              onCancel={() => setScreen('aria-here')}
            />
          )}
          {screen === 'companion' && <ScreenCompanion onEnd={() => setScreen('aria-here')} />}
          {screen === 'medication' && <ScreenMedication />}
          {screen === 'family-call' && <ScreenFamilyCall onEnd={() => setScreen('aria-here')} />}
          {screen === 'menu' && <ScreenMenu onPick={setScreen} />}
          {screen === 'reflect' && <ScreenReflect />}
          {screen === 'goodnight' && <ScreenGoodnight time={time} />}

          {/* Bottom Floating Buttons */}
          {/* 底部 4 元素 · 比照設計稿（DESIGN_NOTES L100-104）：
              左下「陪伴聊天 amber 72px」+ 中央 VoicePill + 右下底「呼叫家人 sage 56px」+ 右下上「選單 56px」
              語音優先 + 按鈕並排輔助、VoicePill 仍中央主視覺 */}
          {screen !== 'standby' && screen !== 'goodnight' && screen !== 'menu' && screen !== 'family-call' && screen !== 'companion-confirm' && (
            <div style={{ position: 'absolute', bottom: 26, left: 26, right: 26, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pointerEvents: 'none' }}>
              {/* 左下 · 陪伴聊天 amber 72px 含「剩 82 分」副字 */}
              <CircleBtn
                label="陪伴聊天"
                sub="剩 82 分"
                icon={<MessageCircle size={28} strokeWidth={1.8} color="#fff" />}
                bg={T.amber}
                onClick={() => setScreen('companion-confirm')}
              />
              {/* 中央 · VoicePill 主視覺（語音優先） */}
              <div style={{ pointerEvents: 'auto', marginBottom: 8 }}><VoicePill /></div>
              {/* 右下 · 呼叫家人（底） + 選單（上）兩顆疊放 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end', pointerEvents: 'auto' }}>
                <CircleBtn
                  label="呼叫家人"
                  icon={<Phone size={22} strokeWidth={1.8} color="#fff" />}
                  bg={T.sage}
                  size={56}
                  onClick={() => setScreen('family-call')}
                />
                <CircleBtn
                  label="選單"
                  icon={<Menu size={22} strokeWidth={1.8} color="#fff" />}
                  bg="rgba(36,28,20,0.78)"
                  size={56}
                  onClick={() => setScreen('menu')}
                />
              </div>
            </div>
          )}

          {/* Dev Panel · 仍在裝置框內顯示（佔右側） */}
          {devOpen && <DevPanel currentScreen={screen} onSelect={setScreen} onClose={() => setDevOpen(false)} />}
        </div>

        {/* D 鈕移到裝置框外 · 不污染窗景 · 按 D 鍵也可切換 */}
        {!devOpen && (
          <button
            onClick={() => setDevOpen(true)}
            style={{
              position: 'fixed', top: 20, right: 20,
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,253,248,0.45)',
              fontFamily: '"JetBrains Mono", monospace', fontSize: 12, fontWeight: 700,
              border: '1px solid rgba(255,255,255,0.10)',
              cursor: 'pointer', zIndex: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              letterSpacing: '0.02em',
            }}
            title="開發者面板 · 按 D 切換 / 演示用"
          >
            D
          </button>
        )}
      </div>
    </>
  );
}
