import { hasSupabase } from '../lib/supabase';
import type { UserType } from '../types';

const SUPA_URL = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const SUPA_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

export type FunnelEvent = 'code_valid' | 'phone_verified' | 'share_clicked' | 'link_token_verified';

/**
 * Minimal funnel instrumentation — no third-party analytics/pixel,
 * no PII beyond the redeem code itself. Lets the admin see where
 * people drop off (code entered -> phone verified -> share) via a
 * simple query against funnel_events, instead of having zero
 * visibility into the conversion funnel.
 * Fire-and-forget: never blocks or breaks the UI if it fails.
 */
export function logEvent(eventType: FunnelEvent, code?: string, userType?: UserType): void {
  if (!hasSupabase()) return;
  try {
    fetch(`${SUPA_URL}/rest/v1/funnel_events`, {
      method: 'POST',
      headers: {
        apikey: SUPA_KEY,
        Authorization: `Bearer ${SUPA_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event_type: eventType, code: code ?? null, user_type: userType ?? null }),
    }).catch(() => { /* ignore */ });
  } catch {
    /* ignore */
  }
}
