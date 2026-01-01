import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TodoSettingsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });
  }

  async getSettings(userId: string) {
    let settings = await this.prisma.todoPageSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.todoPageSettings.create({
        data: { userId },
      });
    }

    return settings;
  }

  async updateSettings(
    userId: string,
    data: { title?: string; description?: string; icon?: string },
  ) {
    const settings = await this.getSettings(userId);

    return this.prisma.todoPageSettings.update({
      where: { id: settings.id },
      data,
    });
  }

  async uploadCover(userId: string, file: Express.Multer.File) {
    const settings = await this.getSettings(userId);

    // Delete old cover if exists
    if (settings.cover) {
      const publicId = this.extractPublicId(settings.cover);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }

    // Upload new cover
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'devion/todo-covers',
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      uploadStream.end(file.buffer);
    });

    return this.prisma.todoPageSettings.update({
      where: { id: settings.id },
      data: { cover: result.secure_url },
    });
  }

  async deleteCover(userId: string) {
    const settings = await this.getSettings(userId);

    if (settings.cover) {
      const publicId = this.extractPublicId(settings.cover);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }

    return this.prisma.todoPageSettings.update({
      where: { id: settings.id },
      data: { cover: null },
    });
  }

  private extractPublicId(url: string): string | null {
    const match = url.match(/\/v\d+\/(.+)\.\w+$/);
    return match ? match[1] : null;
  }
}
