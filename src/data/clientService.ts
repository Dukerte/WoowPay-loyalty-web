import { hasSupabase, selectOne, rpc } from '../lib/supabase';
import { validateCode }                from './codeValidator';
import { verifyPhone }                 from './records';
import type { CodeValidationResult }   from '../types';

interface SupabaseClient {
  id:         string;
  name:       string;
  phone:      string;
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
    const client = await selectOne<SupabaseClient>('clients', { code: `eq.${code}`, enabled: 'eq.true' });

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
    const client = await selectOne<SupabaseClient>('clients', {
      code:    `eq.${code.toUpperCase()}`,
      enabled: 'eq.true',
    });
    if (!client || !client.phone) return true; // no phone registered → open
    return verifyPhone(code, phone, client.phone);
  } catch {
    return verifyPhone(code, phone); // network error → static fallback
  }
}

/**
 * Record a spin via the SECURITY DEFINER stored function.
 * Fire-and-forget — errors are silently ignored.
 */
export async function recordSpin(code: string): Promise<void> {
  if (!hasSupabase()) return;
  try { await rpc('record_spin', { p_code: code.toUpperCase() }); }
  catch { /* ignore */ }
}
