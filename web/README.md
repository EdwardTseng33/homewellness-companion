# CAREON · HomeWellness Companion · Web Demo

**AI 智慧身心照護 + 智能給藥機** · 銀髮居家照護一體機 MVP Demo
Next.js 14 + Vercel ai-sdk + Anthropic Claude Sonnet 4.6

🔗 **Live Demo**：https://web-one-kohl-15.vercel.app

---

## 一、產品介紹

**CAREON Companion** 是 24 小時住在長輩家裡的 AI 智慧身心照護員 — 不是工具、是家人。透過 IoT 感測（PIR 動作、藍牙血壓計、Apple Watch 心率）+ Claude Sonnet 4.6 推理 + 5 個 health tool 主動關懷、提醒用藥、家屬通知，緊急狀況**人工確認後通報 119**。

這個 Web Demo 用 Next.js 重寫了原 Streamlit prototype、可一鍵部署到 Vercel、面試官或合作夥伴可掃 QR Code 即時互動。

> **完整產品架構提案**：CAREON-INTERVIEW-PROPOSAL-v1.html（15 章節 / 8.8 MB · 含產品照、BOM、商業模式、技術架構、Demo 場景）

---

## 二、CAREON 完整品牌架構（給讀者快速理解）

| 層 | 名稱 | 角色 |
|---|---|---|
| **母品牌** | CAREON | 整體品牌 · 關懷在這裡 |
| **硬體** | CAREON Companion | 8 吋觸控主機 · 含自動配藥槽 + 視訊鏡頭 + AI |
| **App** | CAREON | 雙端（長者大字版 + 子女 dashboard）|
| **AI 服務** | **CARE.AI** | Conversational AI for Wellness Care · 月訂閱核心 |
| **AI 人格** | 阿康 + 小晴 | 30 歲擬人 voice + avatar · 風格化預設 |

### 兩層服務模組（CARE.AI 訂閱定價邏輯）

- **A · 功能互動 · 永遠免費**：用藥提醒、健康查詢、緊急通報、視訊通話、device 主動關心（走端側 Phi-4-mini · NT$0）
- **B · 聊天陪伴 · 訂閱計費**：開放式對話 / 心靈陪聊（走雲端 OpenAI Realtime 2 + 自家 castle-voice-engine · NT$3/分）

### 3 層訂閱（聊天分鐘）

| 方案 | 月費 | 聊天分鐘 |
|---|---|---|
| Free | NT$0（買機自帶）| 50 分鐘 |
| Plus ⭐ | NT$699 | 150 分鐘 |
| Pro | NT$1,299 | 300 分鐘 |

→ 詳細商業模式 / 4 種購機方案 / 長照 3.0 補助對接、見產品架構提案。

---

## 三、本機跑起來

### 1. 裝套件

```bash
cd web
npm install
```

### 2. 設環境變數

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

## 四、Vercel 一鍵部署

1. push 整個 repo 到 GitHub
2. 開 https://vercel.com/new、選此 repo
3. 在 Vercel project 設定：
   - **Root Directory**：`web`
   - **Framework Preset**：Next.js（自動偵測）
4. **Environment Variables** → 新增：
   ```
   ANTHROPIC_API_KEY = sk-ant-api03-...
   ```
5. Deploy → 拿到 `https://your-app.vercel.app` URL

---

## 五、UI 三欄結構

```
┌─────────────────────────────────────────────────────┐
│ Header · CAREON Companion · 關懷在這裡              │
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
│ 清空對話 │                     │ · 通報紀錄        │
└──────────┴─────────────────────┴───────────────────┘
```

桌面版顯示三欄；mobile 自動收成抽屜（Header 左右按鈕展開）。

---

## 六、5 個 Tool（ai-sdk）

| Tool | 描述 |
|---|---|
| `readVitals` | 讀即時血壓（OMRON / Withings 藍牙血壓計）+ 心率（Apple Watch）+ 體溫 + 血氧 + 睡眠 |
| `checkMedicationSchedule` | 查目前該吃哪個藥（搭 28 格 weekly tray / MVP 8 槽 prototype）|
| `notifyFamily` | 通知家屬 4 級升級（L1 系統自處理 / L2 App push / L3 push + 電話 / L4 人工確認後通報 119）|
| `emergency119` | **人工確認後**通報 119 + GPS + 最近生命徵象 + 事件摘要 |
| `queryHealthHistory` | 拉 7/30 天歷史趨勢給 LLM 解讀（不替代醫師診斷） |

**Safety Guardrail**：所有醫療建議結尾自動加「這不是診斷、建議跟你的醫師討論」。CAREON 不診斷、不改劑量、不替代專業。

所有 tool mock data 100% reproducible — 同一 tool call 同樣回傳值、demo 可預測。

---

## 七、4 個 Demo 場景

1. **早安主動關懷** — IoT PIR 觸發、device 主動開口問早安 + 詢問睡眠
2. **用藥提醒** — 08:00 排程觸發、tool 拉用藥表、用問句給選擇權
3. **頭暈症狀** — 用戶主動「我頭暈」、tool 讀血壓 145/95、引導家屬聯絡
4. **異常通報** — PIR 靜止 2 hr、4 級升級流程 → App push → 電話 → 人工確認 → 119

左 sidebar 點場景 → 按「自動跑場景」會自動播放完整對話腳本。

---

## 八、技術 Stack

| 層 | 技術 |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS · warm-serif theme |
| UI Primitives | Radix UI · shadcn/ui pattern |
| Icons | Lucide React |
| LLM（Demo） | Anthropic Claude Sonnet 4.6 |
| **Production LLM 路徑** | **OpenAI Realtime 2**（主路徑 speech-to-speech 300ms）+ Claude 4.6（複雜推理備援）|
| **自架 Voice + Avatar** | **castle-voice-engine**（Wav2Lip + SadTalker + Hallo 2 + MuseTalk 開源 stack · 不綁 DUIX / Tavus）|
| **端側** | Jetson Nano + Llama 3.1 8B + whisper.cpp + Piper TTS · 70% 例行場景跑端側 NT$0 |
| AI SDK | Vercel `ai` + `@ai-sdk/anthropic` |
| Streaming | Data stream protocol (server → client) |
| Tool Calling | ai-sdk native `tool()` helper + Zod schema |
| Deployment | Vercel (zero config) |

→ **3 階段自架轉換策略**：M1-3 OpenAI Realtime 過渡 → M3-9 Inworld（100% 相容遷移）→ M9-24 完全自架（Pipecat + faster-whisper + Fish Speech + Kyutai Moshi）· 把每用戶月 voice 成本從 $50-80 砍到 $5-12 USD。

---

## 九、檔案結構

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
│   ├── system-prompt.ts          # 10 條 Vibe 紀律 + Safety Guardrail
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

## 十、視覺設計

對齊 CAREON 提案 warm-serif 風格：

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

## 十一、Fallback 機制

- 無 `ANTHROPIC_API_KEY` → 自動切 mock streaming reply
- API timeout / error → 自動 fallback、不會把 stack trace 噴給使用者
- 場景對話腳本即使 API 掛了也能跑（直接 inject messages）

---

## 十二、相關連結

- **Live Demo**：https://web-one-kohl-15.vercel.app
- **GitHub Repo**：https://github.com/EdwardTseng33/homewellness-companion
- **CAREON 母品牌**：Castle Intelligence · Edward Tseng

---

## 十三、授權

MIT License
