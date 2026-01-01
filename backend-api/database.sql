-- ============================================================
-- Hostel Management System Database Schema
-- MySQL Database for Web Deployment
-- Version: 2.2.0
-- ============================================================

-- ============================================================
-- Table: users
-- ============================================================

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fullName` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `role` enum('Admin','Clerk','Manager') DEFAULT 'Clerk',
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: students
-- ============================================================

CREATE TABLE IF NOT EXISTS `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `enrollmentNo` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `faculty` varchar(100) DEFAULT NULL,
  `college` varchar(100) DEFAULT NULL,
  `year` varchar(20) DEFAULT NULL,
  `course` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `guardianPhone` varchar(20) DEFAULT NULL,
  `address` text,
  `wing` enum('A','B','C','D') DEFAULT NULL,
  `roomNo` varchar(20) DEFAULT NULL,
  `admissionDate` date DEFAULT NULL,
  `admissionType` enum('Permanent','Temporary','Left') DEFAULT 'Permanent',
  `stayDuration` int(11) DEFAULT 10,
  `expectedEndDate` date DEFAULT NULL,
  `annualFees` decimal(10,2) DEFAULT 0.00,
  `status` enum('Active','Inactive','Left') DEFAULT 'Active',
  `bloodGroup` varchar(10) DEFAULT NULL,
  `aadharNo` varchar(20) DEFAULT NULL,
  `photoUrl` text,
  `remarks` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `enrollmentNo` (`enrollmentNo`),
  KEY `idx_enrollment` (`enrollmentNo`),
  KEY `idx_wing` (`wing`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: rooms
-- ============================================================

CREATE TABLE IF NOT EXISTS `rooms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `roomNumber` varchar(20) NOT NULL,
  `wing` enum('A','B','C','D') NOT NULL,
  `floor` int(11) DEFAULT 0,
  `capacity` int(11) NOT NULL DEFAULT 2,
  `currentOccupancy` int(11) DEFAULT 0,
  `roomType` varchar(50) DEFAULT 'Standard',
  `features` text,
  `status` enum('Available','Full','Maintenance','Unavailable') DEFAULT 'Available',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_room_wing` (`roomNumber`,`wing`),
  KEY `idx_wing` (`wing`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: payments
-- ============================================================

CREATE TABLE IF NOT EXISTS `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `studentId` int(11) NOT NULL,
  `receiptNo` varchar(50) NOT NULL,
  `date` date NOT NULL,
  `registrationFees` decimal(10,2) DEFAULT 0.00,
  `roomRent` decimal(10,2) DEFAULT 0.00,
  `waterElectricity` decimal(10,2) DEFAULT 0.00,
  `securityDeposit` decimal(10,2) DEFAULT 0.00,
  `otherCharges` decimal(10,2) DEFAULT 0.00,
  `totalAmount` decimal(10,2) NOT NULL,
  `paymentMethod` enum('Cash','UPI','Card','Bank Transfer','Cheque') DEFAULT 'Cash',
  `transactionRef` varchar(100) DEFAULT NULL,
  `paymentMonth` varchar(20) DEFAULT NULL,
  `paymentYear` varchar(10) DEFAULT NULL,
  `remarks` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `receiptNo` (`receiptNo`),
  KEY `fk_student_payment` (`studentId`),
  KEY `idx_receipt` (`receiptNo`),
  KEY `idx_date` (`date`),
  CONSTRAINT `fk_student_payment` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: receipt_register
-- ============================================================

CREATE TABLE IF NOT EXISTS `receipt_register` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `receiptNo` varchar(50) NOT NULL,
  `studentId` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `year` varchar(20) DEFAULT NULL,
  `college` varchar(100) DEFAULT NULL,
  `faculty` varchar(100) DEFAULT NULL,
  `roomRent` decimal(10,2) DEFAULT 0.00,
  `waterElectricity` decimal(10,2) DEFAULT 0.00,
  `securityDeposit` decimal(10,2) DEFAULT 0.00,
  `otherCharges` decimal(10,2) DEFAULT 0.00,
  `registrationFees` decimal(10,2) DEFAULT 0.00,
  `totalAmount` decimal(10,2) NOT NULL,
  `paymentMethod` enum('Cash','UPI','Card','Bank Transfer','Cheque') DEFAULT 'Cash',
  `remarks` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `receiptNo` (`receiptNo`),
  KEY `fk_student_receipt` (`studentId`),
  KEY `idx_date` (`date`),
  CONSTRAINT `fk_student_receipt` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: facility_transactions
-- ============================================================

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
  PRIMARY KEY (`id`),
  KEY `idx_date` (`date`),
  KEY `idx_facility` (`facility`),
  KEY `idx_receiptNo` (`receiptNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: petty_cash
-- ============================================================

CREATE TABLE IF NOT EXISTS `petty_cash` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `particulars` text NOT NULL,
  `voucherNo` varchar(50) DEFAULT NULL,
  `totalExpenses` decimal(10,2) DEFAULT 0.00,
  `misc` decimal(10,2) DEFAULT 0.00,
  `conveyance` decimal(10,2) DEFAULT 0.00,
  `xerox` decimal(10,2) DEFAULT 0.00,
  `housekeeping` decimal(10,2) DEFAULT 0.00,
  `security` decimal(10,2) DEFAULT 0.00,
  `repairs` decimal(10,2) DEFAULT 0.00,
  `office` decimal(10,2) DEFAULT 0.00,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: settings
-- ============================================================

CREATE TABLE IF NOT EXISTS `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `keyName` varchar(100) NOT NULL,
  `value` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `keyName` (`keyName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: student_year_records
-- ============================================================

CREATE TABLE IF NOT EXISTS `student_year_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `studentId` int(11) NOT NULL,
  `academicYear` varchar(20) NOT NULL,
  `year` varchar(20) NOT NULL,
  `totalFees` decimal(10,2) DEFAULT 0.00,
  `paidFees` decimal(10,2) DEFAULT 0.00,
  `pendingFees` decimal(10,2) DEFAULT 0.00,
  `remarks` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_student_year` (`studentId`),
  KEY `idx_academic_year` (`academicYear`),
  CONSTRAINT `fk_student_year` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Default Data
-- ============================================================

-- ============================================================
-- Default Data Inserts
-- ============================================================

-- Default admin user (password: admin123)
INSERT INTO `users` (`id`, `username`, `password`, `fullName`, `email`, `role`, `isActive`) VALUES
(1, 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin@hostel.com', 'Admin', 1);

-- Default receipt counters and organization settings
INSERT INTO `settings` (`keyName`, `value`) VALUES
('receiptCounter', '1'),
('adminReceiptCounter', '1'),
('organizationName', 'Maulana Azad Hostel'),
('organizationAddress', 'Mahabir Nagar Colony, Kankarbagh, Patna'),
('organizationPhone', '+91 9123456789'),
('organizationEmail', 'info@maulanaazadhostel.com');

-- ============================================================
-- Refactor Additions: Fee & Installment System (v2.3.0 draft)
-- ============================================================

-- Students table alterations for academic & category handling
ALTER TABLE `students`
  ADD COLUMN `academicYear` varchar(20) DEFAULT NULL AFTER `year`,
  ADD COLUMN `currentYear` varchar(20) DEFAULT NULL AFTER `academicYear`,
  ADD COLUMN `category` enum('Hosteller','Non-Hosteller') DEFAULT 'Hosteller' AFTER `currentYear`,
  ADD COLUMN `renewalStatus` enum('None','Renewed','Promoted') DEFAULT 'None' AFTER `category`;

-- Core fees tracking per academic year
CREATE TABLE IF NOT EXISTS `student_fees` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `studentId` int(11) NOT NULL,
  `academicYear` varchar(20) NOT NULL,
  `totalFee` decimal(10,2) NOT NULL DEFAULT 0.00,
  `paidAmount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `pendingAmount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('Unpaid','Partially Paid','Paid') NOT NULL DEFAULT 'Unpaid',
  `lastPaymentDate` date DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_student_year` (`studentId`,`academicYear`),
  KEY `fk_student_fees` (`studentId`),
  CONSTRAINT `fk_student_fees` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Individual installment receipts (auto or manual)
CREATE TABLE IF NOT EXISTS `payment_receipts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `studentId` int(11) DEFAULT NULL,
  `academicYear` varchar(20) DEFAULT NULL,
  `receiptNumber` varchar(50) NOT NULL,
  `installmentNumber` int(11) DEFAULT 1,
  `paymentAmount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `totalFeeSnapshot` decimal(10,2) NOT NULL DEFAULT 0.00,
  `paidAmountToDate` decimal(10,2) NOT NULL DEFAULT 0.00,
  `pendingAmountAfter` decimal(10,2) NOT NULL DEFAULT 0.00,
  `paymentDate` date NOT NULL,
  `paymentMode` enum('Cash','UPI','Card','Bank Transfer','Cheque','DD') DEFAULT 'Cash',
  `isManual` tinyint(1) NOT NULL DEFAULT 0,
  `manualReceiptProvided` tinyint(1) NOT NULL DEFAULT 0,
  `notes` text,
  `createdBy` varchar(100) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_receipt_number` (`receiptNumber`),
  KEY `idx_student_year` (`studentId`,`academicYear`),
  CONSTRAINT `fk_student_installment` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments captured before student record exists (payment-first workflow)
CREATE TABLE IF NOT EXISTS `pending_payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tempReference` varchar(50) NOT NULL, -- e.g. enrollmentNo placeholder or mobile
  `paymentAmount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `paymentDate` date NOT NULL,
  `paymentMode` enum('Cash','UPI','Card','Bank Transfer','Cheque','DD') DEFAULT 'Cash',
  `notes` text,
  `linkedStudentId` int(11) DEFAULT NULL,
  `academicYear` varchar(20) DEFAULT NULL,
  `isLinked` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_temp_reference_date` (`tempReference`,`paymentDate`),
  KEY `idx_linked_student` (`linkedStudentId`),
  CONSTRAINT `fk_pending_link_student` FOREIGN KEY (`linkedStudentId`) REFERENCES `students` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student renewal / promotion history
CREATE TABLE IF NOT EXISTS `student_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `studentId` int(11) NOT NULL,
  `previousAcademicYear` varchar(20) NOT NULL,
  `newAcademicYear` varchar(20) NOT NULL,
  `renewalDate` date NOT NULL,
  `oldTotalFee` decimal(10,2) DEFAULT 0.00,
  `newTotalFee` decimal(10,2) DEFAULT 0.00,
  `action` enum('Renewed','Promoted') NOT NULL,
  `remarks` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_student_history` (`studentId`),
  CONSTRAINT `fk_student_history_student` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sequence helper (optional yearly reset support)
CREATE TABLE IF NOT EXISTS `receipt_sequence` (
  `yearKey` varchar(10) NOT NULL,
  `currentValue` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`yearKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initialize current year sequence row if missing
INSERT IGNORE INTO `receipt_sequence` (`yearKey`, `currentValue`) VALUES (YEAR(CURDATE()), 0);

