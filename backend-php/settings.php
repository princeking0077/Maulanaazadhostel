<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = requireAuth();
$pdo = getDBConnection();

// GET all settings or by key
if ($method === 'GET' && !isset($_GET['id'])) {
    if (isset($_GET['key'])) {
        $stmt = $pdo->prepare('SELECT * FROM settings WHERE `key` = ?');
        $stmt->execute([$_GET['key']]);
        $setting = $stmt->fetch();
        
        if (!$setting) {
            sendError('Setting not found', 404);
        }
        
        sendJSON($setting);
    } else {
        $stmt = $pdo->query('SELECT * FROM settings ORDER BY `key`');
        $settings = $stmt->fetchAll();
        sendJSON($settings);
    }
}

// GET single setting by ID
if ($method === 'GET' && isset($_GET['id'])) {
    $stmt = $pdo->prepare('SELECT * FROM settings WHERE id = ?');
    $stmt->execute([$_GET['id']]);
    $setting = $stmt->fetch();
    
    if (!$setting) {
        sendError('Setting not found', 404);
    }
    
    sendJSON($setting);
}

// CREATE or UPDATE setting
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['key']) || !isset($data['value'])) {
        sendError('key and value are required', 400);
    }
    
    try {
        $stmt = $pdo->prepare('
            INSERT INTO settings (`key`, `value`, description)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE `value` = ?, description = ?
        ');
        
        $stmt->execute([
            $data['key'],
            $data['value'],
            $data['description'] ?? '',
            $data['value'],
            $data['description'] ?? ''
        ]);
        
        sendJSON(['message' => 'Setting saved successfully'], 201);
    } catch (PDOException $e) {
        sendError('Failed to save setting: ' . $e->getMessage(), 500);
    }
}

// UPDATE setting
if ($method === 'PUT' && isset($_GET['id'])) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $_GET['id'];
    
    $stmt = $pdo->prepare('UPDATE settings SET `value` = ?, description = ? WHERE id = ?');
    $stmt->execute([
        $data['value'],
        $data['description'] ?? '',
        $id
    ]);
    
    sendJSON(['message' => 'Setting updated successfully']);
}

// DELETE setting
if ($method === 'DELETE' && isset($_GET['id'])) {
    $id = $_GET['id'];
    
    $stmt = $pdo->prepare('DELETE FROM settings WHERE id = ?');
    $stmt->execute([$id]);
    
    sendJSON(['message' => 'Setting deleted successfully']);
}
?>
