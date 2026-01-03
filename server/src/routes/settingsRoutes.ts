import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { requireAuth, requireRole } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();
router.use(requireAuth);

// GET /settings/all - Get All Settings
router.get('/all', async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM settings');
        const settings: Record<string, any> = {};
        rows.forEach(row => {
            settings[row.keyName] = row.value;
        });
        res.json({ data: settings });
    } catch (error) {
        console.error('Get all settings error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /settings/:key - Get Single Setting
router.get('/:key', async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT value FROM settings WHERE keyName = ?', [req.params.key]);
        if (rows.length > 0) {
            res.json({ value: rows[0].value });
        } else {
            res.json({ value: null });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /settings - Set/Update Setting (Admin only)
router.post('/', requireRole(['Admin']), async (req: Request, res: Response) => {
    const { key, value } = req.body;
    try {
        await pool.query(
            'INSERT INTO settings (keyName, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
            [key, value, value]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Update setting error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
