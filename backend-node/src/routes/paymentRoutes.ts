import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { requireAuth, requireRole } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = Router();
router.use(requireAuth);

// GET /payments - List payments
router.get('/', async (req: Request, res: Response) => {
    try {
        const user = req.currentUser!;

        if (user.role === 'Student') {
            // View own payments
            // Need to join with students table or have studentId link
            const [rows] = await pool.query(`
                SELECT p.* FROM payments p
                JOIN students s ON p.studentId = s.id
                WHERE s.enrollmentNo = ? OR s.email = ?
            `, [user.username, user.username]);
            return res.json(rows);
        }

        // Admin/Accountant view all
        if (['Admin', 'Accountant', 'Staff'].includes(user.role)) {
            const [rows] = await pool.query('SELECT * FROM payments ORDER BY createdAt DESC');
            return res.json(rows);
        }

        res.status(403).json({ error: 'Forbidden' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /payments - Create Payment (Admin/Accountant?)
// User Requirements: "accountant login also only export data and view cant modify or change it"
// So Accountant CANNOT create payments? "cant modify or change it".
// Assuming ONLY Admin can create payments.
router.post('/', requireRole(['Admin']), async (req: Request, res: Response) => {
    const data = req.body;
    try {
        // Get receipt counter
        const [settings] = await pool.query<RowDataPacket[]>("SELECT value FROM settings WHERE keyName = 'receiptCounter'");
        let counter = 1;
        if (settings.length > 0) {
            counter = parseInt(settings[0].value);
        }

        const receiptNo = 'RCP-' + counter.toString().padStart(3, '0');

        const [result] = await pool.query(
            `INSERT INTO payments (studentId, receiptNo, date, registrationFee, rentFee, 
            waterFee, electricityFee, gymFee, otherFee, securityDeposit, totalAmount, 
            balanceAmount, paymentStatus, utrNo, paymentMethod, cashier)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.studentId, receiptNo, data.date, data.registrationFee,
                data.rentFee, data.waterFee, data.electricityFee, data.gymFee,
                data.otherFee, data.securityDeposit, data.totalAmount,
                data.balanceAmount, data.paymentStatus, data.utrNo,
                data.paymentMethod, data.cashier
            ]
        );

        // Update counter
        await pool.query("INSERT INTO settings (keyName, value) VALUES ('receiptCounter', ?) ON DUPLICATE KEY UPDATE value = ?", [counter + 1, counter + 1]);

        res.status(201).json({ success: true, id: (result as any).insertId, receiptNo });
    } catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
