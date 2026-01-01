<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        try {
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM petty_cash WHERE id = ?");
                $stmt->execute([$id]);
                sendJSON($stmt->fetch() ?: ['error' => 'Entry not found'], 404);
            } else {
                $stmt = $pdo->query("SELECT * FROM petty_cash ORDER BY date DESC");
                sendJSON($stmt->fetchAll());
            }
        } catch(PDOException $e) {
            sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'POST':
        try {
            $data = getRequestData();
            validateRequired($data, ['date', 'particulars']);
            
            $stmt = $pdo->prepare("
                INSERT INTO petty_cash (date, particulars, voucherNo, totalExpenses, 
                    misc, conveyance, xerox, housekeeping, security, repairs, office)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['date'],
                $data['particulars'],
                $data['voucherNo'] ?? '',
                $data['totalExpenses'] ?? 0,
                $data['misc'] ?? 0,
                $data['conveyance'] ?? 0,
                $data['xerox'] ?? 0,
                $data['housekeeping'] ?? 0,
                $data['security'] ?? 0,
                $data['repairs'] ?? 0,
                $data['office'] ?? 0
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
                UPDATE petty_cash SET 
                    date=?, particulars=?, voucherNo=?, totalExpenses=?, 
                    misc=?, conveyance=?, xerox=?, housekeeping=?, security=?, repairs=?, office=?
                WHERE id=?
            ");
            
            $stmt->execute([
                $data['date'],
                $data['particulars'],
                $data['voucherNo'] ?? '',
                $data['totalExpenses'] ?? 0,
                $data['misc'] ?? 0,
                $data['conveyance'] ?? 0,
                $data['xerox'] ?? 0,
                $data['housekeeping'] ?? 0,
                $data['security'] ?? 0,
                $data['repairs'] ?? 0,
                $data['office'] ?? 0,
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
            
            $stmt = $pdo->prepare("DELETE FROM petty_cash WHERE id = ?");
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
