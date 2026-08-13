import { hasSupabase, selectOne, rpc, rpcCall } from '../lib/supabase';
import { validateCode }                from './codeValidator';
import { verifyPhone }                 from './records';
import type { CodeValidationResult }   from '../types';

// name and phone are intentionally absent — the anon key can no longer
// select those columns (see verify_phone_match RPC below for phone
// checks), so they'd never actually be populated here.
interface SupabaseClient {
  id:         string;
  code:       string;
  user_type:  'merchant' | 'client';
  spins:      number;
  spins_used: number;
  enabled:    boolean;
}

/**
 * Validate a code against Supabase.
 * Falls back to the static records.ts when Supabase is not configured.
 */
export async function validateCodeRemote(raw: string): Promise<CodeValidationResult> {
  const code = raw.trim().toUpperCase();

  // Quick local format check first
  const local = validateCode(code);
  if (!local.valid) return local;

  // No Supabase → use static records
  if (!hasSupabase()) return local;

  try {
    // Explicit `select=` is required: the anon key only has column-level
    // grants on these specific fields (not name/phone), and PostgREST's
    // default `SELECT *` fails outright with "permission denied for
    // table" the moment it implicitly requests a column anon can't read.
    const client = await selectOne<SupabaseClient>('clients', {
      code: `eq.${code}`,
      enabled: 'eq.true',
      select: 'id,code,spins,spins_used,enabled,user_type',
    });

    if (!client) return local; // not in DB → fall back to static

    const spinsLeft = client.spins - client.spins_used;
    if (spinsLeft <= 0) {
      return { valid: false, error: 'Эрхийн эргэлт дуусжээ' };
    }

    return {
      valid:    true,
      userType: client.user_type,
      spins:    spinsLeft,
    };
  } catch {
    return local; // network error → static fallback
  }
}

/**
 * Verify phone against Supabase client record.
 * Falls back to static verifyPhone() when Supabase is unavailable.
 */
export async function verifyPhoneRemote(code: string, phone: string): Promise<boolean> {
  if (!hasSupabase()) return verifyPhone(code, phone);

  try {
    // The comparison happens server-side now (verify_phone_match RPC) —
    // the raw phone column was removed from what the anon key can
    // select directly, so the browser never sees another client's
    // phone number even transiently.
    const result = await rpcCall<boolean>('verify_phone_match', {
      p_code:  code.toUpperCase(),
      p_phone: phone,
    });
    if (result === null) return verifyPhone(code, phone); // network/RPC error → static fallback
    return result;
  } catch {
    return verifyPhone(code, phone); // network error → static fallback
  }
}

/**
 * Record a spin via the SECURITY DEFINER stored function.
 * Passes the prize label so it gets logged in spin_results —
 * without this, the DB has no record of what a client actually won.
 * Fire-and-forget — errors are silently ignored.
 */
export async function recordSpin(code: string, prizeLabel: string): Promise<void> {
  if (!hasSupabase()) return;
  try {
    await rpc('record_spin', {
      p_code:        code.toUpperCase(),
      p_prize_label: prizeLabel,
    });
  }
  catch { /* ignore */ }
}
