// 5 個 Tool · 從 streamlit_chatbot.py 移植到 ai-sdk tool() helper
// Mock data 100% reproducible · 同樣 input 同樣 output

import { tool } from 'ai';
import { z } from 'zod';

// 固定 timestamp · demo 可重現
const DEMO_TS = '2026-05-25T08:00:00+08:00';

// ============================================================
// Tool 1 · read_vitals
// ============================================================
export const readVitals = tool({
  description: '讀取長者即時生理數據 (血壓 / 心率 / 體溫 / 血氧 / 睡眠分數)',
  parameters: z.object({
    metric: z
      .enum(['blood_pressure', 'heart_rate', 'body_temp', 'spo2', 'sleep_score'])
      .describe('要讀的生理指標'),
  }),
  execute: async ({ metric }) => {
    const table: Record<string, Record<string, unknown>> = {
      blood_pressure: {
        metric: 'blood_pressure',
        value: '145/95',
        unit: 'mmHg',
        timestamp: DEMO_TS,
        trend_7d: 'stable_slightly_high',
        normal_range: '120-140 / 80-90',
        interpretation: '稍高於平常建議休息',
      },
      heart_rate: {
        metric: 'heart_rate',
        value: 78,
        unit: 'bpm',
        timestamp: DEMO_TS,
        trend_7d: 'stable',
        normal_range: '60-100',
        interpretation: '正常',
      },
      body_temp: {
        metric: 'body_temp',
        value: 36.5,
        unit: 'C',
        interpretation: '正常',
      },
      spo2: {
        metric: 'spo2',
        value: 97,
        unit: 'percent',
        interpretation: '正常',
      },
      sleep_score: {
        metric: 'sleep_score',
        value: 72,
        unit: 'fen',
        interpretation: '中等',
      },
    };
    return table[metric] ?? { error: 'unknown metric' };
  },
});

// ============================================================
// Tool 2 · check_medication_schedule
// ============================================================
export const checkMedicationSchedule = tool({
  description: '查目前該吃哪個藥 (回傳當前需吃的藥單 + 上次服用時間)',
  parameters: z.object({
    time: z.string().optional().describe('查詢時間 ISO 8601 預設現在'),
  }),
  execute: async () => {
    return [
      {
        name: '降壓藥',
        generic: 'amlodipine 5mg',
        dose: '1 顆',
        due_at: '2026-05-25T08:00:00+08:00',
        status: 'pending',
        with_food: false,
        interactions: ['grapefruit'],
        last_taken: '2026-05-24T08:15:00+08:00',
      },
      {
        name: '降血糖藥',
        generic: 'metformin 500mg',
        dose: '1 顆',
        due_at: '2026-05-25T08:00:00+08:00',
        status: 'pending',
        with_food: true,
        interactions: [],
        last_taken: '2026-05-24T08:15:00+08:00',
      },
    ];
  },
});

// ============================================================
// Tool 3 · notify_family
// ============================================================
export const notifyFamily = tool({
  description: '通知家屬 (依 severity 走不同通知 channel)',
  parameters: z.object({
    severity: z
      .enum(['info', 'warning', 'urgent', 'emergency'])
      .describe('嚴重程度'),
    message: z.string().describe('通知文字'),
  }),
  execute: async ({ severity, message }) => {
    const channelMap: Record<string, string> = {
      info: 'LINE only',
      warning: 'LINE + push',
      urgent: 'LINE + SMS + 30s call',
      emergency: 'LINE + SMS + immediate call + 119',
    };
    return {
      channel: channelMap[severity] ?? 'LINE',
      severity,
      message,
      sent_at: DEMO_TS,
      status: 'delivered',
    };
  },
});

// ============================================================
// Tool 4 · emergency_119 · 人工確認後通報（合規版）
// ============================================================
export const emergency119 = tool({
  description:
    '緊急狀況升級流程 (跌倒 / 無回應 / 用戶呼救) · 通知家屬 / call center · 人工確認後通報 119、附 GPS 定位 + 最近生命徵象 + 事件摘要',
  parameters: z.object({
    condition: z.string().describe('觸發原因'),
  }),
  execute: async ({ condition }) => {
    return {
      condition,
      escalation_at: DEMO_TS,
      step_1: 'App push + 自動電話通知所有家屬（高優先）',
      step_2: 'Call center outbound call（2 分鐘內若無人應答）',
      step_3: '家屬 / call center 人工確認後通報 119',
      attached: 'GPS 定位 + 最近生命徵象 + 事件摘要',
      estimated_arrival_if_119: '8-12 分鐘',
      ambulance_id: 'TPE-EMS-007',
      status: 'awaiting_human_confirmation',
    };
  },
});

// ============================================================
// Tool 5 · query_health_history
// ============================================================
export const queryHealthHistory = tool({
  description: '拉歷史趨勢給 LLM 解讀 (血壓 / 睡眠 / 心率 / 用藥配合)',
  parameters: z.object({
    metric: z.string().describe('要查的指標'),
    days: z.number().optional().describe('回看天數預設 7'),
  }),
  execute: async ({ metric, days = 7 }) => {
    const table: Record<string, Record<string, unknown>> = {
      blood_pressure: {
        metric: 'blood_pressure',
        trend: 'stable',
        average: '135/85',
        anomalies: [
          { date: '2026-05-22', value: '152/98', note: '跟前晚睡眠相關' },
        ],
        interpretation: '整體穩定偶有偏高跟睡眠相關性高',
        days_analyzed: days,
      },
      sleep_score: {
        metric: 'sleep_score',
        trend: 'slightly_descending',
        average: '72',
        anomalies: [],
        interpretation: '近 3 天睡眠時數比平均少 1 小時',
        days_analyzed: days,
      },
      heart_rate: {
        metric: 'heart_rate',
        trend: 'stable',
        average: '72',
        anomalies: [],
        interpretation: '心率穩定無異常',
        days_analyzed: days,
      },
    };
    return (
      table[metric] ?? {
        metric,
        trend: 'stable',
        average: 'N/A',
        interpretation: '資料不足',
        days_analyzed: days,
      }
    );
  },
});

export const ALL_TOOLS = {
  readVitals,
  checkMedicationSchedule,
  notifyFamily,
  emergency119,
  queryHealthHistory,
};
