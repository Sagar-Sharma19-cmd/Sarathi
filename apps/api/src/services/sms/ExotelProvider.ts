import { logger } from '../../config/logger.js';
import type { SMSProvider, SMSConfig } from './types.js';

export class ExotelProvider implements SMSProvider {
  constructor(private config: SMSConfig) {}

  async send(phoneE164: string, message: string): Promise<void> {
    // Exotel API integration would go here
    // For MVP, we log and simulate success
    logger.info({ phoneE164 }, 'Sending SMS via Exotel');
    
    // In production:
    // const response = await fetch('https://api.exotel.com/v1/Accounts/{sid}/Sms/send', {
    //   method: 'POST',
    //   headers: { 'Authorization': `Basic ${btoa(config.apiKey + ':' + config.apiSecret)}` },
    //   body: new URLSearchParams({ From: config.senderId, To: phoneE164, Body: message })
    // });
    
    // Mock success
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

