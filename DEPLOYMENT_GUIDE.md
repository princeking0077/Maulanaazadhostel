# Deployment Guide - Hostinger MySQL Setup

## Database Credentials
- **Host:** 82.25.121.27
- **Database:** u631305858_Hostel
- **Username:** u631305858_Hostel
- **Password:** Sk@001001

## Steps to Deploy

### 1. Import Database Schema
1. Login to Hostinger cPanel
2. Go to **phpMyAdmin**
3. Select database `u631305858_Hostel`
4. Click **Import** tab
5. Upload `backend-php/database.sql`
6. Click **Go** to execute

### 2. Upload Backend Files
Upload the `backend-php/` folder to your Hostinger account:

**Via File Manager:**
1. Login to Hostinger → File Manager
2. Navigate to `public_html/`
3. Create new folder: `api`
4. Upload all files from `backend-php/` to `public_html/api/`

**Via FTP (FileZilla):**
```
Host: ftp.yourdomain.com
Username: your_ftp_username
Password: your_ftp_password
Port: 21

Upload: backend-php/* → /public_html/api/
```

### 3. Build React App for Production
```powershell
# Update .env.production with your domain
# Change: VITE_API_BASE_URL=https://yourdomain.com/api

npm run build
```

### 4. Upload React Build
Upload `dist/` folder contents to Hostinger:

**Via File Manager:**
1. Navigate to `public_html/`
2. Upload all files from `dist/` folder
3. Files should be in root: `public_html/index.html`, `public_html/assets/`, etc.

**Via FTP:**
```
Upload: dist/* → /public_html/
```

### 5. Set File Permissions (Important!)
In Hostinger File Manager or FTP:
- `public_html/api/*.php` → **644**
- `public_html/api/` folder → **755**

### 6. Test the API
Visit in browser:
```
https://yourdomain.com/api/students.php?action=list
```

Should return JSON response (empty array initially).

### 7. Update .env.production Before Build
Edit `.env.production`:
```env
VITE_STORAGE_MODE=api
VITE_API_BASE_URL=https://yourdomain.com/api
VITE_APP_MODE=production
```

Replace `yourdomain.com` with your actual Hostinger domain.

## Development vs Production

### Development (Offline - IndexedDB)
```powershell
npm run dev
```
Uses `.env.development` → IndexedDB local storage

### Production (Online - MySQL API)
```powershell
npm run build
```
Uses `.env.production` → Hostinger MySQL via API

## Folder Structure on Hostinger
```
public_html/
├── index.html          (React app entry)
├── assets/             (React app assets)
│   ├── index-*.js
│   └── *.css
└── api/                (PHP backend)
    ├── auth.php
    ├── config.php
    ├── students.php
    ├── payments.php
    ├── rooms.php
    ├── settings.php
    ├── facility-transactions.php
    └── year-records.php
```

## Troubleshooting

### CORS Errors
If you see CORS errors, ensure `backend-php/config.php` has:
```php
header('Access-Control-Allow-Origin: *');
```

### Database Connection Failed
- Verify credentials in `backend-php/config.php`
- Check if MySQL remote access is enabled in Hostinger
- Confirm database exists in phpMyAdmin

### 404 on API Calls
- Ensure files uploaded to `public_html/api/`
- Check file permissions (644 for .php)
- Verify .htaccess allows PHP execution

### Empty Data After Deploy
- Import `database.sql` via phpMyAdmin
- Check default admin user created
- Test API endpoints directly in browser

## Default Login
After deployment:
- **Username:** admin
- **Password:** admin123

## Security Notes
1. Change JWT_SECRET in `config.php` after deployment
2. Use HTTPS (SSL) - Hostinger provides free SSL
3. Change default admin password after first login
4. Restrict CORS to your domain only in production

## Support
For Hostinger-specific issues:
- Hostinger Knowledge Base: https://support.hostinger.com
- Check PHP version: Ensure PHP 7.4+ is enabled in cPanel
