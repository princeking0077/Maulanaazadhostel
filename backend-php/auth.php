<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDBConnection();

// Login endpoint (no auth required)
if ($method === 'POST' && (!isset($_GET['action']) || $_GET['action'] === 'login')) {
    $data = json_decode(file_get_contents('php://input'), true);
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';
    
    if (!$username || !$password) {
        sendError('Username and password required', 400);
    }
    
    $stmt = $pdo->prepare('SELECT * FROM users WHERE username = ?');
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password'])) {
        sendError('Invalid credentials', 401);
    }
    
    $token = generateJWT($user['id'], $user['username'], $user['role']);
    
    sendJSON([
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role']
        ]
    ]);
}

// All other endpoints require authentication
$user = requireAuth();

// GET all users
if ($method === 'GET' && !isset($_GET['id'])) {
    $stmt = $pdo->query('SELECT id, username, role, name, email, created_at FROM users ORDER BY id DESC');
    $users = $stmt->fetchAll();
    sendJSON($users);
}

// GET single user
if ($method === 'GET' && isset($_GET['id'])) {
    $stmt = $pdo->prepare('SELECT id, username, role, name, email, created_at FROM users WHERE id = ?');
    $stmt->execute([$_GET['id']]);
    $user = $stmt->fetch();
    
    if (!$user) {
        sendError('User not found', 404);
    }
    
    sendJSON($user);
}

// CREATE user
if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'create') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';
    $role = $data['role'] ?? 'Staff';
    $name = $data['name'] ?? '';
    $email = $data['email'] ?? '';
    
    if (!$username || !$password || !$name || !$email) {
        sendError('All fields required', 400);
    }
    
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    try {
        $stmt = $pdo->prepare('INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$username, $hashedPassword, $role, $name, $email]);
        
        sendJSON(['id' => $pdo->lastInsertId(), 'message' => 'User created successfully'], 201);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            sendError('Username already exists', 409);
        }
        sendError('Failed to create user', 500);
    }
}

// UPDATE user
if ($method === 'PUT' && isset($_GET['id'])) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $_GET['id'];
    
    $name = $data['name'] ?? '';
    $email = $data['email'] ?? '';
    $role = $data['role'] ?? 'Staff';
    
    if (!$name || !$email) {
        sendError('Name and email required', 400);
    }
    
    $stmt = $pdo->prepare('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?');
    $stmt->execute([$name, $email, $role, $id]);
    
    sendJSON(['message' => 'User updated successfully']);
}

// DELETE user
if ($method === 'DELETE' && isset($_GET['id'])) {
    $id = $_GET['id'];
    
    // Prevent deleting yourself or the main admin
    if ($id == $user['userId'] || $id == 1) {
        sendError('Cannot delete this user', 403);
    }
    
    $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
    $stmt->execute([$id]);
    
    sendJSON(['message' => 'User deleted successfully']);
}
?>
