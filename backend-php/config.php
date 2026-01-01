<?php
// Database configuration
define('DB_HOST', '82.25.121.27'); // Hostinger MySQL host
define('DB_NAME', 'u631305858_Hostel'); // Your MySQL database name
define('DB_USER', 'u631305858_Hostel'); // Your MySQL username
define('DB_PASS', 'Sk@001001'); // Your MySQL password

// Security
define('JWT_SECRET', 'maulana_azad_hostel_jwt_secret_key_2025_secure_random'); // JWT secret key
define('API_KEY', 'SET_A_STRONG_API_KEY_HERE'); // Optional: simple API key for non-JWT clients
define('API_VERSION', 'v1');

// CORS - Allow your desktop app to connect
header('Access-Control-Allow-Origin: *'); // In production, replace * with your domain
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection
function getDBConnection() {
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
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed']);
        exit();
    }
}

// JWT helper functions
function generateJWT($userId, $username, $role) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'userId' => $userId,
        'username' => $username,
        'role' => $role,
        'exp' => time() + (7 * 24 * 60 * 60) // 7 days
    ]);
    
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function verifyJWT($token) {
    if (!$token) {
        return false;
    }
    
    $tokenParts = explode('.', $token);
    if (count($tokenParts) !== 3) {
        return false;
    }
    
    $header = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[0]));
    $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[1]));
    $signatureProvided = $tokenParts[2];
    
    $signature = hash_hmac('sha256', $tokenParts[0] . "." . $tokenParts[1], JWT_SECRET, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    if ($base64UrlSignature !== $signatureProvided) {
        return false;
    }
    
    $payloadData = json_decode($payload, true);
    if (isset($payloadData['exp']) && $payloadData['exp'] < time()) {
        return false;
    }
    
    return $payloadData;
}

function requireAuth() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    // 1) Try JWT Bearer token
    if ($authHeader && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = $matches[1];
        $userData = verifyJWT($token);
        if ($userData) {
            return $userData;
        }
    }

    // 2) Fallback: API key via header or query string
    $apiKeyHeader = $headers['X-API-Key'] ?? $headers['x-api-key'] ?? '';
    $apiKeyQuery = $_GET['api_key'] ?? '';
    if ((API_KEY && $apiKeyHeader && hash_equals(API_KEY, $apiKeyHeader)) || (API_KEY && $apiKeyQuery && hash_equals(API_KEY, $apiKeyQuery))) {
        // Minimal user payload for API key auth
        return [ 'userId' => 0, 'username' => 'api-key', 'role' => 'API' ];
    }

    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized - Provide Bearer token or valid X-API-Key']);
    exit();
}

function sendJSON($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode(['error' => $message]);
    exit();
}
?>
