// src/types/shift.ts
export interface Relawan {
  id: number;
  name: string;
  email: string;
}

export interface DayPattern {
  day_name: string;
  relawan_count: number;
  relawan: Relawan[];
}

export interface WeeklyPatternsResponse {
  success: boolean;
  weekly_patterns: {
    monday: DayPattern;
    tuesday: DayPattern;
    wednesday: DayPattern;
    thursday: DayPattern;
    friday: DayPattern;
    saturday: DayPattern;
    sunday: DayPattern;
  };
  note: string;
}

export interface SetDayPatternRequest {
  day_of_week: string;
  relawan_ids: number[];
}

export interface SetDayPatternResponse {
  success: boolean;
  message: string;
  day_of_week: string;
  relawan_assigned: string[];
  patterns_created: number;
}

export const DAYS_OF_WEEK = [
  { value: "monday", label: "Senin" },
  { value: "tuesday", label: "Selasa" },
  { value: "wednesday", label: "Rabu" },
  { value: "thursday", label: "Kamis" },
  { value: "friday", label: "Jumat" },
  { value: "saturday", label: "Sabtu" },
  { value: "sunday", label: "Minggu" },
] as const;

export type DayOfWeek = typeof DAYS_OF_WEEK[number]['value'];