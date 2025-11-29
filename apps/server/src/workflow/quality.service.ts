import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QualityService {
    constructor(private prisma: PrismaService) { }

    async validateModelPackage(modelPackageId: string): Promise<string[]> {
        const errors: string[] = [];

        const elements = await this.prisma.element.findMany({
            where: { modelPackageId },
            include: { conceptType: true },
        });

        for (const element of elements) {
            // Rule 1: Application Component must have an Owner
            if (element.conceptType.name === 'ApplicationComponent') {
                const props = element.properties as any;
                if (!props || !props.owner) {
                    errors.push(`Element ${element.name} (ApplicationComponent) is missing 'owner' property.`);
                }
            }
        }

        return errors;
    }
}
