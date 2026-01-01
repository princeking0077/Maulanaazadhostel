<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        try {
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM payments WHERE id = ?");
                $stmt->execute([$id]);
                $payment = $stmt->fetch();
                sendJSON($payment ?: ['error' => 'Payment not found'], $payment ? 200 : 404);
            } else {
                $stmt = $pdo->query("SELECT * FROM payments ORDER BY createdAt DESC");
                $payments = $stmt->fetchAll();
                sendJSON($payments);
            }
        } catch(PDOException $e) {
            sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'POST':
        try {
            $data = getRequestData();
            validateRequired($data, ['studentId', 'date']);
            
            // Get and increment receipt counter
            $stmt = $pdo->prepare("SELECT value FROM settings WHERE keyName = 'receiptCounter'");
            $stmt->execute();
            $counter = (int)($stmt->fetchColumn() ?: 1);
            $receiptNo = 'RCP-' . str_pad($counter, 3, '0', STR_PAD_LEFT);
            
            // Insert payment
            $stmt = $pdo->prepare("
                INSERT INTO payments (studentId, receiptNo, date, registrationFee, rentFee, 
                    waterFee, electricityFee, gymFee, otherFee, securityDeposit, totalAmount, 
                    balanceAmount, paymentStatus, utrNo, paymentMethod, cashier)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['studentId'],
                $receiptNo,
                $data['date'],
                $data['registrationFee'] ?? 0,
                $data['rentFee'] ?? 0,
                $data['waterFee'] ?? 0,
                $data['electricityFee'] ?? 0,
                $data['gymFee'] ?? 0,
                $data['otherFee'] ?? 0,
                $data['securityDeposit'] ?? 0,
                $data['totalAmount'] ?? 0,
                $data['balanceAmount'] ?? 0,
                $data['paymentStatus'] ?? 'Paid',
                $data['utrNo'] ?? '',
                $data['paymentMethod'] ?? 'Cash',
                $data['cashier'] ?? 'Admin'
            ]);
            
            $paymentId = $pdo->lastInsertId();
            
            // Update receipt counter
            $pdo->prepare("UPDATE settings SET value = ? WHERE keyName = 'receiptCounter'")
                ->execute([$counter + 1]);
            
            // Auto-add to receipt register
            $stmt = $pdo->prepare("SELECT name, yearOfCollege, collegeName, faculty FROM students WHERE id = ?");
            $stmt->execute([$data['studentId']]);
            $student = $stmt->fetch();
            
            if ($student) {
                $pdo->prepare("
                    INSERT INTO receipt_register (date, receiptNo, studentId, name, year, 
                        collegeName, faculty, rent, electricity, securityDeposit, anyOther, 
                        registrationFees, totalAmount, modeOfTransaction)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ")->execute([
                    $data['date'],
                    $receiptNo,
                    $data['studentId'],
                    $student['name'],
                    $student['yearOfCollege'] ?? '',
                    $student['collegeName'] ?? '',
                    $student['faculty'] ?? '',
                    $data['rentFee'] ?? 0,
                    $data['electricityFee'] ?? 0,
                    $data['securityDeposit'] ?? 0,
                    $data['otherFee'] ?? 0,
                    $data['registrationFee'] ?? 0,
                    $data['totalAmount'] ?? 0,
                    $data['paymentMethod'] ?? 'Cash'
                ]);
            }
            
            sendJSON([
                'success' => true, 
                'id' => $paymentId, 
                'receiptNo' => $receiptNo
            ], 201);
            
        } catch(PDOException $e) {
            sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'PUT':
        try {
            if (!$id) sendJSON(['error' => 'Payment ID required'], 400);
            
            $data = getRequestData();
            
            $stmt = $pdo->prepare("
                UPDATE payments SET 
                    studentId=?, date=?, registrationFee=?, rentFee=?, waterFee=?, 
                    electricityFee=?, gymFee=?, otherFee=?, securityDeposit=?, totalAmount=?, 
                    balanceAmount=?, paymentStatus=?, utrNo=?, paymentMethod=?, cashier=?
                WHERE id=?
            ");
            
            $stmt->execute([
                $data['studentId'],
                $data['date'],
                $data['registrationFee'] ?? 0,
                $data['rentFee'] ?? 0,
                $data['waterFee'] ?? 0,
                $data['electricityFee'] ?? 0,
                $data['gymFee'] ?? 0,
                $data['otherFee'] ?? 0,
                $data['securityDeposit'] ?? 0,
                $data['totalAmount'] ?? 0,
                $data['balanceAmount'] ?? 0,
                $data['paymentStatus'] ?? 'Paid',
                $data['utrNo'] ?? '',
                $data['paymentMethod'] ?? 'Cash',
                $data['cashier'] ?? 'Admin',
                $id
            ]);
            
            sendJSON(['success' => true]);
        } catch(PDOException $e) {
            sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'DELETE':
        try {
            if (!$id) sendJSON(['error' => 'Payment ID required'], 400);
            
            $stmt = $pdo->prepare("DELETE FROM payments WHERE id = ?");
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
