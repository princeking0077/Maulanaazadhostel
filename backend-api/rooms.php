<?php
require_once 'config.php';

$action = $_GET['action'] ?? 'list';

try {
    switch ($action) {
        case 'list':
            // Get all rooms with optional filtering
            $wing = $_GET['wing'] ?? null;
            $status = $_GET['status'] ?? null;
            
            $query = "SELECT * FROM rooms WHERE 1=1";
            $params = [];
            
            if ($wing) {
                $query .= " AND wing = ?";
                $params[] = $wing;
            }
            
            if ($status) {
                if ($status === 'available') {
                    $query .= " AND currentOccupancy < capacity";
                } elseif ($status === 'full') {
                    $query .= " AND currentOccupancy >= capacity";
                }
            }
            
            $query .= " ORDER BY wing, roomNumber";
            
            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
            $rooms = $stmt->fetchAll();
            
            sendJSON(['success' => true, 'data' => $rooms]);
            break;
            
        case 'by-wing':
            // Get rooms by specific wing
            $wing = $_GET['wing'] ?? null;
            if (!$wing) {
                sendJSON(['error' => 'Wing parameter required'], 400);
            }
            
            $stmt = $pdo->prepare("SELECT * FROM rooms WHERE wing = ? ORDER BY roomNumber");
            $stmt->execute([$wing]);
            $rooms = $stmt->fetchAll();
            
            sendJSON(['success' => true, 'data' => $rooms]);
            break;
            
        case 'update':
            // Update a room
            $data = getRequestData();
            
            if (!isset($data['roomNumber'])) {
                sendJSON(['error' => 'Room number required'], 400);
            }
            
            // Find room by roomNumber and wing
            $stmt = $pdo->prepare("SELECT id FROM rooms WHERE roomNumber = ? AND wing = ?");
            $stmt->execute([$data['roomNumber'], $data['wing'] ?? '']);
            $room = $stmt->fetch();
            
            if (!$room) {
                sendJSON(['error' => 'Room not found'], 404);
            }
            
            $stmt = $pdo->prepare("
                UPDATE rooms SET 
                    wing = ?, 
                    floor = ?, 
                    capacity = ?, 
                    currentOccupancy = ?, 
                    roomType = ?, 
                    features = ?, 
                    status = ?, 
                    updatedAt = NOW()
                WHERE id = ?
            ");
            
            $stmt->execute([
                $data['wing'] ?? '',
                $data['floor'] ?? 0,
                $data['capacity'] ?? 0,
                $data['currentOccupancy'] ?? 0,
                $data['roomType'] ?? 'Standard',
                $data['features'] ?? '',
                $data['status'] ?? 'Available',
                $room['id']
            ]);
            
            sendJSON(['success' => true, 'message' => 'Room updated successfully']);
            break;
            
        case 'bulk-create':
            // Bulk create rooms
            $data = getRequestData();
            
            if (!isset($data['rooms']) || !is_array($data['rooms'])) {
                sendJSON(['error' => 'Rooms array required'], 400);
            }
            
            $pdo->beginTransaction();
            $created = 0;
            
            foreach ($data['rooms'] as $room) {
                // Check for duplicate
                $stmt = $pdo->prepare("SELECT id FROM rooms WHERE roomNumber = ? AND wing = ?");
                $stmt->execute([$room['roomNumber'], $room['wing']]);
                if ($stmt->fetch()) {
                    continue; // Skip duplicates
                }
                
                $stmt = $pdo->prepare("
                    INSERT INTO rooms (roomNumber, wing, floor, capacity, currentOccupancy, 
                        roomType, features, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                $stmt->execute([
                    $room['roomNumber'],
                    $room['wing'],
                    $room['floor'] ?? 0,
                    $room['capacity'] ?? 2,
                    $room['currentOccupancy'] ?? 0,
                    $room['roomType'] ?? 'Standard',
                    $room['features'] ?? '',
                    $room['status'] ?? 'Available'
                ]);
                
                $created++;
            }
            
            $pdo->commit();
            
            sendJSON([
                'success' => true, 
                'message' => "$created rooms created successfully",
                'created' => $created
            ]);
            break;
            
        case 'delete':
            // Delete a room
            $id = $_GET['id'] ?? null;
            if (!$id) {
                sendJSON(['error' => 'Room ID required'], 400);
            }
            
            // Check if room has occupants
            $stmt = $pdo->prepare("SELECT currentOccupancy FROM rooms WHERE id = ?");
            $stmt->execute([$id]);
            $room = $stmt->fetch();
            
            if (!$room) {
                sendJSON(['error' => 'Room not found'], 404);
            }
            
            if ($room['currentOccupancy'] > 0) {
                sendJSON(['error' => 'Cannot delete room with current occupants'], 400);
            }
            
            $stmt = $pdo->prepare("DELETE FROM rooms WHERE id = ?");
            $stmt->execute([$id]);
            
            sendJSON(['success' => true, 'message' => 'Room deleted successfully']);
            break;
            
        default:
            sendJSON(['error' => 'Invalid action'], 400);
    }
} catch(PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
}
?>
