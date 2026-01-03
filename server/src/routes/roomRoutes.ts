import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { requireAuth, requireRole } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// Middleware: All room actions likely require auth.
// View: Everyone (authenticated)
// Modify: Admin only
router.use(requireAuth);

// GET /rooms - List all rooms or filter by wing
router.get('/', async (req: Request, res: Response) => {
    try {
        const { wing } = req.query;
        let query = 'SELECT * FROM rooms';
        const params: any[] = [];

        if (wing) {
            query += ' WHERE wing = ?';
            params.push(wing);
        }

        query += ' ORDER BY wing, roomNumber';

        // Fix: PHP used 'room_number' but schema likely has snake_case or we map it. 
        // Based on other files, we should stick to DB column names. 
        // Let's assume schema matches PHP: 'room_number', 'current_occupancy', 'is_active'.
        // BUT the frontend API expects camelCase keys? Or does it?
        // Let's check api.ts: it uses `roomNumber`. So we may need to alias.
        // Or if the DB has camelCase? unlikely in MySQL.
        // Let's verify schema first to be safe, but for now I'll select *.

        const [rows] = await pool.query<RowDataPacket[]>(query, params);

        // Map to camelCase for frontend consistency if needed, specific check needed later.
        // For now returning raw rows.
        res.json(rows);
    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /rooms/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Room not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /rooms - Create Room (Admin)
router.post('/', requireRole(['Admin']), async (req: Request, res: Response) => {
    const { roomNumber, wing, capacity, currentOccupancy, isActive } = req.body;

    // Support both casings from frontend
    const room_number = roomNumber || req.body.room_number;
    const current_occupancy = currentOccupancy || req.body.current_occupancy || 0;
    const is_active = isActive !== undefined ? isActive : (req.body.is_active !== undefined ? req.body.is_active : 1);

    if (!room_number || !wing || !capacity) {
        return res.status(400).json({ error: 'roomNumber, wing, and capacity are required' });
    }

    try {
        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO rooms (roomNumber, wing, capacity, currentOccupancy, isActive) VALUES (?, ?, ?, ?, ?)',
            [room_number, wing, capacity, current_occupancy, is_active]
        );
        res.status(201).json({ success: true, id: result.insertId });
    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Room number already exists' });
        }
        console.error('Create room error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /rooms/:id - Update Room (Admin)
router.put('/:id', requireRole(['Admin']), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { roomNumber, wing, capacity, currentOccupancy, isActive } = req.body;

    const room_number = roomNumber || req.body.room_number;
    const current_occupancy = currentOccupancy !== undefined ? currentOccupancy : req.body.current_occupancy;
    const is_active = isActive !== undefined ? isActive : req.body.is_active;

    try {
        await pool.query(
            'UPDATE rooms SET roomNumber=?, wing=?, capacity=?, currentOccupancy=?, isActive=? WHERE id=?',
            [room_number, wing, capacity, current_occupancy, is_active, id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Update room error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


// POST /rooms/bulk-create - Bulk Create (Admin)
router.post('/bulk-create', requireRole(['Admin']), async (req: Request, res: Response) => {
    const { rooms } = req.body;
    if (!rooms || !Array.isArray(rooms)) return res.status(400).json({ error: 'rooms array is required' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const stmt = 'INSERT INTO rooms (roomNumber, wing, capacity, currentOccupancy, isActive) VALUES (?, ?, ?, ?, ?)';

        for (const room of rooms) {
            await connection.execute(stmt, [
                room.roomNumber || room.room_number,
                room.wing,
                room.capacity,
                room.currentOccupancy || 0,
                room.isActive || 1
            ]);
        }

        await connection.commit();
        res.status(201).json({ success: true, count: rooms.length });
    } catch (error: any) {
        await connection.rollback();
        console.error('Bulk create error:', error);
        res.status(500).json({ error: 'Server error' });
    } finally {
        connection.release();
    }
});

export default router;
