#!/bin/bash
# Test authentication flow

# 1. Request OTP
echo "=== Requesting OTP ==="
curl -X POST http://localhost:3000/auth/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phoneE164": "+919876543210"}'

echo -e "\n\n=== Check your terminal for OTP code ==="
echo "Then run: curl -X POST http://localhost:3000/auth/otp/verify -H \"Content-Type: application/json\" -d '{\"phoneE164\": \"+919876543210\", \"code\": \"YOUR_OTP_HERE\"}'"
