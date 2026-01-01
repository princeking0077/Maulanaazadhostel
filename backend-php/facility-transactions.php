<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = requireAuth();
$pdo = getDBConnection();

// GET all facility transactions or filter
if ($method === 'GET' && !isset($_GET['id'])) {
    $query = 'SELECT * FROM facility_transactions';
    $params = [];
    
    if (isset($_GET['facility'])) {
        $query .= ' WHERE facility = ?';
        $params[] = $_GET['facility'];
    }
    
    if (isset($_GET['txn_type'])) {
        $query .= (strpos($query, 'WHERE') !== false ? ' AND' : ' WHERE') . ' txn_type = ?';
        $params[] = $_GET['txn_type'];
    }
    
    $query .= ' ORDER BY date DESC, id DESC';
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $transactions = $stmt->fetchAll();
    
    sendJSON($transactions);
}

// GET single facility transaction
if ($method === 'GET' && isset($_GET['id'])) {
    $stmt = $pdo->prepare('SELECT * FROM facility_transactions WHERE id = ?');
    $stmt->execute([$_GET['id']]);
    $transaction = $stmt->fetch();
    
    if (!$transaction) {
        sendError('Transaction not found', 404);
    }
    
    sendJSON($transaction);
}

// CREATE facility transaction
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $required = ['facility', 'txn_type', 'date', 'party_name'];
    
    foreach ($required as $field) {
        if (!isset($data[$field]) || $data[$field] === '') {
            sendError("Field $field is required", 400);
        }
    }
    
    // Handle items JSON
    $items = null;
    if (isset($data['items']) && is_array($data['items'])) {
        $items = json_encode($data['items']);
    }
    
    try {
        $stmt = $pdo->prepare('
            INSERT INTO facility_transactions (
                facility, txn_type, date, amount, party_name, description, receipt_no,
                bill_no, payment_method, payment_ref, items, subtotal, gst_percent,
                gst_amount, net_amount, paid_amount, balance_amount, utility_type,
                period_from, period_to, meter_units, worker_role
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        $stmt->execute([
            $data['facility'],
            $data['txn_type'],
            $data['date'],
            $data['amount'] ?? $data['net_amount'] ?? 0,
            $data['party_name'],
            $data['description'] ?? '',
            $data['receipt_no'] ?? null,
            $data['bill_no'] ?? null,
            $data['payment_method'] ?? 'Cash',
            $data['payment_ref'] ?? null,
            $items,
            $data['subtotal'] ?? 0,
            $data['gst_percent'] ?? 0,
            $data['gst_amount'] ?? 0,
            $data['net_amount'] ?? $data['amount'] ?? 0,
            $data['paid_amount'] ?? $data['net_amount'] ?? $data['amount'] ?? 0,
            $data['balance_amount'] ?? 0,
            $data['utility_type'] ?? null,
            $data['period_from'] ?? null,
            $data['period_to'] ?? null,
            $data['meter_units'] ?? null,
            $data['worker_role'] ?? null
        ]);
        
        sendJSON(['id' => $pdo->lastInsertId(), 'message' => 'Transaction created successfully'], 201);
    } catch (PDOException $e) {
        sendError('Failed to create transaction: ' . $e->getMessage(), 500);
    }
}

// UPDATE facility transaction
if ($method === 'PUT' && isset($_GET['id'])) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $_GET['id'];
    
    $items = null;
    if (isset($data['items']) && is_array($data['items'])) {
        $items = json_encode($data['items']);
    }
    
    $stmt = $pdo->prepare('
        UPDATE facility_transactions SET
            facility = ?, txn_type = ?, date = ?, amount = ?, party_name = ?,
            description = ?, bill_no = ?, payment_method = ?, payment_ref = ?,
            items = ?, subtotal = ?, gst_percent = ?, gst_amount = ?, net_amount = ?,
            paid_amount = ?, balance_amount = ?, utility_type = ?, period_from = ?,
            period_to = ?, meter_units = ?, worker_role = ?
        WHERE id = ?
    ');
    
    $stmt->execute([
        $data['facility'],
        $data['txn_type'],
        $data['date'],
        $data['amount'] ?? $data['net_amount'] ?? 0,
        $data['party_name'],
        $data['description'] ?? '',
        $data['bill_no'] ?? null,
        $data['payment_method'] ?? 'Cash',
        $data['payment_ref'] ?? null,
        $items,
        $data['subtotal'] ?? 0,
        $data['gst_percent'] ?? 0,
        $data['gst_amount'] ?? 0,
        $data['net_amount'] ?? $data['amount'] ?? 0,
        $data['paid_amount'] ?? $data['net_amount'] ?? $data['amount'] ?? 0,
        $data['balance_amount'] ?? 0,
        $data['utility_type'] ?? null,
        $data['period_from'] ?? null,
        $data['period_to'] ?? null,
        $data['meter_units'] ?? null,
        $data['worker_role'] ?? null,
        $id
    ]);
    
    sendJSON(['message' => 'Transaction updated successfully']);
}

// DELETE facility transaction
if ($method === 'DELETE' && isset($_GET['id'])) {
    $id = $_GET['id'];
    
    $stmt = $pdo->prepare('DELETE FROM facility_transactions WHERE id = ?');
    $stmt->execute([$id]);
    
    sendJSON(['message' => 'Transaction deleted successfully']);
}
?>
