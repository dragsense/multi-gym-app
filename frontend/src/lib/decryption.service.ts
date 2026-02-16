import { config } from "@/config";
// Browser-compatible base64 to Uint8Array conversion
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const ENCRYPTION_KEY = config.encryptionKey;
export const ENCRYPTION_ALGORITHM = 'AES-GCM'; // Web Crypto API uses uppercase

export interface EncryptedResponse {
  encrypted: boolean;
  data: string;
  algorithm: string;
  timestamp: number;
}

export interface DecryptedData {
  data: any;
  timestamp: number;
  version: string;
  checksum: string;
}

export class DecryptionService {
  private readonly algorithm = ENCRYPTION_ALGORITHM;
  private readonly keyLength = 256;
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private readonly saltLength = 64;
  private readonly iterations = 100000;

  constructor() {
    if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {

    }
  }

  /**
   * Decrypt data using Web Crypto API
   * @param encryptedData - Base64 encrypted data
   * @returns Decrypted data
   */
  async decrypt(encryptedData: string): Promise<any> {
    try {


      if (!ENCRYPTION_KEY) {
        throw new Error('Encryption key not configured');
      }

      // Convert from base64
      const combined = base64ToUint8Array(encryptedData);

      // Extract components
      const salt = combined.subarray(0, this.saltLength);
      const iv = combined.subarray(this.saltLength, this.saltLength + this.ivLength);
      const tag = combined.subarray(this.saltLength + this.ivLength, this.saltLength + this.ivLength + this.tagLength);
      const encrypted = combined.subarray(this.saltLength + this.ivLength + this.tagLength);

      // Derive key using PBKDF2
      const key = await this.deriveKey(ENCRYPTION_KEY!, salt);

      // Create ArrayBuffer for decryption
      const encryptedBuffer = new Uint8Array(encrypted);
      const ivBuffer = new Uint8Array(iv);
      const tagBuffer = new Uint8Array(tag);

      // Combine encrypted data with tag
      const encryptedWithTag = new Uint8Array(encryptedBuffer.length + tagBuffer.length);
      encryptedWithTag.set(encryptedBuffer);
      encryptedWithTag.set(tagBuffer, encryptedBuffer.length);

      // Import key
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: this.algorithm },
        false,
        ['decrypt']
      );

      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: ivBuffer,
          additionalData: new TextEncoder().encode('WEB-API'),
          tagLength: this.tagLength * 8
        },
        cryptoKey,
        encryptedWithTag
      );

      // Convert to string and parse JSON
      const decryptedString = new TextDecoder().decode(decrypted);
      return JSON.parse(decryptedString);
    } catch (error) {

      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Derive key using PBKDF2
   * @param password - Password/key
   * @param salt - Salt
   * @returns Derived key
   */
  private async deriveKey(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits']
    );

    return await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt as unknown as ArrayBuffer,
        iterations: this.iterations,
        hash: 'SHA-512'
      },
      baseKey,
      this.keyLength
    );
  }

  /**
   * Decrypt API response
   * @param response - API response
   * @returns Decrypted response data
   */
  async decryptResponse(response: any): Promise<any> {
    try {
      // Check if response is encrypted
      if (!response.encrypted || !response.data) {
        return response; // Return as-is if not encrypted
      }

      // Decrypt the data
      const decryptedData: DecryptedData = await this.decrypt(response.data);

      // Verify checksum for data integrity
      if (!this.verifyChecksum(decryptedData.data, decryptedData.checksum)) {
        throw new Error('Data integrity check failed');
      }

      return decryptedData.data;
    } catch (error) {
      console.log("decryptedData", error);

      throw error;
    }
  }

  /**
   * Generate checksum for data integrity
   * @param data - Data to checksum
   * @returns SHA-256 checksum
   */
  private async generateChecksum(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);

    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verify data integrity
   * @param data - Data to verify
   * @param checksum - Expected checksum
   * @returns True if checksum matches
   */
  private async verifyChecksum(data: any, checksum: string): Promise<boolean> {
    const calculatedChecksum = await this.generateChecksum(data);
    return calculatedChecksum === checksum;
  }
} 