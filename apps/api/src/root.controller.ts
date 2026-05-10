import { Controller, Get } from '@nestjs/common';

/**
 * Routes excluded from the global `/api` prefix (see main.ts) so deploy roots and health checks work.
 */
@Controller()
export class RootController {
  @Get()
  welcome() {
    return {
      service: 'Interview Planner API',
      message:
        'This deployment is the JSON API only. The website is the Next.js app in apps/web — deploy that folder as a separate Vercel project and set NEXT_PUBLIC_API_BASE_URL to this origin + /api.',
      api: '/api',
      example: 'GET /api/hello',
      health: '/health',
    };
  }

  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
