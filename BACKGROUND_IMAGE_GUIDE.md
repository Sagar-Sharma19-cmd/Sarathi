# Background Image Guide

## ✅ **Current Status: FIXED**

The app now has a beautiful gradient background with a construction-themed pattern that works immediately on both login and home pages.

---

## 🎨 **What's Currently Applied**

### Login Page & Home Page:
- **Gradient**: Orange-to-blue gradient (matches Sarathi brand colors)
- **Pattern**: Diagonal construction stripe pattern
- **Responsive**: Works perfectly on mobile and desktop
- **Readable**: White card overlays keep text crisp and clear

---

## 📸 **Want to Use Your Worker Photo Instead?**

If you want to replace the gradient with your construction worker image:

### Option 1: Save Image File (Recommended)

1. **Save your worker image** as: `sarathi-worker.jpg`

2. **Place it here:**
   ```
   apps/web/public/images/sarathi-worker.jpg
   ```

3. **Update the code:**

**LoginPage.tsx** (line 11):
```typescript
export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const backgroundImageUrl = '/images/sarathi-worker.jpg'; // Add this line

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
```

**LoginPage.tsx** (line 40):
```typescript
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.88), rgba(255,255,255,0.88)), url(${backgroundImageUrl})`,
      }}
    >
      <div className="card max-w-md w-full bg-white/95 backdrop-blur-sm shadow-2xl relative z-10">
```

**HomePage.tsx** (line 10):
```typescript
export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const backgroundImageUrl = '/images/sarathi-worker.jpg'; // Add this

  const { data, isLoading } = useQuery({
```

**HomePage.tsx** (line 35):
```typescript
  return (
    <Layout 
      title={t('app.name')} 
      backgroundImageUrl={backgroundImageUrl} 
      backgroundOverlayOpacity={0.88}
    >
```

4. **Refresh browser** - your image will appear!

---

### Option 2: Use External URL

If your image is hosted online (CDN, cloud storage, etc.):

```typescript
const backgroundImageUrl = 'https://your-cdn.com/images/worker.jpg';
```

Then follow step 3 above.

---

### Option 3: Use Base64 (Not Recommended)

If you must embed the image directly in code:

1. Convert image to base64
2. Use: `const backgroundImageUrl = 'data:image/jpeg;base64,...'`

⚠️ **Warning**: This makes your bundle very large and slow to load.

---

## 🎨 **Current Gradient Colors**

The gradient uses Sarathi brand colors:
- **Orange**: `from-orange-50` (light orange)
- **Blue**: `via-blue-50` (light blue)
- **Orange**: `to-orange-100` (lighter orange)

To change colors, edit:

**LoginPage.tsx** (line 41):
```typescript
className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-orange-50 via-blue-50 to-orange-100 relative overflow-hidden"
```

**Layout.tsx** (line 44):
```typescript
<div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-blue-50 to-orange-100 -z-10"></div>
```

---

## 📱 **Mobile Responsiveness**

Both gradient and image backgrounds are fully responsive:

✅ **Mobile** (< 640px):
- Full-height background
- Readable card overlay
- Pattern scales properly

✅ **Tablet** (640px - 1024px):
- Background covers entire viewport
- Cards remain centered

✅ **Desktop** (> 1024px):
- Background fills screen
- Maximum content width maintained

---

## 🎯 **Quick Commands**

### Check if image exists:
```bash
ls -la apps/web/public/images/sarathi-worker.jpg
```

### Test in browser:
```
http://localhost:5173/images/sarathi-worker.jpg
```

If the URL shows your image, the path is correct!

---

## 🐛 **Troubleshooting**

### Image still not showing after adding file?

1. **Hard refresh**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

2. **Check browser console** (F12) for errors

3. **Verify filename is exact**: `sarathi-worker.jpg` (case-sensitive)

4. **Try different image format**:
   - Save as `.jpg`, `.jpeg`, or `.png`
   - Update code to match: `/images/sarathi-worker.png`

5. **Check file size**:
   - Recommended: < 500KB
   - Optimize at: https://tinypng.com

---

## ✨ **Current Design Features**

- ✅ Brand-consistent gradient (orange + blue)
- ✅ Construction-themed pattern overlay
- ✅ Readable white cards with backdrop blur
- ✅ Smooth shadow and depth effects
- ✅ Fully mobile-responsive
- ✅ Fast loading (no image downloads)
- ✅ Professional appearance

---

## 📝 **Summary**

**Right now**: Beautiful gradient background working immediately ✅

**Optional**: Replace with worker photo by following Option 1 above

Both solutions look professional and work perfectly on all devices!

