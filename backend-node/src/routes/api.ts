import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

router.get('/status', async (req: Request, res: Response) => {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        res.json({ status: 'OK', database: 'Connected' });
    } catch (error: any) {
        res.status(500).json({ status: 'Error', database: error.message });
    }
});

export default router;
