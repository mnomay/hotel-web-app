import crypto from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const generateConfirmationCode = () => {
  const bytes = crypto.randomBytes(6);
  let suffix = '';

  for (let i = 0; i < 6; i += 1) {
    suffix += ALPHABET[bytes[i] % ALPHABET.length];
  }

  return `HTL-${suffix}`;
};
