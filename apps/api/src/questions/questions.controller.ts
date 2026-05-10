import { Controller, Get, Query } from '@nestjs/common';
import { QuestionsService } from './questions.service';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  list(@Query('search') search?: string, @Query('category') category?: string) {
    return this.questionsService.list({ search, category });
  }
}
