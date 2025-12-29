import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class ProjectSettingsService {
  constructor(private prisma: PrismaService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async getSettings(userId: string) {
    let settings = await this.prisma.projectPageSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.projectPageSettings.create({
        data: {
          userId,
          title: 'DATA PROJECT',
        },
      });
    }

    return settings;
  }

  async updateSettings(
    userId: string,
    dto: { title?: string; description?: string; icon?: string },
  ) {
    return this.prisma.projectPageSettings.upsert({
      where: { userId },
      update: dto,
      create: {
        userId,
        ...dto,
      },
    });
  }

  async uploadCover(userId: string, file: Express.Multer.File) {
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'devion/project-covers',
            resource_type: 'image',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        )
        .end(file.buffer);
    });

    return this.prisma.projectPageSettings.upsert({
      where: { userId },
      update: { cover: result.secure_url },
      create: {
        userId,
        cover: result.secure_url,
        title: 'DATA PROJECT',
      },
    });
  }

  async removeCover(userId: string) {
    return this.prisma.projectPageSettings.update({
      where: { userId },
      data: { cover: null },
    });
  }
}
