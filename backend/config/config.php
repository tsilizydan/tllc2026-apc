<?php
/**
 * Apos'Creed — Global Configuration
 * ============================================================
 * MUST be the first file required by every API endpoint.
 * Handles: error suppression, output buffering, CORS, session.
 * ============================================================
 */

// ── 1. Silence all PHP errors / warnings so they never corrupt JSON ──
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(0);

// ── 2. Buffer all output so an accidental echo can't break JSON ──────
ob_start();

// ── 3. Register a shutdown handler that catches fatal PHP errors ──────
//    (e.g. parse errors on PHP < 8.0, out-of-memory, etc.)
register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        ob_clean(); // discard any partial HTML output
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
        }
        echo json_encode([
            'success' => false,
            'message' => 'Server error.',
            'error'   => $error['message'], // shows in API but hidden from browser console
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } else {
        ob_end_flush(); // normal path — flush buffered output
    }
});

// ── 4. Application constants ──────────────────────────────────────────
define('BASE_URL',       'https://apc.tsilizy.com');
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

// ── 5. CORS ───────────────────────────────────────────────────────────
$allowed_origins = [
    BASE_URL,
    'https://www.apc.tsilizy.com',
    'http://localhost:5173',
    'http://localhost:3000',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin === '' || in_array($origin, $allowed_origins, true)) {
    // Same-origin or trusted origin — allow
    if ($origin !== '') {
        header('Access-Control-Allow-Origin: ' . $origin);
    }
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');

// Pre-flight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    ob_end_clean();
    exit;
}

// ── 6. Session ────────────────────────────────────────────────────────
if (session_status() === PHP_SESSION_NONE) {
    session_name(SESSION_NAME);
    session_start();
}
