import { hasSupabase, selectMany } from '../lib/supabase';
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
export async function fetchPrizes(userType: UserType): Promise<Prize[]> {
  const fallback = PRIZES[userType];

  if (!hasSupabase()) return fallback;

  try {
    const rows = await selectMany<DbPrize>(
      'prizes',
      { user_type: `eq.${userType}`, enabled: 'eq.true' },
      'sort_order.asc'
    );
    if (!rows.length) return fallback;

    return rows.map((r) => ({
      id:         r.id,
      label:      r.label,
      shortLabel: r.short_label,
      emoji:      r.emoji,
      desc:       r.description,
      color:      r.color,
      weight:     r.weight,
    }));
  } catch {
    return fallback;
  }
}
