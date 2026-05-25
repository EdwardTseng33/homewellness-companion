// Mock user memory · 阿嬤完整 profile (對齊 PROTOTYPE §2.1 schema)
// Production 換 DynamoDB / Supabase / 任何 KV store

export interface Medication {
  name: string;
  generic_name: string;
  dose: string;
  schedule: string[];
  with_food: boolean;
  interactions: string[];
  prescriber: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface UserProfile {
  name: string;
  age: number;
  gender: string;
  preferred_address: string;
  preferred_language: 'zh-tw' | 'tw' | 'mixed';
  chronic_conditions: string[];
  allergies: string[];
  medications: Medication[];
  routine: {
    wake_time: string;
    sleep_time: string;
    meals: string[];
  };
  emergency_contacts: EmergencyContact[];
}

export interface HealthTrends {
  blood_pressure_7d_avg: string;
  heart_rate_7d_avg: number;
  sleep_7d_avg_hours: number;
  medication_adherence_30d: number;
}

export interface UserMemory {
  user_id: string;
  profile: UserProfile;
  health_trends: HealthTrends;
  recent_conversations: string[];
}

export const MOCK_USER_MEMORY: UserMemory = {
  user_id: 'demo_grandma_001',
  profile: {
    name: '王秀英',
    age: 72,
    gender: 'F',
    preferred_address: '阿嬤',
    preferred_language: 'mixed',
    chronic_conditions: ['高血壓', '第二型糖尿病'],
    allergies: ['penicillin'],
    medications: [
      {
        name: '降壓藥',
        generic_name: 'amlodipine 5mg',
        dose: '1 顆',
        schedule: ['08:00', '20:00'],
        with_food: false,
        interactions: ['grapefruit'],
        prescriber: '李醫師',
      },
      {
        name: '降血糖藥',
        generic_name: 'metformin 500mg',
        dose: '1 顆',
        schedule: ['08:00', '12:00', '18:00'],
        with_food: true,
        interactions: [],
        prescriber: '李醫師',
      },
    ],
    routine: {
      wake_time: '06:30',
      sleep_time: '22:00',
      meals: ['07:30', '12:00', '18:00'],
    },
    emergency_contacts: [
      { name: '女兒小美', phone: '0912-345-678', relation: 'daughter' },
    ],
  },
  health_trends: {
    blood_pressure_7d_avg: '135/85',
    heart_rate_7d_avg: 72,
    sleep_7d_avg_hours: 6.8,
    medication_adherence_30d: 0.92,
  },
  recent_conversations: [
    '5/23 早上: 阿嬤提到孫子下禮拜要回來、語氣開心',
    '5/24 晚上: 阿嬤抱怨膝蓋有點痠、已告知女兒',
  ],
};
