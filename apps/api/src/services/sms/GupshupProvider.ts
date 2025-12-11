import { logger } from '../../config/logger.js';
import type { SMSProvider, SMSConfig } from './types.js';

export class GupshupProvider implements SMSProvider {
  constructor(private config: SMSConfig) {}

  async send(phoneE164: string, message: string): Promise<void> {
    // Gupshup API integration would go here
    logger.info({ phoneE164 }, 'Sending SMS via Gupshup');
    
    // In production:
    // const response = await fetch('https://enterprise.smsgupshup.com/GatewayAPI/rest', {
    //   method: 'POST',
    //   body: new URLSearchParams({
    //     method: 'SendMessage',
    //     userid: config.apiKey,
    //     password: config.apiSecret,
    //     send_to: phoneE164,
    //     msg: message,
    //     msg_type: 'TEXT',
    //   })
    // });
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

