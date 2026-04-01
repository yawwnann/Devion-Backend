import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePaymentMethodDto) {
    try {
      return await this.prisma.paymentMethod.create({
        data: { ...dto, userId },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Payment method name already exists');
      }
      throw error;
    }
  }

  async findAll(userId: string) {
    return this.prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, userId: string, dto: UpdatePaymentMethodDto) {
    const method = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });
    if (!method || method.userId !== userId) {
      throw new NotFoundException('Payment method not found');
    }
    return this.prisma.paymentMethod.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    const method = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });
    if (!method || method.userId !== userId) {
      throw new NotFoundException('Payment method not found');
    }

    // Check if payment method is used by any projects
    const projectsUsingPayment = await this.prisma.project.count({
      where: { paymentId: id },
    });

    if (projectsUsingPayment > 0) {
      throw new ConflictException(
        `Cannot delete payment method. ${projectsUsingPayment} project(s) are using it.`,
      );
    }

    return this.prisma.paymentMethod.delete({ where: { id } });
  }
}
