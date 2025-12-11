# Admin Panel Guide

## 🔧 Fixes Applied

The admin panel authentication issues have been fixed:

### 1. **Automatic Logout on Expired Tokens**
- When your JWT token expires (after 24 hours), the app now automatically logs you out
- You'll be redirected to the login page instead of seeing confusing errors
- No more "Invalid or expired token" errors while you're using the app

### 2. **Better Error Messages**
- **401 (Unauthorized)**: "Your session has expired" → Auto-logout
- **403 (Forbidden)**: "You need admin privileges" → Clear instructions
- **Other errors**: Specific error messages from the API

### 3. **Improved Authentication Flow**
- The API client now detects authentication failures automatically
- Invalid tokens are immediately cleared from localStorage
- You're redirected to login when needed

---

## 🚀 How to Use the Admin Panel

### Step 1: Create a User Account

1. Open http://localhost:5173
2. Login with your phone number (e.g., `+919876543210`)
3. Enter the OTP from your terminal console

### Step 2: Grant Admin Privileges

Open a new terminal and run:

```bash
cd apps/api
pnpm make-admin +919876543210
```

**Output:**
```
✅ Success! User is now an admin.
   Phone: +919876543210
   Sarathi ID: abc-123-def
   User ID: 507f1f77bcf86cd799439011

⚠️  You need to login again to get a new JWT token with admin privileges.
```

### Step 3: Login Again

1. **Logout** from the web app (Settings → Logout button, or clear localStorage)
2. **Login again** with the same phone number
3. Your new JWT token will now include admin privileges

### Step 4: Access Admin Features

Navigate to the Admin page to:
- ✅ Seed transaction data
- ✅ Create and verify merchants
- ✅ Review pending proof submissions
- ✅ Manage SafeSend escrows

---

## 🔐 Admin Management Commands

All commands work while the app is running - **no restart needed**!

### Grant Admin Access
```bash
cd apps/api
pnpm make-admin +919876543210
```

### Remove Admin Access
```bash
cd apps/api
pnpm remove-admin +919876543210
```

### List All Admins
```bash
cd apps/api
pnpm list-admins
```

---

## 🐛 Troubleshooting

### "Failed to create merchant: Invalid or expired token"

**Solution 1: Your token expired (24h lifetime)**
- Logout and login again to get a fresh token

**Solution 2: You're not an admin yet**
```bash
cd apps/api
pnpm make-admin +919876543210  # Your phone number
```
Then logout and login again.

**Solution 3: Clear old tokens**
Open browser console (F12) and run:
```javascript
localStorage.clear()
```
Then refresh and login again.

### "Access denied: You need admin privileges"

This means you're logged in, but not an admin:

1. **Make yourself admin:**
   ```bash
   cd apps/api
   pnpm make-admin +919876543210
   ```

2. **Logout and login again** to get new token with admin flag

### "User not found" when running make-admin

The user doesn't exist yet. You need to:

1. **Login at least once** via the web app
2. **Then run** `make-admin` command

### Stuck on loading or broken UI

**Clear browser storage:**
1. Press F12 (or Cmd+Option+I on Mac)
2. Go to Console tab
3. Type: `localStorage.clear()`
4. Press Enter
5. Refresh the page

---

## 🎯 Admin Panel Features

### 1. Seed Transaction Data
- Creates historical remittance transactions
- Useful for testing credit scores
- Customizable: months, amount, counterparty

### 2. Merchant Management
- **Create Merchants**: Add new merchants for SafeSend
- **Verify Merchants**: Approve merchants to accept payments
- **View All Merchants**: See verified/unverified status

### 3. Proof Review (SafeSend)
- **View Pending Proofs**: See proof submissions from merchants
- **Approve**: Release funds to merchant
- **Reject**: Refund to sender with reason

---

## 📊 Token Lifecycle

```
1. Login with OTP
   ↓
2. Receive JWT token (valid for 24h)
   ↓
3. Token stored in localStorage
   ↓
4. Every API call includes: Authorization: Bearer <token>
   ↓
5. Token expires after 24h
   ↓
6. Next API call returns 401
   ↓
7. App automatically logs you out
   ↓
8. Redirected to login page
```

---

## 🔒 Security Notes

1. **Tokens are Bearer tokens**: Anyone with the token can make requests
2. **Tokens expire after 24 hours**: For security
3. **Admin flag is checked server-side**: Can't be faked in the token
4. **Rate limiting is active**: Protects against abuse

---

## 💡 Best Practices

1. **Don't share your JWT token**: It's like a password
2. **Use admin accounts carefully**: They have elevated privileges
3. **Logout when done**: Especially on shared computers
4. **Monitor admin activity**: Check logs regularly
5. **Rotate admin users**: Remove admin access when no longer needed

---

## 🆘 Quick Reference

| Issue | Solution |
|-------|----------|
| Token expired | Logout and login again |
| Not an admin | Run `pnpm make-admin <phone>` |
| Old token stuck | `localStorage.clear()` in console |
| User doesn't exist | Login once first, then make-admin |
| 403 Forbidden | You need admin privileges |
| 401 Unauthorized | Token invalid/expired (auto-logout) |

---

## 📝 Testing Checklist

- [ ] Login with OTP works
- [ ] Make user admin via CLI
- [ ] Logout and login again
- [ ] Can access Admin page
- [ ] Can create merchants
- [ ] Can verify merchants
- [ ] Token expiry triggers auto-logout
- [ ] Error messages are clear

---

For more information, see:
- **QUICKSTART.md** - Basic setup
- **README.md** - Full documentation
- **SETUP.md** - Detailed setup guide

