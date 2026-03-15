import { describe, expect, it } from 'vitest';
import { generateBase32Secret, generateTotpCode, verifyTotpCode } from './totp';

describe('totp utils', () => {
  it('generates and verifies a valid TOTP code', () => {
    const secret = generateBase32Secret(20);
    const now = Date.now();
    const code = generateTotpCode(secret, now);

    expect(code).toHaveLength(6);
    expect(verifyTotpCode(secret, code, { atMs: now })).toBe(true);
  });

  it('rejects invalid TOTP codes', () => {
    const secret = generateBase32Secret(20);
    const now = Date.now();

    expect(verifyTotpCode(secret, '000000', { atMs: now, window: 0 })).toBe(false);
  });
});

