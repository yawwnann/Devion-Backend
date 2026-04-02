import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { NotificationsService } from '../notifications';
import { Request } from 'express';

interface UserAgentInfo {
  browser: string;
  os: string;
  device: string;
}

@Injectable()
export class LoginHistoryService {
  private prisma: PrismaService;
  private notificationsService: NotificationsService;

  constructor(
    prisma: PrismaService,
    notificationsService: NotificationsService,
  ) {
    this.prisma = prisma;
    this.notificationsService = notificationsService;
  }

  /**
   * Parse user agent to extract browser, OS, and device info
   */
  private parseUserAgent(userAgent: string): UserAgentInfo {
    const ua = userAgent.toLowerCase();

    // Detect browser
    let browser = 'Unknown';
    if (ua.includes('firefox')) {
      browser = 'Firefox';
    } else if (ua.includes('edg')) {
      browser = 'Edge';
    } else if (ua.includes('chrome')) {
      browser = 'Chrome';
    } else if (ua.includes('safari')) {
      browser = 'Safari';
    } else if (ua.includes('opera') || ua.includes('opr')) {
      browser = 'Opera';
    } else if (ua.includes('msie') || ua.includes('trident')) {
      browser = 'Internet Explorer';
    }

    // Detect OS
    let os = 'Unknown';
    if (ua.includes('win')) {
      os = 'Windows';
    } else if (ua.includes('mac')) {
      os = 'macOS';
    } else if (ua.includes('linux')) {
      os = 'Linux';
    } else if (ua.includes('android')) {
      os = 'Android';
    } else if (
      ua.includes('ios') ||
      ua.includes('iphone') ||
      ua.includes('ipad')
    ) {
      os = 'iOS';
    }

    // Detect device
    let device = 'Desktop';
    if (
      ua.includes('mobile') ||
      ua.includes('android') ||
      ua.includes('iphone')
    ) {
      device = 'Mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      device = 'Tablet';
    }

    return { browser, os, device };
  }

  /**
   * Get location info from IP using ipapi.co (free, no API key needed)
   */
  private async getLocationFromIp(ip: string): Promise<{
    country?: string;
    city?: string;
    region?: string;
    timezone?: string;
  }> {
    try {
      // Remove IPv6 prefix if present
      const cleanIp = ip.replace(/^::ffff:/, '');

      // Skip localhost and private IPs
      if (
        cleanIp === '127.0.0.1' ||
        cleanIp === 'localhost' ||
        cleanIp.startsWith('192.168.') ||
        cleanIp.startsWith('10.') ||
        cleanIp.startsWith('172.')
      ) {
        return {
          country: 'Local Network',
          city: 'Localhost',
          region: '',
          timezone: 'UTC',
        };
      }

      const response = await fetch(`https://ipapi.co/${cleanIp}/json/`);
      if (!response.ok) {
        return {};
      }

      const data = await response.json();
      return {
        country: data.country_name,
        city: data.city,
        region: data.region,
        timezone: data.timezone,
      };
    } catch (error) {
      console.error('Failed to get location from IP:', error);
      return {};
    }
  }

  /**
   * Get client IP from request
   */
  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return request.ip || request.socket.remoteAddress || 'Unknown';
  }

  /**
   * Log a login attempt
   */
  async logLogin(
    userId: string | null,
    request: Request,
    isSuccess: boolean,
    failureReason?: string,
  ) {
    const ipAddress = this.getClientIp(request);
    const userAgent = request.headers['user-agent'] || 'Unknown';
    const { browser, os, device } = this.parseUserAgent(userAgent);
    const location = await this.getLocationFromIp(ipAddress);

    // Only log if we have a user ID (for successful logins) or if it's a failed attempt
    if (!userId && isSuccess) {
      return;
    }

    try {
      await this.prisma.loginHistory.create({
        data: {
          userId: userId || 'unknown',
          ipAddress,
          userAgent,
          browser,
          os,
          device,
          country: location.country,
          city: location.city,
          region: location.region,
          timezone: location.timezone,
          isSuccess,
          failureReason,
        },
      });

      // Send security notification for successful login
      if (userId && isSuccess) {
        const locationString = location.city
          ? `${location.city}${location.country ? ', ' + location.country : ''}`
          : location.country || 'Unknown location';

        // Check if this is a new device (simplified check - in production you'd want to store device fingerprints)
        const recentLogins = await this.prisma.loginHistory.findMany({
          where: {
            userId,
            device,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
          take: 1,
        });

        const isNewDevice = recentLogins.length === 0;

        if (isNewDevice) {
          await this.notificationsService.newDeviceLogin(
            userId,
            `${browser} on ${os}`,
            locationString,
            ipAddress,
          );
        } else {
          await this.notificationsService.newLogin(
            userId,
            `${browser} on ${os}`,
            locationString,
            ipAddress,
          );
        }
      }

      // Send notification for failed login attempt
      if (userId && !isSuccess && failureReason) {
        const locationString = location.city
          ? `${location.city}${location.country ? ', ' + location.country : ''}`
          : location.country || 'Unknown location';

        await this.notificationsService.failedLoginAttempt(
          userId,
          `${browser} on ${os}`,
          locationString,
          ipAddress,
        );
      }
    } catch (error) {
      console.error('Failed to log login history:', error);
    }
  }

  /**
   * Get login history for a user
   */
  async getUserLoginHistory(userId: string, limit = 10) {
    return this.prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get recent login attempts (for admin)
   */
  async getRecentLogins(limit = 50) {
    return this.prisma.loginHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }
}
