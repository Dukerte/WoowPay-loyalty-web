import type { AnswerValue, ContactInfo, SurveyState } from './types';

function newSessionId(): string {
  // crypto.randomUUID() needs a secure context (https, or localhost)
  // — true everywhere this ships, but fall back just in case.
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function freshState(): SurveyState {
  return { sessionId: newSessionId(), age: null, contact: null, answers: {} };
}

let state: SurveyState = freshState();

export function getSurveyState(): Readonly<SurveyState> {
  return state;
}

export function setAge(age: number): void {
  state = { ...state, age };
}

export function setContact(contact: ContactInfo): void {
  state = { ...state, contact };
}

export function setAnswer(id: string, value: AnswerValue): void {
  state = { ...state, answers: { ...state.answers, [id]: value } };
}

export function getAnswer(id: string): AnswerValue {
  return state.answers[id];
}

export function resetSurveyState(): void {
  state = freshState();
}
