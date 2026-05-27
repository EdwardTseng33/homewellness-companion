'use client';

// CAREON Companion · 8" 1280×800 Device POC
// 12 screens + 玻璃語言 + Lily mp4 avatar + Dev Panel
// Design tokens 從 Anthropic Design 拆出 (window-primitives.jsx)

import { useState, useEffect } from 'react';
import {
  MessageCircle, Phone, PhoneOff, Menu, BarChart3, Pill, Search,
  Thermometer, Users, Radio, User, Mic, Video as VideoIcon, VideoOff,
  AlertCircle, X, Check, AlertTriangle, Square, Plus, Minus,
} from 'lucide-react';

// === Design Tokens ===
const T = {
  void: '#1a1612',
  ink: '#1F1B17',
  ink2: '#5A4F46',
  ink3: '#8A7F73',
  glass: 'rgba(255,253,248,0.36)',
  glassDeep: 'rgba(255,253,248,0.94)',
  glassDark: 'rgba(36,28,20,0.55)',
  glassDarkDeep: 'rgba(36,28,20,0.78)',
  amber: '#D4712A',
  amberSoft: '#F3D7B8',
  sage: '#7A9482',
  sageSoft: '#C7D7CC',
  rose: '#E5BFB8',
  roseDeep: '#C9685F',
  red: '#D85A55',
  paper: '#eaddc7',
  muted: '#9B8E80',
  navy: '#5A7A8A',
  violet: '#7C5CFC',
} as const;

// type 保留 12 個（避免大量 compile error）但 SCREENS 只列設計稿有的 8 個
// 砍掉：04 純語音對話 / 06 陪伴聊天確認 / 11 今日回顧 / 12 晚安模式
// 這 4 個畫面不在設計稿 · 不展示給面試官看
type ScreenId =
  | 'standby' | 'aria-here' | 'nudge' | 'engage' | 'health'
  | 'companion-confirm' | 'companion' | 'medication'
  | 'family-call' | 'menu' | 'reflect' | 'goodnight';

const SCREENS: { id: ScreenId; label: string; mood: 'sage' | 'amber' | 'rose' | 'dark' }[] = [
  { id: 'standby', label: '01 · 待機 Standby', mood: 'dark' },
  { id: 'aria-here', label: '02 · 莉莉在 Aria Here', mood: 'sage' },
  { id: 'nudge', label: '03 · 主動關懷 Nudge', mood: 'rose' },
  { id: 'health', label: '05 · 健康關心 Check-in', mood: 'sage' },
  { id: 'companion', label: '07 · 陪伴聊天', mood: 'rose' },
  { id: 'medication', label: '08 · 用藥提醒', mood: 'amber' },
  { id: 'family-call', label: '09 · 家人視訊', mood: 'amber' },
  { id: 'menu', label: '10 · 選單', mood: 'sage' },
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
  // companion 用清晰莉莉笑容靜態圖（設計稿 07）
  if (s === 'engage') return { type: 'video', src: '/lily/lily-talking.mp4' };
  if (s === 'companion') return { type: 'img', src: '/lily/lily-portrait.png' };
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
        padding: '18px 22px',
        maxWidth: 460,
        fontFamily: '"Noto Serif TC", "Newsreader", serif',
        fontSize: 17,
        lineHeight: 1.55,
        boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        borderLeft: accent ? `3px solid ${accent}` : 'none',
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
      {/* bubble tail · 指向莉莉的小三角 */}
      <span style={{
        position: 'absolute',
        right: side === 'right' ? undefined : -8,
        left: side === 'right' ? -8 : undefined,
        top: 30,
        width: 0, height: 0,
        borderTop: '7px solid transparent',
        borderBottom: '7px solid transparent',
        borderLeft: side === 'right' ? undefined : `9px solid ${dark ? T.glassDarkDeep : T.glassDeep}`,
        borderRight: side === 'right' ? `9px solid ${dark ? T.glassDarkDeep : T.glassDeep}` : undefined,
        filter: 'drop-shadow(2px 0 4px rgba(0,0,0,0.10))',
        pointerEvents: 'none',
      }} />
      {children}
    </div>
  );
}

// === StatusBadge · 設計稿摘要面板每行的 status icon ===
function StatusBadge({ status }: { status: 'ok' | 'warn' | 'info' }) {
  const config = {
    ok: { bg: T.sage, icon: <Check size={11} strokeWidth={3.2} color="#fff" /> },
    warn: { bg: T.amber, icon: <AlertTriangle size={10} strokeWidth={2.6} color="#fff" /> },
    info: { bg: T.muted, icon: null as React.ReactNode },
  }[status];
  return (
    <span style={{
      width: 18, height: 18, borderRadius: '50%',
      background: config.bg,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 2px 6px ${config.bg}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
      flexShrink: 0,
    }}>
      {config.icon || <span style={{ width: 8, height: 1.5, background: '#fff', borderRadius: 1 }} />}
    </span>
  );
}

function SummaryPanel({ title, subtitle, rows, statusChip }: { title: string; subtitle?: string; rows: { label: string; value: string; unit?: string; status?: 'ok' | 'warn' | 'info'; note?: string }[]; statusChip?: { text: string; type: 'ok' | 'warn' } }) {
  return (
    <div
      style={{
        background: T.glass,
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        borderRadius: 22,
        padding: '18px 22px 16px',
        minWidth: 296,
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
      />      {/* TODAY mono subtitle + status chip 同列、不蓋字 */}
      {(subtitle || statusChip) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          {subtitle ? (
            <span style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.18em', color: T.ink3, fontWeight: 700,
            }}>{subtitle}</span>
          ) : <span />}
          {statusChip && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 9px', borderRadius: 999,
              background: statusChip.type === 'ok' ? T.sage : T.amber,
              color: '#fff',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em',
              boxShadow: statusChip.type === 'ok'
                ? '0 3px 8px rgba(122,148,130,0.42), inset 0 1px 0 rgba(255,255,255,0.30)'
                : '0 3px 8px rgba(212,113,42,0.42), inset 0 1px 0 rgba(255,255,255,0.30)',
            }}>
              <span style={{
                width: 12, height: 12, borderRadius: '50%',
                background: 'rgba(255,255,255,0.22)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {statusChip.type === 'ok'
                  ? <Check size={8} strokeWidth={3.4} color="#fff" />
                  : <AlertTriangle size={8} strokeWidth={2.6} color="#fff" />}
              </span>
              {statusChip.text}
            </span>
          )}
        </div>
      )}
      {/* 主標獨立一行 */}
      <div style={{ marginBottom: 10 }}>
        <span style={{
          fontFamily: '"Noto Serif TC", "Newsreader", serif',
          fontSize: 19, fontWeight: 600, color: T.ink, letterSpacing: '0.01em',
        }}>{title}</span>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderTop: i > 0 ? '1px solid rgba(36,28,20,0.08)' : 'none' }}>
          {r.status && <StatusBadge status={r.status} />}
          <span style={{ flex: '0 0 52px', fontFamily: '"Noto Sans TC", Inter, sans-serif', fontSize: 13, fontWeight: 600, color: T.ink2 }}>
            {r.label}
          </span>
          <span style={{ flex: 1, fontFamily: '"Newsreader", serif', fontSize: 19, fontWeight: 500, color: T.ink, display: 'flex', alignItems: 'baseline', gap: 5 }}>
            {r.value}
            {r.unit && <span style={{ fontSize: 11, color: T.ink3 }}>{r.unit}</span>}
          </span>
          {r.note && (
            <span style={{
              fontFamily: '"Noto Sans TC", sans-serif', fontSize: 11, fontWeight: 600,
              color: r.status === 'warn' ? T.amber : r.status === 'ok' ? T.sage : T.ink3,
              letterSpacing: '0.04em',
            }}>{r.note}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// === CircleBtn 重做 · 真實霧面液態玻璃（Edward 5/27 14:07 catch）===
// 之前是「實心立體球 + 多層 inset 高光」= 不對 · 設計稿是 frosted glass
// 修法：半透明 + backdrop-filter blur + 細邊 + 簡單外陰影 · 沒有 inset gradient / 沒有頂緣高光膠線
function CircleBtn({ label, sub, icon, bg, size = 56, iconOnly = false, onClick }: { label?: string; sub?: string; icon: React.ReactNode; bg?: string; size?: number; iconOnly?: boolean; onClick?: () => void }) {
  // 全部按鈕都用同一種半透明 dark glass · 不再分 amber / sage / dark variant
  // 看設計稿底部按鈕：背景是真實玻璃、不是純色 + gradient
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        background: 'transparent', border: 'none', cursor: 'pointer',
        pointerEvents: 'auto',
        padding: 0,
      }}
    >
      <div
        style={{
          width: size, height: size, borderRadius: '50%',
          background: 'rgba(36,28,20,0.52)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: '0 8px 22px rgba(0,0,0,0.32)',
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      </div>
      {!iconOnly && label && (
        <span style={{
          color: '#fff',
          fontFamily: '"Noto Serif TC", "Newsreader", serif',
          fontSize: 13, fontWeight: 500,
          letterSpacing: '0.03em',
          textShadow: '0 2px 8px rgba(0,0,0,0.7)',
        }}>
          {label}
        </span>
      )}
      {!iconOnly && sub && (
        <span style={{
          color: 'rgba(255,253,248,0.62)',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10, fontWeight: 500,
          letterSpacing: '0.14em',
          marginTop: -4,
          textShadow: '0 1px 4px rgba(0,0,0,0.6)',
        }}>
          {sub}
        </span>
      )}
    </button>
  );
}

// === EndCallBtn · 紅色小圓結束按鈕（家人視訊 / 陪伴聊天） ===
function EndCallBtn({ icon, size = 56, onClick }: { icon: React.ReactNode; size?: number; onClick?: () => void }) {
  // 紅色霧面玻璃 · 不要 gradient + 不要 inset 高光（之前 catch 切痕問題）
  return (
    <button
      onClick={onClick}
      aria-label="結束"
      style={{
        width: size, height: size, borderRadius: '50%',
        background: 'rgba(216,90,85,1.0)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.18)',
        color: '#fff', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 22px rgba(216,90,85,0.42)',
      }}
    >
      {icon}
    </button>
  );
}

function VoicePill({ state = 'listening', prompt }: { state?: 'listening' | 'speaking' | 'thinking'; prompt?: string }) {
  const config = {
    listening: { color: T.roseDeep, text: '直接說、莉莉在聽' },
    speaking: { color: T.sage, text: '莉莉正在說話…' },
    thinking: { color: T.amber, text: '莉莉想一下…' },
  }[state];
  // 設計稿真相：底部 capsule 有 prompt 時只顯示 prompt（單行）· 不雙行
  const displayText = prompt || config.text;
  return (
    <div
      style={{
        padding: '11px 22px',
        background: 'rgba(36,28,20,0.78)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        borderRadius: 999,
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.14)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 14 }}>
        {[0, 1, 2, 1, 0].map((idx, i) => (
          <span
            key={i}
            style={{
              width: 2.5, height: 11,
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
        fontSize: 15, fontWeight: 500, color: 'rgba(255,253,248,0.92)', letterSpacing: '0.02em',
        lineHeight: 1.2,
      }}>{displayText}</span>
    </div>
  );
}

// === GlassChip · 對話泡內兩顆 sage 玻璃膠囊選項（nudge / health / medication） ===
// 設計稿真相：對話泡內、文字下方、橫排兩顆 sage 淡綠霧化玻璃膠囊
function GlassChip({ children, primary = false, icon, onClick }: { children: React.ReactNode; primary?: boolean; icon?: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: icon ? '10px 18px 10px 14px' : '10px 20px',
        background: primary
          ? 'linear-gradient(155deg, rgba(143,168,151,0.92) 0%, rgba(122,148,130,0.86) 60%, rgba(95,122,104,0.88) 100%)'
          : 'transparent',
        color: primary ? '#fff' : T.ink,
        backdropFilter: 'blur(14px) saturate(140%)',
        WebkitBackdropFilter: 'blur(14px) saturate(140%)',
        borderRadius: 999,
        border: primary
          ? '1px solid rgba(255,255,255,0.22)'
          : '1px solid rgba(31,27,23,0.15)',
        fontFamily: '"Noto Serif TC", "Newsreader", serif',
        fontSize: 17, fontWeight: 500,
        letterSpacing: '0.02em',
        cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        boxShadow: primary
          ? '0 6px 16px rgba(95,122,104,0.45), inset 0 1px 0 rgba(255,255,255,0.30)'
          : '0 4px 12px rgba(31,27,23,0.10), inset 0 1px 0 rgba(255,255,255,0.55)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <span style={{
        position: 'absolute', top: 0, left: '14%', right: '14%', height: 1,
        background: primary
          ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)'
          : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)',
        borderRadius: 999, pointerEvents: 'none',
      }} />
      {icon && (
        <span style={{
          width: 18, height: 18, borderRadius: '50%',
          background: primary ? 'rgba(255,255,255,0.22)' : T.sage,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </span>
      )}
      <span>{children}</span>
    </button>
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
    // 整個畫面可點 · 觸碰任意處或說「莉莉」喚醒、設計稿 01 對齊：
    // 上方中央 logo / 左上溫濕度 / 右上 wifi · 中央大時鐘 · 時鐘下日期 · 再下方圓 mic 鈕含「點我喚醒」膠囊
    <div
      onClick={onWake}
      style={{ position: 'absolute', inset: 0, color: T.paper, cursor: 'pointer' }}
    >
      {/* === 左上 · 溫濕度 + 適合保存 === */}
      <div style={{
        position: 'absolute', top: 26, left: 32,
        display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 11, letterSpacing: '0.18em',
        color: T.paper, opacity: 0.78, fontWeight: 700,
      }}>
        <span style={{ letterSpacing: '0.22em' }}>25°C · 58%RH</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.sage }} />
          適合保存
        </span>
      </div>

      {/* === 上方中央 · CAREON Companion logo === */}
      <div style={{
        position: 'absolute', top: 22, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 8,
        fontFamily: '"Newsreader", serif',
        color: T.paper, opacity: 0.85,
      }}>
        <span style={{ fontSize: 20, fontWeight: 400, letterSpacing: '0.08em' }}>CAREON</span>
        <span style={{ fontSize: 20, fontWeight: 400, fontStyle: 'italic', letterSpacing: '0.01em', color: T.amberSoft }}>Companion</span>
      </div>

      {/* === 右上 · 已連線 wifi === */}
      <div style={{
        position: 'absolute', top: 26, right: 32,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 11, letterSpacing: '0.18em',
        color: T.paper, opacity: 0.78, fontWeight: 700,
      }}>
        <span style={{ fontSize: 13 }}>⌃</span>
        已連線
      </div>

      {/* === 中央 · 大時鐘 + 日期 + mic 喚醒鈕 === */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 0,
      }}>
        {/* 大時鐘 */}
        <div style={{
          fontFamily: '"Newsreader", serif',
          fontSize: 220, fontWeight: 300,
          letterSpacing: '-0.04em', lineHeight: 1,
          color: T.paper,
          textShadow: 'none',
        }}>
          {time}
        </div>
        {/* 日期 */}
        <div style={{
          fontFamily: '"Noto Serif TC", serif',
          fontSize: 20, fontWeight: 400,
          marginTop: 10, opacity: 0.78,
          color: T.paper,
          letterSpacing: '0.02em',
        }}>
          5月20日 週二
        </div>
        {/* mic 喚醒大圓鈕 · 中央下方 ~48px gap */}
        <button
          onClick={(e) => { e.stopPropagation(); onWake(); }}
          aria-label="點我喚醒"
          style={{
            marginTop: 56,
            width: 132, height: 132, borderRadius: '50%',
            background: 'rgba(36,28,20,0.66)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.14)',
            color: '#fff', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: 0,
            boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
          }}
        >
          <Mic size={32} strokeWidth={2} color="#fff" />
          <span style={{
            fontFamily: '"Noto Sans TC", sans-serif',
            fontSize: 13, fontWeight: 500,
            color: 'rgba(255,253,248,0.94)',
            letterSpacing: '0.10em',
          }}>
            點我喚醒
          </span>
        </button>
        <div style={{
          marginTop: 12,
          fontFamily: '"Noto Serif TC", serif',
          fontStyle: 'italic',
          fontSize: 14, fontWeight: 400,
          color: 'rgba(255,253,248,0.55)',
          letterSpacing: '0.04em',
          textAlign: 'center',
        }}>
          或語音呼叫「莉莉在嘛 」
        </div>
      </div>
    </div>
  );
}

function ScreenAriaHere() {
  return (
    <>
      <div style={{ position: 'absolute', top: '36%', left: 60 }}>
        <GlassBubble accent={T.sage}>
          <span style={{ display: 'block', fontFamily: '"JetBrains Mono", monospace', fontSize: 13, letterSpacing: '0.16em', fontWeight: 700, color: T.sage, marginBottom: 10 }}>
            ● 莉莉 · 在
          </span>
          <span style={{ fontSize: 22, fontWeight: 500, color: T.ink, display: 'inline-block', marginBottom: 4 }}>早安、王阿姨。</span><br />
          <span style={{ fontSize: 15, color: T.ink2 }}>今天台北 25°，適合到陽台坐坐。</span>
        </GlassBubble>
      </div>
      <div style={{ position: 'absolute', top: 80, right: 32 }}>
        <SummaryPanel
          title="今日健康"
          subtitle="TODAY · 5/26"
          statusChip={{ text: '都正常', type: 'ok' }}
          rows={[
            { label: '血壓', value: '128/82', status: 'ok', note: '正常' },
            { label: '心跳', value: '72', unit: 'bpm', status: 'ok', note: '平穩' },
            { label: '血糖', value: '98', unit: 'mg/dL', status: 'ok', note: '正常' },
            { label: '用藥', value: '2/3 顆', status: 'warn', note: '待提醒' },
            { label: '睡眠', value: '6h 42m', status: 'info', note: '不足' },
          ]}
        />
      </div>
    </>
  );
}

function ScreenNudge() {
  return (
    <>
      <div style={{ position: 'absolute', top: '32%', left: 60 }}>
        <GlassBubble accent={T.rose}>
          <span style={{ display: 'block', fontFamily: '"JetBrains Mono", monospace', fontSize: 13, letterSpacing: '0.16em', fontWeight: 700, color: T.roseDeep, marginBottom: 10 }}>
            ● 莉莉 · 活動關懷
          </span>
          阿姨、您今天<span style={{ color: T.roseDeep, fontWeight: 600 }}>活動量不太夠</span>。<br />
          要不要出去走走？今天再走 <span style={{ color: T.amber, fontWeight: 600 }}>1,000 步</span>、身體比較不會活動量太低喔。
          {/* === 對話泡內 · 兩顆 sage 玻璃膠囊選項 === */}
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <GlassChip primary>好、看看</GlassChip>
            <GlassChip>等一下</GlassChip>
          </div>
        </GlassBubble>
      </div>
      <div style={{ position: 'absolute', top: 80, right: 32 }}>
        <SummaryPanel
          title="今日活動"
          subtitle="TODAY · 5/26"
          statusChip={{ text: '步數不足', type: 'warn' }}
          rows={[
            { label: '步數', value: '412', unit: '/ 3,000', status: 'warn', note: '步數不足' },
            { label: '心跳', value: '68', unit: 'bpm', status: 'ok' },
            { label: '有氧', value: '8', unit: '/ 30 分', status: 'warn' },
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
          <span style={{ display: 'block', fontFamily: '"JetBrains Mono", monospace', fontSize: 13, letterSpacing: '0.16em', fontWeight: 700, color: T.sage, marginBottom: 10 }}>
            ● 莉莉 · 早晨關心
          </span>
          <span style={{ fontSize: 15, color: T.ink2 }}>早安王阿姨～</span><br />
          <span style={{ color: T.amber, fontWeight: 600, fontSize: 22, lineHeight: 1.3, display: 'inline-block', marginTop: 4 }}>昨晚睡得怎麼樣？</span>
          {/* === 對話泡內 · 兩顆 sage 玻璃膠囊選項 === */}
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <GlassChip primary>睡得好</GlassChip>
            <GlassChip>沒睡好</GlassChip>
          </div>
        </GlassBubble>
      </div>
      <div style={{ position: 'absolute', top: 80, right: 32 }}>
        <SummaryPanel
          title="今早摘要"
          subtitle="TODAY · 5/26 早晨"
          statusChip={{ text: '已啟動關懷', type: 'warn' }}
          rows={[
            { label: '睡眠', value: '6h 42m', status: 'warn', note: '稍微短' },
            { label: '感覺', value: '背酸', status: 'warn', note: '待關心' },
            { label: '用藥', value: '2 顆', status: 'warn', note: '待提醒' },
            { label: '血壓', value: '128/82', status: 'ok', note: '正常' },
            { label: '心率', value: '72', unit: 'bpm', status: 'ok' },
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

// === 07 · 陪伴聊天 · 計時中 · 對齊設計稿（紅色小圓 stop icon + 計時中 chip） ===
function ScreenCompanion({ onEnd }: { onEnd: () => void }) {
  return (
    <>
      <div style={{ position: 'absolute', top: 80, right: 32, width: 296 }}>
        <div style={{
          background: T.glass,
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          borderRadius: 22,
          padding: '20px 22px',
          position: 'relative',
          boxShadow: '0 12px 32px rgba(0,0,0,0.20)',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 12, right: 12, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)',
            borderRadius: 999,
          }} />
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.22em', color: T.ink3, fontWeight: 700 }}>
              COMPANION · 10:48
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontFamily: '"Noto Serif TC", serif', fontSize: 19, fontWeight: 600, color: T.ink }}>陪伴聊天</span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 9px', borderRadius: 999,
              background: T.sage, color: '#fff',
              fontFamily: '"JetBrains Mono", monospace', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em',
              boxShadow: '0 3px 8px rgba(122,148,130,0.42)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse 1.4s ease-in-out infinite' }} />
              計時中
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
            <StatusBadge status="warn" />
            <span style={{ flex: '0 0 56px', fontFamily: '"Noto Sans TC", sans-serif', fontSize: 13, fontWeight: 600, color: T.ink2 }}>已使用</span>
            <span style={{ flex: 1, fontFamily: '"JetBrains Mono", monospace', fontSize: 18, fontWeight: 600, color: T.ink }}>00:08:32</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: '1px solid rgba(36,28,20,0.08)' }}>
            <StatusBadge status="ok" />
            <span style={{ flex: '0 0 56px', fontFamily: '"Noto Sans TC", sans-serif', fontSize: 13, fontWeight: 600, color: T.ink2 }}>剩餘</span>
            <span style={{ flex: 1, fontFamily: '"Newsreader", serif', fontSize: 22, fontWeight: 500, color: T.ink, display: 'flex', alignItems: 'baseline', gap: 4 }}>
              82
              <span style={{ fontSize: 12, color: T.ink3 }}>分鐘 · 每分 NT$ 2</span>
            </span>
          </div>
        </div>
      </div>
      {/* 紅色結束陪伴大鈕 · 位置在莉莉胸前下方（不擋臉、不變鼻子點）
          設計稿 07-companion：紅圓在畫面底部 1/4 · 大顆顯眼 80px · 含「結束陪伴」label 在鈕下方
          移除原本的「陪伴中 · 00:08」中央字幕（資訊已在右上面板）· 不疊在臉上 */}
      <div style={{
        position: 'absolute',
        bottom: 50, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
        <button
          aria-label="結束陪伴"
          onClick={onEnd}
          style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(216,90,85,0.92)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.20)',
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 32px rgba(216,90,85,0.55), 0 4px 12px rgba(0,0,0,0.25)',
          }}
        >
          <Square size={26} strokeWidth={0} fill="#fff" />
        </button>
        <span style={{
          fontFamily: '"Noto Serif TC", serif',
          fontSize: 14, fontWeight: 600,
          color: '#fff',
          letterSpacing: '0.06em',
          textShadow: '0 2px 6px rgba(0,0,0,0.85), 0 1px 2px rgba(0,0,0,0.6)',
        }}>
          結束陪伴
        </span>
      </div>
    </>
  );
}

function ScreenMedication() {
  return (
    <>
      <div style={{ position: 'absolute', top: '30%', left: 60 }}>
        <GlassBubble accent={T.amber}>
          <span style={{ display: 'block', fontFamily: '"JetBrains Mono", monospace', fontSize: 13, letterSpacing: '0.16em', fontWeight: 700, color: T.amber, marginBottom: 10 }}>
            ● 莉莉 · 用藥提醒
          </span>
          <span style={{ fontSize: 15, color: T.ink2 }}>早安王阿姨～</span><br />
          <span style={{ color: T.amber, fontWeight: 600, fontSize: 22, lineHeight: 1.3, display: 'inline-block', marginTop: 4 }}>該吃藥囉。</span><br />
          <span style={{ fontSize: 15, color: T.ink2 }}>配藥槽已準備好兩顆，慢慢來。</span>
          {/* === 對話泡內 · 兩顆 sage 玻璃膠囊選項（含 ✓ icon） === */}
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <GlassChip primary icon={<Check size={11} strokeWidth={3.2} color="#fff" />}>我吃了</GlassChip>
            <GlassChip>等 15 分</GlassChip>
          </div>
        </GlassBubble>
      </div>
      <div style={{ position: 'absolute', top: 80, right: 32 }}>
        <SummaryPanel
          title="早餐用藥"
          subtitle="TODAY · 5/26 上午"
          statusChip={{ text: '配藥槽已出', type: 'warn' }}
          rows={[
            { label: '血壓藥', value: '1', unit: '顆 · AMLODIPINE', status: 'warn' },
            { label: '維他命 D', value: '1', unit: '顆 · 1000U', status: 'warn' },
            { label: '存量', value: '6 天', status: 'ok', note: '下週補' },
          ]}
        />
      </div>
    </>
  );
}

// === 09 · 家人視訊 · 對齊設計稿（紅色小圓 phone-hangup + iconOnly mic/camera/chat + 左側 VOLUME +/- 直立條） ===
function ScreenFamilyCall({ onEnd }: { onEnd: () => void }) {
  const [volume, setVolume] = useState(6);
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/family/dahua-son.png"
        alt="兒子 · 大華"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 20%',
        }}
      />

      {/* 左上時間 · 對齊設計稿 09 左上 15:08 */}
      <div style={{
        position: 'absolute', top: 24, left: 32,
        color: '#fff',
        fontFamily: '"Newsreader", serif',
        fontSize: 22, fontWeight: 500, letterSpacing: '0.01em',
        textShadow: '0 2px 10px rgba(0,0,0,0.55)',
      }}>15:08</div>

      {/* LIVE 玻璃膠囊 · 對齊設計稿 09 右上角位置 */}
      <div style={{
        position: 'absolute', top: 24, right: 240,
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

      {/* PIP 玻璃框 · 王阿姨 · 右上 */}
      <div style={{
        position: 'absolute', top: 60, right: 32,
        width: 196, height: 138, borderRadius: 16,
        overflow: 'hidden',
        border: '1.5px solid rgba(255,255,255,0.22)',
        boxShadow: '0 12px 36px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.15)',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/family/wang-aunt.png"
          alt="王阿姨自拍 PIP"
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 15%',
          }}
        />
        <span style={{
          position: 'absolute', bottom: 6, left: 10,
          color: '#fff', fontFamily: 'Inter', fontSize: 10, fontWeight: 600,
          letterSpacing: '0.08em',
          textShadow: '0 1px 3px rgba(0,0,0,0.7)',
        }}>我</span>
      </div>

      {/* 底部 4 顆按鈕 · 對齊設計稿：mic / camera-off / chat / 紅小圓 phone-hangup */}
      <div style={{
        position: 'absolute', bottom: 60, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', gap: 18, alignItems: 'center',
      }}>
        <CircleBtn iconOnly size={56} icon={<Mic size={22} strokeWidth={2} color="#fff" />} />
        <CircleBtn iconOnly size={56} icon={<VideoOff size={22} strokeWidth={2} color="#fff" />} />
        <CircleBtn iconOnly size={56} icon={<MessageCircle size={22} strokeWidth={2} color="#fff" />} />
        <EndCallBtn icon={<PhoneOff size={26} strokeWidth={2.2} color="#fff" />} size={56} onClick={onEnd} />
      </div>

      {/* 左側 VOLUME · 對齊設計稿 09（+/- 按鈕 + 直立棒 + 小圓滑塊） */}
      <div style={{
        position: 'absolute', top: '50%', left: 28,
        transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        background: 'rgba(36,28,20,0.62)',
        backdropFilter: 'blur(14px) saturate(140%)',
        WebkitBackdropFilter: 'blur(14px) saturate(140%)',
        padding: '12px 8px',
        borderRadius: 36,
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.10)',
      }}>
        <button
          onClick={() => setVolume(v => Math.min(10, v + 1))}
          aria-label="音量加"
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.18)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
          }}
        >
          <Plus size={16} strokeWidth={2.4} />
        </button>
        <div style={{
          width: 6, height: 160, borderRadius: 4,
          background: 'rgba(255,255,255,0.14)',
          position: 'relative',
          margin: '4px 0',
        }}>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: (volume * 10) + '%',
            background: 'linear-gradient(180deg, #E08A4C 0%, #D4712A 100%)',
            borderRadius: 4,
            boxShadow: '0 0 8px rgba(212,113,42,0.6)',
          }} />
          <div style={{
            position: 'absolute', left: '50%', transform: 'translate(-50%, 50%)',
            bottom: (volume * 10) + '%',
            width: 24, height: 24, borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 4px 10px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.10)',
          }} />
        </div>
        <button
          onClick={() => setVolume(v => Math.max(0, v - 1))}
          aria-label="音量減"
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.18)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
          }}
        >
          <Minus size={16} strokeWidth={2.4} />
        </button>
      </div>
    </>
  );
}

// === 10 · 選單 · 對齊設計稿（8 磁磚加副字 + mono 「說『XXX』」標籤 + 左下緊急聯絡紅色 iconOnly + 右下 X / phone 上下疊放） ===
function ScreenMenu({ onPick }: { onPick: (s: ScreenId) => void }) {
  type Item = { label: string; sub: string; voice: string; icon: React.ReactNode; tint: string; screen?: ScreenId };
  const items: Item[] = [
    { label: '健康報告', sub: '每週 · 月 · 季', voice: "說『健康』", icon: <BarChart3 size={26} strokeWidth={1.6} />, tint: T.sage },
    { label: '今日用藥', sub: '18:00 · 剩 1 顆', voice: "說『吃藥』", icon: <Pill size={26} strokeWidth={1.6} />, tint: T.amber, screen: 'medication' },
    { label: '藥箱監測', sub: '血壓藥剩 6 天', voice: "說『藥箱』", icon: <Search size={26} strokeWidth={1.6} />, tint: T.roseDeep },
    { label: '環境感測', sub: '25° · 濕度 58%', voice: "說『環境』", icon: <Thermometer size={26} strokeWidth={1.6} />, tint: T.sage },
    { label: '聯絡家人', sub: '聯絡 · 觸發狀態', voice: "說『家人』", icon: <Users size={26} strokeWidth={1.6} />, tint: T.amber, screen: 'family-call' },
    { label: '陪伴聊天', sub: '角色 · 充值 · 剩 90 分', voice: "說『陪伴』", icon: <MessageCircle size={26} strokeWidth={1.6} />, tint: T.roseDeep, screen: 'companion' },
    { label: '連線裝置', sub: 'Wi-Fi · 藍芽 · 手錶', voice: "說『裝置』", icon: <Radio size={26} strokeWidth={1.6} />, tint: T.navy },
    { label: '個人資料', sub: '名稱 · 年齡 · 體態', voice: "說『我的』", icon: <User size={26} strokeWidth={1.6} />, tint: T.violet },
  ];
  return (
    <>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(31,27,23,0.32)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        pointerEvents: 'none',
      }} />

      {/* 標題群 · 對齊 10-menu 設計稿（上方居中 · 「想做什麼？ or 直接說」） */}
      <div style={{
        position: 'absolute', top: 32, left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        pointerEvents: 'none', zIndex: 2,
      }}>
        <span style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 10, letterSpacing: '0.30em',
          color: 'rgba(255,253,248,0.62)', fontWeight: 700,
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}>● 莉莉 · 準備</span>
        <span style={{
          fontFamily: '"Newsreader", "Noto Serif TC", serif',
          fontSize: 30, fontWeight: 500, color: '#fff', letterSpacing: '0.02em',
          textShadow: '0 2px 12px rgba(0,0,0,0.65)',
        }}>
          想做什麼？<span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 14, letterSpacing: '0.18em', color: T.amberSoft, marginLeft: 12, opacity: 0.86 }}>or 直接說</span>
        </span>
      </div>

      {/* 8 磁磚 4×2 grid · 中央區 · 對齊設計稿緊湊 · 留底中 VoicePill 空間 */}
      <div style={{
        position: 'absolute', top: 90, left: 90, right: 90, bottom: 160,
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(2, 1fr)',
        gap: 12,
      }}>
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => item.screen && onPick(item.screen)}
            style={{
              background: '#FFFEFA',
              border: '1px solid rgba(31,27,23,0.06)',
              borderRadius: 18, padding: '20px 12px 18px',
              cursor: item.screen ? 'pointer' : 'default',
              opacity: item.screen ? 1 : 0.82,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 6px 18px rgba(31,27,23,0.10), inset 0 1px 0 rgba(255,255,255,0.8)',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease',
              position: 'relative',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: item.tint, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 16px ' + item.tint + '55',
              marginBottom: 2,
            }}>{item.icon}</div>
            <span style={{
              fontFamily: '"Noto Serif TC", serif', fontSize: 16, fontWeight: 600, color: T.ink, letterSpacing: '0.01em',
            }}>{item.label}</span>
            <span style={{
              fontFamily: '"Noto Sans TC", sans-serif', fontSize: 12, fontWeight: 500, color: T.ink2, letterSpacing: '0.02em',
              textAlign: 'center', lineHeight: 1.4,
            }}>{item.sub}</span>
            <span style={{
              position: 'absolute', bottom: 7,
              fontFamily: '"JetBrains Mono", monospace', fontSize: 9, fontWeight: 600,
              color: T.muted, letterSpacing: '0.10em', opacity: 0.78,
            }}>{item.voice}</span>
          </button>
        ))}
      </div>

      {/* 底中央 · VoicePill 「直接說、莉莉在聽」 · 對齊 10-menu 設計稿 */}
      <div style={{ position: 'absolute', bottom: 92, left: '50%', transform: 'translateX(-50%)', zIndex: 4 }}>
        <VoicePill />
      </div>

      {/* 左下 · 緊急聯絡 紅色 iconOnly 56px */}
      <button
        onClick={() => alert('（demo）緊急聯絡已撥出、人工確認後通報 119')}
        aria-label="緊急聯絡"
        style={{
          position: 'absolute', bottom: 26, left: 26,
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(216,90,85,0.92)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.18)',
          color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 22px rgba(216,90,85,0.42)',
        }}
      >
        <AlertCircle size={24} strokeWidth={2.2} color="#fff" />
      </button>

      {/* 右下 · X 關閉 + Phone 呼叫家人 上下疊放 iconOnly 56px */}
      <div style={{ position: 'absolute', bottom: 26, right: 26, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <CircleBtn iconOnly size={56} icon={<X size={22} strokeWidth={2} color="#fff" />} onClick={() => onPick('aria-here')} />
        <CircleBtn iconOnly size={56} icon={<Phone size={22} strokeWidth={2} color="#fff" />} onClick={() => onPick('family-call')} />
      </div>
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
            boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
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
          <div style={{ position: 'absolute', inset: 0, background: moodToTint(currentScreen.mood), pointerEvents: 'none', mixBlendMode: 'soft-light', opacity: 0.28 }} />

          {/* Status Bar · 純文字浮在莉莉照片上、不加 chip 框 · 比照設計稿 */}
          {screen !== 'standby' && screen !== 'goodnight' && (
            <div style={{
              position: 'absolute', top: 24, left: 32,
              display: 'flex', alignItems: 'baseline', gap: 14,
              color: '#fff',
              textShadow: '0 3px 12px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.6)',
            }}>
              <span style={{ fontFamily: '"Newsreader", serif', fontSize: 22, fontWeight: 500, letterSpacing: '0.01em', lineHeight: 1 }}>{time}</span>
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, fontWeight: 600, opacity: 0.78, letterSpacing: '0.22em', lineHeight: 1 }}>室溫 24°</span>
            </div>
          )}

          {/* Screen Content · 只 render 設計稿有的 8 個畫面 */}
          {/* 砍掉：04 純語音 / 06 確認彈窗 / 11 今日回顧 / 12 晚安模式 — 都不在設計稿 */}
          {screen === 'standby' && <ScreenStandby time={time} onWake={() => setScreen('aria-here')} />}
          {screen === 'aria-here' && <ScreenAriaHere />}
          {screen === 'nudge' && <ScreenNudge />}
          {screen === 'health' && <ScreenHealth />}
          {screen === 'companion' && <ScreenCompanion onEnd={() => setScreen('aria-here')} />}
          {screen === 'medication' && <ScreenMedication />}
          {screen === 'family-call' && <ScreenFamilyCall onEnd={() => setScreen('aria-here')} />}
          {screen === 'menu' && <ScreenMenu onPick={setScreen} />}

          {/* === 底部 3 顆 iconOnly 暗色玻璃圓鈕 + 中央 VoicePill · 對齊設計稿 02 / 03 / 05 主畫面 === */}
          {/* 左下 1 顆 chat / 中央 VoicePill / 右下兩顆上下疊（X·返回 + phone·家人）— 注意：menu 鈕在主畫面但右下顯示為 X*/}
          {screen !== 'standby' && screen !== 'menu' && screen !== 'family-call' && screen !== 'companion' && (
            <>
              {/* 左下 · 陪伴聊天 iconOnly 56px · 直接進計時、不確認 */}
              <div style={{ position: 'absolute', bottom: 26, left: 26, pointerEvents: 'auto', zIndex: 5 }}>
                <CircleBtn iconOnly size={56} icon={<MessageCircle size={24} strokeWidth={2} color="#fff" />} onClick={() => setScreen('companion')} />
              </div>
              {/* 中央 · VoicePill · context-aware 副字 · 對齊設計稿 02 / 03 / 05 / 07-medication */}
              <div style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'auto', zIndex: 5 }}>
                <VoicePill prompt={(() => {
                  if (screen === 'nudge') return '說「好、看看」或「等一下」';
                  if (screen === 'health') return '說「睡得好」或「沒睡好」';
                  if (screen === 'medication') return '說「我吃了」或「等一下」';
                  return undefined;
                })()} />
              </div>
              {/* 右下 · menu + phone 上下疊放 iconOnly 56px */}
              <div style={{ position: 'absolute', bottom: 26, right: 26, display: 'flex', flexDirection: 'column', gap: 12, pointerEvents: 'auto', zIndex: 5 }}>
                <CircleBtn iconOnly size={56} icon={<Menu size={24} strokeWidth={2} color="#fff" />} onClick={() => setScreen('menu')} />
                <CircleBtn iconOnly size={56} icon={<Phone size={24} strokeWidth={2} color="#fff" />} onClick={() => setScreen('family-call')} />
              </div>
            </>
          )}

          {/* 07-companion 設計稿：無任何 floating · 只有摘要面板 + 中央紅停止鈕 + 左上時間 */}

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
