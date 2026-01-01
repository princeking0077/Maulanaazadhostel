# Backend API Fixes - Deployment Guide

## Critical Issues Fixed

### 1. **Missing facility-transactions.php** ❌ → ✅
   - **Problem**: `facility-transactions.php` was missing from `backend-api/` folder causing 404 errors
   - **Impact**: Dashboard showing 0 students, admin billing totals not working
   - **Fix**: Created new `facility-transactions.php` with action-based routing

### 2. **rooms.php API Mismatch** ❌ → ✅
   - **Problem**: Backend used REST methods (GET/POST/PUT/DELETE) but frontend expected action-based routing (`?action=update`, `?action=list`)
   - **Impact**: Room editing failed with "Error saving room: r"
   - **Fix**: Converted `rooms.php` to action-based pattern matching other endpoints

## Files to Upload

Upload these 2 files to your Hostinger server at `public_html/api/`:

### File 1: `facility-transactions.php` (NEW FILE)
**Location**: `backend-api/facility-transactions.php`

**Features**:
- Action-based routing: `?action=list`, `?action=by-facility`, `?action=create`
- Supports all admin billing data (Income/Expense transactions)
- Uses camelCase column names matching database schema
- Handles items as JSON array
- Auto-generates timestamps

### File 2: `rooms.php` (UPDATED FILE)
**Location**: `backend-api/rooms.php`

**Changes**:
- Converted from REST methods to action-based routing
- Actions: `list`, `by-wing`, `update`, `bulk-create`, `delete`
- Fixed response format to include `{success: true, data: [...]}`
- Improved error handling with transaction rollback for bulk operations

## Deployment Steps

### Option A: Using Hostinger File Manager (Recommended)

1. **Login to Hostinger**
   - Go to: https://hpanel.hostinger.com
   - Navigate to your hosting account

2. **Open File Manager**
   - Click "Files" → "File Manager"
   - Navigate to: `public_html/api/`

3. **Upload facility-transactions.php**
   - Click "Upload" button
   - Select: `C:\Users\shoai\OneDrive\Desktop\hostel react\backend-api\facility-transactions.php`
   - Wait for upload to complete

4. **Replace rooms.php**
   - Find existing `rooms.php` in the file list
   - Click the checkbox next to it → Click "Delete"
   - Click "Upload" button
   - Select: `C:\Users\shoai\OneDrive\Desktop\hostel react\backend-api\rooms.php`
   - Wait for upload to complete

5. **Verify File Permissions**
   - Right-click `facility-transactions.php` → Permissions → Set to `644`
   - Right-click `rooms.php` → Permissions → Set to `644`

### Option B: Using FTP Client (FileZilla)

1. **Connect via FTP**
   ```
   Host: ftp.apexapps.in
   Username: [your-hostinger-username]
   Password: [your-hostinger-password]
   Port: 21
   ```

2. **Navigate to API Folder**
   - Remote path: `/public_html/api/`

3. **Upload Files**
   - Upload: `backend-api/facility-transactions.php` → `public_html/api/facility-transactions.php`
   - Upload: `backend-api/rooms.php` → `public_html/api/rooms.php` (overwrite existing)

4. **Set Permissions**
   - Right-click each file → File permissions → Set to `644`

## Verification Steps

After uploading, test these endpoints in your browser:

### Test 1: Facility Transactions List
```
https://apexapps.in/api/facility-transactions.php?action=list
```
**Expected**: JSON response with `{success: true, data: [...]}`

### Test 2: Rooms List
```
https://apexapps.in/api/rooms.php?action=list
```
**Expected**: JSON response with `{success: true, data: [...]}`

### Test 3: Rooms by Wing
```
https://apexapps.in/api/rooms.php?action=by-wing&wing=A
```
**Expected**: JSON response with Wing A rooms

## Testing in Application

1. **Rebuild Application** (if needed)
   ```powershell
   npm run build
   npm run dist
   ```

2. **Launch Application**
   - Run the latest `.exe` installer from `dist-electron/` folder
   - Login with: `admin` / `admin123`

3. **Test Dashboard**
   - Dashboard should now show correct student counts
   - Admin billing totals should display (Income/Expense/Net)
   - Wing statistics should load

4. **Test Room Management**
   - Go to "Rooms" section
   - Try editing a room (click edit icon)
   - Change capacity or other fields
   - Click Save
   - **Expected**: "Room updated successfully" message

5. **Test Admin Billing**
   - Go to "Administration" → "Billing"
   - Add a new transaction
   - Check if it appears in dashboard totals

## Database Schema Verification

The database `facility_transactions` table should have these columns (camelCase):

```sql
CREATE TABLE IF NOT EXISTS `facility_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `facility` enum('Mess','Canteen','Xerox','Other') DEFAULT 'Mess',
  `txnType` enum('Income','Expense') DEFAULT 'Expense',
  `partyName` varchar(100) NOT NULL,
  `description` text,
  `amount` decimal(10,2) NOT NULL,
  `receiptNo` varchar(50) DEFAULT NULL,
  `billNo` varchar(50) DEFAULT NULL,
  `paymentMethod` enum('Cash','UPI','Card','Bank Transfer','Cheque') DEFAULT 'Cash',
  `paymentRef` varchar(100) DEFAULT NULL,
  `items` text,
  `subtotal` decimal(10,2) DEFAULT 0.00,
  `gstPercent` decimal(5,2) DEFAULT 0.00,
  `gstAmount` decimal(10,2) DEFAULT 0.00,
  `netAmount` decimal(10,2) DEFAULT 0.00,
  `paidAmount` decimal(10,2) DEFAULT 0.00,
  `balanceAmount` decimal(10,2) DEFAULT 0.00,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

If your database uses snake_case (txn_type, party_name), you'll need to either:
- **Option A**: Rename columns to camelCase (recommended)
- **Option B**: Update the PHP files to map camelCase → snake_case in queries

## Troubleshooting

### Issue: Still Getting 404 Errors
- **Check file location**: Files must be in `public_html/api/` not `public_html/backend-api/`
- **Check file names**: Must be exactly `facility-transactions.php` (with hyphen) and `rooms.php`
- **Check permissions**: Both files should be `644` (rw-r--r--)

### Issue: "Database error" in Response
- **Verify database columns match camelCase** (txnType not txn_type)
- **Check config.php** has correct database credentials
- **Test database connection** using test-api.php

### Issue: Empty Data Arrays
- **Run SQL import**: Import `database.sql` if tables are missing
- **Check table names**: Should be `facility_transactions`, `rooms`, etc.
- **Verify data exists**: Use phpMyAdmin to check if tables have data

### Issue: "Invalid action" Error
- **Check URL format**: Must include `?action=list` (or other valid action)
- **Valid actions for facility-transactions**: `list`, `by-facility`, `create`
- **Valid actions for rooms**: `list`, `by-wing`, `update`, `bulk-create`, `delete`

## Next Steps

After successful deployment:

1. ✅ Dashboard will auto-fetch and display data
2. ✅ Room editing will save correctly
3. ✅ Admin billing totals will appear on dashboard
4. ⏳ Test Petty Cash print/preview/PDF (still needs verification)

## Petty Cash Status

The Petty Cash print/preview/PDF feature has been refactored to mirror the working ReceiptRegister implementation:
- Changed from HTML string generation to DOM ref capture
- Uses `printRef` and `previewRef` for actual DOM nodes
- `exportToPDF`, `handlePrint`, `handlePreview` now capture live DOM content

**Testing required** after backend deployment to confirm if Petty Cash issues are resolved.

---

## Summary

**Critical Fixes**:
- ✅ Created missing `facility-transactions.php` endpoint
- ✅ Fixed `rooms.php` to use action-based routing
- ✅ Ensured camelCase column names match database schema
- ✅ Fixed response formats to include `{success: true, data: [...]}`

**Upload these 2 files to Hostinger `public_html/api/` folder and test!**
