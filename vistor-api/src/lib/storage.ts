import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

export interface StorageProvider {
  save(buffer: Buffer, originalName: string, mimeType: string): Promise<string>;
  delete(filePath: string): Promise<void>;
  getUrl(filePath: string): string;
}

export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(env.UPLOAD_DIR);
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async save(buffer: Buffer, originalName: string, mimeType: string): Promise<string> {
    const ext = path.extname(originalName) || this.getExtFromMime(mimeType);
    const fileName = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(this.uploadDir, fileName);

    await fs.promises.writeFile(filePath, buffer);

    return fileName;
  }

  async delete(fileName: string): Promise<void> {
    const filePath = path.join(this.uploadDir, fileName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  getUrl(fileName: string): string {
    return `/uploads/${fileName}`;
  }

  private getExtFromMime(mimeType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/heic': '.heic',
    };
    return map[mimeType] || '.jpg';
  }
}

// Singleton - swap to S3StorageProvider in the future
export const storage: StorageProvider = new LocalStorageProvider();
