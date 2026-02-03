import type { User } from '@prisma/client';
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
export declare class PaymentMethodsController {
    private service;
    constructor(service: PaymentMethodsService);
    create(user: User, dto: CreatePaymentMethodDto): Promise<{
        id: string;
        name: string;
        color: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    findAll(user: User): Promise<{
        id: string;
        name: string;
        color: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }[]>;
    update(id: string, user: User, dto: UpdatePaymentMethodDto): Promise<{
        id: string;
        name: string;
        color: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
    remove(id: string, user: User): Promise<{
        id: string;
        name: string;
        color: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    }>;
}
