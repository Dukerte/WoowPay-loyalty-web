import type { AnswerValue, SurveyProfile, SurveyState } from './types';

const DEFAULT_STATE: SurveyState = {
  profile: null,
  answers: {},
  path: [],
};

let state: SurveyState = { ...DEFAULT_STATE, answers: {}, path: [] };

export function getSurveyState(): Readonly<SurveyState> {
  return state;
}

export function setProfile(profile: SurveyProfile): void {
  state = { ...state, profile };
}

export function setAnswer(id: string, value: AnswerValue): void {
  state = { ...state, answers: { ...state.answers, [id]: value } };
}

export function getAnswer(id: string): AnswerValue {
  return state.answers[id];
}

export function setPath(path: string[]): void {
  state = { ...state, path };
}

export function resetSurveyState(): void {
  state = { profile: null, answers: {}, path: [] };
}
