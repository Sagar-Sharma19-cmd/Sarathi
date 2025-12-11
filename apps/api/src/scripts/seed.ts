import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { logger } from '../config/logger.js';

async function seed() {
  try {
    await connectDatabase();
    logger.info('Seed script: Use the /admin/seed endpoint with authentication to seed data');
    await disconnectDatabase();
  } catch (error) {
    logger.error({ error }, 'Seed script failed');
    process.exit(1);
  }
}

seed();

