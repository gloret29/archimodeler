import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@repo/database';

@Injectable()
export class RolesService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.role.findMany({
            include: { permissions: true },
        });
    }

    async findOne(id: string) {
        return this.prisma.role.findUnique({
            where: { id },
            include: { permissions: true },
        });
    }

    async create(data: Prisma.RoleCreateInput) {
        return this.prisma.role.create({
            data,
        });
    }

    async update(id: string, data: Prisma.RoleUpdateInput) {
        return this.prisma.role.update({
            where: { id },
            data,
        });
    }

    async remove(id: string) {
        return this.prisma.role.delete({
            where: { id },
        });
    }
}
