<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = requireAuth();
$pdo = getDBConnection();

// GET all rooms or filter by wing
if ($method === 'GET' && !isset($_GET['id'])) {
    $query = 'SELECT * FROM rooms';
    $params = [];
    
    if (isset($_GET['wing'])) {
        $query .= ' WHERE wing = ?';
        $params[] = $_GET['wing'];
    }
    
    $query .= ' ORDER BY wing, room_number';
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $rooms = $stmt->fetchAll();
    
    sendJSON($rooms);
}

// GET single room
if ($method === 'GET' && isset($_GET['id'])) {
    $stmt = $pdo->prepare('SELECT * FROM rooms WHERE id = ?');
    $stmt->execute([$_GET['id']]);
    $room = $stmt->fetch();
    
    if (!$room) {
        sendError('Room not found', 404);
    }
    
    sendJSON($room);
}

// CREATE room
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['room_number']) || !isset($data['wing']) || !isset($data['capacity'])) {
        sendError('room_number, wing, and capacity are required', 400);
    }
    
    try {
        $stmt = $pdo->prepare('
            INSERT INTO rooms (room_number, wing, capacity, current_occupancy, is_active)
            VALUES (?, ?, ?, ?, ?)
        ');
        
        $stmt->execute([
            $data['room_number'],
            $data['wing'],
            $data['capacity'],
            $data['current_occupancy'] ?? 0,
            $data['is_active'] ?? 1
        ]);
        
        sendJSON(['id' => $pdo->lastInsertId(), 'message' => 'Room created successfully'], 201);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            sendError('Room number already exists', 409);
        }
        sendError('Failed to create room: ' . $e->getMessage(), 500);
    }
}

// UPDATE room
if ($method === 'PUT' && isset($_GET['id'])) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $_GET['id'];
    
    $stmt = $pdo->prepare('
        UPDATE rooms SET
            room_number = ?, wing = ?, capacity = ?, current_occupancy = ?, is_active = ?
        WHERE id = ?
    ');
    
    $stmt->execute([
        $data['room_number'],
        $data['wing'],
        $data['capacity'],
        $data['current_occupancy'] ?? 0,
        $data['is_active'] ?? 1,
        $id
    ]);
    
    sendJSON(['message' => 'Room updated successfully']);
}

// DELETE room
if ($method === 'DELETE' && isset($_GET['id'])) {
    $id = $_GET['id'];
    
    $stmt = $pdo->prepare('DELETE FROM rooms WHERE id = ?');
    $stmt->execute([$id]);
    
    sendJSON(['message' => 'Room deleted successfully']);
}

// Bulk create rooms (special endpoint)
if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'bulk') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['rooms']) || !is_array($data['rooms'])) {
        sendError('rooms array is required', 400);
    }
    
    $pdo->beginTransaction();
    
    try {
        $stmt = $pdo->prepare('
            INSERT INTO rooms (room_number, wing, capacity, current_occupancy, is_active)
            VALUES (?, ?, ?, ?, ?)
        ');
        
        foreach ($data['rooms'] as $room) {
            $stmt->execute([
                $room['room_number'],
                $room['wing'],
                $room['capacity'],
                $room['current_occupancy'] ?? 0,
                $room['is_active'] ?? 1
            ]);
        }
        
        $pdo->commit();
        sendJSON(['message' => 'Rooms created successfully', 'count' => count($data['rooms'])], 201);
    } catch (PDOException $e) {
        $pdo->rollBack();
        sendError('Failed to create rooms: ' . $e->getMessage(), 500);
    }
}
?>
