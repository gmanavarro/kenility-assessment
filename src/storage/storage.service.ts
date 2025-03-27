import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as minio from 'minio';
import { storageConfig } from '../config/configuration';

@Injectable()
export class StorageService {
  private client: minio.Client;

  constructor(
    @Inject(storageConfig.KEY)
    private config: ConfigType<typeof storageConfig>,
  ) {
    this.client = new minio.Client({
      ...this.config,
      useSSL: false,
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const { bucket } = this.config;
    const extension = file.originalname.split('.').pop();
    const filename = `${randomUUID()}.${extension}`;

    try {
      await this.client.putObject(
        bucket,
        filename,
        file.buffer,
        file.buffer.length,
        {
          'Content-Type': file.mimetype,
        },
      );

      return `http://localhost:9000/${bucket}/${filename}`;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
}
