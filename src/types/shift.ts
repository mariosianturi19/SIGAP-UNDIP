// src/types/shift.ts (Update/Replace existing file)
export interface Relawan {
  id: number;
  name: string;
  email: string;
}

export interface WeekInfo {
  week_offset: number;
  start_date: string;
  end_date: string;
  week_label: string;
  period_formatted: string;
}

export interface TodayStatus {
  date: string;
  is_on_duty: boolean;
  day_name: string;
  shift_source: string | null;
}

export interface WeeklyScheduleItem {
  date: string;
  day_of_week: string;
  day_name: string;
  date_formatted: string;
  is_today: boolean;
  is_past: boolean;
  is_future: boolean;
  is_scheduled: boolean;
  shift_source: string | null;
  shift_id: number | null;
  has_actual_shift: boolean;
  has_pattern: boolean;
}

export interface ShiftSummary {
  total_scheduled_days: number;
  days_with_actual_shifts: number;
  days_with_patterns_only: number;
  work_days_this_week: string;
}

export interface ShiftNavigation {
  previous_week: number;
  current_week: number;
  next_week: number;
}

export interface MyShiftsResponse {
  relawan: Relawan;
  week_info: WeekInfo;
  today_status: TodayStatus;
  weekly_schedule: WeeklyScheduleItem[];
  upcoming_shifts: WeeklyScheduleItem[];
  summary: ShiftSummary;
  navigation: ShiftNavigation;
}

// Move TodayPanicReportsResponse to panic.ts to avoid circular dependency
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