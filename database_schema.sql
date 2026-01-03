-- Database Schema for Maulana Azad Hostel Management System
-- Compatible with Hostinger MySQL

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+05:30";

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Admin','Staff','Accountant','Student') NOT NULL DEFAULT 'Staff',
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `enrollmentNo` varchar(50) DEFAULT NULL,
  `faculty` varchar(100) DEFAULT NULL,
  `collegeName` varchar(255) DEFAULT NULL,
  `yearOfCollege` varchar(50) DEFAULT NULL,
  `address` text,
  `residencyStatus` enum('Permanent','Temporary') DEFAULT 'Permanent',
  `wing` enum('A','B','C','D') DEFAULT NULL,
  `roomNo` varchar(20) DEFAULT NULL,
  `studentType` varchar(50) DEFAULT NULL,
  `joiningDate` date DEFAULT NULL,
  `annualFee` decimal(10,2) DEFAULT '50000.00',
  `stayDuration` varchar(50) DEFAULT NULL,
  `stayEndDate` date DEFAULT NULL,
  `customAmount` decimal(10,2) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Active',
  `securityDeposit` decimal(10,2) DEFAULT '0.00',
  `isOldStudent` tinyint(1) DEFAULT '0',
  `vacatedDate` date DEFAULT NULL,
  `remarks` text,
  `isPlaceholder` tinyint(1) DEFAULT '0',
  `placeholderRef` varchar(50) DEFAULT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `enrollmentNo` (`enrollmentNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `studentId` int(11) NOT NULL,
  `receiptNo` varchar(50) NOT NULL,
  `date` date NOT NULL,
  `registrationFee` decimal(10,2) DEFAULT '0.00',
  `rentFee` decimal(10,2) DEFAULT '0.00',
  `waterFee` decimal(10,2) DEFAULT '0.00',
  `electricityFee` decimal(10,2) DEFAULT '0.00',
  `gymFee` decimal(10,2) DEFAULT '0.00',
  `otherFee` decimal(10,2) DEFAULT '0.00',
  `securityDeposit` decimal(10,2) DEFAULT '0.00',
  `messVegFee` decimal(10,2) DEFAULT '0.00',
  `messNonVegFee` decimal(10,2) DEFAULT '0.00',
  `canteenFee` decimal(10,2) DEFAULT '0.00',
  `xeroxFee` decimal(10,2) DEFAULT '0.00',
  `totalAmount` decimal(10,2) NOT NULL,
  `balanceAmount` decimal(10,2) DEFAULT '0.00',
  `paymentStatus` enum('Paid','Partial','Pending') DEFAULT 'Paid',
  `utrNo` varchar(100) DEFAULT NULL,
  `paymentMethod` enum('Cash','Online','Cheque') DEFAULT 'Cash',
  `cashier` varchar(100) DEFAULT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `receiptNo` (`receiptNo`),
  KEY `studentId` (`studentId`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `keyName` varchar(100) NOT NULL,
  `value` text,
  `description` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `keyName` (`keyName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `petty_cash`
--

CREATE TABLE `petty_cash` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `receiptNo` varchar(50) DEFAULT NULL,
  `description` text,
  `category` varchar(100) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `paymentMethod` enum('Cash','Online','Cheque') DEFAULT 'Cash',
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `receipt_register`
--

CREATE TABLE `receipt_register` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `receiptNo` varchar(50) NOT NULL,
  `studentId` int(11) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `year` varchar(50) DEFAULT NULL,
  `collegeName` varchar(255) DEFAULT NULL,
  `faculty` varchar(100) DEFAULT NULL,
  `rent` decimal(10,2) DEFAULT '0.00',
  `electricity` decimal(10,2) DEFAULT '0.00',
  `securityDeposit` decimal(10,2) DEFAULT '0.00',
  `anyOther` decimal(10,2) DEFAULT '0.00',
  `registrationFees` decimal(10,2) DEFAULT '0.00',
  `totalAmount` decimal(10,2) NOT NULL,
  `modeOfTransaction` varchar(50) DEFAULT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `roomNumber` varchar(20) NOT NULL,
  `wing` enum('A','B','C','D') NOT NULL,
  `capacity` int(11) NOT NULL DEFAULT '3',
  `currentOccupancy` int(11) NOT NULL DEFAULT '0',
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roomNumber_wing` (`roomNumber`,`wing`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `facility_transactions`
--

CREATE TABLE `facility_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `partyName` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `facility` varchar(100) NOT NULL,
  `txnType` enum('Income','Expense') NOT NULL,
  `description` text,
  `billNo` varchar(50) DEFAULT NULL,
  `paymentMethod` enum('Cash','Online','Cheque','Credit') DEFAULT 'Cash',
  `paymentRef` varchar(100) DEFAULT NULL,
  `subtotal` decimal(10,2) DEFAULT NULL,
  `gstPercent` decimal(5,2) DEFAULT '0.00',
  `gstAmount` decimal(10,2) DEFAULT '0.00',
  `netAmount` decimal(10,2) DEFAULT NULL,
  `paidAmount` decimal(10,2) DEFAULT NULL,
  `balanceAmount` decimal(10,2) DEFAULT '0.00',
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Seed Default Admin User
-- Password is 'admin123' hashed with bcrypt
--

INSERT INTO `users` (`username`, `password`, `role`, `name`, `email`) VALUES
('admin', '$2a$10$X.Bk.s.1.1.1.1.1.1.1.1', 'Admin', 'Administrator', 'admin@example.com');
-- Note: The above hash is a placeholder. The actual registration endpoint hashes passwords.
-- Check instructions to register a real admin or use the register endpoint.

COMMIT;
