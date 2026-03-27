<?php
/**
 * Apos'Creed — Global Configuration
 */

define('BASE_URL',       'https://apc.tsilizy.com');    // ← Change on deploy
define('API_VERSION',    'v1');
define('SESSION_NAME',   'aposcreed_sess');
define('CART_SESSION',   'aposcreed_cart');

// Security
define('BCRYPT_COST',    12);
define('CSRF_TOKEN_LEN', 32);

// Upload paths (relative to public_html)
define('UPLOAD_DIR',     __DIR__ . '/../../uploads/');
define('UPLOAD_URL',     BASE_URL . '/uploads/');
define('MAX_FILE_SIZE',  5 * 1024 * 1024); // 5 MB

// Allowed CORS origins
$allowed_origins = [
    BASE_URL,
    'http://localhost:5173',  // Vite dev server
    'http://localhost:3000',
];

// ----- CORS handling -----
if (isset($_SERVER['HTTP_ORIGIN'])) {
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
        header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    }
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');

// Pre-flight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_name(SESSION_NAME);
    session_start();
}
