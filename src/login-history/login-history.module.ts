import { Module } from '@nestjs/common';
import { LoginHistoryService } from './login-history.service';
import { PrismaModule } from '../prisma';

@Module({
  imports: [PrismaModule],
  providers: [LoginHistoryService],
  exports: [LoginHistoryService],
})
export class LoginHistoryModule {}
