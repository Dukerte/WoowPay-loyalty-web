export type UserType = 'merchant' | 'client';

export interface Prize {
  id?:        string;  // prizes.id in Supabase, when sourced from the DB (used for FB share OG image)
  label:      string;   // full label shown in result modal
  shortLabel: string;   // short label shown on the wheel
  emoji: string;
  desc:  string;
  color: string;
  weight?: number; // relative odds weight; defaults to 1 (equal chance) if omitted
}

export interface SpinHistoryEntry {
  prize: Prize;
  timestamp: number;
}

export interface AppState {
  userType: UserType | null;
  code: string | null;
  spinsTotal: number;
  spinsUsed: number;
  history: SpinHistoryEntry[];
}

export interface CodeValidationResult {
  valid: boolean;
  error?: string;
  userType?: UserType;
  spins?: number;
}
