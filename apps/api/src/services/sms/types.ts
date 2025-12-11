export interface SMSProvider {
  send(phoneE164: string, message: string): Promise<void>;
}

export interface SMSConfig {
  provider: string;
  apiKey: string;
  apiSecret: string;
  senderId: string;
}

