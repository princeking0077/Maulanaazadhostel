<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$key = $_GET['key'] ?? null;

switch ($method) {
    case 'GET':
        try {
            if ($key) {
                $stmt = $pdo->prepare("SELECT * FROM settings WHERE keyName = ?");
                $stmt->execute([$key]);
                $setting = $stmt->fetch();
                
                sendJSON($setting ?: ['error' => 'Setting not found'], $setting ? 200 : 404);
            } else {
                $stmt = $pdo->query("SELECT * FROM settings ORDER BY keyName");
                $settings = $stmt->fetchAll();
                
                // Convert to key-value object for easier frontend consumption
                $settingsObj = [];
                foreach ($settings as $setting) {
                    $settingsObj[$setting['keyName']] = $setting['value'];
                }
                
                sendJSON($settingsObj);
            }
        } catch(PDOException $e) {
            sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'POST':
        try {
            $data = getRequestData();
            validateRequired($data, ['keyName', 'value']);
            
            // Check if setting exists
            $stmt = $pdo->prepare("SELECT id FROM settings WHERE keyName = ?");
            $stmt->execute([$data['keyName']]);
            $exists = $stmt->fetch();
            
            if ($exists) {
                sendJSON(['error' => 'Setting already exists. Use PUT to update.'], 409);
            }
            
            $stmt = $pdo->prepare("INSERT INTO settings (keyName, value) VALUES (?, ?)");
            $stmt->execute([$data['keyName'], $data['value']]);
            
            sendJSON(['success' => true, 'id' => $pdo->lastInsertId()], 201);
        } catch(PDOException $e) {
            sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'PUT':
        try {
            $data = getRequestData();
            
            if ($key) {
                // Update single setting by key
                if (!isset($data['value'])) {
                    sendJSON(['error' => 'Value is required'], 400);
                }
                
                $stmt = $pdo->prepare("
                    INSERT INTO settings (keyName, value) 
                    VALUES (?, ?) 
                    ON DUPLICATE KEY UPDATE value = ?, updatedAt = NOW()
                ");
                $stmt->execute([$key, $data['value'], $data['value']]);
                
                sendJSON(['success' => true]);
            } else {
                // Bulk update multiple settings
                if (!is_array($data)) {
                    sendJSON(['error' => 'Data must be an object of key-value pairs'], 400);
                }
                
                $pdo->beginTransaction();
                $stmt = $pdo->prepare("
                    INSERT INTO settings (keyName, value) 
                    VALUES (?, ?) 
                    ON DUPLICATE KEY UPDATE value = ?, updatedAt = NOW()
                ");
                
                foreach ($data as $keyName => $value) {
                    $stmt->execute([$keyName, $value, $value]);
                }
                
                $pdo->commit();
                sendJSON(['success' => true, 'updated' => count($data)]);
            }
        } catch(PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
        break;
        
    case 'DELETE':
        try {
            if (!$key) sendJSON(['error' => 'Setting key required'], 400);
            
            $stmt = $pdo->prepare("DELETE FROM settings WHERE keyName = ?");
            $stmt->execute([$key]);
            
            sendJSON(['success' => true]);
        } catch(PDOException $e) {
            sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
        break;
        
    default:
        sendJSON(['error' => 'Method not allowed'], 405);
}
?>
