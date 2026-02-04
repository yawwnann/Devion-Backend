import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { CalendarService } from '../calendar';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private calendarService: CalendarService,
  ) {}

  async create(userId: string, dto: CreateProjectDto) {
    // Convert date strings to DateTime objects
    const data: any = {
      ...dto,
      userId,
    };

    // Convert startDate string to DateTime if provided and not empty
    if (dto.startDate && dto.startDate.trim() !== "") {
      data.startDate = new Date(dto.startDate);
    } else {
      // Remove empty startDate from data to avoid Prisma error
      delete data.startDate;
    }

    // Convert dueDate string to DateTime if provided and not empty
    if (dto.dueDate && dto.dueDate.trim() !== "") {
      data.dueDate = new Date(dto.dueDate);
    } else {
      // Remove empty dueDate from data to avoid Prisma error
      delete data.dueDate;
    }

    const project = await this.prisma.project.create({
      data,
    });

    // Auto-sync to calendar if project has dates
    if (dto.startDate || dto.dueDate) {
      await this.calendarService.syncFromProjects(userId);
    }

    return project;
  }

  async findAll(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      include: {
        category: true,
        payment: true,
      },
      orderBy: { orderNum: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.userId !== userId) throw new ForbiddenException();

    return project;
  }

  async update(id: string, userId: string, dto: UpdateProjectDto) {
    await this.findOne(id, userId);

    // Convert date strings to DateTime objects
    const data: any = { ...dto };

    // Convert startDate string to DateTime if provided and not empty
    if (dto.startDate && dto.startDate.trim() !== "") {
      data.startDate = new Date(dto.startDate);
    } else if (dto.startDate === "") {
      // If explicitly set to empty string, set to null
      data.startDate = null;
    }

    // Convert dueDate string to DateTime if provided and not empty
    if (dto.dueDate && dto.dueDate.trim() !== "") {
      data.dueDate = new Date(dto.dueDate);
    } else if (dto.dueDate === "") {
      // If explicitly set to empty string, set to null
      data.dueDate = null;
    }

    const project = await this.prisma.project.update({
      where: { id },
      data,
    });

    // Auto-sync to calendar after update
    await this.calendarService.syncFromProjects(userId);

    return project;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    // Delete associated calendar events first
    await this.prisma.calendarEvent.deleteMany({
      where: { projectId: id },
    });

    return this.prisma.project.delete({
      where: { id },
    });
  }

  async getStats(userId: string) {
    const [total, todo, inProgress, done] = await Promise.all([
      this.prisma.project.count({ where: { userId } }),
      this.prisma.project.count({ where: { userId, status: 'TODO' } }),
      this.prisma.project.count({ where: { userId, status: 'IN_PROGRESS' } }),
      this.prisma.project.count({ where: { userId, status: 'DONE' } }),
    ]);

    return { total, todo, inProgress, done };
  }

  async exportToCsv(userId: string): Promise<string> {
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
      p.createdAt.toISOString().split('T')[0], // Format: YYYY-MM-DD
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');

    return csvContent;
  }

  async importFromCsv(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ imported: number; errors: string[] }> {
    const csvContent = file.buffer.toString('utf-8');
    const lines = csvContent.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error('CSV file is empty or invalid');
    }

    const errors: string[] = [];
    let imported = 0;

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCsvLine(lines[i]);
        if (values.length < 2) continue;

        // CSV format: NO, PROJECT, ORDER, STATUS, PAYMENT, INFORMATION, CATEGORY, DATE
        // NO is ignored, we auto-generate orderNum based on import sequence
        // DATE will be used as createdAt if provided
        const [
          _no, // Ignored
          name,
          order,
          status,
          paymentName,
          information,
          categoryName,
          dateStr,
        ] = values;

        if (!name) continue; // Skip if no project name

        // Parse date if provided, will be used as createdAt
        let createdAt: Date | undefined;
        if (dateStr) {
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            createdAt = parsedDate;
          }
        }

        // Find or create category
        let categoryId: string | undefined;
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

        // Find or create payment method
        let paymentId: string | undefined;
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
            ...(createdAt && { createdAt }), // Set createdAt if date provided in CSV
          },
        });

        imported++;
      } catch (error) {
        errors.push(`Line ${i + 1}: ${error.message}`);
      }
    }

    return { imported, errors };
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  // ========== XLSX Export/Import ==========
  async exportToXlsx(userId: string): Promise<Buffer> {
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

  async importFromXlsx(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ imported: number; errors: string[] }> {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length < 2) {
      throw new Error('XLSX file is empty or invalid');
    }

    const errors: string[] = [];
    let imported = 0;

    // Skip header (first row)
    for (let i = 1; i < data.length; i++) {
      try {
        const row = data[i];
        if (!row || row.length < 2) continue;

        // XLSX format: NO, PROJECT, ORDER, STATUS, PAYMENT, INFORMATION, CATEGORY, DATE
        const [
          _no, // Ignored
          name,
          order,
          status,
          paymentName,
          information,
          categoryName,
          dateValue,
        ] = row;

        if (!name) continue; // Skip if no project name

        // Parse date if provided
        let createdAt: Date | undefined;
        if (dateValue) {
          // Excel dates can be serial numbers or strings
          if (typeof dateValue === 'number') {
            // Excel serial date - convert to JS date
            // Excel epoch is 1900-01-01, but treats 1900 as leap year
            const excelEpoch = new Date(1899, 11, 30);
            const parsedDate = new Date(
              excelEpoch.getTime() + dateValue * 86400000,
            );
            if (!isNaN(parsedDate.getTime())) {
              createdAt = parsedDate;
            }
          } else {
            const parsedDate = new Date(dateValue);
            if (!isNaN(parsedDate.getTime())) {
              createdAt = parsedDate;
            }
          }
        }

        // Find or create category
        let categoryId: string | undefined;
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

        // Find or create payment method
        let paymentId: string | undefined;
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
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    return { imported, errors };
  }
}
