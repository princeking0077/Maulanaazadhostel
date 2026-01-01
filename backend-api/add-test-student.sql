-- Add a test student to verify the system works
-- Run this in phpMyAdmin SQL tab

INSERT INTO students (
    name, enrollmentNo, faculty, collegeName, yearOfCollege, 
    mobile, email, wing, roomNo, residencyStatus, studentType,
    joiningDate, annualFee, stayDuration, status
) VALUES (
    'Test Student', 'TEST001', 'Science', 'Test College', '1st Year',
    '9876543210', 'test@example.com', 'A', '101', 'Permanent', 'Regular',
    '2024-01-01', 50000, 10, 'Active'
);
