import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
    constructor(private prisma: PrismaService) { }

    async getSetting(key: string) {
        const setting = await this.prisma.systemSetting.findUnique({
            where: { key },
        });
        return setting ? setting.value : null;
    }

    async setSetting(key: string, value: any, description?: string) {
        return this.prisma.systemSetting.upsert({
            where: { key },
            update: { value, description },
            create: { key, value, description },
        });
    }

    async getAllSettings() {
        return this.prisma.systemSetting.findMany();
    }
}
