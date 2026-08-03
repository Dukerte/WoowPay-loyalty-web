/**
 * Redeem code registry.
 *
 * Add each issued code here with:
 *   phone — 8-digit Mongolian number (no +976 prefix), or '' to skip phone check
 *   spins — how many spins this code grants (any number)
 *
 * Example:
 *   'WM-AB0013': { phone: '99112233', spins: 3 },
 *   'WC-XY0021': { phone: '88005678', spins: 10 },
 */
export interface CodeRecord {
  phone: string;
  spins: number;
}

export const CODE_RECORDS: Record<string, CodeRecord> = {
  // ── Merchant codes ──────────────────────────────────────
  // 'WM-AB0013': { phone: '99001234', spins: 3 },

  // ── Client codes ────────────────────────────────────────
  'WC-XY0021': { phone: '', spins: 10 },
};

/**
 * Verify that the entered phone matches the record for this code.
 * Returns true if no record exists, or if the record has no phone set.
 */
export function verifyPhone(code: string, phone: string): boolean {
  const record = CODE_RECORDS[code];
  if (!record || !record.phone) return true;   // no record / no phone constraint → allow
  const clean = phone.replace(/\D/g, '');
  return clean === record.phone || clean === '976' + record.phone;
}

/**
 * Get spin count for a code from the registry.
 * Falls back to last-char encoding (1/2/3) if code not in registry.
 */
export function getSpins(code: string): number {
  const record = CODE_RECORDS[code];
  if (record) return record.spins;
  // Fallback: last character encodes spin count
  const lastChar = code.slice(-1);
  return ['1','2','3'].includes(lastChar) ? parseInt(lastChar) : 3;
}
