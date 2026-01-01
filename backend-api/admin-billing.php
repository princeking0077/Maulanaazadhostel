<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        try {
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM facility_transactions WHERE id = ?");
                $stmt->execute([$id]);
                $transaction = $stmt->fetch();
                
                if ($transaction && isset($transaction['items'])) {
                    $transaction['items'] = json_decode($transaction['items'], true);
                }
                
                sendJSON($transaction ?: ['error' => 'Transaction not found'], 404);
            } else {
                $stmt = $pdo->query("SELECT * FROM facility_transactions ORDER BY date DESC");
                $transactions = $stmt->fetchAll();
                
                foreach ($transactions as &$txn) {
                    if (isset($txn['items'])) {
                        $txn['items'] = json_decode($txn['items'], true);
                    }
                }
                
                sendJSON($transactions);
            }
        } catch(PDOException $e) {
            sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'POST':
        try {
            $data = getRequestData();
            validateRequired($data, ['date', 'partyName', 'amount']);
            
            $txnType = $data['txnType'] ?? 'Expense';
            $receiptNo = '';
            $counter = null;
            if (strtolower($txnType) === 'income') {
                // Get and increment admin receipt counter only for Income
                $stmt = $pdo->prepare("SELECT value FROM settings WHERE keyName = 'adminReceiptCounter'");
                $stmt->execute();
                $counter = (int)($stmt->fetchColumn() ?: 1);
                $receiptNo = 'ADMIN-' . str_pad($counter, 3, '0', STR_PAD_LEFT);
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO facility_transactions (date, facility, txnType, partyName, 
                    description, amount, receiptNo, billNo, paymentMethod, paymentRef, 
                    items, subtotal, gstPercent, gstAmount, netAmount, paidAmount, balanceAmount)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $items = isset($data['items']) ? json_encode($data['items']) : '[]';
            
            $stmt->execute([
                $data['date'],
                $data['facility'] ?? 'Mess',
                $txnType,
                $data['partyName'],
                $data['description'] ?? '',
                $data['amount'],
                $receiptNo,
                $data['billNo'] ?? '',
                $data['paymentMethod'] ?? 'Cash',
                $data['paymentRef'] ?? '',
                $items,
                $data['subtotal'] ?? $data['amount'],
                $data['gstPercent'] ?? 0,
                $data['gstAmount'] ?? 0,
                $data['netAmount'] ?? $data['amount'],
                $data['paidAmount'] ?? $data['amount'],
                $data['balanceAmount'] ?? 0
            ]);
            
            $txnId = $pdo->lastInsertId();
            
            // Update admin receipt counter only if generated
            if ($counter !== null) {
                $pdo->prepare("UPDATE settings SET value = ? WHERE keyName = 'adminReceiptCounter'")
                    ->execute([$counter + 1]);
            }
            
            sendJSON([
                'success' => true, 
                'id' => $txnId, 
                'receiptNo' => $receiptNo
            ], 201);
            
        } catch(PDOException $e) {
            sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'PUT':
        try {
            if (!$id) sendJSON(['error' => 'Transaction ID required'], 400);
            
            $data = getRequestData();
            $items = isset($data['items']) ? json_encode($data['items']) : '[]';
            
            $stmt = $pdo->prepare("
                UPDATE facility_transactions SET 
                    date=?, facility=?, txnType=?, partyName=?, description=?, amount=?, 
                    billNo=?, paymentMethod=?, paymentRef=?, items=?, subtotal=?, 
                    gstPercent=?, gstAmount=?, netAmount=?, paidAmount=?, balanceAmount=?, 
                    updatedAt=NOW()
                WHERE id=?
            ");
            
            $stmt->execute([
                $data['date'],
                $data['facility'] ?? 'Mess',
                $data['txnType'] ?? 'Expense',
                $data['partyName'],
                $data['description'] ?? '',
                $data['amount'],
                $data['billNo'] ?? '',
                $data['paymentMethod'] ?? 'Cash',
                $data['paymentRef'] ?? '',
                $items,
                $data['subtotal'] ?? $data['amount'],
                $data['gstPercent'] ?? 0,
                $data['gstAmount'] ?? 0,
                $data['netAmount'] ?? $data['amount'],
                $data['paidAmount'] ?? $data['amount'],
                $data['balanceAmount'] ?? 0,
                $id
            ]);
            
            sendJSON(['success' => true]);
        } catch(PDOException $e) {
            sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'DELETE':
        try {
            if (!$id) sendJSON(['error' => 'Transaction ID required'], 400);
            
            $stmt = $pdo->prepare("DELETE FROM facility_transactions WHERE id = ?");
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
