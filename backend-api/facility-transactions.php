<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'list':
        if ($method === 'GET') {
            try {
                $query = 'SELECT * FROM facility_transactions';
                $params = [];
                
                if (isset($_GET['facility'])) {
                    $query .= ' WHERE facility = ?';
                    $params[] = $_GET['facility'];
                }
                
                $query .= ' ORDER BY date DESC, id DESC';
                
                $stmt = $pdo->prepare($query);
                $stmt->execute($params);
                $transactions = $stmt->fetchAll();
                
                sendJSON($transactions);
            } catch (PDOException $e) {
                sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
            }
        }
        break;
        
    case 'by-facility':
        if ($method === 'GET') {
            try {
                $facility = $_GET['facility'] ?? '';
                if (!$facility) {
                    sendJSON(['error' => 'Facility parameter required'], 400);
                    exit;
                }
                
                $stmt = $pdo->prepare('SELECT * FROM facility_transactions WHERE facility = ? ORDER BY date DESC');
                $stmt->execute([$facility]);
                $transactions = $stmt->fetchAll();
                
                sendJSON($transactions);
            } catch (PDOException $e) {
                sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
            }
        }
        break;
        
    case 'create':
        if ($method === 'POST') {
            try {
                $data = getRequestData();
                
                // Handle items JSON
                $items = null;
                if (isset($data['items']) && is_array($data['items'])) {
                    $items = json_encode($data['items']);
                }
                
                $stmt = $pdo->prepare('
                    INSERT INTO facility_transactions (
                        facility, txnType, date, amount, partyName, description, receiptNo,
                        billNo, paymentMethod, paymentRef, items, subtotal, gstPercent,
                        gstAmount, netAmount, paidAmount, balanceAmount, utilityType,
                        periodFrom, periodTo, meterUnits, workerRole, createdAt, updatedAt
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ');
                
                $stmt->execute([
                    $data['facility'] ?? 'Mess',
                    $data['txnType'] ?? 'Expense',
                    $data['date'],
                    $data['amount'] ?? $data['netAmount'] ?? 0,
                    $data['partyName'],
                    $data['description'] ?? '',
                    $data['receiptNo'] ?? null,
                    $data['billNo'] ?? null,
                    $data['paymentMethod'] ?? 'Cash',
                    $data['paymentRef'] ?? null,
                    $items,
                    $data['subtotal'] ?? 0,
                    $data['gstPercent'] ?? 0,
                    $data['gstAmount'] ?? 0,
                    $data['netAmount'] ?? $data['amount'] ?? 0,
                    $data['paidAmount'] ?? $data['netAmount'] ?? $data['amount'] ?? 0,
                    $data['balanceAmount'] ?? 0,
                    $data['utilityType'] ?? null,
                    $data['periodFrom'] ?? null,
                    $data['periodTo'] ?? null,
                    $data['meterUnits'] ?? null,
                    $data['workerRole'] ?? null
                ]);
                
                sendJSON(['success' => true, 'id' => $pdo->lastInsertId()], 201);
            } catch (PDOException $e) {
                sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
            }
        }
        break;
        
    default:
        sendJSON(['error' => 'Invalid action'], 400);
}
?>
