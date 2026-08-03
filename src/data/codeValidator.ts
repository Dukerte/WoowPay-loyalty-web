import type { CodeValidationResult, UserType } from '../types';
import { getSpins } from './records';

/**
 * Redeem code format: WM-XXXXXX (Merchant) | WC-XXXXXX (Client)
 * 6-character alphanumeric suffix (A-Z, 0-9).
 * Spin count is looked up from records.ts; fallback: last char '1'/'2'/'3' → that many spins.
 *
 * Examples:
 *   WM-AB0013  → Merchant, 3 spins (fallback)
 *   WC-XY0021  → Client,  10 spins (from records)
 */
export function validateCode(raw: string): CodeValidationResult {
  const code = raw.trim().toUpperCase();
  if (!code) return { valid: false, error: 'Эрхийн кодоо оруулна уу' };

  const isMerchant = code.startsWith('WM-');
  const isClient   = code.startsWith('WC-');

  if (!isMerchant && !isClient)
    return { valid: false, error: 'Код WM- (мерчант) эсвэл WC- (харилцагч) гэж эхлэх ёстой' };

  if (!/^W[MC]-[A-Z0-9]{6}$/.test(code))
    return { valid: false, error: 'Код бүтэц буруу байна. Жишээ: WM-AB0013' };

  const userType: UserType = isMerchant ? 'merchant' : 'client';
  const spins = getSpins(code);

  return { valid: true, userType, spins };
}

/** Auto-format user input → uppercase, insert dash after 2 chars, max 9 chars total */
export function formatCodeInput(value: string): string {
  let v = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  // Ensure dash at position 2
  if (v.length >= 2 && v[2] !== '-')
    v = v.slice(0, 2) + '-' + v.slice(2).replace(/-/g, '');
  return v.slice(0, 9); // WM-XXXXXX = 9 chars
}
