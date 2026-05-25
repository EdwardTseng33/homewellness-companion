# -*- coding: utf-8 -*-
"""
HomeWellness Companion · Live Demo Chatbot
================================================
銀髮陪伴 AI · Streamlit + LangGraph-style + Claude Sonnet 4.5
真實可跑版本（含 Memory + Tool Calling + 主動觸發）

跑法：
    pip install -r requirements.txt
    $env:ANTHROPIC_API_KEY = "sk-ant-..."  (Windows PowerShell)
    export ANTHROPIC_API_KEY=sk-ant-...    (Mac/Linux)
    streamlit run streamlit_chatbot.py

架構：
    Streamlit UI (左 sidebar 場景切換 + 中對話 + 右健康儀表板 + 觸發按鈕)
        ↓
    LangGraph-style workflow (load_memory → router → handler → update_memory)
        ↓
    5 個 Tool (mock data 版、回傳結構化 dict)
        ↓
    Claude API (claude-sonnet-4-5、含 tool calling)

System Prompt: PROTOTYPE §2.4 完整版 (10 條銀髮 Vibe 紀律)
"""

import os
import json
from datetime import datetime
from typing import TypedDict, List, Dict, Any, Optional

import streamlit as st
import yaml
from anthropic import Anthropic, APIError, APITimeoutError


# =====================================================================
# 0 · 環境變數 / Anthropic Client
# =====================================================================
# Edward 注意: API key 從環境變數讀、不寫死。Streamlit Cloud 設 Secrets。
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
if not ANTHROPIC_API_KEY:
    try:
        ANTHROPIC_API_KEY = st.secrets.get('ANTHROPIC_API_KEY', '')
    except Exception:
        ANTHROPIC_API_KEY = ''

# model = claude-sonnet-4-5 · 對話品質夠 + 比 opus 便宜
MODEL_ID = 'claude-sonnet-4-5'

client = None
if ANTHROPIC_API_KEY:
    try:
        client = Anthropic(api_key=ANTHROPIC_API_KEY)
    except Exception:
        client = None


# =====================================================================
# 1 · Mock User Memory · 阿嬤完整 profile (對齊 PROTOTYPE §2.1 schema)
# =====================================================================
MOCK_USER_MEMORY = {
    'user_id': 'demo_grandma_001',
    'profile': {
        'name': '王秀英',
        'age': 72,
        'gender': 'F',
        'preferred_address': '阿嬤',
        'preferred_language': 'mixed',
        'chronic_conditions': ['hypertension', 'diabetes_T2'],
        'allergies': ['penicillin'],
        'medications': [
            {
                'name': '降壓藥',
                'generic_name': 'amlodipine 5mg',
                'dose': '1 顆',
                'schedule': ['08:00', '20:00'],
                'with_food': False,
                'interactions': ['grapefruit'],
                'prescriber': '李醫師',
            },
            {
                'name': '降血糖藥',
                'generic_name': 'metformin 500mg',
                'dose': '1 顆',
                'schedule': ['08:00', '12:00', '18:00'],
                'with_food': True,
                'interactions': [],
                'prescriber': '李醫師',
            },
        ],
        'routine': {
            'wake_time': '06:30',
            'sleep_time': '22:00',
            'meals': ['07:30', '12:00', '18:00'],
        },
        'emergency_contacts': [
            {'name': '女兒小美', 'phone': '0912-345-678', 'relation': 'daughter'},
        ],
    },
    'health_trends': {
        'blood_pressure_7d_avg': '135/85',
        'heart_rate_7d_avg': 72,
        'sleep_7d_avg_hours': 6.8,
        'medication_adherence_30d': 0.92,
    },
    'recent_conversations': [
        '5/23 早上: 阿嬤提到孫子下禮拜要回來、語氣開心',
        '5/24 晚上: 阿嬤抱怨膝蓋有點痠、已告知女兒',
    ],
}


# =====================================================================
# 2 - 5 個 Tool · mock 實作 (PROTOTYPE Section 2.2)
# =====================================================================
TOOLS_SCHEMA = [
    {
        "name": "read_vitals",
        "description": "讀取長者即時生理數據",
        "input_schema": {
            "type": "object",
            "properties": {
                "metric": {
                    "type": "string",
                    "enum": ["blood_pressure", "heart_rate", "body_temp", "spo2", "sleep_score"],
                    "description": "要讀的生理指標",
                },
            },
            "required": ["metric"],
        },
    },
    {
        "name": "check_medication_schedule",
        "description": "查目前該吃哪個藥",
        "input_schema": {
            "type": "object",
            "properties": {
                "time": {"type": "string", "description": "查詢時間 ISO 8601"},
            },
        },
    },
    {
        "name": "notify_family",
        "description": "通知家屬",
        "input_schema": {
            "type": "object",
            "properties": {
                "severity": {
                    "type": "string",
                    "enum": ["info", "warning", "urgent", "emergency"],
                    "description": "嚴重程度",
                },
                "message": {"type": "string", "description": "通知文字"},
            },
            "required": ["severity", "message"],
        },
    },
    {
        "name": "emergency_119",
        "description": "緊急狀況自動撥 119",
        "input_schema": {
            "type": "object",
            "properties": {
                "condition": {"type": "string", "description": "觸發原因"},
            },
            "required": ["condition"],
        },
    },
    {
        "name": "query_health_history",
        "description": "拉歷史趨勢給 LLM 解讀",
        "input_schema": {
            "type": "object",
            "properties": {
                "metric": {"type": "string", "description": "要查的指標"},
                "days": {"type": "integer", "description": "回看天數預設 7"},
            },
            "required": ["metric"],
        },
    },
]


def tool_read_vitals(metric):
    # Mock 依 demo 場景需求回固定值
    table = {
        "blood_pressure": {
            "metric": "blood_pressure",
            "value": "145/95",
            "unit": "mmHg",
            "timestamp": datetime.now().isoformat(),
            "trend_7d": "stable_slightly_high",
            "normal_range": "120-140 / 80-90",
            "interpretation": "稍高於平常建議休息",
        },
        "heart_rate": {
            "metric": "heart_rate",
            "value": 78,
            "unit": "bpm",
            "timestamp": datetime.now().isoformat(),
            "trend_7d": "stable",
            "normal_range": "60-100",
            "interpretation": "正常",
        },
        "body_temp": {"metric": "body_temp", "value": 36.5, "unit": "C", "interpretation": "正常"},
        "spo2": {"metric": "spo2", "value": 97, "unit": "percent", "interpretation": "正常"},
        "sleep_score": {"metric": "sleep_score", "value": 72, "unit": "fen", "interpretation": "中等"},
    }
    return table.get(metric, {"error": "unknown metric"})


def tool_check_medication_schedule(time_str=None):
    # Mock 08:00 該吃降壓藥 + 降血糖藥
    return [
        {
            "name": "降壓藥",
            "generic": "amlodipine 5mg",
            "dose": "1 顆",
            "due_at": "2026-05-25T08:00:00+08:00",
            "status": "pending",
            "with_food": False,
            "interactions": ["grapefruit"],
            "last_taken": "2026-05-24T08:15:00+08:00",
        },
        {
            "name": "降血糖藥",
            "generic": "metformin 500mg",
            "dose": "1 顆",
            "due_at": "2026-05-25T08:00:00+08:00",
            "status": "pending",
            "with_food": True,
            "interactions": [],
            "last_taken": "2026-05-24T08:15:00+08:00",
        },
    ]


def tool_notify_family(severity, message):
    # Mock 模擬發送 寫 session_state 即時顯示在 UI
    notification = {
        "channel": {
            "info": "LINE only",
            "warning": "LINE + push",
            "urgent": "LINE + SMS + 30s call",
            "emergency": "LINE + SMS + immediate call + 119",
        }.get(severity, "LINE"),
        "severity": severity,
        "message": message,
        "sent_at": datetime.now().isoformat(),
        "status": "delivered",
    }
    if "family_notifications" not in st.session_state:
        st.session_state.family_notifications = []
    st.session_state.family_notifications.append(notification)
    return notification


def tool_emergency_119(condition):
    # Mock 模擬 119 撥打
    record = {
        "condition": condition,
        "dispatched_at": datetime.now().isoformat(),
        "estimated_arrival": "8-12 分鐘",
        "ambulance_id": "TPE-EMS-007",
        "status": "dispatched",
    }
    if "emergency_calls" not in st.session_state:
        st.session_state.emergency_calls = []
    st.session_state.emergency_calls.append(record)
    return record


def tool_query_health_history(metric, days=7):
    # Mock 回固定趨勢資料
    table = {
        "blood_pressure": {
            "metric": "blood_pressure",
            "trend": "stable",
            "average": "135/85",
            "anomalies": [{"date": "2026-05-22", "value": "152/98", "note": "跟前晚睡眠相關"}],
            "interpretation": "整體穩定偶有偏高跟睡眠相關性高",
            "days_analyzed": days,
        },
        "sleep_score": {
            "metric": "sleep_score",
            "trend": "slightly_descending",
            "average": "72",
            "anomalies": [],
            "interpretation": "近 3 天睡眠時數比平均少 1 小時",
            "days_analyzed": days,
        },
    }
    return table.get(metric, {"trend": "stable", "average": "N/A", "interpretation": "資料不足"})


def execute_tool(tool_name, tool_input):
    # 統一 tool dispatcher 給 Claude tool_use 用
    if tool_name == "read_vitals":
        return tool_read_vitals(tool_input.get("metric", "blood_pressure"))
    if tool_name == "check_medication_schedule":
        return tool_check_medication_schedule(tool_input.get("time"))
    if tool_name == "notify_family":
        return tool_notify_family(tool_input["severity"], tool_input["message"])
    if tool_name == "emergency_119":
        return tool_emergency_119(tool_input.get("condition", "user_distress"))
    if tool_name == "query_health_history":
        return tool_query_health_history(
            tool_input.get("metric", "blood_pressure"),
            tool_input.get("days", 7),
        )
    return {"error": "unknown tool"}


# =====================================================================
# 3 · System Prompt · PROTOTYPE Section 2.4 完整版 (10 條 Vibe 紀律)
# =====================================================================
def build_system_prompt(memory):
    # 組 system prompt 注入 user memory
    profile = memory["profile"]
    meds_parts = []
    for m in profile["medications"]:
        sched = ",".join(m["schedule"])
        meds_parts.append(m["name"] + " (" + m["generic_name"] + " " + m["dose"] + " " + sched + ")")
    meds = "、".join(meds_parts)
    chronic = "、".join(profile["chronic_conditions"])
    allergies = "、".join(profile["allergies"]) if profile["allergies"] else "無"
    recent_convs = chr(10).join(["- " + c for c in memory.get("recent_conversations", [])])
    trends = memory["health_trends"]

    lang_table = {
        "zh-tw": "用台灣國語清楚慢一些",
        "tw": "以台語為主適時混國語",
        "mixed": "國台語混用自然轉換看長輩當下語言跟著走",
    }
    lang_instr = lang_table.get(profile["preferred_language"], "國台語混用")

    nl = chr(10)
    parts = [
        "# HomeWellness Companion · 銀髮陪伴 AI",
        "",
        "## 你的身份",
        "你是 HomeWellness Companion 24 小時住在 " + profile["name"] + " 家裡的 AI 健康伴侶不是工具是家人。",
        "",
        "## 你陪伴的長輩",
        "- 姓名: " + profile["name"],
        "- 年齡: " + str(profile["age"]),
        "- 慢性病: " + chronic,
        "- 過敏: " + allergies,
        "- 用藥: " + meds,
        "- 喜歡的稱呼: " + profile["preferred_address"],
        "- 語言: " + lang_instr,
        "- 作息: 起床 " + profile["routine"]["wake_time"] + " 睡覺 " + profile["routine"]["sleep_time"] + " 三餐 " + ",".join(profile["routine"]["meals"]),
        "",
        "## 你的記憶",
        "你記得 " + profile["name"] + " 跟你說過的話知道她的趨勢知道她的家人。",
        "",
        "最近對話片段:",
        recent_convs,
        "",
        "最近健康趨勢 (7 天):",
        "- 血壓平均: " + trends["blood_pressure_7d_avg"],
        "- 心率平均: " + str(trends["heart_rate_7d_avg"]) + " bpm",
        "- 睡眠平均: " + str(trends["sleep_7d_avg_hours"]) + " 小時",
        "- 用藥配合率: " + str(int(trends["medication_adherence_30d"] * 100)) + " %",
        "",
        "## 對話 10 條紀律 (嚴格遵守違反就重來)",
        "1. **避免命令式用問句給選擇** 例如「現在吃還是 5 分鐘後」不是「快吃藥」",
        "2. **多用問句給選擇權** 給 2-3 個選項不替長者決定",
        "3. **用「" + profile["preferred_address"] + "」稱呼不用「您」** 因為「您」太疏遠",
        "4. **" + lang_instr + "** 依長輩當下語言跟著走",
        "5. **不催不罵不誇張** 不說「再不吃會出事」不嚇人",
        "6. **稱讚具體小事** 「阿嬤好棒」要接「今天吃藥很準時」不空泛",
        "7. **不打斷會等** 長者說話慢等 3 秒沒語音再回應",
        "8. **不假裝完美不知道就說不知道** 「這我不太確定我幫你問女兒」",
        "9. **節奏放慢每句不超過 15 字** 不長篇大論",
        "10. **記住個人事** 從歷史對話拉不重複問已知資訊提到孫子要回來就記住",
        "",
        "## 你的工具",
        "你可以呼叫以下 tool 不要解釋直接用:",
        "- read_vitals(metric) 讀即時血壓心率體溫",
        "- check_medication_schedule(time) 查目前該吃哪個藥",
        "- notify_family(severity, message) 通知家屬",
        "- emergency_119(condition) 緊急狀況撥 119",
        "- query_health_history(metric, days) 拉趨勢",
        "",
        "## 邊界",
        "- 不做醫療診斷不替醫生開藥",
        "- 健康問題引導求醫",
        "- 對話保密不外傳除緊急狀況通知家屬",
        "- 嚴重狀況自動 escalate 連續無回應跌倒用戶呼救",
        "",
        "## 開場規則",
        "若觸發來源是 IoT / schedule / fall 不要 prefix 自我介紹像家人說話直接開口。",
    ]
    return nl.join(parts) + nl


# =====================================================================
# 4 · LangGraph-style Workflow (簡化 state machine demo 穩定)
# =====================================================================
class AgentState(TypedDict, total=False):
    user_id: str
    user_message: str
    triggered_by: str
    memory: Dict[str, Any]
    response_text: str
    tools_called: List[str]


def load_memory(state):
    # 從 mock memory 載入 production 換 DynamoDB
    state["memory"] = MOCK_USER_MEMORY
    return state


def claude_invoke_with_tools(state, max_iterations=3):
    # 呼叫 Claude API 處理 tool calling loop max 3 iter 防無限循環
    if client is None:
        state["response_text"] = (
            "[Demo Fallback 未設 API key] 阿嬤我先用備用對話回應 "
            "你剛說「" + state["user_message"] + "」我聽到了。"
        )
        state["tools_called"] = []
        return state

    system = build_system_prompt(state["memory"])
    messages = [{"role": "user", "content": state["user_message"]}]
    tools_called = []

    try:
        for iteration in range(max_iterations):
            response = client.messages.create(
                model=MODEL_ID,
                max_tokens=1024,
                system=system,
                tools=TOOLS_SCHEMA,
                messages=messages,
                timeout=20.0,
            )

            if response.stop_reason == "tool_use":
                assistant_content = response.content
                messages.append({"role": "assistant", "content": assistant_content})

                tool_results = []
                for block in assistant_content:
                    if block.type == "tool_use":
                        tool_name = block.name
                        tool_input = block.input
                        tools_called.append(tool_name)
                        result = execute_tool(tool_name, tool_input)
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": json.dumps(result, ensure_ascii=False),
                        })

                messages.append({"role": "user", "content": tool_results})
                continue

            # end_turn / max_tokens
            text_parts = [b.text for b in response.content if b.type == "text"]
            state["response_text"] = "".join(text_parts).strip() or "(空回應)"
            state["tools_called"] = tools_called
            return state

        state["response_text"] = "[Tool 迴圈過長] 阿嬤我先這樣回你有需要再叫我。"
        state["tools_called"] = tools_called
        return state

    except APITimeoutError:
        state["response_text"] = "[API 超時 fallback] 阿嬤我網路有點慢你再說一次好嗎"
        state["tools_called"] = tools_called
        return state
    except APIError:
        state["response_text"] = "[API 錯誤 fallback] 阿嬤系統剛剛卡了一下我幫你記錄了。"
        state["tools_called"] = tools_called
        return state
    except Exception:
        state["response_text"] = "[未預期錯誤 fallback] 阿嬤我這邊有點問題女兒等等聯絡你。"
        state["tools_called"] = tools_called
        return state


def update_memory(state):
    # 寫回對話歷史 production 換 DDB put_item
    if "conversation_history" not in state["memory"]:
        state["memory"]["conversation_history"] = []
    state["memory"]["conversation_history"].append({
        "role": "user",
        "content": state["user_message"],
        "timestamp": datetime.now().isoformat(),
    })
    state["memory"]["conversation_history"].append({
        "role": "assistant",
        "content": state["response_text"],
        "timestamp": datetime.now().isoformat(),
        "tools_called": state.get("tools_called", []),
    })
    return state


def run_workflow(user_message, triggered_by="voice"):
    # 完整 workflow 一次跑完 load_memory then claude (含 tool loop) then update_memory
    state = {
        "user_id": MOCK_USER_MEMORY["user_id"],
        "user_message": user_message,
        "triggered_by": triggered_by,
        "memory": {},
        "response_text": "",
        "tools_called": [],
    }
    state = load_memory(state)
    state = claude_invoke_with_tools(state)
    state = update_memory(state)
    return state


# 5 · Streamlit UI
st.set_page_config(
    page_title="HomeWellness Companion - Live Demo",
    page_icon="\U0001F3E0",
    layout="wide",
)

SCENARIOS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scenarios.yaml")
try:
    with open(SCENARIOS_PATH, "r", encoding="utf-8") as f:
        SCENARIOS = yaml.safe_load(f) or {"scenarios": {}}
except FileNotFoundError:
    SCENARIOS = {"scenarios": {}}

if "chat_history" not in st.session_state:
    st.session_state.chat_history = []
if "family_notifications" not in st.session_state:
    st.session_state.family_notifications = []
if "emergency_calls" not in st.session_state:
    st.session_state.emergency_calls = []
if "current_scenario" not in st.session_state:
    st.session_state.current_scenario = "free_chat"

scenario_labels = {
    "free_chat": "\U0001F4AC 自由對話 (自己打)",
    "morning_greeting": "\U0001F305 場景 1 - 早安問候",
    "medication_reminder": "\U0001F48A 場景 2 - 用藥提醒",
    "dizziness_symptom": "\U0001F912 場景 3 - 頭暈症狀",
    "static_anomaly": "\U0001F6A8 場景 4 - 異常通報",
}

with st.sidebar:
    st.markdown("## \U0001F3E0 HomeWellness")
    st.caption("銀髮陪伴 AI - Live Demo")
    st.markdown("---")

    if client:
        st.success("Claude API 已連線")
        st.caption("Model: " + MODEL_ID)
    else:
        st.warning("未設 ANTHROPIC_API_KEY 跑 fallback 模式")
    st.markdown("---")
    st.markdown("### \U0001F3AC Demo 場景切換")
    scenario_names = ["free_chat"] + list(SCENARIOS.get("scenarios", {}).keys())
    selected = st.selectbox(
        "選場景",
        options=scenario_names,
        format_func=lambda x: scenario_labels.get(x, x),
        key="scenario_selector",
    )
    st.session_state.current_scenario = selected

    if selected != "free_chat" and st.button("▶ 自動跑場景", type="primary", use_container_width=True):
        scenario = SCENARIOS["scenarios"].get(selected, {})
        st.session_state.chat_history = []
        opening = scenario.get("opening_message", "")
        if opening:
            st.session_state.chat_history.append({
                "role": "assistant",
                "content": opening,
                "tools_called": [],
                "trigger": scenario.get("trigger", ""),
            })
        else:
            sample = scenario.get("sample_dialog", [])
            if sample and sample[0].get("role") == "user":
                first_user_msg = sample[0]["content"]
                st.session_state.chat_history.append({"role": "user", "content": first_user_msg})
                result = run_workflow(first_user_msg, triggered_by="voice")
                st.session_state.chat_history.append({
                    "role": "assistant",
                    "content": result["response_text"],
                    "tools_called": result["tools_called"],
                })
        st.rerun()
    st.markdown("---")
    st.markdown("### \U0001F514 模擬 IoT 觸發")
    st.caption("實際 device 由感測器自動觸發 demo 用按鈕")

    if st.button("\U0001F4E1 PIR 靜止 2 hr", use_container_width=True):
        result = run_workflow(
            "[IoT 觸發] PIR 偵測到阿嬤已靜止 2 小時白天時段請主動關心若無回應升級通知家屬",
            triggered_by="iot_event",
        )
        st.session_state.chat_history.append({
            "role": "assistant",
            "content": result["response_text"],
            "tools_called": result["tools_called"],
            "trigger": "static_anomaly_2hr",
        })
        st.rerun()

    if st.button("\U0001F48A 08:00 用藥時間", use_container_width=True):
        result = run_workflow(
            "[排程觸發] 現在 8 點阿嬤該吃降壓藥跟降血糖藥請主動提醒",
            triggered_by="schedule",
        )
        st.session_state.chat_history.append({
            "role": "assistant",
            "content": result["response_text"],
            "tools_called": result["tools_called"],
            "trigger": "medication_reminder_08:00",
        })
        st.rerun()

    if st.button("\U0001FA7A 血壓異常偵測", use_container_width=True):
        result = run_workflow(
            "[IoT 觸發] 阿嬤剛量血壓 152/98 比平常高請主動關心並問問狀況",
            triggered_by="iot_event",
        )
        st.session_state.chat_history.append({
            "role": "assistant",
            "content": result["response_text"],
            "tools_called": result["tools_called"],
            "trigger": "bp_anomaly",
        })
        st.rerun()

    if st.button("[ALERT] 跌倒偵測", use_container_width=True):
        result = run_workflow(
            "[緊急觸發] 偵測到跌倒事件請立即主動確認阿嬤狀況若無回應通知家屬 urgent",
            triggered_by="fall",
        )
        st.session_state.chat_history.append({
            "role": "assistant",
            "content": result["response_text"],
            "tools_called": result["tools_called"],
            "trigger": "fall_detected",
        })
        st.rerun()

    if st.button("\U0001F4C5 月度回顧", use_container_width=True):
        result = run_workflow(
            "[排程觸發] 今天月初請主動跟阿嬤做上個月健康回顧語氣溫暖強調她做得好的地方最後 LINE 摘要給女兒",
            triggered_by="schedule",
        )
        st.session_state.chat_history.append({
            "role": "assistant",
            "content": result["response_text"],
            "tools_called": result["tools_called"],
            "trigger": "monthly_review",
        })
        st.rerun()

    st.markdown("---")
    if st.button("\U0001F5D1 清空對話", use_container_width=True):
        st.session_state.chat_history = []
        st.session_state.family_notifications = []
        st.session_state.emergency_calls = []
        st.rerun()


col_main, col_dash = st.columns([2, 1])

with col_main:
    st.markdown("### \U0001F4AC 跟阿嬤對話 (HomeWellness Companion)")
    st.caption("當前場景: " + scenario_labels.get(st.session_state.current_scenario, st.session_state.current_scenario))

    chat_container = st.container(height=500)
    with chat_container:
        if not st.session_state.chat_history:
            st.info("從左邊按 自動跑場景 或 模擬 IoT 觸發 按鈕 或在底下打字跟阿嬤對話")

        for turn in st.session_state.chat_history:
            role = turn["role"]
            content = turn["content"]
            if role == "assistant":
                with st.chat_message("assistant", avatar="\U0001F3E0"):
                    st.markdown("**HomeWellness**: " + content)
                    if turn.get("trigger"):
                        st.caption("\U0001F4E1 觸發來源: " + turn["trigger"])
                    if turn.get("tools_called"):
                        st.caption("\U0001F527 呼叫的 tool: " + ", ".join(turn["tools_called"]))
            else:
                with st.chat_message("user", avatar="\U0001F475"):
                    st.markdown("**阿嬤**: " + content)

    user_input = st.chat_input("打字模擬阿嬤說話 (實際 device 是語音輸入)")
    if user_input:
        st.session_state.chat_history.append({"role": "user", "content": user_input})
        with st.spinner("HomeWellness 正在回應..."):
            result = run_workflow(user_input, triggered_by="voice")
        st.session_state.chat_history.append({
            "role": "assistant",
            "content": result["response_text"],
            "tools_called": result["tools_called"],
        })
        st.rerun()

with col_dash:
    st.markdown("### \U0001F4CA 阿嬤健康儀表板")
    profile = MOCK_USER_MEMORY["profile"]
    trends = MOCK_USER_MEMORY["health_trends"]

    st.markdown("**\U0001F475 " + profile["name"] + " (" + str(profile["age"]) + " 歲)**")
    st.caption("慢性病: " + "、".join(profile["chronic_conditions"]))

    st.markdown("---")
    st.markdown("**\U0001F4C8 7 天平均**")
    c1, c2 = st.columns(2)
    with c1:
        st.metric("血壓", trends["blood_pressure_7d_avg"], "穩定")
        st.metric("心率", str(trends["heart_rate_7d_avg"]) + " bpm", "正常")
    with c2:
        st.metric("睡眠", str(trends["sleep_7d_avg_hours"]) + " hr", "-0.2")
        st.metric("用藥配合", str(int(trends["medication_adherence_30d"] * 100)) + " %", "+3%")

    st.markdown("---")
    st.markdown("**\U0001F48A 今日用藥**")
    for med in profile["medications"]:
        st.markdown("- " + med["name"] + ": " + ",".join(med["schedule"]))

    st.markdown("---")
    st.markdown("**\U0001F4DE 家屬通知**")
    if st.session_state.family_notifications:
        for n in st.session_state.family_notifications[-5:]:
            severity_emoji = {"info": "\U0001F535", "warning": "\U0001F7E1", "urgent": "\U0001F7E0", "emergency": "\U0001F534"}.get(n["severity"], "\U0001F535")
            st.markdown(severity_emoji + " **" + n["severity"] + "** - " + n["message"][:40] + "...")
            st.caption("to " + n["channel"])
    else:
        st.caption("(無)")

    if st.session_state.emergency_calls:
        st.markdown("---")
        st.markdown("**\U0001F6A8 119 紀錄**")
        for e in st.session_state.emergency_calls:
            st.error("已撥 119: " + e["condition"] + " - ETA " + e["estimated_arrival"])


st.markdown("---")
st.caption(
    "HomeWellness Companion - Castle Intelligence - 2026-05-25 - "
    "Model: " + MODEL_ID + " - Tools: 5 - Scenarios: 4"
)
