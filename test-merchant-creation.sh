#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000"
PHONE="+919876543210"

echo -e "${YELLOW}=== Sarathi Merchant Creation Test ===${NC}\n"

# Step 1: Request OTP
echo -e "${YELLOW}Step 1: Requesting OTP for $PHONE...${NC}"
OTP_RESPONSE=$(curl -s -X POST "$API_URL/auth/otp/send" \
  -H "Content-Type: application/json" \
  -d "{\"phoneE164\": \"$PHONE\"}")

echo "Response: $OTP_RESPONSE"
echo -e "${GREEN}✓ OTP sent! Check your terminal console for the 6-digit code.${NC}\n"

# Step 2: Verify OTP (user needs to input)
echo -e "${YELLOW}Step 2: Enter the OTP code from your console:${NC}"
read -p "OTP Code: " OTP_CODE

echo -e "\n${YELLOW}Verifying OTP...${NC}"
AUTH_RESPONSE=$(curl -s -X POST "$API_URL/auth/otp/verify" \
  -H "Content-Type: application/json" \
  -d "{\"phoneE164\": \"$PHONE\", \"code\": \"$OTP_CODE\"}")

# Extract JWT token
JWT=$(echo $AUTH_RESPONSE | grep -o '"jwt":"[^"]*"' | cut -d'"' -f4)

if [ -z "$JWT" ]; then
  echo -e "${RED}✗ Failed to get JWT token. Response:${NC}"
  echo "$AUTH_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Authentication successful!${NC}"
echo "JWT Token: ${JWT:0:50}..."
echo ""

# Step 3: Try to create merchant
echo -e "${YELLOW}Step 3: Attempting to create merchant...${NC}"
MERCHANT_RESPONSE=$(curl -s -X POST "$API_URL/safesend/merchants" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d '{
    "name": "Test Grocery Store",
    "phoneE164": "+919999888877",
    "category": "grocery",
    "stateCode": "DL"
  }')

# Check if successful
if echo "$MERCHANT_RESPONSE" | grep -q '"merchant"'; then
  echo -e "${GREEN}✓ Merchant created successfully!${NC}"
  echo "$MERCHANT_RESPONSE" | jq '.' 2>/dev/null || echo "$MERCHANT_RESPONSE"
else
  echo -e "${RED}✗ Failed to create merchant${NC}"
  echo "Response: $MERCHANT_RESPONSE"
  echo ""
  
  if echo "$MERCHANT_RESPONSE" | grep -q "Admin access required"; then
    echo -e "${YELLOW}════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}Issue: Your user is not an admin${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════════${NC}"
    echo ""
    echo "To fix this, run:"
    echo -e "${GREEN}  cd apps/api${NC}"
    echo -e "${GREEN}  pnpm make-admin $PHONE${NC}"
    echo ""
    echo "Then run this script again."
  elif echo "$MERCHANT_RESPONSE" | grep -q "Invalid or expired token"; then
    echo -e "${YELLOW}════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}Issue: Token is invalid or expired${NC}"
    echo -e "${YELLOW}════════════════════════════════════════════════${NC}"
    echo ""
    echo "Possible causes:"
    echo "  1. Your user doesn't exist in the database"
    echo "  2. JWT_SECRET mismatch between signing and verification"
    echo "  3. Token format is incorrect"
    echo ""
    echo "Steps to fix:"
    echo "  1. Make sure the API server is running"
    echo "  2. Make sure MongoDB is running"
    echo "  3. Make your user an admin: cd apps/api && pnpm make-admin $PHONE"
    echo "  4. Run this script again"
  fi
  exit 1
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ All tests passed!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"

