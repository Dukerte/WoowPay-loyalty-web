// ══════════════════════════════════════════════════════════════
//  Branching engine — given the answers collected so far, builds
//  the ordered list of questions that should actually be shown.
//  Recomputed fresh on every navigation instead of diffed, since
//  every branch decision only depends on answers already given
//  before that point in the flow — simpler and can't drift out of
//  sync with what's actually been answered.
// ══════════════════════════════════════════════════════════════
import type { AnswerValue, MatrixAnswer, Question } from './types';
import {
  Q1, Q2, Q3, Q3A, Q4, Q5, Q6, Q7, Q8, Q8A, Q8B, Q8C, Q8D, Q8N,
  Q9_USED_REASON, Q9_USED_3WORDS, Q9_USED_RECOMMEND,
  Q9_KNOWN_NOTUSED_WHY, Q9_KNOWN_NOTUSED_DRIVER,
  Q9_UNKNOWN_TRUST,
  Q10, Q11, Q12,
} from './data';

type Q9Variant = 'used' | 'known_notused' | 'unknown';

function getQ9Variant(answers: Record<string, AnswerValue>): Q9Variant {
  const q7 = answers['q7'] as MatrixAnswer | undefined;
  const cell = q7?.rows?.['WooW Pay'];
  if (cell?.used || cell?.current) return 'used';
  if (cell?.know) return 'known_notused';
  return 'unknown';
}

export function buildSequence(answers: Record<string, AnswerValue>): Question[] {
  const seq: Question[] = [Q1, Q2, Q3];

  if (answers['q3'] === 'Тийм') seq.push(Q3A);

  seq.push(Q4, Q5, Q6, Q7, Q8);

  const q8Answer = answers['q8'];
  if (q8Answer === 'Огт ашиглаагүй') {
    seq.push(Q8N);
  } else if (typeof q8Answer === 'string' && q8Answer) {
    seq.push(Q8A, Q8B, Q8C, Q8D);
  }

  const variant = getQ9Variant(answers);
  if (variant === 'used') {
    seq.push(Q9_USED_REASON, Q9_USED_3WORDS, Q9_USED_RECOMMEND);
  } else if (variant === 'known_notused') {
    seq.push(Q9_KNOWN_NOTUSED_WHY, Q9_KNOWN_NOTUSED_DRIVER);
  } else {
    seq.push(Q9_UNKNOWN_TRUST);
  }

  seq.push(Q10, Q11, Q12);

  return seq;
}

/** Index of `id` within the sequence built from the current answers, or -1. */
export function indexOf(id: string, answers: Record<string, AnswerValue>): number {
  return buildSequence(answers).findIndex(q => q.id === id);
}

/** The question after `currentId` (or the first question, when currentId is null). */
export function getNext(currentId: string | null, answers: Record<string, AnswerValue>): Question | null {
  const seq = buildSequence(answers);
  if (currentId === null) return seq[0] ?? null;
  const i = seq.findIndex(q => q.id === currentId);
  if (i === -1) return seq[0] ?? null;
  return seq[i + 1] ?? null; // null → survey finished
}

/** The question before `currentId`, or null when it's the first question (→ back to intro). */
export function getPrev(currentId: string, answers: Record<string, AnswerValue>): Question | null {
  const seq = buildSequence(answers);
  const i = seq.findIndex(q => q.id === currentId);
  if (i <= 0) return null;
  return seq[i - 1];
}

export function totalSteps(answers: Record<string, AnswerValue>): number {
  return buildSequence(answers).length;
}
