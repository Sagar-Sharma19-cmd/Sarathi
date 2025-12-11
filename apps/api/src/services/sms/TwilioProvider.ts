import { logger } from '../../config/logger.js';
import type { SMSProvider, SMSConfig } from './types.js';

export class TwilioProvider implements SMSProvider {
  constructor(private config: SMSConfig) {}

  async send(phoneE164: string, message: string): Promise<void> {
    // Twilio API integration would go here
    logger.info({ phoneE164 }, 'Sending SMS via Twilio');
    
    // In production, install @twilio/sdk and use:
    // const client = twilio(config.apiKey, config.apiSecret);
    // await client.messages.create({
    //   body: message,
    //   from: config.senderId,
    //   to: phoneE164
    // });
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

