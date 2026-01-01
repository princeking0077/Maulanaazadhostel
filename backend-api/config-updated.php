-- Updated config.php with correct credentials
-- Upload this to: public_html/api/config.php

<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database credentials - UPDATED WITH YOUR ACTUAL CREDENTIALS
define('DB_HOST', 'localhost');
define('DB_NAME', 'u123456_hostel_management'); // Replace with YOUR actual database name
define('DB_USER', 'u123456_hosteluser');        // Replace with YOUR actual database username
define('DB_PASS', 'Sk@001001');                 // Your password that you confirmed works

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}

// Helper function to send JSON response
function sendJSON($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

// Helper function to get request data
function getRequestData() {
    $data = json_decode(file_get_contents('php://input'), true);
    return $data ?? [];
}

// Helper function to validate required fields
function validateRequired($data, $fields) {
    foreach ($fields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            sendJSON(['error' => "Field '$field' is required"], 400);
        }
    }
}
?>
