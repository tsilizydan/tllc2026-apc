<?php
/**
 * Apos'Creed — Auth Helper (session-based)
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/response.php';

function get_current_user(): ?array {
    if (!empty($_SESSION['user_id'])) {
        return [
            'id'    => (int)$_SESSION['user_id'],
            'email' => $_SESSION['user_email'] ?? '',
            'name'  => $_SESSION['user_name']  ?? '',
            'role'  => $_SESSION['user_role']  ?? 'customer',
        ];
    }
    return null;
}

function require_auth(): array {
    $user = get_current_user();
    if (!$user) {
        error('Authentication required.', 401);
    }
    return $user;
}

function require_admin(): array {
    $user = require_auth();
    if ($user['role'] !== 'admin') {
        error('Forbidden — admin only.', 403);
    }
    return $user;
}

function set_session_user(array $user): void {
    $_SESSION['user_id']    = $user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_name']  = $user['name'];
    $_SESSION['user_role']  = $user['role'];
}

function clear_session_user(): void {
    unset($_SESSION['user_id'], $_SESSION['user_email'], $_SESSION['user_name'], $_SESSION['user_role']);
    session_regenerate_id(true);
}

function hash_password(string $password): string {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);
}

function verify_password(string $password, string $hash): bool {
    return password_verify($password, $hash);
}

function generate_token(int $length = 32): string {
    return bin2hex(random_bytes($length));
}
