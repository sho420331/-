export enum TimeSlot {
  MORNING = '午前 (9:00-13:00)',
  AFTERNOON = '午後 (13:00-17:00)',
  FULL_DAY = '一日 (9:00-17:00)',
}

export interface AttendanceRequest {
  id: string;
  childName: string;
  date: string; // ISO string YYYY-MM-DD
  timeSlot?: TimeSlot;
  arrivalTime?: string;
  departureTime?: string;
  pickup?: boolean;
  pickupLocation?: string;
  dropOff?: boolean;
  dropOffLocation?: string;
  notes?: string;
  submittedAt: string; // ISO string (Submission Timestamp)
}

export interface Staff {
  id: string;
  name: string;
  role: string; // e.g., '保育士', '指導員'
  isAvailable: boolean; // Simple toggle for availability
  workSchedule?: string; // 勤務形態・備考（例: 毎週火曜休み）
}

export interface ShiftAssignment {
  id: string;
  date: string;
  childName: string;
  timeSlot: string;
  staffName: string; // The assigned staff
}

export enum ViewMode {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export interface ParentCode {
  code: string;
  childName: string;
  defaultPickupLocation: string;
  defaultDropOffLocation: string;
}