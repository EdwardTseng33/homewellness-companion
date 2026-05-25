# HomeWellness Companion · Web

銀髮陪伴 AI · 即時主動關懷 + 用藥提醒 + 異常通報
Next.js 14 + Vercel ai-sdk + Anthropic Claude Sonnet 4.5

---

## 一、產品介紹

HomeWellness Companion (家暖) 是一個 24 小時住在長輩家裡的 AI 健康伴侶 — 不是工具、是家人。透過 IoT 感測器主動感知狀態（PIR、血壓計、心率手環），結合 Claude Sonnet 4.5 的對話能力與 5 個 health tool，主動關懷、提醒用藥、異常通報，最嚴重時自動撥 119 + 通知家屬。

這個 web demo 用 Next.js 重寫了原 Streamlit prototype、可一鍵部署到 Vercel、面試官或合作夥伴可掃 QR 碼即時互動。

---

## 二、本機跑起來

### 1. 裝套件

```bash
cd web
npm install
```

### 2. 設環境變數

複製 `.env.example` 成 `.env.local`：

```bash
cp .env.example .env.local
```

填入 `ANTHROPIC_API_KEY`（從 https://console.anthropic.com/ 取得）。

> 若未填、demo 仍可跑、會走 fallback mock 回應、但看不到真實 tool calling。

### 3. 跑

```bash
npm run dev
```

開 http://localhost:3000

---

## 三、Vercel 一鍵部署

1. push 整個 repo 到 GitHub
2. 開 https://vercel.com/new、選此 repo
3. 在 Vercel project 設定：
   - **Root Directory**：`demo/web`（若 web 在子目錄）
   - **Framework Preset**：Next.js（自動偵測）
4. **Environment Variables** → 新增：
   ```
   ANTHROPIC_API_KEY = sk-ant-api03-...
   ```
5. Deploy → 拿到 `https://your-app.vercel.app` URL

---

## 四、UI 三欄結構

```
┌─────────────────────────────────────────────────────┐
│ Header · HomeWellness Companion · 家暖              │
├──────────┬─────────────────────┬───────────────────┤
│ 左 240px │ 中 (flex-1)         │ 右 320px         │
│          │                     │                  │
│ Scenario │ ChatInterface       │ HealthDashboard  │
│ Selector │ ─────────────       │ ─────────────    │
│ (4 場景) │ · 對話泡泡           │ · 王秀英 72 歲    │
│          │ · streaming text    │ · 慢性病標籤      │
│ IoT      │ · tool call chip    │ · 4 metric cards │
│ Triggers │ · 自動跑場景         │ · 今日用藥        │
│ (5 按鈕) │ · 打字輸入框         │ · 家屬通知記錄    │
│ 清空對話 │                     │ · 119 紀錄        │
└──────────┴─────────────────────┴───────────────────┘
```

桌面版顯示三欄；mobile 自動收成抽屜（Header 左右按鈕展開）。

---

## 五、5 個 Tool（ai-sdk）

| Tool | 描述 |
|---|---|
| `readVitals` | 讀即時血壓 / 心率 / 體溫 / 血氧 / 睡眠 |
| `checkMedicationSchedule` | 查目前該吃哪個藥 |
| `notifyFamily` | 通知家屬（info / warning / urgent / emergency 四級） |
| `emergency119` | 緊急狀況自動撥 119 |
| `queryHealthHistory` | 拉歷史趨勢給 LLM 解讀 |

所有 tool mock data 100% reproducible — 同一 tool call 同樣回傳值、demo 可預測。

---

## 六、4 個場景 demo

1. **早安主動關懷** — IoT PIR 觸發、device 主動開口問早安 + 詢問睡眠
2. **用藥提醒** — 08:00 排程觸發、tool 拉用藥表、用問句給選擇權
3. **頭暈症狀** — 用戶主動「我頭暈」、tool 讀血壓 145/95、引導家屬聯絡
4. **異常通報** — PIR 靜止 2 hr、升級流程 → 通知家屬 → 119

左 sidebar 點場景 → 按「自動跑場景」會自動播放完整對話腳本。

---

## 七、技術 stack

| 層 | 技術 |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS · warm-serif theme |
| UI Primitives | Radix UI · shadcn/ui pattern |
| Icons | Lucide React |
| LLM | Anthropic Claude Sonnet 4.5 |
| AI SDK | Vercel `ai` + `@ai-sdk/anthropic` |
| Streaming | Data stream protocol (server → client) |
| Tool Calling | ai-sdk native `tool()` helper + Zod schema |
| Deployment | Vercel (zero config) |

---

## 八、檔案結構

```
web/
├── app/
│   ├── api/chat/route.ts        # ai-sdk streaming + tool endpoint
│   ├── page.tsx                  # 主頁面三欄佈局
│   ├── layout.tsx
│   └── globals.css               # tailwind + warm-serif theme
├── components/
│   ├── chat-interface.tsx        # useChat hook + 對話泡泡
│   ├── health-dashboard.tsx      # 右側健康儀表板
│   ├── scenario-selector.tsx     # 左側場景切換
│   ├── iot-triggers.tsx          # 5 個 IoT 觸發按鈕
│   └── ui/                       # shadcn-style primitives
├── lib/
│   ├── system-prompt.ts          # 10 條 Vibe 紀律
│   ├── tools.ts                  # 5 個 ai-sdk tool
│   ├── scenarios.ts              # 4 場景對話 data
│   ├── mock-data.ts              # 阿嬤 7 維健康輪廓
│   └── utils.ts
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
├── vercel.json
└── .env.example
```

---

## 九、視覺設計

對齊 PROPOSAL-premium 設計：

- **字體**：Fraunces italic（標題）+ Noto Serif TC（中文）+ Source Serif Pro（內文）+ Fira Code（程式）
- **配色**：
  - 米色 `#FAF6F0` / 紙白 `#FFFBF5` / 暖砂 `#F5E6D3`
  - 琥珀 `#D4712A` / 深琥珀 `#B85A1F` / 淡琥珀 `#E89B5F`
  - 可可 `#8B4513` / 深可可 `#5A2D0A`
  - 墨 `#2A1F18` / 軟墨 `#4A3A2E` / 啞墨 `#8A7560`
- **對話泡泡**：
  - 阿嬤（右）：琥珀色淺底
  - AI（左）：暖砂底
  - 圓角不對稱、貼合對話脈絡

---

## 十、Fallback 機制

- 無 `ANTHROPIC_API_KEY` → 自動切 mock streaming reply
- API timeout / error → 自動 fallback、不會把 stack trace 噴給使用者
- 場景對話腳本即使 API 掛了也能跑（直接 inject messages）

---

## 十一、授權

MIT License
