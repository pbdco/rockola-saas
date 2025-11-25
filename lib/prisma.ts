import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from './logger';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ],
  });

// Log all Prisma queries
prisma.$on('query' as never, (e: Prisma.QueryEvent) => {
  logger.dbOperation('query', 'prisma', {
    query: e.query,
    params: e.params,
    duration: `${e.duration}ms`,
    target: e.target,
  });
});

// Log Prisma errors
prisma.$on('error' as never, (e: Prisma.LogEvent) => {
  logger.dbOperation('error', 'prisma', undefined, undefined, {
    message: e.message,
  });
});

// Log Prisma warnings
prisma.$on('warn' as never, (e: Prisma.LogEvent) => {
  logger.dbOperation('warn', 'prisma', {
    message: e.message,
  });
});

// Add middleware to log all operations
prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;

  logger.dbOperation(
    params.action,
    params.model || 'unknown',
    {
      args: params.args,
    },
    {
      duration: `${duration}ms`,
      recordCount: Array.isArray(result) ? result.length : result ? 1 : 0,
    }
  );

  return result;
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
