/**
 * Tiny Supabase REST helper — no SDK dependency.
 * Uses the Supabase PostgREST + RPC API directly via fetch.
 */

const SUPA_URL  = (import.meta.env.VITE_SUPABASE_URL  as string) || '';
const SUPA_KEY  = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

export const hasSupabase = (): boolean => !!(SUPA_URL && SUPA_KEY);

function headers(): HeadersInit {
  return {
    'apikey':        SUPA_KEY,
    'Authorization': `Bearer ${SUPA_KEY}`,
    'Content-Type':  'application/json',
  };
}

/** SELECT single row from a table with a filter */
export async function selectOne<T>(
  table: string,
  filter: Record<string, string>
): Promise<T | null> {
  const params = new URLSearchParams({ ...filter, limit: '1' });
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${params}`, {
    headers: { ...headers(), Accept: 'application/vnd.pgrst.object+json' },
  });
  if (!res.ok) return null;
  try { return await res.json() as T; }
  catch { return null; }
}

/** SELECT multiple rows from a table with a filter, optionally ordered */
export async function selectMany<T>(
  table: string,
  filter: Record<string, string>,
  order?: string
): Promise<T[]> {
  const params = new URLSearchParams(filter);
  if (order) params.set('order', order);
  const res = await fetch(`${SUPA_URL}/rest/v1/${table}?${params}`, {
    headers: headers(),
  });
  if (!res.ok) return [];
  try { return await res.json() as T[]; }
  catch { return []; }
}

/** Call a stored RPC function */
export async function rpc(fn: string, args: Record<string, string>): Promise<void> {
  await fetch(`${SUPA_URL}/rest/v1/rpc/${fn}`, {
    method:  'POST',
    headers: headers(),
    body:    JSON.stringify(args),
  });
}
