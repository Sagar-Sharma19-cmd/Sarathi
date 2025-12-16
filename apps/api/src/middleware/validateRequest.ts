import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError, ErrorCodes } from '../utils/errors.js';
import { logger } from '../config/logger.js';

// Helper to normalize phone number
function normalizePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return phone;
  }
  
  let normalized = phone.replace(/[^\d+]/g, '').trim();
  
  // If already starts with +91, just ensure it has exactly 10 digits after
  if (normalized.startsWith('+91')) {
    const digitsAfter91 = normalized.substring(3);
    if (digitsAfter91.length > 10) {
      normalized = '+91' + digitsAfter91.substring(0, 10);
    }
    return normalized;
  }
  
  // Handle numbers starting with 91
  if (normalized.startsWith('91') && normalized.length > 2) {
    const digitsAfter91 = normalized.substring(2);
    // If more than 10 digits, take only first 10
    if (digitsAfter91.length > 10) {
      normalized = '+91' + digitsAfter91.substring(0, 10);
    } else {
      normalized = '+91' + digitsAfter91;
    }
    return normalized;
  }
  
  // Handle numbers starting with 0
  if (normalized.startsWith('0')) {
    const digitsAfter0 = normalized.substring(1);
    if (digitsAfter0.length > 10) {
      normalized = '+91' + digitsAfter0.substring(0, 10);
    } else {
      normalized = '+91' + digitsAfter0;
    }
    return normalized;
  }
  
  // For any other number, add +91 and limit to 10 digits
  if (normalized.length > 10) {
    normalized = '+91' + normalized.substring(0, 10);
  } else {
    normalized = '+91' + normalized;
  }
  
  return normalized;
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Normalize phoneE164 if it exists
      if (req.body.phoneE164 && typeof req.body.phoneE164 === 'string') {
        const beforeNormalization = req.body.phoneE164;
        req.body.phoneE164 = normalizePhoneNumber(req.body.phoneE164);
        const digitsAfter91 = req.body.phoneE164.replace(/^\+91/, '');
        
        logger.info({ 
          before: beforeNormalization, 
          after: req.body.phoneE164,
          digitsCount: digitsAfter91.length,
          digitsAfter91: digitsAfter91
        }, 'Phone number normalized');
      }
      
      // Trim password if it exists
      if (req.body.password && typeof req.body.password === 'string') {
        req.body.password = req.body.password.trim();
      }
      
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        logger.error({ 
          errors: result.error.errors,
          body: {
            ...req.body,
            password: req.body.password ? `[${req.body.password.length} chars]` : undefined
          },
          phoneE164: req.body.phoneE164 
        }, 'Validation error');
        
        // Provide more helpful error messages
        const firstError = result.error.errors[0];
        let errorMessage = firstError?.message || 'validation failed';
        
        // Phone number validation errors
        if (firstError?.path && firstError.path.includes('phoneE164')) {
          const phone = req.body.phoneE164 || '';
          const digitsAfter91 = phone.replace(/^\+91/, '');
          
          if (firstError.code === 'invalid_string' || firstError.code === 'invalid_type') {
            if (digitsAfter91.length !== 10) {
              errorMessage = `Phone number must have exactly 10 digits after +91. Found ${digitsAfter91.length} digits. Format: +919876543210`;
            } else if (!/^[6-9]/.test(digitsAfter91)) {
              errorMessage = 'Phone number must start with 6, 7, 8, or 9 after +91. Format: +919876543210';
            } else {
              errorMessage = `Invalid phone number format. Received: "${phone}". Expected format: +919876543210`;
            }
          } else if (firstError.message) {
            errorMessage = `Phone number error: ${firstError.message}`;
          }
        }
        
        // Password validation errors
        if (firstError?.path && firstError.path.includes('password')) {
          if (firstError.code === 'too_small') {
            errorMessage = `Password must be at least ${firstError.minimum} characters long`;
          } else if (firstError.code === 'too_big') {
            errorMessage = `Password must be at most ${firstError.maximum} characters long`;
          } else if (firstError.code === 'invalid_type') {
            errorMessage = 'Password must be a string';
          } else if (firstError.message) {
            errorMessage = `Password error: ${firstError.message}`;
          }
        }
        
        return next(
          new AppError(ErrorCodes.INVALID_INPUT, errorMessage, 400)
        );
      }
      
      req.body = result.data;
      next();
    } catch (error) {
      logger.error({ error }, 'Unexpected error in validateBody');
      return next(
        new AppError(ErrorCodes.INTERNAL_ERROR, 'Validation error occurred', 500)
      );
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(
        new AppError(ErrorCodes.INVALID_INPUT, 'Invalid query parameters', 400)
      );
    }
    req.query = result.data as Record<string, string>;
    next();
  };
}

