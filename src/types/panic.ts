// src/types/panic.ts
export interface PanicUser {
  id: number;
  name: string;
  email: string;
  no_telp: string | null;
  nik: string | null;
}

export interface PanicHandler {
  id: number;
  name: string;
}

export interface PanicReport {
  id: number;
  user_id: number;
  latitude: number;
  longitude: number;
  location_description: string | null;
  emergency_type: string | null;
  status: string;
  handled_by: number | null;
  handled_at: string | null;
  created_at: string;
  updated_at: string;
  coordinate_constraints_added?: number;
  user: PanicUser;
  handler?: PanicHandler;
}

export interface TodayPanicReportsResponse {
  user_type: string;
  today: string;
  total_reports: number;
  data: PanicReport[];
}

export interface UpdatePanicStatusRequest {
  status: string;
  notes?: string;
}

export interface UpdatePanicStatusResponse {
  success: boolean;
  panic: PanicReport;
  message: string;
  action: string;
  updated_by: string;
}

export interface MyShift {
  id: number;
  relawan_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MyShiftsResponse {
  success: boolean;
  shifts: MyShift[];
  current_week: {
    start_date: string;
    end_date: string;
  };
}

export const PANIC_STATUS_OPTIONS = [
  { value: "pending", label: "Menunggu", color: "bg-yellow-100 text-yellow-800" },
  { value: "handling", label: "Sedang Ditangani", color: "bg-blue-100 text-blue-800" },
  { value: "resolved", label: "Diselesaikan", color: "bg-green-100 text-green-800" },
  { value: "cancelled", label: "Dibatalkan", color: "bg-gray-100 text-gray-800" },
] as const;

export type PanicStatus = typeof PANIC_STATUS_OPTIONS[number]['value'];