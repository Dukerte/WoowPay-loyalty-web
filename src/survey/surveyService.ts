// ══════════════════════════════════════════════════════════════
//  Calls the submit_survey_progress SECURITY DEFINER RPC (see the
//  survey_defer_contact_to_end migration). Two call sites in
//  main.ts:
//
//   - saveProgress(..., completed=false) after every answer — fires
//     and forgets, keyed by sessionId (not phone — we don't have one
//     yet, since contact info now lives on the last screen). An
//     abandoned survey still has its partial answers on record.
//   - submitSurvey(...) on the final contact screen (completed=true,
//     phone+name included) — this is the one call that actually
//     grants the +2 spins, exactly once ever per phone.
// ══════════════════════════════════════════════════════════════
import { rpcCall } from '../lib/supabase';
import type { AnswerValue, ContactInfo } from './types';

export interface SubmitResult {
  ok: boolean;
  alreadyClaimed?: boolean;
  clientCode?: string | null;
  clientToken?: string | null;
  error?: string;
}

interface RpcResponse {
  ok: boolean;
  already_claimed?: boolean;
  client_code?: string | null;
  client_token?: string | null;
  error?: string;
}

function toResult(res: RpcResponse | null): SubmitResult {
  if (!res) return { ok: false, error: 'network' };
  return {
    ok:             res.ok,
    alreadyClaimed: res.already_claimed,
    clientCode:     res.client_code ?? null,
    clientToken:    res.client_token ?? null,
    error:          res.error,
  };
}

/** Fire-and-forget partial save — never blocks navigation, never
 * surfaces an error to the person filling out the survey. */
export function saveProgress(
  sessionId: string,
  age: number | null,
  answers: Record<string, AnswerValue>
): void {
  if (age === null) return; // nothing to save before the intro is submitted
  void rpcCall<RpcResponse>('submit_survey_progress', {
    p_session_id: sessionId,
    p_age:        age,
    p_answers:    answers,
    p_completed:  false,
  }).catch(() => null);
}

/** The final, completion call — this is the one that grants spins. */
export async function submitSurvey(
  sessionId: string,
  age: number,
  answers: Record<string, AnswerValue>,
  contact: ContactInfo
): Promise<SubmitResult> {
  try {
    const res = await rpcCall<RpcResponse>('submit_survey_progress', {
      p_session_id: sessionId,
      p_age:        age,
      p_answers:    answers,
      p_completed:  true,
      p_phone:      contact.phone,
      p_name:       contact.name,
    });
    return toResult(res);
  } catch {
    return { ok: false, error: 'network' };
  }
}
