import { Body, Controller, Post } from '@nestjs/common';
import { InterviewsService } from './interviews.service';

@Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post('mock')
  mockInterview(@Body() body: { answer: string }) {
    return this.interviewsService.streamPrompt(body.answer);
  }
}
