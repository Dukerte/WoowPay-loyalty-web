import { hasSupabase, selectMany, rpcCall } from '../lib/supabase';
import { PRIZES } from './prizes';
import type { Prize, UserType } from '../types';

interface DbPrize {
  id:          string;
  label:       string;
  short_label: string;
  emoji:       string;
  color:       string;
  description: string;
  weight:      number;
  enabled:     boolean;
}

/**
 * Fetch the prize list + odds for a user type from Supabase (admin-editable).
 * Falls back to the static PRIZES in prizes.ts when Supabase is not
 * configured, unreachable, or the table is empty — so the wheel never
 * breaks even if the DB has an issue.
 */
export async function fetchPrizes(userType: UserType, code?: string): Promise<Prize[]> {
  const fallback = PRIZES[userType];

  if (!hasSupabase()) return fallback;

  const toPrize = (r: DbPrize): Prize => ({
    id:         r.id,
    label:      r.label,
    shortLabel: r.short_label,
    emoji:      r.emoji,
    desc:       r.description,
    color:      r.color,
    weight:     r.weight,
  });

  try {
    // Per-client wheel: prizes flagged eligible_only (e.g. ₮500,000 cash)
    // are returned only for clients the admin has marked eligible.
    if (code) {
      const mine = await rpcCall<DbPrize[]>('get_prizes_for_code', { p_code: code.toUpperCase() });
      if (mine && mine.length) return mine.map(toPrize);
    }

    // Fallback (no code / RPC failed): public prize list WITHOUT any
    // eligible-only prize, so a failure can never expose it to everyone.
    const rows = await selectMany<DbPrize>(
      'prizes',
      { user_type: `eq.${userType}`, enabled: 'eq.true', eligible_only: 'eq.false' },
      'sort_order.asc'
    );
    if (!rows.length) return fallback;

    return rows.map(toPrize);
  } catch {
    return fallback;
  }
}
