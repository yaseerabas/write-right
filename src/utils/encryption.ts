/**
 * Encryption utility using Web Crypto API
 * Provides AES-GCM encryption/decryption for sensitive data
 */

const APP_KEY_PREFIX = 'ai_writing_assistant_';
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

/**
 * Derive a cryptographic key from a passphrase using PBKDF2
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a random salt for key derivation
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Generate a random IV for encryption
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypt plaintext data using AES-GCM
 * Returns a base64-encoded string containing: salt + iv + ciphertext
 */
export async function encrypt(plaintext: string, passphrase: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = generateSalt();
  const iv = generateIV();
  const key = await deriveKey(passphrase, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(plaintext)
  );

  // Combine salt + iv + ciphertext
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  return arrayBufferToBase64(combined.buffer);
}

/**
 * Decrypt ciphertext using AES-GCM
 * Expects a base64-encoded string containing: salt + iv + ciphertext
 */
export async function decrypt(ciphertext: string, passphrase: string): Promise<string> {
  const combined = new Uint8Array(base64ToArrayBuffer(ciphertext));

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 16 + IV_LENGTH);
  const encryptedData = combined.slice(16 + IV_LENGTH);

  const key = await deriveKey(passphrase, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    encryptedData
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Simple encryption using a hardcoded app key (better than plaintext)
 * This is a convenience method that doesn't require user passphrase
 * Note: This provides obfuscation, not strong security. For production,
 * use a backend proxy or require user passphrase.
 */
const APP_SECRET = 'ai-writing-assistant-v1-secure-storage-key';

export async function encryptWithAppKey(plaintext: string): Promise<string> {
  return encrypt(plaintext, APP_SECRET);
}

export async function decryptWithAppKey(ciphertext: string): Promise<string> {
  return decrypt(ciphertext, APP_SECRET);
}

/**
 * Check if a string looks like encrypted data (base64, reasonable length)
 */
export function isEncrypted(data: string): boolean {
  if (!data || data.length < 50) return false;
  // Check if it looks like base64
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(data);
}

/**
 * Generate a secure random ID for history entries
 */
export function generateSecureId(): string {
  const array = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
