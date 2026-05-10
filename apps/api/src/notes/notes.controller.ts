import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { NotesService } from './notes.service';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  list(@Query('userId') userId: string) {
    return this.notesService.list(userId);
  }

  @Post()
  save(
    @Body()
    body: {
      userId: string;
      id?: string;
      title?: string;
      content: string;
    },
  ) {
    return this.notesService.upsert(body);
  }
}
