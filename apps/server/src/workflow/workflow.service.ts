import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QualityService } from './quality.service';
import { Prisma } from '@repo/database';

@Injectable()
export class WorkflowService {
    constructor(
        private prisma: PrismaService,
        private qualityService: QualityService
    ) { }

    async createChangeRequest(userId: string, modelPackageId: string, title: string, description?: string) {
        return this.prisma.changeRequest.create({
            data: {
                title,
                description,
                modelPackage: { connect: { id: modelPackageId } },
                requester: { connect: { id: userId } },
                status: 'DRAFT'
            },
        });
    }

    async submitForReview(changeRequestId: string) {
        const cr = await this.prisma.changeRequest.findUnique({ where: { id: changeRequestId } });
        if (!cr) throw new BadRequestException('Change Request not found');

        // Run Quality Checks
        const errors = await this.qualityService.validateModelPackage(cr.modelPackageId);
        if (errors.length > 0) {
            throw new BadRequestException(`Quality checks failed: ${errors.join(', ')}`);
        }

        return this.prisma.changeRequest.update({
            where: { id: changeRequestId },
            data: { status: 'IN_REVIEW' },
        });
    }

    async approveChangeRequest(changeRequestId: string, reviewerId: string) {
        return this.prisma.changeRequest.update({
            where: { id: changeRequestId },
            data: {
                status: 'APPROVED',
                reviewer: { connect: { id: reviewerId } }
            },
        });
    }

    async rejectChangeRequest(changeRequestId: string, reviewerId: string) {
        return this.prisma.changeRequest.update({
            where: { id: changeRequestId },
            data: {
                status: 'DRAFT', // Back to draft? Or REJECTED? Let's say DRAFT for rework.
                reviewer: { connect: { id: reviewerId } }
            },
        });
    }

    async publishChangeRequest(changeRequestId: string) {
        const cr = await this.prisma.changeRequest.update({
            where: { id: changeRequestId },
            data: { status: 'PUBLISHED' },
        });

        // Update ModelPackage status
        await this.prisma.modelPackage.update({
            where: { id: cr.modelPackageId },
            data: { status: 'PUBLISHED' },
        });

        return cr;
    }

    async findAll() {
        return this.prisma.changeRequest.findMany({
            include: { requester: true, modelPackage: true, reviewer: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: string) {
        return this.prisma.changeRequest.findUnique({
            where: { id },
            include: { requester: true, modelPackage: true, reviewer: true }
        });
    }
}
