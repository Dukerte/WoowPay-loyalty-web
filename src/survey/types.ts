// ══════════════════════════════════════════════════════════════
//  WooW Pay Хэрэглэгчийн судалгаа — question schema types
// ══════════════════════════════════════════════════════════════

export type QuestionType = 'single' | 'multi' | 'text' | 'matrix' | 'scale';

interface BaseQuestion {
  id: string;
  kicker: string;      // e.g. "03 • Гэнэтийн хэрэгцээ"
  title: string;       // <h2>
  lead?: string;       // optional supporting paragraph under the title
  hint?: string;       // optional small note above the options (e.g. "3 хүртэл сонголт")
}

export interface SingleQuestion extends BaseQuestion {
  type: 'single';
  options: string[];
  errorMsg?: string;
}

export interface MultiQuestion extends BaseQuestion {
  type: 'multi';
  options: string[];
  max?: number;         // undefined = unlimited
  required?: boolean;   // at least one selection required
  errorMsg?: string;
}

export interface TextQuestion extends BaseQuestion {
  type: 'text';
  placeholder?: string;
  required?: boolean;
}

export interface MatrixQuestion extends BaseQuestion {
  type: 'matrix';
  rows: string[];        // brand names
  columns: string[];     // e.g. ["Мэддэг","Өмнө ашиглаж байсан","Одоо ашигладаг"]
  allowOther?: boolean;  // adds a free-text "Бусад" row
}

export interface ScaleQuestion extends BaseQuestion {
  type: 'scale';
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
}

export type Question = SingleQuestion | MultiQuestion | TextQuestion | MatrixQuestion | ScaleQuestion;

// ── Answers ──────────────────────────────────────────────────
export interface MatrixCell {
  know: boolean;
  used: boolean;
  current: boolean;
}

export interface MatrixAnswer {
  rows: Record<string, MatrixCell>;  // keyed by brand name (or "__other__")
  otherLabel?: string;               // free-text name typed into the "Бусад" row
}

export type AnswerValue = string | string[] | number | MatrixAnswer | undefined;

// Age is collected on the intro screen (it gates entry, 18+); phone
// and name are collected on the LAST screen, right before the reward
// is granted — so a person only has to hand over contact details once
// they've seen the whole thing is worth it. `sessionId` exists so
// partial answers can be saved to the DB before we have a phone
// number to key on (see engine.ts / surveyService.ts).
export interface ContactInfo {
  phone: string;
  name: string;
}

export interface SurveyState {
  sessionId: string;
  age: number | null;
  contact: ContactInfo | null;
  answers: Record<string, AnswerValue>;
}
