"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectSettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../prisma");
const cloudinary_1 = require("cloudinary");
let ProjectSettingsService = class ProjectSettingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
        cloudinary_1.v2.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
    }
    async getSettings(userId) {
        let settings = await this.prisma.projectPageSettings.findUnique({
            where: { userId },
        });
        if (!settings) {
            settings = await this.prisma.projectPageSettings.create({
                data: {
                    userId,
                    title: 'DATA PROJECT',
                },
            });
        }
        return settings;
    }
    async updateSettings(userId, dto) {
        return this.prisma.projectPageSettings.upsert({
            where: { userId },
            update: dto,
            create: {
                userId,
                ...dto,
            },
        });
    }
    async uploadCover(userId, file) {
        const result = await new Promise((resolve, reject) => {
            cloudinary_1.v2.uploader
                .upload_stream({
                folder: 'devion/project-covers',
                resource_type: 'image',
            }, (error, result) => {
                if (error)
                    reject(error);
                else
                    resolve(result);
            })
                .end(file.buffer);
        });
        return this.prisma.projectPageSettings.upsert({
            where: { userId },
            update: { cover: result.secure_url },
            create: {
                userId,
                cover: result.secure_url,
                title: 'DATA PROJECT',
            },
        });
    }
    async removeCover(userId) {
        return this.prisma.projectPageSettings.update({
            where: { userId },
            data: { cover: null },
        });
    }
};
exports.ProjectSettingsService = ProjectSettingsService;
exports.ProjectSettingsService = ProjectSettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService])
], ProjectSettingsService);
//# sourceMappingURL=project-settings.service.js.map