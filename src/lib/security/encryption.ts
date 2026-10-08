import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes recommended for GCM
const DEFAULT_FALLBACK_SECRET = 'roxten-os-secure-integration-encryption-key-default-32B';

/**
 * Derives a consistent 32-byte encryption key from the environment variable.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.INTEGRATION_ENCRYPTION_KEY || 
                 process.env.ENCRYPTION_KEY || 
                 DEFAULT_FALLBACK_SECRET;
  
  // Use SHA-256 to ensure exact 32-byte key length
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a plain text token using AES-256-GCM.
 * Returns formatted string: ivHex:authTagHex:encryptedHex
 */
export function encryptToken(token: string): string {
  if (!token) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an encrypted token string using AES-256-GCM.
 * Verifies authenticity before returning the plain text.
 */
export function decryptToken(encryptedData: string): string {
  if (!encryptedData) return '';
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
