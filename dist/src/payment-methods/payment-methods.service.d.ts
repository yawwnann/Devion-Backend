import { PrismaService } from '../prisma';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
export declare class PaymentMethodsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, dto: CreatePaymentMethodDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        userId: string;
    }>;
    findAll(userId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        userId: string;
    }[]>;
    update(id: string, userId: string, dto: UpdatePaymentMethodDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        userId: string;
    }>;
    remove(id: string, userId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        userId: string;
    }>;
}
