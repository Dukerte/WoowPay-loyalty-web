export type UserType = 'merchant' | 'client';

export interface Prize {
  label: string;
  emoji: string;
  desc:  string;
  color: string;
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
