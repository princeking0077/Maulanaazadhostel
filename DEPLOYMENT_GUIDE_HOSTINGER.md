# Hostinger Deployment Guide - Maulana Azad Hostel Management System

## ✅ Windows Desktop Application - READY TO USE

**Installer Location:** `dist-electron\Maulana Azad Hostel Management System Setup 2.2.0.exe`

### Features Included:
- ✅ Sequential receipt numbering (Payment: RCP-001, Admin: ADMIN-001)
- ✅ Beautiful Petty Cash PDF export template
- ✅ Receipt Register with print preview & PDF export
- ✅ Dual-copy payment receipts (Student + Hostel Copy)
- ✅ Wing-based default fees (A Wing: ₹14,000 rent, B/C/D: ₹11,000 rent)
- ✅ 10-month stay duration for permanent students
- ✅ Total annual fees on Dashboard
- ✅ Admin billing auto-receipt generation
- ✅ Offline-first with IndexedDB storage

---

## 🌐 Web Deployment Options for Hostinger

### ⚠️ IMPORTANT LIMITATIONS

This application is currently designed as a **Desktop Application (Electron)** and uses **IndexedDB** for offline storage. To deploy on Hostinger hPanel, you need to convert it to a web application with backend storage.

### Current Architecture:
- **Frontend:** React + TypeScript + Material-UI
- **Storage:** IndexedDB (Browser-based, local only)
- **Desktop:** Electron wrapper

### Required Changes for Web Deployment:

---

## Option 1: Simple Static Website (Limited Functionality)

**What Works:**
- UI will display properly
- All components will render
- Forms will work

**What Won'T Work:**
- Data will NOT persist across sessions
- Each user will have separate local data (no centralized database)
- No multi-user support
- Data stored in browser only (clears when cache is cleared)

### Steps to Deploy Static Version:

1. **Build for Web:**
   ```powershell
   npm run build
   ```

2. **Upload to Hostinger:**
   - Log in to Hostinger hPanel
   - Go to "File Manager"
   - Navigate to `public_html` folder
   - Upload all files from `dist` folder
   - Set up index.html as the entry point

3. **Access:**
   - Your site will be available at: `https://yourdomain.com`

**⚠️ NOT RECOMMENDED** - Data won't persist properly without backend

---

## Option 2: Full Web Application with MySQL Backend (RECOMMENDED)

### Prerequisites:
1. MySQL database (available in Hostinger hPanel)
2. PHP or Node.js backend support
3. Domain with SSL certificate

### Required Development Work:

#### Step 1: Database Setup
Create MySQL database structure:

```sql
-- Students Table
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(20),
  email VARCHAR(255),
  enrollmentNo VARCHAR(50) UNIQUE,
  faculty VARCHAR(100),
  collegeName VARCHAR(255),
  yearOfCollege VARCHAR(50),
  address TEXT,
  residencyStatus ENUM('Permanent', 'Temporary') DEFAULT 'Permanent',
  wing ENUM('A', 'B', 'C', 'D'),
  roomNo VARCHAR(20),
  studentType VARCHAR(50),
  joiningDate DATE,
  annualFee DECIMAL(10,2),
  stayDuration VARCHAR(50),
  stayEndDate DATE,
  customAmount DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'Active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId INT,
  receiptNo VARCHAR(50) UNIQUE,
  date DATE,
  registrationFee DECIMAL(10,2),
  rentFee DECIMAL(10,2),
  waterFee DECIMAL(10,2),
  electricityFee DECIMAL(10,2),
  totalAmount DECIMAL(10,2),
  balanceAmount DECIMAL(10,2),
  paymentStatus ENUM('Paid', 'Partial', 'Pending'),
  paymentMethod VARCHAR(50),
  cashier VARCHAR(100),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES students(id)
);

-- Receipt Register Table
CREATE TABLE receipt_register (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE,
  receiptNo VARCHAR(50),
  studentId INT,
  name VARCHAR(255),
  year VARCHAR(50),
  collegeName VARCHAR(255),
  faculty VARCHAR(100),
  rent DECIMAL(10,2),
  electricity DECIMAL(10,2),
  securityDeposit DECIMAL(10,2),
  anyOther DECIMAL(10,2),
  registrationFees DECIMAL(10,2),
  totalAmount DECIMAL(10,2),
  modeOfTransaction VARCHAR(50),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Petty Cash Table
CREATE TABLE petty_cash (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE,
  particulars TEXT,
  voucherNo VARCHAR(50),
  totalExpenses DECIMAL(10,2),
  misc DECIMAL(10,2),
  conveyance DECIMAL(10,2),
  xerox DECIMAL(10,2),
  housekeeping DECIMAL(10,2),
  security DECIMAL(10,2),
  repairs DECIMAL(10,2),
  office DECIMAL(10,2),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Facility Transactions Table (Admin Billing)
CREATE TABLE facility_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE,
  facility VARCHAR(50),
  txnType VARCHAR(20),
  partyName VARCHAR(255),
  description TEXT,
  amount DECIMAL(10,2),
  receiptNo VARCHAR(50),
  billNo VARCHAR(50),
  paymentMethod VARCHAR(50),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings Table
CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  keyName VARCHAR(100) UNIQUE,
  value TEXT,
  description TEXT
);

-- Users Table (Authentication)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  role VARCHAR(50),
  name VARCHAR(255),
  email VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Step 2: Backend API Development

You need to create REST API endpoints (PHP or Node.js):

**Example PHP Structure** (create in `backend-php` folder):

```
backend-php/
├── config.php          (Database connection)
├── auth.php           (Login/Logout)
├── students.php       (CRUD operations)
├── payments.php       (Payment operations)
├── receipt-register.php
├── petty-cash.php
├── admin-billing.php
└── settings.php
```

**Example Node.js/Express Structure:**

```
backend/
├── server.js
├── config/
│   └── database.js
├── routes/
│   ├── auth.js
│   ├── students.js
│   ├── payments.js
│   └── ...
└── models/
    ├── Student.js
    ├── Payment.js
    └── ...
```

#### Step 3: Frontend Modifications

Replace IndexedDB calls with API calls:

**Example Change:**
```typescript
// OLD (IndexedDB):
const students = await db.students.toArray();

// NEW (API):
const response = await fetch('/api/students');
const students = await response.json();
```

#### Step 4: Hostinger Deployment

1. **In hPanel:**
   - Create MySQL database
   - Note database credentials
   - Upload backend files
   - Upload frontend build files

2. **Configure Database:**
   - Go to phpMyAdmin
   - Import SQL schema
   - Create default admin user

3. **Set Environment Variables:**
   ```env
   DB_HOST=localhost
   DB_NAME=your_database_name
   DB_USER=your_username
   DB_PASSWORD=your_password
   ```

4. **Upload Files:**
   - Frontend: `public_html/`
   - Backend: `public_html/api/`

5. **Configure .htaccess:**
   ```apache
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^api/(.*)$ api/$1 [L]
   RewriteRule ^ index.html [L]
   ```

---

## Option 3: Hybrid Approach (Desktop + Cloud Sync)

Keep the desktop app but add cloud backup:

1. **Use Desktop App** (current installer)
2. **Add Export/Import** features
3. **Manual sync** to cloud storage or database
4. **Schedule backups** to Hostinger server

This requires minimal changes and keeps offline functionality.

---

## 📋 Summary & Recommendations

### For Windows Desktop Only:
✅ **USE THE INSTALLER** - Already built and ready
- Location: `dist-electron\Maulana Azad Hostel Management System Setup 2.2.0.exe`
- Install on Windows computers
- Data stored locally
- Works offline

### For Web Deployment:
⚠️ **Requires significant development work:**
1. Create MySQL database
2. Build REST API backend (PHP/Node.js)
3. Replace IndexedDB with API calls
4. Add authentication
5. Handle file uploads (PDFs, logos)
6. Deploy to Hostinger

**Estimated Development Time:** 40-60 hours for full conversion

---

## 🚀 Quick Start (Desktop App)

1. **Run the installer:**
   ```
   dist-electron\Maulana Azad Hostel Management System Setup 2.2.0.exe
   ```

2. **Default Login:**
   - Username: `admin`
   - Password: `admin123`

3. **Features Ready to Use:**
   - Dashboard
   - Student Management
   - Payment Processing (with wing-based defaults)
   - Receipt Register (with print preview)
   - Petty Cash Register (beautiful PDF export)
   - Admin Billing (auto-receipt generation)

---

## 📞 Need Web Version?

If you need the web version for Hostinger, I can help with:
1. Database schema creation
2. API endpoint development
3. Frontend API integration
4. Deployment configuration

Let me know if you want to proceed with web deployment!
