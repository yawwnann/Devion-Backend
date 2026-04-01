import type { User } from '@prisma/client';
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
export declare class PaymentMethodsController {
    private service;
    constructor(service: PaymentMethodsService);
    create(user: User, dto: CreatePaymentMethodDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        userId: string;
    }>;
    findAll(user: User): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        userId: string;
    }[]>;
    update(id: string, user: User, dto: UpdatePaymentMethodDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        userId: string;
    }>;
    remove(id: string, user: User): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        userId: string;
    }>;
}
