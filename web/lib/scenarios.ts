// 4 場景對話腳本 · 從 scenarios.yaml 移植到 TypeScript
// 對齊 PROTOTYPE §4 Live Demo 完整腳本

export type Role = 'user' | 'assistant';

export interface ScenarioMessage {
  role: Role;
  content: string;
}

export interface Scenario {
  id: string;
  label: string;
  trigger: string;
  description: string;
  openingMessage: string;
  expectedTools: string[];
  sampleDialog: ScenarioMessage[];
  talkingPoints: string[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'morning_greeting',
    label: '場景 1 · 早安問候',
    trigger: 'pir_first_movement_morning',
    description:
      'IoT 觸發、device 主動開口、不等長者問。2026 PMF 最大差異點 = 主動而非被動。',
    openingMessage: '阿嬤、早起好無？我看你睡了 6.5 小時、比平常少 1 小時。',
    expectedTools: ['queryHealthHistory'],
    sampleDialog: [
      {
        role: 'assistant',
        content: '阿嬤、早起好無？我看你睡了 6.5 小時、比平常少 1 小時。',
      },
      { role: 'user', content: '沒睡好啦、半夜熱醒。' },
      {
        role: 'assistant',
        content: '那今天記得多喝水。早餐前的降壓藥要記得吃喔。',
      },
      { role: 'user', content: '好。' },
      { role: 'assistant', content: '我等等 8 點再叫你一次、提醒你吃藥。' },
    ],
    talkingPoints: [
      'device 主動開口、不等使用者觸發',
      '拉睡眠歷史趨勢、用對比說明（少 1 小時）',
      '口語化、節奏放慢、每句 ≤ 15 字（Vibe 紀律 9）',
      '不命令、用陳述加排程（Vibe 紀律 1）',
    ],
  },
  {
    id: 'medication_reminder',
    label: '場景 2 · 用藥提醒',
    trigger: 'medication_scheduled_08:00',
    description:
      'Tool Calling 接 IoT 手環、Memory 拉用藥表。對齊 Memory + Tool Calling 要求。',
    openingMessage:
      '阿嬤、現在 8 點、該吃降壓藥了。要不要我 5 分鐘後再問一次？',
    expectedTools: ['checkMedicationSchedule'],
    sampleDialog: [
      {
        role: 'assistant',
        content:
          '阿嬤、現在 8 點、該吃降壓藥了。要不要我 5 分鐘後再問一次？',
      },
      { role: 'user', content: '等等啦、我在煎蛋。' },
      { role: 'assistant', content: '好、5 分鐘後我再叫你。' },
      { role: 'user', content: '好啦、現在吃。' },
      {
        role: 'assistant',
        content: '好的、阿嬤好棒。今天 8 點準時、跟上禮拜一樣。',
      },
    ],
    talkingPoints: [
      'Tool: checkMedicationSchedule 拉到降壓藥 + 降血糖藥 schedule',
      '用問句給選擇權（Vibe 紀律 2）',
      '稱讚具體小事（Vibe 紀律 6）',
      '不催、不嚇人（Vibe 紀律 5）',
    ],
  },
  {
    id: 'dizziness_symptom',
    label: '場景 3 · 頭暈症狀',
    trigger: 'user_initiated_voice',
    description:
      '用戶主動「我頭暈」→ 觸發讀血壓 tool → 對話自然、不替醫生診斷、引導家屬聯絡。',
    openingMessage: '',
    expectedTools: ['readVitals', 'queryHealthHistory'],
    sampleDialog: [
      { role: 'user', content: '欸、我剛剛頭有點暈。' },
      {
        role: 'assistant',
        content: '阿嬤、我幫你看一下。我看你現在血壓 145/95、比平常高一些。',
      },
      {
        role: 'assistant',
        content: '要不要先坐下休息？我可以幫你打電話給女兒。',
      },
      { role: 'user', content: '不用啦、休息一下就好。' },
      {
        role: 'assistant',
        content: '好、那我 15 分鐘後再幫你量一次、你也先深呼吸。',
      },
    ],
    talkingPoints: [
      'Tool: readVitals 即時讀血壓 145/95',
      '對話自然、不冰冷（Vibe 紀律 3、5）',
      '不替醫生診斷、給選項（Vibe 紀律 2）',
      '不過度反應、保留長者自主（Vibe 紀律 2）',
      '排程後續關心（紀律 7：會等）',
    ],
  },
  {
    id: 'static_anomaly',
    label: '場景 4 · 異常通報',
    trigger: 'pir_static_2hr_daytime',
    description:
      '靜止 2 小時 → device 主動呼叫 → 無回應升級 → 通知家屬 + 119。',
    openingMessage: '阿嬤、我注意到你 2 小時沒動了、還好嗎？',
    expectedTools: ['notifyFamily', 'emergency119'],
    sampleDialog: [
      {
        role: 'assistant',
        content: '阿嬤、我注意到你 2 小時沒動了、還好嗎？',
      },
      {
        role: 'assistant',
        content: '[等 30 秒無回應] 阿嬤、有聽到我說話嗎？',
      },
      {
        role: 'assistant',
        content: '[再等 30 秒無回應] 我先打電話給女兒、她馬上會聯絡你。',
      },
    ],
    talkingPoints: [
      'IoT PIR 觸發、device 主動偵測異常',
      '升級流程：2 次呼叫 → notifyFamily urgent → 60s 後 119',
      'Tool: notifyFamily + emergency119 雙呼叫',
      '對齊「緊急狀況時：自動撥 119 + 家屬通知」',
    ],
  },
];

export interface IoTTrigger {
  id: string;
  label: string;
  icon: string;
  payload: string;
}

export const IOT_TRIGGERS: IoTTrigger[] = [
  {
    id: 'pir_static',
    label: 'PIR 靜止 2 hr',
    icon: 'radio',
    payload:
      '[IoT 觸發] PIR 偵測到阿嬤已靜止 2 小時白天時段請主動關心若無回應升級通知家屬',
  },
  {
    id: 'medication_time',
    label: '08:00 用藥時間',
    icon: 'pill',
    payload: '[排程觸發] 現在 8 點阿嬤該吃降壓藥跟降血糖藥請主動提醒',
  },
  {
    id: 'bp_anomaly',
    label: '血壓異常偵測',
    icon: 'activity',
    payload: '[IoT 觸發] 阿嬤剛量血壓 152/98 比平常高請主動關心並問問狀況',
  },
  {
    id: 'fall_detected',
    label: '跌倒偵測',
    icon: 'alert-triangle',
    payload:
      '[緊急觸發] 偵測到跌倒事件請立即主動確認阿嬤狀況若無回應通知家屬 urgent',
  },
  {
    id: 'monthly_review',
    label: '月度回顧',
    icon: 'calendar',
    payload:
      '[排程觸發] 今天月初請主動跟阿嬤做上個月健康回顧語氣溫暖強調她做得好的地方最後 LINE 摘要給女兒',
  },
];
