import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePreferenceDto } from './dto/update-preference.dto';

@Injectable()
export class PreferencesService {
  constructor(private prisma: PrismaService) {}

  async getPreferences(userId: string) {
    let preferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    // Jika user belum pernah mengatur/memiliki preference, kita return/buat nilai default
    if (!preferences) {
      preferences = await this.prisma.userPreferences.create({
        data: {
          userId,
          theme: 'system',
          language: 'id', // Default to 'id' (Indonesian) aligned with Nuxt config
        },
      });
    }

    return preferences;
  }

  async updatePreferences(userId: string, dto: UpdatePreferenceDto) {
    // Upsert: lakukan update kalau sudah ada, atau buat baru kalau modelnya belum ada
    return await this.prisma.userPreferences.upsert({
      where: { userId },
      update: dto,
      create: {
        userId,
        ...dto,
      },
    });
  }
}
