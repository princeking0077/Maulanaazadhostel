<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        try {
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM receipt_register WHERE id = ?");
                $stmt->execute([$id]);
                sendJSON($stmt->fetch() ?: ['error' => 'Entry not found'], 404);
            } else {
                $stmt = $pdo->query("SELECT * FROM receipt_register ORDER BY date DESC, createdAt DESC");
                sendJSON($stmt->fetchAll());
            }
        } catch(PDOException $e) {
            sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'POST':
        try {
            $data = getRequestData();
            validateRequired($data, ['date', 'receiptNo', 'name']);
            
            $stmt = $pdo->prepare("
                INSERT INTO receipt_register (date, receiptNo, studentId, name, year, 
                    collegeName, faculty, rent, electricity, securityDeposit, anyOther, 
                    registrationFees, totalAmount, modeOfTransaction)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['date'],
                $data['receiptNo'],
                $data['studentId'] ?? 0,
                $data['name'],
                $data['year'] ?? '',
                $data['collegeName'] ?? '',
                $data['faculty'] ?? '',
                $data['rent'] ?? 0,
                $data['electricity'] ?? 0,
                $data['securityDeposit'] ?? 0,
                $data['anyOther'] ?? 0,
                $data['registrationFees'] ?? 0,
                $data['totalAmount'] ?? 0,
                $data['modeOfTransaction'] ?? 'Cash'
            ]);
            
            sendJSON(['success' => true, 'id' => $pdo->lastInsertId()], 201);
        } catch(PDOException $e) {
            sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'PUT':
        try {
            if (!$id) sendJSON(['error' => 'Entry ID required'], 400);
            
            $data = getRequestData();
            
            $stmt = $pdo->prepare("
                UPDATE receipt_register SET 
                    date=?, receiptNo=?, name=?, year=?, collegeName=?, faculty=?, 
                    rent=?, electricity=?, securityDeposit=?, anyOther=?, 
                    registrationFees=?, totalAmount=?, modeOfTransaction=?
                WHERE id=?
            ");
            
            $stmt->execute([
                $data['date'],
                $data['receiptNo'],
                $data['name'],
                $data['year'] ?? '',
                $data['collegeName'] ?? '',
                $data['faculty'] ?? '',
                $data['rent'] ?? 0,
                $data['electricity'] ?? 0,
                $data['securityDeposit'] ?? 0,
                $data['anyOther'] ?? 0,
                $data['registrationFees'] ?? 0,
                $data['totalAmount'] ?? 0,
                $data['modeOfTransaction'] ?? 'Cash',
                $id
            ]);
            
            sendJSON(['success' => true]);
        } catch(PDOException $e) {
            sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'DELETE':
        try {
            if (!$id) sendJSON(['error' => 'Entry ID required'], 400);
            
            $stmt = $pdo->prepare("DELETE FROM receipt_register WHERE id = ?");
            $stmt->execute([$id]);
            
            sendJSON(['success' => true]);
        } catch(PDOException $e) {
            sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
        break;
        
    default:
        sendJSON(['error' => 'Method not allowed'], 405);
}
?>
