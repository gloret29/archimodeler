import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@repo/database';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOne(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
            include: { roles: true },
        });
    }

    async findAll(): Promise<User[]> {
        return this.prisma.user.findMany({
            include: { roles: true },
        });
    }

    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
            include: { roles: true },
        });
    }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        // Hash password if provided
        const { password, ...restData } = data as any;
        const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
        
        return this.prisma.user.create({
            data: {
                ...restData,
                ...(hashedPassword && { password: hashedPassword }),
            } as Prisma.UserCreateInput,
            include: { roles: true },
        });
    }

    async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data,
            include: { roles: true },
        });
    }

    async delete(id: string): Promise<User> {
        return this.prisma.user.delete({
            where: { id },
        });
    }
}
