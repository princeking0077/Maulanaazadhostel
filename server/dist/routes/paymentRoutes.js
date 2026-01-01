"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// GET /payments - List payments
router.get('/', async (req, res) => {
    try {
        const user = req.currentUser;
        if (user.role === 'Student') {
            // View own payments
            // Need to join with students table or have studentId link
            const [rows] = await database_1.default.query(`
                SELECT p.* FROM payments p
                JOIN students s ON p.studentId = s.id
                WHERE s.enrollmentNo = ? OR s.email = ?
            `, [user.username, user.username]);
            return res.json(rows);
        }
        // Admin/Accountant view all
        if (['Admin', 'Accountant', 'Staff'].includes(user.role)) {
            const [rows] = await database_1.default.query('SELECT * FROM payments ORDER BY createdAt DESC');
            return res.json(rows);
        }
        res.status(403).json({ error: 'Forbidden' });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
// POST /payments - Create Payment (Admin/Accountant?)
// User Requirements: "accountant login also only export data and view cant modify or change it"
// So Accountant CANNOT create payments? "cant modify or change it".
// Assuming ONLY Admin can create payments.
router.post('/', (0, auth_1.requireRole)(['Admin']), async (req, res) => {
    const data = req.body;
    try {
        // Get receipt counter
        const [settings] = await database_1.default.query("SELECT value FROM settings WHERE keyName = 'receiptCounter'");
        let counter = 1;
        if (settings.length > 0) {
            counter = parseInt(settings[0].value);
        }
        const receiptNo = 'RCP-' + counter.toString().padStart(3, '0');
        const [result] = await database_1.default.query(`INSERT INTO payments (studentId, receiptNo, date, registrationFee, rentFee, 
            waterFee, electricityFee, gymFee, otherFee, securityDeposit, totalAmount, 
            balanceAmount, paymentStatus, utrNo, paymentMethod, cashier)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            data.studentId, receiptNo, data.date, data.registrationFee,
            data.rentFee, data.waterFee, data.electricityFee, data.gymFee,
            data.otherFee, data.securityDeposit, data.totalAmount,
            data.balanceAmount, data.paymentStatus, data.utrNo,
            data.paymentMethod, data.cashier
        ]);
        // Update counter
        await database_1.default.query("INSERT INTO settings (keyName, value) VALUES ('receiptCounter', ?) ON DUPLICATE KEY UPDATE value = ?", [counter + 1, counter + 1]);
        res.status(201).json({ success: true, id: result.insertId, receiptNo });
    }
    catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
