"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Middleware to ensure user is logged in
router.use(auth_1.requireAuth);
// GET /students - List all students (Admin/Accountant) or Single (Student)
router.get('/', async (req, res) => {
    try {
        const user = req.currentUser;
        if (user.role === 'Student') {
            // Students can only see their own profile
            // Assuming we link username to enrollmentNo or have a studentId in user table
            // For now, let's assume username matches enrollmentNo or we query by user_id linkage
            // This requires the users table to have a studentId column or linkage.
            // fallback: return empty if not linked, or implement linkage logic.
            // SIMPLIFICATION: If role is student, we need to find their student record.
            // Let's assume the 'users' table has a 'studentId' or we look up by email/username.
            const [studentRows] = await database_1.default.query('SELECT * FROM students WHERE enrollmentNo = ? OR email = ?', [user.username, user.username]);
            return res.json(studentRows);
        }
        // Admin and Accountant can view all
        if (['Admin', 'Accountant', 'Staff'].includes(user.role)) {
            const [rows] = await database_1.default.query('SELECT * FROM students ORDER BY createdAt DESC');
            return res.json(rows);
        }
        return res.status(403).json({ error: 'Forbidden' });
    }
    catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
// POST /students - Create Student (Admin Only)
router.post('/', (0, auth_1.requireRole)(['Admin']), async (req, res) => {
    const data = req.body;
    try {
        // ... (Insert logic matching db.ts schema)
        // Using a dynamic query or simplified rigorous one
        const [result] = await database_1.default.query(`INSERT INTO students (name, mobile, email, enrollmentNo, faculty, collegeName, 
            yearOfCollege, address, residencyStatus, wing, roomNo, studentType, 
            joiningDate, annualFee, stayDuration, stayEndDate, customAmount, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            data.name, data.mobile, data.email, data.enrollmentNo,
            data.faculty, data.collegeName, data.yearOfCollege, data.address,
            data.residencyStatus || 'Permanent', data.wing, data.roomNo,
            data.studentType, data.joiningDate, data.annualFee || 50000,
            data.stayDuration, data.stayEndDate, data.customAmount,
            data.status || 'Active'
        ]);
        res.status(201).json({ success: true, id: result.insertId });
    }
    catch (error) {
        console.error('Create student error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
// PUT /students/:id - Update Student (Admin Only)
router.put('/:id', (0, auth_1.requireRole)(['Admin']), async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    try {
        await database_1.default.query(`UPDATE students SET name=?, mobile=?, email=?, enrollmentNo=?, faculty=?, 
            collegeName=?, yearOfCollege=?, address=?, residencyStatus=?, wing=?, 
            roomNo=?, studentType=?, joiningDate=?, annualFee=?, stayDuration=?, 
            stayEndDate=?, customAmount=?, status=?, updatedAt=NOW()
            WHERE id=?`, [
            data.name, data.mobile, data.email, data.enrollmentNo,
            data.faculty, data.collegeName, data.yearOfCollege, data.address,
            data.residencyStatus, data.wing, data.roomNo, data.studentType,
            data.joiningDate, data.annualFee, data.stayDuration,
            data.stayEndDate, data.customAmount, data.status, id
        ]);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
// DELETE /students/:id - Delete Student (Admin Only)
router.delete('/:id', (0, auth_1.requireRole)(['Admin']), async (req, res) => {
    const { id } = req.params;
    try {
        await database_1.default.query('DELETE FROM students WHERE id = ?', [id]);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
