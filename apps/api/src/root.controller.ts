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
      message: 'API routes live under /api (e.g. GET /api/hello, POST /api/auth/login).',
      health: '/health',
    };
  }

  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
