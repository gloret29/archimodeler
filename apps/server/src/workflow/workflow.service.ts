import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QualityService } from './quality.service';
import { Prisma } from '@repo/database';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationSeverity } from '@prisma/client';

@Injectable()
export class WorkflowService {
    constructor(
        private prisma: PrismaService,
        private qualityService: QualityService,
        @Inject(forwardRef(() => NotificationsService))
        private notificationsService: NotificationsService,
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
        const cr = await this.prisma.changeRequest.findUnique({ 
            where: { id: changeRequestId },
            include: { modelPackage: true, requester: true }
        });
        if (!cr) throw new BadRequestException('Change Request not found');

        // Run Quality Checks
        const errors = await this.qualityService.validateModelPackage(cr.modelPackageId);
        if (errors.length > 0) {
            throw new BadRequestException(`Quality checks failed: ${errors.join(', ')}`);
        }

        const updated = await this.prisma.changeRequest.update({
            where: { id: changeRequestId },
            data: { status: 'IN_REVIEW' },
        });

        // Notify reviewers (users with Lead Designer or System Administrator roles)
        const reviewers = await this.prisma.user.findMany({
            where: {
                roles: {
                    some: {
                        name: { in: ['Lead Designer', 'System Administrator'] }
                    }
                }
            }
        });

        for (const reviewer of reviewers) {
            await this.notificationsService.createNotification({
                userId: reviewer.id,
                type: NotificationType.CHANGE_REQUEST_CREATED,
                severity: NotificationSeverity.INFO,
                title: 'New Change Request Submitted',
                message: `Change request "${cr.title}" for package "${cr.modelPackage.name}" has been submitted for review.`,
                metadata: { changeRequestId: cr.id, modelPackageId: cr.modelPackageId }
            });
        }

        return updated;
    }

    async approveChangeRequest(changeRequestId: string, reviewerId: string) {
        const cr = await this.prisma.changeRequest.findUnique({
            where: { id: changeRequestId },
            include: { requester: true, modelPackage: true }
        });
        if (!cr) throw new BadRequestException('Change Request not found');

        const updated = await this.prisma.changeRequest.update({
            where: { id: changeRequestId },
            data: {
                status: 'APPROVED',
                reviewer: { connect: { id: reviewerId } }
            },
        });

        // Notify requester
        await this.notificationsService.createNotification({
            userId: cr.requesterId,
            type: NotificationType.CHANGE_REQUEST_APPROVED,
            severity: NotificationSeverity.SUCCESS,
            title: 'Change Request Approved',
            message: `Your change request "${cr.title}" has been approved.`,
            metadata: { changeRequestId: cr.id, modelPackageId: cr.modelPackageId }
        });

        return updated;
    }

    async rejectChangeRequest(changeRequestId: string, reviewerId: string) {
        const cr = await this.prisma.changeRequest.findUnique({
            where: { id: changeRequestId },
            include: { requester: true, modelPackage: true }
        });
        if (!cr) throw new BadRequestException('Change Request not found');

        const updated = await this.prisma.changeRequest.update({
            where: { id: changeRequestId },
            data: {
                status: 'DRAFT', // Back to draft? Or REJECTED? Let's say DRAFT for rework.
                reviewer: { connect: { id: reviewerId } }
            },
        });

        // Notify requester
        await this.notificationsService.createNotification({
            userId: cr.requesterId,
            type: NotificationType.CHANGE_REQUEST_REJECTED,
            severity: NotificationSeverity.WARNING,
            title: 'Change Request Rejected',
            message: `Your change request "${cr.title}" has been rejected and returned to draft.`,
            metadata: { changeRequestId: cr.id, modelPackageId: cr.modelPackageId }
        });

        return updated;
    }

    async publishChangeRequest(changeRequestId: string) {
        const cr = await this.prisma.changeRequest.findUnique({
            where: { id: changeRequestId },
            include: { requester: true, modelPackage: true }
        });
        if (!cr) throw new BadRequestException('Change Request not found');

        const updated = await this.prisma.changeRequest.update({
            where: { id: changeRequestId },
            data: { status: 'PUBLISHED' },
        });

        // Update ModelPackage status
        await this.prisma.modelPackage.update({
            where: { id: cr.modelPackageId },
            data: { status: 'PUBLISHED' },
        });

        // Notify requester
        await this.notificationsService.createNotification({
            userId: cr.requesterId,
            type: NotificationType.CHANGE_REQUEST_PUBLISHED,
            severity: NotificationSeverity.SUCCESS,
            title: 'Change Request Published',
            message: `Your change request "${cr.title}" has been published.`,
            metadata: { changeRequestId: cr.id, modelPackageId: cr.modelPackageId }
        });

        return updated;
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
