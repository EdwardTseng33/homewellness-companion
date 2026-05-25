# HomeWellness Companion · Demo

銀髮陪伴 AI · 即時主動關懷 + 用藥提醒 + 異常通報 · Streamlit + LangGraph-style + Claude Sonnet 4.5

---

## 一、跑起來（3 步）

### 1. 裝套件

```bash
pip install -r requirements.txt
```

`requirements.txt`：

```
streamlit>=1.31.0
anthropic>=0.39.0
pydantic>=2.5.0
pyyaml>=6.0
```

### 2. 設環境變數

```bash
# Windows PowerShell
$env:ANTHROPIC_API_KEY = "sk-ant-..."

# Mac / Linux / Git Bash
export ANTHROPIC_API_KEY=sk-ant-...
```

### 3. 跑

```bash
streamlit run streamlit_chatbot.py
```

瀏覽器自動開 `http://localhost:8501`。

---

## 二、UI 結構

```
┌─────────────────────────────────────────────────────────┐
│ Sidebar 左                  │  主對話區       │ 健康儀表板   │
│ ─────────                   │  ─────────      │ ─────────  │
│ 🏠 HomeWellness            │  💬 跟阿嬤對話   │ 👵 王秀英    │
│ ✅ API 連線狀態             │                 │ 慢性病      │
│                            │  對話歷史顯示    │ 7 天平均     │
│ 🎬 Demo 場景切換            │  ┌──────────┐  │ - 血壓       │
│ [▾ 4 場景]                 │  │ 阿嬤：... │  │ - 心率       │
│ ▶ 自動跑場景                │  │ AI: ...   │  │ - 睡眠       │
│                            │  │ ...       │  │ - 用藥配合   │
│ 🔔 模擬 IoT 觸發            │  └──────────┘  │             │
│ 📡 PIR 靜止 2hr             │                 │ 💊 今日用藥  │
│ 💊 08:00 用藥時間           │  [打字輸入框]    │             │
│ 🩺 血壓異常偵測             │                 │ 📞 家屬通知  │
│ ⚠️ 跌倒偵測                 │                 │             │
│ 📅 月度回顧                 │                 │ 🚨 119 紀錄  │
│ 🗑 清空對話                  │                 │             │
└─────────────────────────────────────────────────────────┘
```

---

## 三、4 個 Demo 場景

### 場景 1 · 早安主動關懷
- 左 sidebar 選 `場景 1 · 早安問候` → 按 `▶ 自動跑場景`
- 模擬 IoT PIR 偵測長者起床 → device 主動開口問早安 + 詢問睡眠

### 場景 2 · 用藥提醒
- 按 `💊 08:00 用藥時間` 觸發按鈕（或選場景 2 自動跑）
- 模擬 Tool Calling：呼叫 `check_medication_schedule` 拉用藥表 → 主動提醒

### 場景 3 · 頭暈症狀
- 在底部打字輸入：「欸、我剛剛頭有點暈。」
- 觸發 Tool Calling：呼叫 `read_vitals('blood_pressure')` → 回血壓 145/95 → LLM 解讀 + 引導家屬聯絡

### 場景 4 · 異常通報
- 按 `📡 PIR 靜止 2 hr` 觸發按鈕
- 觀察右側健康儀表板「📞 家屬通知」即時出現訊息
- 模擬 device 主動呼叫 → 無回應升級 → 通知家屬 + 119

---

## 四、Streamlit Cloud 部署

### 步驟

1. fork 或推到 GitHub（已在 `EdwardTseng33/homewellness-companion`）
2. 開 https://share.streamlit.io 用 GitHub 登入
3. New app → 選 repo → main file `streamlit_chatbot.py`
4. Secrets 設定（左下 Settings）→ 貼：
   ```toml
   ANTHROPIC_API_KEY = "sk-ant-..."
   ```
5. Deploy → 拿到 `https://homewellness-companion.streamlit.app` URL

### 注意

- Streamlit Cloud 免費版 cold start ~30 秒、demo 前先打開預熱
- 本機 `streamlit run` 當備案

---

## 五、故障處理

### 狀況 1 · 網路掛了 / API timeout

- `streamlit_chatbot.py` 內建 `APITimeoutError` 處理、會回 fallback 訊息：「[API 超時] 阿嬤、我網路有點慢、你再說一次好嗎？」
- 切換到 fallback 模式：拔掉 ANTHROPIC_API_KEY、UI 仍能跑、會回 mock 回應
- 最壞 case：直接秀 `scenarios.yaml` 的 `sample_dialog` 解釋架構

### 狀況 2 · Streamlit Cloud 掛了

- 切到本機 localhost:8501（先預先跑著）

### 狀況 3 · Claude API 額度用完

- demo 前確認 Anthropic console 餘額 ≥ $5
- 備援 key：另外用 burner account 申請的備用 key

### 狀況 4 · 觸發按鈕沒反應

- 按 `🗑 清空對話` 重置 session_state
- F5 重整頁面（會清 session 但 UI 重來）

---

## 六、檔案結構

```
homewellness-companion/
├── streamlit_chatbot.py   # 主程式（~750 行）
├── scenarios.yaml         # 4 場景對話腳本
├── README.md              # 本檔
├── LICENSE                # MIT
├── requirements.txt       # 套件清單
└── .gitignore
```

---

## 七、技術 Stack

- **語言**：Python 3.10+
- **框架**：Streamlit（UI）+ Anthropic SDK（Claude API）
- **架構**：LangGraph-style state machine（load_memory → router → tool calls → update_memory）
- **Tool calling**：Anthropic native tool_use
- **5 個 Tool**：`read_vitals` / `check_medication_schedule` / `notify_family` / `emergency_119` / `query_health_history`
- **Mock data**：所有 tool 用固定回傳值、demo 100% reproducible
- **無 console error**：跑 `streamlit run` 後瀏覽器 F12 確認 console 零 error

---

## 八、授權

MIT License · 詳見 `LICENSE`
