import crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const base32Decode = (secret: string): Buffer => {
  const normalized = secret.toUpperCase().replace(/=+$/g, '').replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index < 0) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
};

const base32Encode = (input: Buffer): string => {
  let bits = 0;
  let value = 0;
  let output = '';

  for (const byte of input) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
};

const buildCounterBuffer = (counter: number): Buffer => {
  const buffer = Buffer.alloc(8);
  let value = counter;

  for (let i = 7; i >= 0; i -= 1) {
    buffer[i] = value & 0xff;
    value = Math.floor(value / 256);
  }

  return buffer;
};

export const generateBase32Secret = (bytes = 20): string => {
  const safeBytes = Math.max(16, Math.min(64, bytes));
  return base32Encode(crypto.randomBytes(safeBytes));
};

export const buildOtpAuthUrl = (issuer: string, accountName: string, secret: string): string => {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  const encodedSecret = encodeURIComponent(secret);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${encodedSecret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
};

export const generateTotpCode = (secret: string, atMs = Date.now(), stepSeconds = 30, digits = 6): string => {
  const key = base32Decode(secret);
  const safeDigits = Math.max(6, Math.min(8, digits));
  const counter = Math.floor(atMs / 1000 / stepSeconds);
  const hmac = crypto.createHmac('sha1', key).update(buildCounterBuffer(counter)).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const otp = binary % 10 ** safeDigits;
  return otp.toString().padStart(safeDigits, '0');
};

export const verifyTotpCode = (
  secret: string,
  token: string,
  options?: { window?: number; atMs?: number; stepSeconds?: number; digits?: number }
): boolean => {
  const cleanToken = token.replace(/\s+/g, '');
  if (!/^\d{6,8}$/.test(cleanToken)) {
    return false;
  }

  const window = options?.window ?? 1;
  const atMs = options?.atMs ?? Date.now();
  const stepSeconds = options?.stepSeconds ?? 30;
  const digits = options?.digits ?? cleanToken.length;

  for (let delta = -window; delta <= window; delta += 1) {
    const expected = generateTotpCode(secret, atMs + delta * stepSeconds * 1000, stepSeconds, digits);
    if (expected === cleanToken) {
      return true;
    }
  }

  return false;
};

