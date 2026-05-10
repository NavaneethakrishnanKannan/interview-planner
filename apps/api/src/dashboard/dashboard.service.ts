import { Injectable } from '@nestjs/common';

@Injectable()
export class DashboardService {
  getOverview() {
    return {
      readinessScore: 64,
      weakAreas: ['System Design', 'Security'],
      suggestedTopics: ['Scalable APIs', 'Auth refresh strategy'],
      completedInterviews: 6,
      progressGraph: [
        { date: '2026-05-01', score: 42 },
        { date: '2026-05-03', score: 50 },
        { date: '2026-05-06', score: 57 },
        { date: '2026-05-09', score: 64 },
      ],
    };
  }
}
