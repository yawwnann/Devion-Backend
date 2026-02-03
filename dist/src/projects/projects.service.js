"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const XLSX = __importStar(require("xlsx"));
const prisma_1 = require("../prisma");
const calendar_1 = require("../calendar");
let ProjectsService = class ProjectsService {
    prisma;
    calendarService;
    constructor(prisma, calendarService) {
        this.prisma = prisma;
        this.calendarService = calendarService;
    }
    async create(userId, dto) {
        const data = {
            ...dto,
            userId,
        };
        if (dto.startDate && dto.startDate.trim() !== "") {
            data.startDate = new Date(dto.startDate);
        }
        else {
            delete data.startDate;
        }
        if (dto.dueDate && dto.dueDate.trim() !== "") {
            data.dueDate = new Date(dto.dueDate);
        }
        else {
            delete data.dueDate;
        }
        const project = await this.prisma.project.create({
            data,
        });
        if (dto.startDate || dto.dueDate) {
            await this.calendarService.syncFromProjects(userId);
        }
        return project;
    }
    async findAll(userId) {
        return this.prisma.project.findMany({
            where: { userId },
            include: {
                category: true,
                payment: true,
            },
            orderBy: { orderNum: 'asc' },
        });
    }
    async findOne(id, userId) {
        const project = await this.prisma.project.findUnique({
            where: { id },
        });
        if (!project)
            throw new common_1.NotFoundException('Project not found');
        if (project.userId !== userId)
            throw new common_1.ForbiddenException();
        return project;
    }
    async update(id, userId, dto) {
        await this.findOne(id, userId);
        const data = { ...dto };
        if (dto.startDate && dto.startDate.trim() !== "") {
            data.startDate = new Date(dto.startDate);
        }
        else if (dto.startDate === "") {
            data.startDate = null;
        }
        if (dto.dueDate && dto.dueDate.trim() !== "") {
            data.dueDate = new Date(dto.dueDate);
        }
        else if (dto.dueDate === "") {
            data.dueDate = null;
        }
        const project = await this.prisma.project.update({
            where: { id },
            data,
        });
        await this.calendarService.syncFromProjects(userId);
        return project;
    }
    async remove(id, userId) {
        await this.findOne(id, userId);
        await this.prisma.calendarEvent.deleteMany({
            where: { projectId: id },
        });
        return this.prisma.project.delete({
            where: { id },
        });
    }
    async getStats(userId) {
        const [total, todo, inProgress, done] = await Promise.all([
            this.prisma.project.count({ where: { userId } }),
            this.prisma.project.count({ where: { userId, status: 'TODO' } }),
            this.prisma.project.count({ where: { userId, status: 'IN_PROGRESS' } }),
            this.prisma.project.count({ where: { userId, status: 'DONE' } }),
        ]);
        return { total, todo, inProgress, done };
    }
    async exportToCsv(userId) {
        const projects = await this.prisma.project.findMany({
            where: { userId },
            include: { category: true, payment: true },
            orderBy: { orderNum: 'asc' },
        });
        const headers = [
            'NO',
            'PROJECT',
            'ORDER',
            'STATUS',
            'PAYMENT',
            'INFORMATION',
            'CATEGORY',
            'DATE',
        ];
        const rows = projects.map((p, index) => [
            (index + 1).toString(),
            p.name,
            p.order || '',
            p.status,
            p.payment?.name || '',
            p.information || '',
            p.category?.name || '',
            p.createdAt.toISOString().split('T')[0],
        ]);
        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
        ].join('\n');
        return csvContent;
    }
    async importFromCsv(userId, file) {
        const csvContent = file.buffer.toString('utf-8');
        const lines = csvContent.split('\n').filter((line) => line.trim());
        if (lines.length < 2) {
            throw new Error('CSV file is empty or invalid');
        }
        const errors = [];
        let imported = 0;
        for (let i = 1; i < lines.length; i++) {
            try {
                const values = this.parseCsvLine(lines[i]);
                if (values.length < 2)
                    continue;
                const [_no, name, order, status, paymentName, information, categoryName, dateStr,] = values;
                if (!name)
                    continue;
                let createdAt;
                if (dateStr) {
                    const parsedDate = new Date(dateStr);
                    if (!isNaN(parsedDate.getTime())) {
                        createdAt = parsedDate;
                    }
                }
                let categoryId;
                if (categoryName) {
                    let category = await this.prisma.projectCategory.findFirst({
                        where: { userId, name: categoryName },
                    });
                    if (!category) {
                        category = await this.prisma.projectCategory.create({
                            data: { userId, name: categoryName, color: 'gray' },
                        });
                    }
                    categoryId = category.id;
                }
                let paymentId;
                if (paymentName) {
                    let payment = await this.prisma.paymentMethod.findFirst({
                        where: { userId, name: paymentName },
                    });
                    if (!payment) {
                        payment = await this.prisma.paymentMethod.create({
                            data: { userId, name: paymentName, color: 'gray' },
                        });
                    }
                    paymentId = payment.id;
                }
                await this.prisma.project.create({
                    data: {
                        userId,
                        name,
                        order: order || null,
                        status: ['TODO', 'IN_PROGRESS', 'DONE'].includes(status)
                            ? status
                            : 'TODO',
                        categoryId,
                        paymentId,
                        information: information || null,
                        ...(createdAt && { createdAt }),
                    },
                });
                imported++;
            }
            catch (error) {
                errors.push(`Line ${i + 1}: ${error.message}`);
            }
        }
        return { imported, errors };
    }
    parseCsvLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++;
                }
                else {
                    inQuotes = !inQuotes;
                }
            }
            else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            }
            else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }
    async exportToXlsx(userId) {
        const projects = await this.prisma.project.findMany({
            where: { userId },
            include: { category: true, payment: true },
            orderBy: { orderNum: 'asc' },
        });
        const data = [
            [
                'NO',
                'PROJECT',
                'ORDER',
                'STATUS',
                'PAYMENT',
                'INFORMATION',
                'CATEGORY',
                'DATE',
            ],
            ...projects.map((p, index) => [
                index + 1,
                p.name,
                p.order || '',
                p.status,
                p.payment?.name || '',
                p.information || '',
                p.category?.name || '',
                p.createdAt.toISOString().split('T')[0],
            ]),
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');
        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }
    async importFromXlsx(userId, file) {
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (data.length < 2) {
            throw new Error('XLSX file is empty or invalid');
        }
        const errors = [];
        let imported = 0;
        for (let i = 1; i < data.length; i++) {
            try {
                const row = data[i];
                if (!row || row.length < 2)
                    continue;
                const [_no, name, order, status, paymentName, information, categoryName, dateValue,] = row;
                if (!name)
                    continue;
                let createdAt;
                if (dateValue) {
                    if (typeof dateValue === 'number') {
                        const excelEpoch = new Date(1899, 11, 30);
                        const parsedDate = new Date(excelEpoch.getTime() + dateValue * 86400000);
                        if (!isNaN(parsedDate.getTime())) {
                            createdAt = parsedDate;
                        }
                    }
                    else {
                        const parsedDate = new Date(dateValue);
                        if (!isNaN(parsedDate.getTime())) {
                            createdAt = parsedDate;
                        }
                    }
                }
                let categoryId;
                if (categoryName) {
                    let category = await this.prisma.projectCategory.findFirst({
                        where: { userId, name: String(categoryName) },
                    });
                    if (!category) {
                        category = await this.prisma.projectCategory.create({
                            data: { userId, name: String(categoryName), color: 'gray' },
                        });
                    }
                    categoryId = category.id;
                }
                let paymentId;
                if (paymentName) {
                    let payment = await this.prisma.paymentMethod.findFirst({
                        where: { userId, name: String(paymentName) },
                    });
                    if (!payment) {
                        payment = await this.prisma.paymentMethod.create({
                            data: { userId, name: String(paymentName), color: 'gray' },
                        });
                    }
                    paymentId = payment.id;
                }
                await this.prisma.project.create({
                    data: {
                        userId,
                        name: String(name),
                        order: order ? String(order) : null,
                        status: ['TODO', 'IN_PROGRESS', 'DONE'].includes(String(status))
                            ? String(status)
                            : 'TODO',
                        categoryId,
                        paymentId,
                        information: information ? String(information) : null,
                        ...(createdAt && { createdAt }),
                    },
                });
                imported++;
            }
            catch (error) {
                errors.push(`Row ${i + 1}: ${error.message}`);
            }
        }
        return { imported, errors };
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService,
        calendar_1.CalendarService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map