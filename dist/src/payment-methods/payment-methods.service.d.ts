import { PrismaService } from '../prisma';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
export declare class PaymentMethodsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreatePaymentMethodDto): Promise<{
        id: string;
        name: string;
        color: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    findAll(userId: string): Promise<{
        id: string;
        name: string;
        color: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }[]>;
    update(id: string, userId: string, dto: UpdatePaymentMethodDto): Promise<{
        id: string;
        name: string;
        color: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    remove(id: string, userId: string): Promise<{
        id: string;
        name: string;
        color: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
}
