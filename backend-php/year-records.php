<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = requireAuth();
$pdo = getDBConnection();

// GET all year records or filter by student
if ($method === 'GET' && !isset($_GET['id'])) {
    $query = 'SELECT * FROM student_year_records';
    $params = [];
    
    if (isset($_GET['student_id'])) {
        $query .= ' WHERE student_id = ?';
        $params[] = $_GET['student_id'];
    }
    
    if (isset($_GET['year'])) {
        $query .= (strpos($query, 'WHERE') !== false ? ' AND' : ' WHERE') . ' academic_year_start = ?';
        $params[] = $_GET['year'];
    }
    
    $query .= ' ORDER BY academic_year_start DESC, id DESC';
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $records = $stmt->fetchAll();
    
    sendJSON($records);
}

// GET single year record
if ($method === 'GET' && isset($_GET['id'])) {
    $stmt = $pdo->prepare('SELECT * FROM student_year_records WHERE id = ?');
    $stmt->execute([$_GET['id']]);
    $record = $stmt->fetch();
    
    if (!$record) {
        sendError('Record not found', 404);
    }
    
    sendJSON($record);
}

// CREATE year record
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $required = ['student_id', 'academic_year_start', 'academic_year_end', 'year_label', 'wing', 'room_no', 'annual_fee'];
    
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            sendError("Field $field is required", 400);
        }
    }
    
    try {
        $stmt = $pdo->prepare('
            INSERT INTO student_year_records (
                student_id, academic_year_start, academic_year_end, year_label,
                wing, room_no, annual_fee, status, remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        $stmt->execute([
            $data['student_id'],
            $data['academic_year_start'],
            $data['academic_year_end'],
            $data['year_label'],
            $data['wing'],
            $data['room_no'],
            $data['annual_fee'],
            $data['status'] ?? 'Active',
            $data['remarks'] ?? ''
        ]);
        
        sendJSON(['id' => $pdo->lastInsertId(), 'message' => 'Year record created successfully'], 201);
    } catch (PDOException $e) {
        sendError('Failed to create year record: ' . $e->getMessage(), 500);
    }
}

// UPDATE year record
if ($method === 'PUT' && isset($_GET['id'])) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $_GET['id'];
    
    $stmt = $pdo->prepare('
        UPDATE student_year_records SET
            wing = ?, room_no = ?, annual_fee = ?, status = ?, remarks = ?
        WHERE id = ?
    ');
    
    $stmt->execute([
        $data['wing'],
        $data['room_no'],
        $data['annual_fee'],
        $data['status'] ?? 'Active',
        $data['remarks'] ?? '',
        $id
    ]);
    
    sendJSON(['message' => 'Year record updated successfully']);
}

// DELETE year record
if ($method === 'DELETE' && isset($_GET['id'])) {
    $id = $_GET['id'];
    
    $stmt = $pdo->prepare('DELETE FROM student_year_records WHERE id = ?');
    $stmt->execute([$id]);
    
    sendJSON(['message' => 'Year record deleted successfully']);
}

// Bulk create year records (special endpoint)
if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'bulk') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['records']) || !is_array($data['records'])) {
        sendError('records array is required', 400);
    }
    
    $pdo->beginTransaction();
    
    try {
        $stmt = $pdo->prepare('
            INSERT INTO student_year_records (
                student_id, academic_year_start, academic_year_end, year_label,
                wing, room_no, annual_fee, status, remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        foreach ($data['records'] as $record) {
            $stmt->execute([
                $record['student_id'],
                $record['academic_year_start'],
                $record['academic_year_end'],
                $record['year_label'],
                $record['wing'],
                $record['room_no'],
                $record['annual_fee'],
                $record['status'] ?? 'Active',
                $record['remarks'] ?? ''
            ]);
        }
        
        $pdo->commit();
        sendJSON(['message' => 'Year records created successfully', 'count' => count($data['records'])], 201);
    } catch (PDOException $e) {
        $pdo->rollBack();
        sendError('Failed to create year records: ' . $e->getMessage(), 500);
    }
}
?>
