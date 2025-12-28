import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma';

interface GoogleUser {
  googleId: string;
  email: string;
  name?: string;
  avatar?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateGoogleUser(googleUser: GoogleUser) {
    const { googleId, email, name, avatar } = googleUser;

    let user = await this.prisma.user.findUnique({
      where: { googleId },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          googleId,
          email,
          name,
          avatar,
        },
      });
    } else {
      // Update user info on each login
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { name, avatar },
      });
    }

    return user;
  }

  generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
