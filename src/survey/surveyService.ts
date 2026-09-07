// ══════════════════════════════════════════════════════════════
//  Calls the submit_survey_progress SECURITY DEFINER RPC (see
//  supabase-schema.sql / the survey_responses_and_submit_rpc
//  migration). Two call sites in main.ts:
//
//   - saveProgress(..., completed=false) after every answer — fires
//     and forgets, so an abandoned survey still has its partial
//     answers on record for research value.
//   - submitSurvey(...) at the very end (completed=true) — this is
//     the one call that actually grants the +2 spins, exactly once
//     ever per phone. The RPC itself enforces that; the frontend
//     just reports whatever it says back.
// ══════════════════════════════════════════════════════════════
import { rpcCall } from '../lib/supabase';
import type { AnswerValue, SurveyProfile, SurveyState } from './types';

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

async function callRpc(
  profile: SurveyProfile,
  answers: Record<string, AnswerValue>,
  completed: boolean
): Promise<SubmitResult> {
  try {
    const res = await rpcCall<RpcResponse>('submit_survey_progress', {
      p_phone:     profile.phone,
      p_name:      profile.name,
      p_age:       profile.age,
      p_answers:   answers,
      p_completed: completed,
    });
    if (!res) return { ok: false, error: 'network' };
    return {
      ok:           res.ok,
      alreadyClaimed: res.already_claimed,
      clientCode:   res.client_code ?? null,
      clientToken:  res.client_token ?? null,
      error:        res.error,
    };
  } catch {
    return { ok: false, error: 'network' };
  }
}

/** Fire-and-forget partial save — never blocks navigation, never
 * surfaces an error to the person filling out the survey. */
export function saveProgress(profile: SurveyProfile | null, answers: Record<string, AnswerValue>): void {
  if (!profile) return;
  void callRpc(profile, answers, false);
}

/** The final, completion call — this is the one that grants spins. */
export async function submitSurvey(profile: SurveyProfile, state: SurveyState): Promise<SubmitResult> {
  return callRpc(profile, state.answers, true);
}
