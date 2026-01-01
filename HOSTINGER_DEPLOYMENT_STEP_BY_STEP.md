# Step-by-Step Deployment Guide for apexapps.in (Hostinger hPanel)

## 🎯 Overview
This guide will help you deploy the Maulana Azad Hostel Management System to **apexapps.in** using Hostinger hPanel.

---

## ⚠️ IMPORTANT: Choose Your Deployment Type

### Option A: Static Website (Quick but Limited)
- ✅ Deploy in 15 minutes
- ❌ Data won't persist properly (stored in browser only)
- ❌ No multi-user support
- ❌ Not recommended for production

### Option B: Full Web App with MySQL (Recommended)
- ✅ Proper data persistence
- ✅ Multi-user support
- ✅ Production-ready
- ⏰ Requires 2-3 hours setup

**I'll show you both options below.**

---

## 📋 OPTION A: Quick Static Deployment (NOT RECOMMENDED)

### Step 1: Build the Project
```powershell
# In your project folder
npm run build
```

### Step 2: Access Hostinger hPanel
1. Go to https://hpanel.hostinger.com
2. Log in with your Hostinger credentials
3. Select your website **apexapps.in**

### Step 3: Open File Manager
1. In hPanel dashboard, click **"File Manager"**
2. Navigate to **`public_html`** folder
3. **Delete all existing files** in public_html (if any)

### Step 4: Upload Files
1. In File Manager, click **"Upload Files"** button
2. Navigate to your project folder: `C:\Users\shoai\OneDrive\Desktop\hostel react\dist`
3. Select **ALL files** inside the `dist` folder:
   - `index.html`
   - `assets` folder
   - All `.css` and `.js` files
4. Click **"Upload"**
5. Wait for upload to complete

### Step 5: Verify Deployment
1. Open browser and go to: **https://apexapps.in**
2. You should see the login page
3. Login with:
   - Username: `admin`
   - Password: `admin123`

### ⚠️ Limitations of Static Deployment:
- Data stored in browser's IndexedDB (clears when cache is cleared)
- Each computer will have separate data
- No centralized database
- Not suitable for production use

---

## 📋 OPTION B: Full MySQL Deployment (RECOMMENDED)

This will give you a proper web application with persistent database storage.

---

## PHASE 1: Database Setup (30 minutes)

### Step 1: Create MySQL Database

1. **Login to Hostinger hPanel**
   - Go to https://hpanel.hostinger.com
   - Login with your credentials
   - Select **apexapps.in**

2. **Create Database**
   - In left sidebar, click **"Databases"** → **"MySQL Databases"**
   - Click **"Create New Database"**
   - Database Name: `hostel_management`
   - Click **"Create"**
   - **SAVE THESE CREDENTIALS:**
     ```
     Database Name: u123456_hostel_management (example)
     Database User: u123456_hosteluser
     Password: [your chosen password]
     Host: localhost
     ```

3. **Access phpMyAdmin**
   - In Databases section, click **"Manage"** next to your database
   - Click **"Enter phpMyAdmin"**
   - This opens phpMyAdmin interface

### Step 2: Import Database Schema

1. **In phpMyAdmin:**
   - Click on your database name in left sidebar
   - Click **"SQL"** tab at the top
   - Copy and paste this entire SQL script:

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
  annualFee DECIMAL(10,2) DEFAULT 50000,
  stayDuration VARCHAR(50),
  stayEndDate DATE,
  customAmount DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'Active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_enrollmentNo (enrollmentNo),
  INDEX idx_wing (wing)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Payments Table
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId INT NOT NULL,
  receiptNo VARCHAR(50) UNIQUE NOT NULL,
  date DATE NOT NULL,
  registrationFee DECIMAL(10,2) DEFAULT 0,
  rentFee DECIMAL(10,2) DEFAULT 0,
  waterFee DECIMAL(10,2) DEFAULT 0,
  electricityFee DECIMAL(10,2) DEFAULT 0,
  gymFee DECIMAL(10,2) DEFAULT 0,
  otherFee DECIMAL(10,2) DEFAULT 0,
  securityDeposit DECIMAL(10,2) DEFAULT 0,
  totalAmount DECIMAL(10,2) NOT NULL,
  balanceAmount DECIMAL(10,2) DEFAULT 0,
  pa- Insert Default Admin User
INSERT INTO users (username, password, role, name, email) VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'Administrator', 'admin@apexapps.in');
-- Default password: admin123

-- Insert Receipt Counters
INSERT INTO settings (keyName, value, description) VALUES 
('receiptCounter', '1', 'Sequential receipt number counter'),
('adminReceiptCounter', '1', 'Sequential admin receipt number counter')ymentStatus ENUM('Paid', 'Partial', 'Pending') DEFAULT 'Paid',
  utrNo VARCHAR(100),
  paymentMethod VARCHAR(50) DEFAULT 'Cash',
  cashier VARCHAR(100),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_receiptNo (receiptNo),
  INDEX idx_studentId (studentId),
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Receipt Register Table
CREATE TABLE receipt_register (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  receiptNo VARCHAR(50) NOT NULL,
  studentId INT NOT NULL,
  name VARCHAR(255),
  year VARCHAR(50),
  collegeName VARCHAR(255),
  faculty VARCHAR(100),
  rent DECIMAL(10,2) DEFAULT 0,
  electricity DECIMAL(10,2) DEFAULT 0,
  securityDeposit DECIMAL(10,2) DEFAULT 0,
  anyOther DECIMAL(10,2) DEFAULT 0,
  registrationFees DECIMAL(10,2) DEFAULT 0,
  totalAmount DECIMAL(10,2) NOT NULL,
  modeOfTransaction VARCHAR(50),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_receiptNo (receiptNo),
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Petty Cash Table
CREATE TABLE petty_cash (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  particulars TEXT,
  voucherNo VARCHAR(50),
  totalExpenses DECIMAL(10,2) DEFAULT 0,
  misc DECIMAL(10,2) DEFAULT 0,
  conveyance DECIMAL(10,2) DEFAULT 0,
  xerox DECIMAL(10,2) DEFAULT 0,
  housekeeping DECIMAL(10,2) DEFAULT 0,
  security DECIMAL(10,2) DEFAULT 0,
  repairs DECIMAL(10,2) DEFAULT 0,
  office DECIMAL(10,2) DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_date (date),
  INDEX idx_voucherNo (voucherNo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Facility Transactions Table
CREATE TABLE facility_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  facility VARCHAR(50),
  txnType VARCHAR(20),
  partyName VARCHAR(255),
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  receiptNo VARCHAR(50),
  billNo VARCHAR(50),
  paymentMethod VARCHAR(50),
  paymentRef VARCHAR(100),
  items JSON,
  subtotal DECIMAL(10,2),
  gstPercent DECIMAL(5,2),
  gstAmount DECIMAL(10,2),
  netAmount DECIMAL(10,2),
  paidAmount DECIMAL(10,2),
  balanceAmount DECIMAL(10,2),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_date (date),
  INDEX idx_facility (facility)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Settings Table
CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  keyName VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'Staff',
  name VARCHAR(255),
  email VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Rooms Table
CREATE TABLE rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  roomNumber VARCHAR(20) NOT NULL,
  wing ENUM('A', 'B', 'C', 'D') NOT NULL,
  capacity INT DEFAULT 1,
  currentOccupancy INT DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  UNIQUE KEY unique_room (wing, roomNumber)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Student Year Records Table
CREATE TABLE student_year_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId INT NOT NULL,
  academicYearStart INT NOT NULL,
  academicYearEnd INT NOT NULL,
  yearLabel VARCHAR(20),
  wing ENUM('A', 'B', 'C', 'D'),
  roomNo VARCHAR(20),
  annualFee DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'Active',
  remarks TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-;
```

2. Click **"Go"** button
3. Wait for success message

---

## PHASE 2: Backend API Setup (45 minutes)

### Step 1: Create Backend Folder Structure

1. **In hPanel File Manager:**
   - Navigate to `public_html`
   - Click **"New Folder"**
   - Name it: `api`

### Step 2: Create Database Connection File

1. **Create `api/config.php`:**
   - Click **"New File"**
   - Name: `config.php`
   - Right-click → Edit
   - Paste this code (UPDATE with your database credentials):

```php
<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database credentials - UPDATE THESE
define('DB_HOST', 'localhost');
define('DB_NAME', 'u123456_hostel_management'); // Your database name
define('DB_USER', 'u123456_hosteluser');        // Your database user
define('DB_PASS', 'your_password_here');        // Your database password

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

function sendJSON($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

function getRequestData() {
    return json_decode(file_get_contents('php://input'), true);
}
?>
```

### Step 3: Create Authentication API

**Create `api/auth.php`:**

```php
<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = getRequestData();
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        sendJSON(['error' => 'Username and password required'], 400);
    }
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    
    if ($user && password_verify($password, $user['password'])) {
        unset($user['password']);
        sendJSON([
            'success' => true,
            'user' => $user,
            'token' => base64_encode($username . ':' . time())
        ]);
    } else {
        sendJSON(['error' => 'Invalid credentials'], 401);
    }
}

sendJSON(['error' => 'Method not allowed'], 405);
?>
```

### Step 4: Create Students API

**Create `api/students.php`:**

```php
<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            // Get single student
            $stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
            $stmt->execute([$id]);
            $student = $stmt->fetch();
            sendJSON($student ?: ['error' => 'Student not found'], $student ? 200 : 404);
        } else {
            // Get all students
            $stmt = $pdo->query("SELECT * FROM students ORDER BY createdAt DESC");
            $students = $stmt->fetchAll();
            sendJSON($students);
        }
        break;
        
    case 'POST':
        $data = getRequestData();
        $stmt = $pdo->prepare("
            INSERT INTO students (name, mobile, email, enrollmentNo, faculty, collegeName, 
                yearOfCollege, address, residencyStatus, wing, roomNo, studentType, 
                joiningDate, annualFee, stayDuration, stayEndDate, customAmount, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['name'], $data['mobile'], $data['email'], $data['enrollmentNo'],
            $data['faculty'], $data['collegeName'], $data['yearOfCollege'], $data['address'],
            $data['residencyStatus'] ?? 'Permanent', $data['wing'], $data['roomNo'],
            $data['studentType'], $data['joiningDate'], $data['annualFee'] ?? 50000,
            $data['stayDuration'], $data['stayEndDate'], $data['customAmount'],
            $data['status'] ?? 'Active'
        ]);
        sendJSON(['success' => true, 'id' => $pdo->lastInsertId()], 201);
        break;
        
    case 'PUT':
        if (!$id) sendJSON(['error' => 'ID required'], 400);
        $data = getRequestData();
        $stmt = $pdo->prepare("
            UPDATE students SET name=?, mobile=?, email=?, enrollmentNo=?, faculty=?, 
                collegeName=?, yearOfCollege=?, address=?, residencyStatus=?, wing=?, 
                roomNo=?, studentType=?, joiningDate=?, annualFee=?, stayDuration=?, 
                stayEndDate=?, customAmount=?, status=?, updatedAt=NOW()
            WHERE id=?
        ");
        $stmt->execute([
            $data['name'], $data['mobile'], $data['email'], $data['enrollmentNo'],
            $data['faculty'], $data['collegeName'], $data['yearOfCollege'], $data['address'],
            $data['residencyStatus'], $data['wing'], $data['roomNo'], $data['studentType'],
            $data['joiningDate'], $data['annualFee'], $data['stayDuration'],
            $data['stayEndDate'], $data['customAmount'], $data['status'], $id
        ]);
        sendJSON(['success' => true]);
        break;
        
    case 'DELETE':
        if (!$id) sendJSON(['error' => 'ID required'], 400);
        $stmt = $pdo->prepare("DELETE FROM students WHERE id = ?");
        $stmt->execute([$id]);
        sendJSON(['success' => true]);
        break;
        
    default:
        sendJSON(['error' => 'Method not allowed'], 405);
}
?>
```

### Step 5: Create Payments API

**Create `api/payments.php`:**

```php
<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM payments WHERE id = ?");
            $stmt->execute([$id]);
            sendJSON($stmt->fetch() ?: ['error' => 'Not found'], 404);
        } else {
            $stmt = $pdo->query("SELECT * FROM payments ORDER BY createdAt DESC");
            sendJSON($stmt->fetchAll());
        }
        break;
        
    case 'POST':
        $data = getRequestData();
        
        // Get and increment receipt counter
        $stmt = $pdo->prepare("SELECT value FROM settings WHERE keyName = 'receiptCounter'");
        $stmt->execute();
        $counter = (int)($stmt->fetchColumn() ?: 1);
        $receiptNo = 'RCP-' . str_pad($counter, 3, '0', STR_PAD_LEFT);
        
        // Insert payment
        $stmt = $pdo->prepare("
            INSERT INTO payments (studentId, receiptNo, date, registrationFee, rentFee, 
                waterFee, electricityFee, gymFee, otherFee, securityDeposit, totalAmount, 
                balanceAmount, paymentStatus, utrNo, paymentMethod, cashier)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['studentId'], $receiptNo, $data['date'], $data['registrationFee'],
            $data['rentFee'], $data['waterFee'], $data['electricityFee'], $data['gymFee'],
            $data['otherFee'], $data['securityDeposit'], $data['totalAmount'],
            $data['balanceAmount'], $data['paymentStatus'], $data['utrNo'],
            $data['paymentMethod'], $data['cashier']
        ]);
        
        // Update counter
        $pdo->prepare("UPDATE settings SET value = ? WHERE keyName = 'receiptCounter'")
            ->execute([$counter + 1]);
        
        sendJSON(['success' => true, 'id' => $pdo->lastInsertId(), 'receiptNo' => $receiptNo], 201);
        break;
        
    case 'PUT':
        if (!$id) sendJSON(['error' => 'ID required'], 400);
        $data = getRequestData();
        $stmt = $pdo->prepare("
            UPDATE payments SET studentId=?, date=?, registrationFee=?, rentFee=?, 
                waterFee=?, electricityFee=?, gymFee=?, otherFee=?, securityDeposit=?, 
                totalAmount=?, balanceAmount=?, paymentStatus=?, utrNo=?, paymentMethod=?, cashier=?
            WHERE id=?
        ");
        $stmt->execute([
            $data['studentId'], $data['date'], $data['registrationFee'], $data['rentFee'],
            $data['waterFee'], $data['electricityFee'], $data['gymFee'], $data['otherFee'],
            $data['securityDeposit'], $data['totalAmount'], $data['balanceAmount'],
            $data['paymentStatus'], $data['utrNo'], $data['paymentMethod'], $data['cashier'], $id
        ]);
        sendJSON(['success' => true]);
        break;
        
    case 'DELETE':
        if (!$id) sendJSON(['error' => 'ID required'], 400);
        $stmt = $pdo->prepare("DELETE FROM payments WHERE id = ?");
        $stmt->execute([$id]);
        sendJSON(['success' => true]);
        break;
        
    default:
        sendJSON(['error' => 'Method not allowed'], 405);
}
?>
```

**Continue creating similar API files for:**
- `api/receipt-register.php`
- `api/petty-cash.php`
- `api/admin-billing.php`
- `api/settings.php`

---

## PHASE 3: Frontend Configuration (15 minutes)

### Step 1: Update Frontend Code

You need to modify the frontend to use API calls instead of IndexedDB.

**Create `src/services/api.ts`:**

```typescript
const API_BASE_URL = 'https://apexapps.in/api';

export const api = {
  // Students
  getStudents: async () => {
    const response = await fetch(`${API_BASE_URL}/students.php`);
    return response.json();
  },
  
  createStudent: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/students.php`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  },
  
  // Payments
  getPayments: async () => {
    const response = await fetch(`${API_BASE_URL}/payments.php`);
    return response.json();
  },
  
  createPayment: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/payments.php`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  },
  
  // Add more endpoints as needed
};
```

### Step 2: Build and Deploy

```powershell
# Build with API configuration
npm run build
```

### Step 3: Upload to Hostinger

1. Open File Manager in hPanel
2. Go to `public_html`
3. Delete old files (except `api` folder)
4. Upload all files from `dist` folder
5. Ensure `.htaccess` is configured:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api
RewriteRule ^ index.html [L]
```

---

## PHASE 4: Testing & Verification

### Step 1: Test Database Connection
1. Visit: `https://apexapps.in/api/students.php`
2. Should return JSON (empty array or error)

### Step 2: Test Login
1. Visit: `https://apexapps.in`
2. Login with:
   - Username: `admin`
   - Password: `admin123`

### Step 3: Test Features
- Create a student
- Create a payment
- Generate receipts
- Export PDFs

---

## 📞 Support & Next Steps

### If You Get Stuck:

1. **Check PHP Error Logs:**
   - hPanel → Error Logs
   - Look for PHP errors

2. **Database Issues:**
   - Verify credentials in `config.php`
   - Check phpMyAdmin for tables

3. **File Upload Issues:**
   - Check file permissions (755 for folders, 644 for files)
   - Ensure all files uploaded correctly

### Final Checklist:
- [ ] Database created and schema imported
- [ ] All API files created in `/api/` folder
- [ ] Database credentials updated in `config.php`
- [ ] Frontend built and uploaded
- [ ] `.htaccess` configured
- [ ] Login working
- [ ] All features tested

---

## 🚨 IMPORTANT NOTES

1. **Security:** Change default admin password immediately after first login
2. **Backup:** Regular database backups via hPanel
3. **SSL:** Ensure HTTPS is enabled on apexapps.in
4. **Performance:** Consider enabling caching in hPanel

Your hostel management system should now be live at **https://apexapps.in**!
