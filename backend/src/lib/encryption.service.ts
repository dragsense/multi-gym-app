import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly config: any;

  constructor(private configService: ConfigService) {
    this.config = this.configService.get('app.encryption');
    
    // Validate encryption configuration
    if (!this.config?.key || this.config.key.length < 32) {
      throw new Error('ENCRYPTION_KEY environment variable must be at least 32 characters long');
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param data - Data to encrypt
   * @returns Encrypted data as base64 string
   */
  encrypt(data: any): string {
    try {
      // Convert data to JSON string
      const jsonData = JSON.stringify(data);
      
             // Generate a random IV
       const iv = crypto.randomBytes(this.config.ivLength);
       
       // Generate a random salt
       const salt = crypto.randomBytes(this.config.saltLength);
       
       // Derive key using PBKDF2
       const key = crypto.pbkdf2Sync(
         this.config.key,
         salt,
         this.config.iterations,
         this.config.keyLength,
         this.config.hash
       );
       
       // Create cipher
       const cipher = crypto.createCipheriv(this.config.algorithm, key, iv);
       cipher.setAAD(Buffer.from(this.config.additionalData, 'utf8')); // Additional authenticated data
       
       // Encrypt the data
       let encrypted = cipher.update(jsonData, 'utf8', 'hex');
       encrypted += cipher.final('hex');
       
       // Get the authentication tag
       const tag = cipher.getAuthTag();
      
      // Combine all components: salt + iv + tag + encrypted data
      const combined = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]);
      
      // Return as base64
      return combined.toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   * @param encryptedData - Base64 encrypted data
   * @returns Decrypted data
   */
  decrypt(encryptedData: string): any {
    try {
      // Convert from base64
      const combined = Buffer.from(encryptedData, 'base64');
      
             // Extract components
       const salt = combined.subarray(0, this.config.saltLength);
       const iv = combined.subarray(this.config.saltLength, this.config.saltLength + this.config.ivLength);
       const tag = combined.subarray(this.config.saltLength + this.config.ivLength, this.config.saltLength + this.config.ivLength + this.config.tagLength);
       const encrypted = combined.subarray(this.config.saltLength + this.config.ivLength + this.config.tagLength);
       
       // Derive key using PBKDF2
       const key = crypto.pbkdf2Sync(
         this.config.key,
         salt,
         this.config.iterations,
         this.config.keyLength,
         this.config.hash
       );
       
       // Create decipher
       const decipher = crypto.createDecipheriv(this.config.algorithm, key, iv);
       decipher.setAAD(Buffer.from(this.config.additionalData, 'utf8')); // Additional authenticated data
       decipher.setAuthTag(tag);
       
       // Decrypt the data
       let decrypted = decipher.update(encrypted, undefined, 'utf8');
       decrypted += decipher.final('utf8');
      
      // Parse JSON
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Encrypt response data with metadata
   * @param data - Response data
   * @param timestamp - Response timestamp
   * @returns Encrypted response object
   */
  encryptResponse(data: any, timestamp: number = Date.now()): any {
    const responseData = {
      data,
      timestamp,
      version: '1.0',
      checksum: this.generateChecksum(data)
    };

         return {
       encrypted: true,
       data: this.encrypt(responseData),
       algorithm: this.config.algorithm,
       timestamp
     };
  }

  /**
   * Generate checksum for data integrity
   * @param data - Data to checksum
   * @returns SHA-256 checksum
   */
  private generateChecksum(data: any): string {
    const jsonString = JSON.stringify(data);
    return crypto.createHash('sha256').update(jsonString).digest('hex');
  }

  /**
   * Verify data integrity
   * @param data - Data to verify
   * @param checksum - Expected checksum
   * @returns True if checksum matches
   */
  verifyChecksum(data: any, checksum: string): boolean {
    const calculatedChecksum = this.generateChecksum(data);
    return calculatedChecksum === checksum;
  }
} 