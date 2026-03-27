<?php
/**
 * Apos'Creed — JSON Response Helper
 */

/**
 * @return never
 */
function json_response(mixed $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * @return never
 */
function success(mixed $data = null, string $message = 'OK', int $status = 200): never {
    json_response(['success' => true, 'message' => $message, 'data' => $data], $status);
}

/**
 * @return never
 */
function error(string $message, int $status = 400, mixed $errors = null): never {
    $payload = ['success' => false, 'message' => $message];
    if ($errors !== null) $payload['errors'] = $errors;
    json_response($payload, $status);
}

function get_json_body(): array {
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}
