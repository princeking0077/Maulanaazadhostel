<?php
// Simple API index/router
// This helps route requests if you want a single entry point

// Get the request path
$request = $_SERVER['REQUEST_URI'];
$basePath = '/api'; // Change this to match your hosting path

// Remove base path and query string
$path = str_replace($basePath, '', parse_url($request, PHP_URL_PATH));

// Route to appropriate handler
switch (true) {
    case preg_match('#^/auth/?#', $path):
        require_once 'auth.php';
        break;
    
    case preg_match('#^/students/?#', $path):
        require_once 'students.php';
        break;
    
    case preg_match('#^/payments/?#', $path):
        require_once 'payments.php';
        break;
    
    case preg_match('#^/rooms/?#', $path):
        require_once 'rooms.php';
        break;
    
    case preg_match('#^/settings/?#', $path):
        require_once 'settings.php';
        break;
    
    case preg_match('#^/year-records/?#', $path):
        require_once 'year-records.php';
        break;
    
    case preg_match('#^/facility-transactions/?#', $path):
        require_once 'facility-transactions.php';
        break;
    
    case $path === '/' || $path === '':
        // API info endpoint
        header('Content-Type: application/json');
        echo json_encode([
            'name' => 'Maulana Azad Hostel Management API',
            'version' => '1.0',
            'endpoints' => [
                'POST /auth' => 'Login (username, password)',
                'GET /students' => 'Get all students',
                'POST /students' => 'Create student',
                'GET /payments' => 'Get all payments',
                'POST /payments' => 'Create payment',
                'GET /rooms' => 'Get all rooms',
                'GET /settings' => 'Get all settings',
                'GET /year-records' => 'Get year records',
                'GET /facility-transactions' => 'Get facility transactions'
            ]
        ]);
        break;
    
    default:
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Endpoint not found']);
        break;
}
?>
