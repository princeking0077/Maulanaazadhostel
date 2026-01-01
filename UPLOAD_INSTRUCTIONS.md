# Hostel Management System - Complete Upload Instructions

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ Access to apexapps.in hPanel
- ✅ MySQL database created via hPanel
- ✅ Database credentials (name, username, password)
- ✅ FTP/File Manager access
- ✅ Built frontend files (run `npm run build`)

---

## 🗂️ Step 1: Prepare Files Locally

### 1.1 Build Frontend
```powershell
cd "c:\Users\shoai\OneDrive\Desktop\hostel react"
npm run build
```

This creates the `dist` folder with production files.

### 1.2 Verify Backend Files
Ensure the `backend-api` folder contains:
- ✅ config.php
- ✅ auth.php
- ✅ students.php
- ✅ payments.php
- ✅ receipt-register.php
- ✅ petty-cash.php
- ✅ admin-billing.php
- ✅ settings.php
- ✅ rooms.php
- ✅ database.sql
- ✅ .htaccess

---

## 🗄️ Step 2: Create MySQL Database

### 2.1 Access hPanel
1. Login to your Hostinger hPanel at https://hpanel.hostinger.com
2. Navigate to **Databases** → **MySQL Databases**

### 2.2 Create Database
1. Click **Create Database**
2. Database Name: `u123456_hostel_management` (use your actual prefix)
3. Click **Create**

### 2.3 Create Database User
1. Under **MySQL Users**, click **Create User**
2. Username: `u123456_hosteluser`
3. Password: Generate a strong password (save it!)
4. Click **Create User**

### 2.4 Add User to Database
1. Under **Add User to Database**
2. Select user: `u123456_hosteluser`
3. Select database: `u123456_hostel_management`
4. Grant **All Privileges**
5. Click **Add**

### 2.5 Import Database Schema
1. Click **phpMyAdmin** next to your database
2. Select your database from the left sidebar
3. Click **SQL** tab at the top
4. Open `backend-api/database.sql` from your local files
5. Copy the entire SQL content
6. Paste into the SQL query box
7. Click **Go** to execute
8. Verify tables are created (users, students, rooms, payments, etc.)

---

## 🔧 Step 3: Configure Backend

### 3.1 Update Database Credentials
1. Open `backend-api/config.php` locally
2. Update the following lines with YOUR database credentials:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'u123456_hostel_management');  // Your actual DB name
define('DB_USER', 'u123456_hosteluser');          // Your actual username
define('DB_PASS', 'your_strong_password_here');   // Your actual password
```

3. Save the file

---

## 📤 Step 4: Upload Files to Hostinger

### 4.1 Access File Manager
1. In hPanel, go to **Files** → **File Manager**
2. Navigate to `public_html` directory
3. Delete any existing files (like default index.html)

### 4.2 Upload Backend API Files
1. Create folder: `api` inside `public_html`
2. Upload all files from `backend-api` folder to `public_html/api/`:
   - config.php
   - auth.php
   - students.php
   - payments.php
   - receipt-register.php
   - petty-cash.php
   - admin-billing.php
   - settings.php
   - rooms.php
   - .htaccess

### 4.3 Upload Frontend Files
1. Upload ALL files from `dist` folder to `public_html/`:
   - index.html
   - assets/ folder
   - vite.svg
   - Any other generated files

### 4.4 Upload Root .htaccess
1. Copy the `.htaccess` file from `backend-api/.htaccess`
2. Upload it to `public_html/.htaccess` (root directory)

### Final Structure
```
public_html/
├── index.html              ← Frontend entry
├── .htaccess              ← URL rewriting for SPA
├── assets/                ← Frontend assets
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── api/                   ← Backend API
    ├── config.php
    ├── auth.php
    ├── students.php
    ├── payments.php
    ├── receipt-register.php
    ├── petty-cash.php
    ├── admin-billing.php
    ├── settings.php
    ├── rooms.php
    └── .htaccess
```

---

## ✅ Step 5: Test Backend API

### 5.1 Test Database Connection
Open in browser:
```
https://apexapps.in/api/config.php
```

You should see no output (good) or connection success message.

### 5.2 Test Authentication
Use a tool like Postman or browser console:

```javascript
fetch('https://apexapps.in/api/auth.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
})
.then(r => r.json())
.then(console.log);
```

Expected response:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "fullName": "System Administrator",
    "role": "Admin"
  },
  "token": "..."
}
```

### 5.3 Test Students API
```
https://apexapps.in/api/students.php
```

Should return empty array `[]` or list of students.

### 5.4 Test Settings API
```
https://apexapps.in/api/settings.php
```

Should return:
```json
{
  "receiptCounter": "1",
  "adminReceiptCounter": "1",
  "organizationName": "Maulana Azad Hostel",
  ...
}
```

---

## 🌐 Step 6: Test Frontend Application

### 6.1 Access Website
Open browser and go to:
```
https://apexapps.in
```

### 6.2 Test Login
- Username: `admin`
- Password: `admin123`
- Click **Login**

### 6.3 Verify Features
- ✅ Dashboard loads with statistics
- ✅ Navigate to Students page
- ✅ Navigate to Payments page
- ✅ Navigate to Receipt Register
- ✅ Navigate to Petty Cash
- ✅ Navigate to Admin Billing
- ✅ All pages load without errors

---

## 🐛 Troubleshooting

### Issue: "Database connection failed"
**Solution:**
1. Check `config.php` credentials are correct
2. Verify database user has privileges
3. Check phpMyAdmin if database exists
4. Ensure database tables are created

### Issue: "404 Not Found" on API calls
**Solution:**
1. Verify files are in `public_html/api/` folder
2. Check `.htaccess` is uploaded to `public_html/api/`
3. Verify mod_rewrite is enabled (contact Hostinger support)

### Issue: Blank page or white screen
**Solution:**
1. Open browser console (F12) and check for errors
2. Verify all files from `dist` folder are uploaded
3. Check if `index.html` exists in `public_html/`
4. Clear browser cache and reload

### Issue: CORS errors
**Solution:**
1. Verify `.htaccess` in `api` folder has CORS headers
2. Check browser console for specific CORS error
3. Ensure API URLs use same domain (https://apexapps.in/api/)

### Issue: "Class 'PDO' not found"
**Solution:**
1. Contact Hostinger support to enable PDO extension
2. Verify PHP version is 7.4 or higher

### Issue: File permissions error
**Solution:**
1. Set folder permissions to 755
2. Set file permissions to 644
3. Use File Manager → Right-click → Permissions

---

## 🔐 Security Recommendations

### Change Default Password
1. Login with `admin` / `admin123`
2. Navigate to Settings (if available)
3. Change admin password immediately

### Update Database Password
1. Use a strong, unique password for database
2. Never share database credentials

### Enable HTTPS
1. In hPanel, go to **Security** → **SSL/TLS**
2. Enable **Force HTTPS redirect**
3. Uncomment HTTPS redirect in `.htaccess`

---

## 📊 Performance Optimization

### Enable Caching
- Already configured in `.htaccess`
- Verify by checking browser network tab

### Enable Compression
- Already enabled via mod_deflate in `.htaccess`

### CDN (Optional)
- Consider Cloudflare for faster global access
- Free plan available

---

## 🎯 Post-Deployment Checklist

- [ ] Database created and schema imported
- [ ] All backend files uploaded to `/api/` folder
- [ ] All frontend files uploaded to root
- [ ] `config.php` updated with correct credentials
- [ ] Both `.htaccess` files uploaded (root + api)
- [ ] Login successful with admin credentials
- [ ] All pages accessible
- [ ] Student management working
- [ ] Payment processing working
- [ ] Receipt generation working (RCP-001, ADMIN-001)
- [ ] Default admin password changed
- [ ] HTTPS enabled
- [ ] Website accessible from external devices

---

## 🆘 Support

### Hostinger Support
- Live Chat: Available 24/7 in hPanel
- Email: support@hostinger.com
- Knowledge Base: https://support.hostinger.com

### Common Questions
1. **How to access phpMyAdmin?**
   - hPanel → Databases → phpMyAdmin button

2. **How to view error logs?**
   - hPanel → Files → File Manager → error_log file

3. **How to enable PHP extensions?**
   - Contact Hostinger support

---

## 🎉 Success!

If all tests pass, your Hostel Management System is now live at **https://apexapps.in**!

You can now:
- ✅ Manage students online
- ✅ Process payments
- ✅ Generate receipts
- ✅ Track petty cash
- ✅ Manage admin billing
- ✅ Access from anywhere

**Remember to:**
- Keep regular database backups (hPanel → Backups)
- Monitor error logs periodically
- Update admin credentials
- Share access URL with authorized users only

---

## 📞 Need Help?

If you encounter issues not covered here:
1. Check browser console for errors (F12)
2. Review API responses in Network tab
3. Check Hostinger error logs
4. Contact Hostinger support for server-related issues

**Deployment Guide Version:** 2.2.0  
**Last Updated:** January 2025
