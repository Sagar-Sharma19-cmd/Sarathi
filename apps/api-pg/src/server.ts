import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/db';
import { initRedis } from './config/redis';
import { logger } from './config/logger';

async function main() {
  await initRedis();
  await prisma.$connect();

  const app = createApp();
  app.listen(Number(env.PORT), () => {
    logger.info({ port: env.PORT }, 'Sarathi PG API running');
  });
}

main().catch(err => {
  logger.error({ err }, 'Fatal error during startup');
  process.exit(1);
});

