-- Maulana Azad Hostel Management System
-- MySQL Database Schema
-- Compatible with IndexedDB structure

-- Create database (run this separately in cPanel if needed)
-- CREATE DATABASE IF NOT EXISTS hostel_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE hostel_management;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Staff') NOT NULL DEFAULT 'Staff',
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password, role, name, email) 
VALUES ('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'System Administrator', 'admin@hostel.com')
ON DUPLICATE KEY UPDATE username=username;

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    enrollment_no VARCHAR(100) NOT NULL UNIQUE,
    faculty VARCHAR(255) NOT NULL,
    college_name VARCHAR(500) NOT NULL,
    year_of_college VARCHAR(10) NOT NULL,
    address TEXT NOT NULL,
    residency_status ENUM('Permanent', 'Temporary') NOT NULL DEFAULT 'Permanent',
    wing ENUM('A', 'B', 'C', 'D') NOT NULL,
    room_no VARCHAR(20) NOT NULL,
    student_type ENUM('Day Scholar', 'Hosteller', 'PhD', 'Non-Hosteller') NOT NULL,
    joining_date DATE NOT NULL,
    annual_fee DECIMAL(10, 2) NOT NULL,
    admission_status ENUM('Active', 'Cancelled') DEFAULT 'Active',
    security_deposit DECIMAL(10, 2) DEFAULT 0,
    is_old_student BOOLEAN DEFAULT FALSE,
    status ENUM('Active', 'Vacated', 'Inactive') DEFAULT 'Active',
    vacated_date DATE DEFAULT NULL,
    remarks TEXT,
    stay_duration VARCHAR(50) DEFAULT NULL,
    stay_end_date DATE DEFAULT NULL,
    custom_amount DECIMAL(10, 2) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_enrollment (enrollment_no),
    INDEX idx_wing (wing),
    INDEX idx_room (room_no),
    INDEX idx_status (status),
    INDEX idx_residency (residency_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    receipt_no VARCHAR(50) NOT NULL UNIQUE,
    date DATE NOT NULL,
    registration_fee DECIMAL(10, 2) DEFAULT 0,
    rent_fee DECIMAL(10, 2) DEFAULT 0,
    water_fee DECIMAL(10, 2) DEFAULT 0,
    gym_fee DECIMAL(10, 2) DEFAULT 0,
    other_fee DECIMAL(10, 2) DEFAULT 0,
    mess_veg_fee DECIMAL(10, 2) DEFAULT 0,
    mess_non_veg_fee DECIMAL(10, 2) DEFAULT 0,
    canteen_fee DECIMAL(10, 2) DEFAULT 0,
    xerox_fee DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    balance_amount DECIMAL(10, 2) DEFAULT 0,
    payment_status ENUM('Paid', 'Partial', 'Pending') NOT NULL DEFAULT 'Paid',
    utr_no VARCHAR(100) DEFAULT NULL,
    payment_method ENUM('Cash', 'Online', 'Cheque') NOT NULL DEFAULT 'Cash',
    cashier VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_receipt (receipt_no),
    INDEX idx_date (date),
    INDEX idx_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    wing ENUM('A', 'B', 'C', 'D') NOT NULL,
    capacity INT NOT NULL,
    current_occupancy INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_wing (wing),
    INDEX idx_room_number (room_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(100) NOT NULL UNIQUE,
    `value` TEXT NOT NULL,
    description VARCHAR(500) DEFAULT NULL,
    INDEX idx_key (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO settings (`key`, `value`, description) VALUES
('hostel_name', 'Maulana Azad Hostel Management', 'Name of the hostel'),
('default_registration_fee', '5000', 'Default registration fee'),
('default_rent_fee', '8000', 'Default monthly rent'),
('default_water_fee', '500', 'Default water charges'),
('default_gym_fee', '1000', 'Default gym fee'),
('currency_symbol', '₹', 'Currency symbol')
ON DUPLICATE KEY UPDATE `key`=`key`;

-- Student Year Records table (for academic year tracking)
CREATE TABLE IF NOT EXISTS student_year_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    academic_year_start INT NOT NULL,
    academic_year_end INT NOT NULL,
    year_label VARCHAR(20) NOT NULL,
    wing ENUM('A', 'B', 'C', 'D') NOT NULL,
    room_no VARCHAR(20) NOT NULL,
    annual_fee DECIMAL(10, 2) NOT NULL,
    status ENUM('Active', 'Vacated', 'Cancelled', 'Inactive') NOT NULL DEFAULT 'Active',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_year (academic_year_start),
    INDEX idx_year_label (year_label)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Facility Transactions table (Admin billing for Mess/Canteen/Xerox/Utilities/Workers)
CREATE TABLE IF NOT EXISTS facility_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    facility ENUM('Mess', 'Canteen', 'Xerox') NOT NULL,
    txn_type ENUM('Income', 'Expense') NOT NULL,
    date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    party_name VARCHAR(255) NOT NULL,
    description TEXT,
    receipt_no VARCHAR(50) DEFAULT NULL,
    bill_no VARCHAR(50) DEFAULT NULL,
    payment_method ENUM('Cash', 'Online', 'Cheque') DEFAULT 'Cash',
    payment_ref VARCHAR(100) DEFAULT NULL,
    items JSON DEFAULT NULL,
    subtotal DECIMAL(10, 2) DEFAULT 0,
    gst_percent DECIMAL(5, 2) DEFAULT 0,
    gst_amount DECIMAL(10, 2) DEFAULT 0,
    net_amount DECIMAL(10, 2) DEFAULT 0,
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    balance_amount DECIMAL(10, 2) DEFAULT 0,
    utility_type ENUM('Rent', 'Electricity', 'Water') DEFAULT NULL,
    period_from DATE DEFAULT NULL,
    period_to DATE DEFAULT NULL,
    meter_units INT DEFAULT NULL,
    worker_role VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_facility (facility),
    INDEX idx_txn_type (txn_type),
    INDEX idx_date (date),
    INDEX idx_receipt (receipt_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Petty Cash table
CREATE TABLE IF NOT EXISTS petty_cash (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    receipt_no VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('Cash', 'Online', 'Cheque') DEFAULT 'Cash',
    payment_ref VARCHAR(100) DEFAULT NULL,
    approved_by VARCHAR(255) DEFAULT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (date),
    INDEX idx_receipt (receipt_no),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Receipt Register table (auto-saved from receipt creation)
CREATE TABLE IF NOT EXISTS receipt_register (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    receipt_no VARCHAR(50) NOT NULL UNIQUE,
    student_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    year VARCHAR(20) NOT NULL,
    college_name VARCHAR(500) NOT NULL,
    faculty VARCHAR(255) NOT NULL,
    college_year VARCHAR(20) NOT NULL,
    rent DECIMAL(10, 2) DEFAULT 0,
    electricity DECIMAL(10, 2) DEFAULT 0,
    security_deposit DECIMAL(10, 2) DEFAULT 0,
    any_other DECIMAL(10, 2) DEFAULT 0,
    registration_fees DECIMAL(10, 2) DEFAULT 0,
    mode_of_transaction ENUM('Cash', 'Online', 'Cheque') NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
    INDEX idx_date (date),
    INDEX idx_receipt (receipt_no),
    INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

