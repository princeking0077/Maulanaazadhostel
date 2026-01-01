<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = getRequestData();
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        sendJSON(['error' => 'Username and password required'], 400);
    }
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password'])) {
            // Remove password from response
            unset($user['password']);
            
            sendJSON([
                'success' => true,
                'user' => $user,
                'token' => base64_encode($username . ':' . time())
            ]);
        } else {
            sendJSON(['error' => 'Invalid username or password'], 401);
        }
    } catch(PDOException $e) {
        sendJSON(['error' => 'Authentication failed'], 500);
    }
} else if ($method === 'GET' && isset($_GET['action']) && $_GET['action'] === 'logout') {
    sendJSON(['success' => true, 'message' => 'Logged out successfully']);
} else {
    sendJSON(['error' => 'Method not allowed'], 405);
}
?>
