# SafeSend Merchant Guide

## 🔍 Issue: "No merchants showing in SafeSend"

### Root Cause
When you create a merchant through the Admin Panel, it's created as **unverified** by default. The SafeSend feature **only shows verified merchants** for security purposes.

### ✅ Solution: 2-Step Process

## Step 1: Create Merchant (Admin Panel)

1. Go to **Admin Panel** (http://localhost:5173/admin)
2. In the "Manage Merchants" section, click **"+ Add Merchant"**
3. Fill in the merchant details:
   - **Name**: e.g., "ABC School"
   - **Phone**: e.g., "+919876543210"
   - **Category**: e.g., "school", "grocery", "medical"
   - **State Code**: e.g., "DL", "MH", "KA"
4. Click **"Create Merchant (Unverified)"**

✅ Merchant is now created with status: **Unverified**

## Step 2: Verify Merchant (Admin Panel)

5. In the merchant list, you'll see the new merchant with a yellow **"Unverified"** badge
6. Click the **"Verify →"** button next to the merchant
7. The merchant gets verified and receives an SMS notification

✅ Merchant is now **Verified** and appears in SafeSend!

## Visual Flow

```
Admin Panel
    ↓
Create Merchant → Status: Unverified (🟡)
    ↓
Click "Verify" → Status: Verified (🟢)
    ↓
SafeSend Feature → Merchant now appears in dropdown!
```

---

## 🎯 Quick Fix for Your Issue

If you've already created a merchant but it's not showing in SafeSend:

1. **Go to Admin Panel** → http://localhost:5173/admin
2. **Scroll to "Manage Merchants" section**
3. **Find your merchant** with yellow "Unverified" badge
4. **Click "Verify →"** button
5. **Go back to SafeSend** → Merchant now appears!

---

## 🛡️ Why This Two-Step Process?

**Security & Quality Control:**
- Prevents unauthorized merchants from receiving payments
- Allows admins to verify merchant identity
- Ensures legitimate businesses only
- Protects users from fraud

**Only verified merchants can:**
- ✅ Appear in SafeSend merchant dropdown
- ✅ Receive SafeSend payments
- ✅ Submit proof of purchase
- ✅ Get funds released after proof approval

---

## 📊 Merchant Status Flow

```
┌──────────────┐
│   Created    │ → Admin creates merchant
│  (Unverified)│    Status: verified = false
└──────┬───────┘
       │
       │ Admin clicks "Verify"
       ↓
┌──────────────┐
│   Verified   │ → Merchant receives SMS
│    (Active)  │    Status: verified = true
└──────┬───────┘
       │
       │ Now visible in SafeSend
       ↓
┌──────────────┐
│  Available   │ → Users can select merchant
│ in SafeSend  │    Users can create escrows
└──────────────┘
```

---

## 🔧 Features Added

### Admin Panel Improvements:
1. **Info Banner** - Explains verification requirement
2. **Unverified Badge** - Yellow badge shows unverified status
3. **Verified Badge** - Green badge shows verified status
4. **Clear Button Text** - "Create Merchant (Unverified)" and "Verify →"
5. **Success Message** - Reminds admin to verify after creation
6. **Empty State** - Shows helpful message when no merchants exist
7. **Better Layout** - Merchant info includes state code

### SafeSend Page Improvements:
1. **Better Error Message** - Explains why no merchants are shown
2. **Verification Instructions** - Clear steps to verify merchants
3. **Link to Admin Panel** - Quick navigation to verify merchants

---

## 📝 Complete Merchant Creation Workflow

### For Admins:

**Create:**
```bash
1. Open Admin Panel
2. Click "+ Add Merchant"
3. Enter details
4. Click "Create Merchant (Unverified)"
5. See success message with verification reminder
```

**Verify:**
```bash
6. Find merchant in list (yellow "Unverified" badge)
7. Click "Verify →" button
8. Merchant becomes verified (green "✓ Verified" badge)
9. Merchant receives SMS notification
10. Merchant now appears in SafeSend
```

### For Users (SafeSend):

**Create SafeSend Payment:**
```bash
1. Open SafeSend feature
2. Click "+ New SafeSend"
3. Select merchant from dropdown (only verified merchants shown)
4. Enter amount and purpose
5. Click "Create SafeSend"
6. Funds are locked until merchant provides proof
```

---

## 🎯 Quick Commands

**Check All Merchants (via API):**
```bash
# All merchants (verified + unverified)
curl http://localhost:3000/safesend/merchants \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Only verified merchants
curl http://localhost:3000/safesend/merchants?verified=true \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Only unverified merchants
curl http://localhost:3000/safesend/merchants?verified=false \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🐛 Troubleshooting

### "No verified merchants available yet"

**Cause:** All merchants are unverified  
**Solution:** Go to Admin Panel and verify merchants

### Merchant list is empty in Admin Panel

**Cause:** No merchants created yet  
**Solution:** Click "+ Add Merchant" to create one

### Created merchant but still not in SafeSend

**Cause:** Merchant not verified  
**Solution:** Click "Verify →" in Admin Panel

### Can't see "Verify" button

**Cause 1:** Merchant already verified (shows green "✓ Verified" badge)  
**Cause 2:** You're not an admin  
**Solution:** Run `pnpm make-admin <your-phone>` in apps/api

---

## 📚 Related Documentation

- **ADMIN_GUIDE.md** - Complete admin panel guide
- **ADMIN_QUICK_START.txt** - Quick reference for admin setup
- **README.md** - Full project documentation

---

## 💡 Pro Tips

1. **Verify immediately** - After creating a merchant, verify it right away
2. **Check the badge** - Yellow = Unverified, Green = Verified
3. **Test in SafeSend** - After verifying, check if merchant appears in dropdown
4. **Use meaningful names** - Makes it easier for users to select merchants
5. **Add state codes** - Helps organize merchants by location

---

## 🎉 Summary

✅ **Merchants must be verified** before appearing in SafeSend  
✅ **Two-step process**: Create → Verify  
✅ **Visual indicators**: Yellow badge (unverified), Green badge (verified)  
✅ **Clear messaging**: Tooltips and info banners guide you  
✅ **Security first**: Only verified merchants can receive payments  

**Remember**: After creating a merchant, always click "Verify →" to make it available in SafeSend!

