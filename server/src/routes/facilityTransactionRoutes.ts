import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { requireAuth, requireRole } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();
router.use(requireAuth);

// GET /facility-transactions - List
router.get('/', async (req: Request, res: Response) => {
    try {
        const { facility } = req.query;
        let query = 'SELECT * FROM facility_transactions';
        const params: any[] = [];

        if (facility) {
            query += ' WHERE facility = ?';
            params.push(facility);
        }

        query += ' ORDER BY date DESC, id DESC';
        const [rows] = await pool.query<RowDataPacket[]>(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Get facility transactions error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /facility-transactions - Create
router.post('/', requireRole(['Admin']), async (req: Request, res: Response) => {
    const data = req.body;
    try {
        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO facility_transactions 
            (date, partyName, amount, facility, txnType, description, billNo, paymentMethod, paymentRef, subtotal, gstPercent, gstAmount, netAmount, paidAmount, balanceAmount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.date, data.partyName, data.amount, data.facility, data.txnType,
                data.description, data.billNo, data.paymentMethod, data.paymentRef,
                data.subtotal, data.gstPercent, data.gstAmount, data.netAmount,
                data.paidAmount, data.balanceAmount
            ]
        );
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        console.error('Create facility transaction error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
