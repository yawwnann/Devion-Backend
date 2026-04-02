import { Module } from '@nestjs/common';
import { LoginHistoryService } from './login-history.service';
import { PrismaModule } from '../prisma';
import { NotificationsModule } from '../notifications';

@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [LoginHistoryService],
  exports: [LoginHistoryService],
})
export class LoginHistoryModule {}
