# 🚨 URGENT: Deploy These Files to Fix Your App

## Critical Issues & Fixes

### ❌ Problems You're Experiencing:
1. **Dashboard shows 0 students** - facility-transactions.php missing
2. **Room editing not saving** - rooms.php using wrong API pattern
3. **Petty Cash print/PDF not working** - Already fixed in code, needs rebuild

### ✅ Solution: Upload 2 Files to Hostinger

---

## 📋 STEP-BY-STEP DEPLOYMENT

### Step 1: Login to Hostinger File Manager

1. Go to: **https://hpanel.hostinger.com**
2. Login with your credentials
3. Click **"Files"** → **"File Manager"**
4. Navigate to: **`public_html/api/`**

### Step 2: Upload facility-transactions.php (NEW FILE)

1. In File Manager, make sure you're in `public_html/api/` folder
2. Click **"Upload"** button at the top
3. Select this file from your computer:
   ```
   C:\Users\shoai\OneDrive\Desktop\hostel react\backend-api\facility-transactions.php
   ```
4. Wait for upload to complete ✅

### Step 3: Replace rooms.php (UPDATE EXISTING)

1. **Delete old rooms.php:**
   - Find `rooms.php` in the file list
   - Click checkbox next to it
   - Click **"Delete"** button
   - Confirm deletion

2. **Upload new rooms.php:**
   - Click **"Upload"** button
   - Select this file:
     ```
     C:\Users\shoai\OneDrive\Desktop\hostel react\backend-api\rooms.php
     ```
   - Wait for upload to complete ✅

### Step 4: Verify File Permissions

1. Right-click on **`facility-transactions.php`**
2. Select **"Permissions"**
3. Set to: **644** (rw-r--r--)
4. Click **"OK"**

5. Repeat for **`rooms.php`**

### Step 5: Test the Endpoints

Open these URLs in your browser to verify:

**Test 1: Facility Transactions**
```
https://apexapps.in/api/facility-transactions.php?action=list
```
✅ Expected: `{"success":true,"data":[...]}`

**Test 2: Rooms List**
```
https://apexapps.in/api/rooms.php?action=list
```
✅ Expected: `{"success":true,"data":[...]}`

---

## 🔄 REBUILD YOUR APPLICATION

After uploading the backend files, rebuild your desktop app:

### Windows PowerShell Commands:

```powershell
# Navigate to project folder
cd "C:\Users\shoai\OneDrive\Desktop\hostel react"

# Clean previous build
Remove-Item -Recurse -Force .\dist, .\dist-electron -ErrorAction SilentlyContinue

# Build new version
npm run build
npm run dist
```

### Installation:

1. After build completes, go to: `dist-electron/` folder
2. Find the newest `.exe` file (e.g., `Maulana Azad Hostel Management System Setup 2.2.0.exe`)
3. Run the installer
4. Launch the application

---

## ✅ VERIFICATION CHECKLIST

After deployment and rebuild, test these features:

### Dashboard Test:
- [ ] Shows correct number of students (not 0)
- [ ] Shows wing statistics (A, B, C, D counts)
- [ ] Shows admin billing totals (Income/Expense/Net)
- [ ] Monthly totals display correctly

### Room Management Test:
- [ ] Can view all rooms
- [ ] Click edit icon on any room
- [ ] Change capacity or status
- [ ] Click **Save**
- [ ] Should show: "Room updated successfully" ✅
- [ ] Changes should persist after refresh

### Petty Cash Test:
- [ ] Open Petty Cash Register
- [ ] Add some test entries
- [ ] Click **"Preview"** - should open new window with content
- [ ] Click **"Print"** - should open print dialog
- [ ] Click **"PDF"** - should download PDF file
- [ ] PDF should contain all header info and entries

---

## 🐛 TROUBLESHOOTING

### If Dashboard Still Shows 0:

**Check facility_transactions table exists:**
```sql
-- Run in phpMyAdmin
SHOW TABLES LIKE 'facility_transactions';
```

**Check table structure:**
```sql
DESCRIBE facility_transactions;
```

**Column names MUST be camelCase:**
- ✅ `txnType` (NOT txn_type)
- ✅ `partyName` (NOT party_name)
- ✅ `receiptNo` (NOT receipt_no)
- ✅ `billNo` (NOT bill_no)
- ✅ `paymentMethod` (NOT payment_method)
- ✅ `paymentRef` (NOT payment_ref)

**If columns are snake_case, run this SQL:**
```sql
ALTER TABLE facility_transactions 
  CHANGE COLUMN txn_type txnType ENUM('Income','Expense') DEFAULT 'Expense',
  CHANGE COLUMN party_name partyName VARCHAR(100),
  CHANGE COLUMN receipt_no receiptNo VARCHAR(50),
  CHANGE COLUMN bill_no billNo VARCHAR(50),
  CHANGE COLUMN payment_method paymentMethod ENUM('Cash','UPI','Card','Bank Transfer','Cheque') DEFAULT 'Cash',
  CHANGE COLUMN payment_ref paymentRef VARCHAR(100);
```

### If Room Editing Still Fails:

**Check error in browser console:**
1. Open app
2. Press `Ctrl+Shift+I` (Developer Tools)
3. Go to **Console** tab
4. Try editing a room
5. Look for error messages

**Common issues:**
- Red 404 error = file not uploaded
- "Database error" = column names mismatch
- "Room not found" = data doesn't exist

### If Petty Cash Preview/Print Shows Blank:

**Check Electron window.open settings:**
1. Verify `public/electron.cjs` has:
   ```javascript
   webPreferences: {
     webSecurity: false,
     // ...
   }
   ```

2. And has:
   ```javascript
   mainWindow.webContents.setWindowOpenHandler(({ url }) => {
     if (url.startsWith('about:') || url.startsWith('data:')) {
       return { action: 'allow' };
     }
     // ...
   });
   ```

**Rebuild after any electron.cjs changes!**

---

## 📞 QUICK REFERENCE

### File Locations on Hostinger:
- Backend API: `public_html/api/`
- Database: Access via phpMyAdmin

### Local Project Files:
- Backend files: `C:\Users\shoai\OneDrive\Desktop\hostel react\backend-api\`
- Frontend code: `C:\Users\shoai\OneDrive\Desktop\hostel react\src\`
- Build output: `C:\Users\shoai\OneDrive\Desktop\hostel react\dist-electron\`

### Test URLs:
- API Base: `https://apexapps.in/api/`
- Students: `https://apexapps.in/api/students.php?action=list`
- Rooms: `https://apexapps.in/api/rooms.php?action=list`
- Facility Txns: `https://apexapps.in/api/facility-transactions.php?action=list`

---

## 🎯 SUCCESS CRITERIA

✅ **All Fixed When:**
1. Dashboard loads with actual student counts
2. Wing statistics show real numbers
3. Admin billing totals appear
4. Room editing saves successfully
5. Petty Cash preview opens with content
6. Petty Cash print dialog works
7. Petty Cash PDF downloads successfully

---

## ⚡ PRIORITY ORDER

**Do these in order:**

1. **FIRST**: Upload `facility-transactions.php` to Hostinger ⭐⭐⭐
2. **SECOND**: Replace `rooms.php` on Hostinger ⭐⭐⭐
3. **THIRD**: Test both URLs in browser ⭐⭐
4. **FOURTH**: Rebuild app locally ⭐⭐
5. **FIFTH**: Install and test new build ⭐

**Estimated Time**: 15-20 minutes total

---

## 📝 NOTES

- **Don't modify database.sql** - schema is already correct with camelCase
- **Don't edit frontend code** - all fixes are backend-only
- **Keep backups** - Download existing files before replacing
- **Test after each upload** - Use the verification URLs

**Your backend API files are ready to deploy!** 🚀
