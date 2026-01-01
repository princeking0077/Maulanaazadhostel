# Quick Start - MySQL Integration

## What's Been Set Up

✅ **Backend configured** with your Hostinger MySQL credentials  
✅ **Dual-mode support**: IndexedDB (offline) + MySQL API (online)  
✅ **API service layer** ready for all database operations  
✅ **Environment configs** for development and production

## Your Database Details
- Host: `82.25.121.27`
- Database: `u631305858_Hostel`
- Username: `u631305858_Hostel`
- Password: `Sk@001001`

## Next Steps

### 1. Upload Backend to Hostinger (5 minutes)

**Option A: File Manager (Easiest)**
1. Login to Hostinger → **File Manager**
2. Navigate to `public_html/`
3. Create folder: `api`
4. Upload **all files** from `backend-php/` to `public_html/api/`

**Option B: FTP (FileZilla)**
```
Host: ftp.yourdomain.com
Upload: backend-php/* → /public_html/api/
```

### 2. Import Database (2 minutes)

1. Hostinger cPanel → **phpMyAdmin**
2. Select database: `u631305858_Hostel`
3. Click **Import** tab
4. Choose file: `backend-php/database.sql`
5. Click **Go**

### 3. Test API (1 minute)

Open in browser:
```
https://yourdomain.com/api/students.php?action=list
```

Should see: `{"success":true,"data":[]}`

### 4. Build for Production

Update `.env.production` with your domain:
```env
VITE_API_BASE_URL=https://yourdomain.com/api
```

Then build:
```powershell
npm run build
```

### 5. Upload React App

Upload `dist/` folder contents:
- `dist/*` → `public_html/` (root)

## Two Modes Explained

### Development Mode (Current - Offline)
```powershell
npm run dev
```
- Uses IndexedDB (local browser storage)
- Works offline, no internet needed
- Perfect for testing

### Production Mode (Online)
```powershell
npm run build
# Upload dist/ to Hostinger
```
- Uses MySQL database via API
- Data synced to server
- Multi-user capable

## File Checklist

✅ `backend-php/config.php` - Database credentials configured  
✅ `backend-php/database.sql` - Ready to import  
✅ `src/services/api.ts` - API wrapper created  
✅ `src/services/storage.ts` - Hybrid storage layer  
✅ `.env.development` - Development config (IndexedDB)  
✅ `.env.production` - Production config (MySQL API)

## Troubleshooting

**Can't connect to database:**
- Check if Remote MySQL is enabled in Hostinger
- Verify IP whitelist (may need to add 0.0.0.0/0)
- Confirm database credentials in phpMyAdmin

**CORS errors:**
- Already configured in `config.php`
- If issues persist, update domain in `config.php`

**Empty data after deploy:**
- Import `database.sql` via phpMyAdmin
- Check browser console for API errors

## Default Login
- Username: `admin`
- Password: `admin123`

## Support Files Created
- `DEPLOYMENT_GUIDE.md` - Full deployment steps
- `backend-php/config.php` - Configured with your credentials
- `.env.production` - Ready to edit with your domain

---

**Need help?** Check `DEPLOYMENT_GUIDE.md` for detailed instructions.
