import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.note.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  upsert(payload: {
    userId: string;
    id?: string;
    title?: string;
    content: string;
  }) {
    if (payload.id) {
      return this.prisma.note.update({
        where: { id: payload.id },
        data: { title: payload.title, content: payload.content },
      });
    }
    return this.prisma.note.create({
      data: {
        userId: payload.userId,
        title: payload.title,
        content: payload.content,
      },
    });
  }
}
