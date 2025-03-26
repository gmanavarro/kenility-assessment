import { PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { storageConfig } from '../config/configuration';

@Injectable()
export class StorageService {
  private client: S3Client;

  constructor(
    @Inject(storageConfig.KEY)
    private config: ConfigType<typeof storageConfig>,
  ) {
    const { accessKey, secretKey, endpoint, region } = this.config;

    if (!accessKey || !secretKey || !region) {
      throw new Error('Storage configuration is incomplete');
    }

    const clientConfig: S3ClientConfig = {
      region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      endpoint,
    };

    this.client = new S3Client(clientConfig);
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const { bucket, endpoint, region } = this.config;
    const extension = file.originalname.split('.').pop();
    const filename = `${randomUUID()}.${extension}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    if (endpoint) {
      return `${endpoint}/${bucket}/${filename}`;
    }

    return `https://${bucket}.s3.${region}.amazonaws.com/${filename}`;
  }
}
