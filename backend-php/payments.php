<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = requireAuth();
$pdo = getDBConnection();

// GET all payments or filter by student
if ($method === 'GET' && !isset($_GET['id'])) {
    $query = 'SELECT * FROM payments';
    $params = [];
    
    if (isset($_GET['student_id'])) {
        $query .= ' WHERE student_id = ?';
        $params[] = $_GET['student_id'];
    }
    
    $query .= ' ORDER BY date DESC, id DESC';
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $payments = $stmt->fetchAll();
    
    sendJSON($payments);
}

// GET single payment
if ($method === 'GET' && isset($_GET['id'])) {
    $stmt = $pdo->prepare('SELECT * FROM payments WHERE id = ?');
    $stmt->execute([$_GET['id']]);
    $payment = $stmt->fetch();
    
    if (!$payment) {
        sendError('Payment not found', 404);
    }
    
    sendJSON($payment);
}

// CREATE payment
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['student_id']) || !isset($data['receipt_no']) || !isset($data['date'])) {
        sendError('student_id, receipt_no, and date are required', 400);
    }
    
    try {
        $stmt = $pdo->prepare('
            INSERT INTO payments (
                student_id, receipt_no, date, registration_fee, rent_fee, water_fee, gym_fee,
                other_fee, mess_veg_fee, mess_non_veg_fee, canteen_fee, xerox_fee,
                total_amount, balance_amount, payment_status, utr_no, payment_method, cashier
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        $stmt->execute([
            $data['student_id'],
            $data['receipt_no'],
            $data['date'],
            $data['registration_fee'] ?? 0,
            $data['rent_fee'] ?? 0,
            $data['water_fee'] ?? 0,
            $data['gym_fee'] ?? 0,
            $data['other_fee'] ?? 0,
            $data['mess_veg_fee'] ?? 0,
            $data['mess_non_veg_fee'] ?? 0,
            $data['canteen_fee'] ?? 0,
            $data['xerox_fee'] ?? 0,
            $data['total_amount'],
            $data['balance_amount'] ?? 0,
            $data['payment_status'] ?? 'Paid',
            $data['utr_no'] ?? null,
            $data['payment_method'] ?? 'Cash',
            $data['cashier'] ?? 'System'
        ]);
        
        sendJSON(['id' => $pdo->lastInsertId(), 'message' => 'Payment created successfully'], 201);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            sendError('Receipt number already exists', 409);
        }
        sendError('Failed to create payment: ' . $e->getMessage(), 500);
    }
}

// UPDATE payment
if ($method === 'PUT' && isset($_GET['id'])) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $_GET['id'];
    
    $stmt = $pdo->prepare('
        UPDATE payments SET
            registration_fee = ?, rent_fee = ?, water_fee = ?, gym_fee = ?, other_fee = ?,
            mess_veg_fee = ?, mess_non_veg_fee = ?, canteen_fee = ?, xerox_fee = ?,
            total_amount = ?, balance_amount = ?, payment_status = ?, utr_no = ?,
            payment_method = ?, cashier = ?
        WHERE id = ?
    ');
    
    $stmt->execute([
        $data['registration_fee'] ?? 0,
        $data['rent_fee'] ?? 0,
        $data['water_fee'] ?? 0,
        $data['gym_fee'] ?? 0,
        $data['other_fee'] ?? 0,
        $data['mess_veg_fee'] ?? 0,
        $data['mess_non_veg_fee'] ?? 0,
        $data['canteen_fee'] ?? 0,
        $data['xerox_fee'] ?? 0,
        $data['total_amount'],
        $data['balance_amount'] ?? 0,
        $data['payment_status'] ?? 'Paid',
        $data['utr_no'] ?? null,
        $data['payment_method'] ?? 'Cash',
        $data['cashier'] ?? 'System',
        $id
    ]);
    
    sendJSON(['message' => 'Payment updated successfully']);
}

// DELETE payment
if ($method === 'DELETE' && isset($_GET['id'])) {
    $id = $_GET['id'];
    
    $stmt = $pdo->prepare('DELETE FROM payments WHERE id = ?');
    $stmt->execute([$id]);
    
    sendJSON(['message' => 'Payment deleted successfully']);
}
?>
