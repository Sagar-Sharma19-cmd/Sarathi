import { logger } from '../../config/logger.js';
import type { SMSProvider } from './types.js';

export class DevConsoleProvider implements SMSProvider {
  async send(phoneE164: string, message: string): Promise<void> {
    logger.info({ phoneE164, message }, '[DEV SMS CONSOLE] Message would be sent:');
    console.log('\n===========================================');
    console.log(`📱 SMS to ${phoneE164}`);
    console.log(`📄 Message: ${message}`);
    console.log('===========================================\n');
  }
}

