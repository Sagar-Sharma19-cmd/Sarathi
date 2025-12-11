import { env } from '../../config/env.js';
import { DevConsoleProvider } from './DevConsoleProvider.js';
import { ExotelProvider } from './ExotelProvider.js';
import { GupshupProvider } from './GupshupProvider.js';
import { TwilioProvider } from './TwilioProvider.js';
import type { SMSProvider } from './types.js';

function createSMSProvider(): SMSProvider {
  const config = {
    provider: env.SMS_PROVIDER,
    apiKey: env.SMS_API_KEY,
    apiSecret: env.SMS_API_SECRET,
    senderId: env.SMS_SENDER_ID,
  };

  switch (env.SMS_PROVIDER) {
    case 'EXOTEL':
      return new ExotelProvider(config);
    case 'GUPSHUP':
      return new GupshupProvider(config);
    case 'TWILIO':
      return new TwilioProvider(config);
    case 'DEV_SMS_CONSOLE':
    default:
      return new DevConsoleProvider();
  }
}

export const smsProvider = createSMSProvider();

