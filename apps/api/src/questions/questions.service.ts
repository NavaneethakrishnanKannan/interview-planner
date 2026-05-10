import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  list(params: { search?: string; category?: string }) {
    return this.prisma.question.findMany({
      where: {
        title: params.search
          ? { contains: params.search, mode: 'insensitive' }
          : undefined,
        category: params.category ? { slug: params.category } : undefined,
      },
      include: { category: true },
      take: 50,
      orderBy: { updatedAt: 'desc' },
    });
  }
}
