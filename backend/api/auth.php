<?php
/**
 * Apos'Creed — auth.php
 * Actions: register | login | logout | me | forgot_password | reset_password
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth_helper.php';
require_once __DIR__ . '/../includes/response.php';

$action = $_GET['action'] ?? $_POST['action'] ?? (get_json_body()['action'] ?? '');
$body   = get_json_body();
$db     = Database::getInstance();

match ($action) {
    'register'       => register($db, $body),
    'login'          => login($db, $body),
    'logout'         => logout(),
    'me'             => me(),
    'forgot_password'=> forgot_password($db, $body),
    'reset_password' => reset_password($db, $body),
    default          => error('Unknown action.', 404),
};

// ─────────────────────────────────────────
function register(PDO $db, array $body): void {
    $name     = trim($body['name'] ?? '');
    $email    = strtolower(trim($body['email'] ?? ''));
    $password = $body['password'] ?? '';

    if (!$name || !$email || !$password) {
        error('Name, email and password are required.');
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        error('Invalid email address.');
    }
    if (strlen($password) < 8) {
        error('Password must be at least 8 characters.');
    }

    $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        error('Email already registered.', 409);
    }

    $hash = hash_password($password);
    $token = generate_token();

    $stmt = $db->prepare(
        'INSERT INTO users (name, email, password_hash, verify_token, email_verified) VALUES (?,?,?,?,1)'
    );
    $stmt->execute([$name, $email, $hash, $token]);
    $userId = (int)$db->lastInsertId();

    $user = ['id' => $userId, 'email' => $email, 'name' => $name, 'role' => 'customer'];
    set_session_user($user);

    success($user, 'Registration successful.', 201);
}

function login(PDO $db, array $body): void {
    $email    = strtolower(trim($body['email'] ?? ''));
    $password = $body['password'] ?? '';

    if (!$email || !$password) {
        error('Email and password are required.');
    }

    $stmt = $db->prepare('SELECT id, name, email, password_hash, role FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $row = $stmt->fetch();

    if (!$row || !verify_password($password, $row['password_hash'])) {
        error('Invalid credentials.', 401);
    }

    $user = ['id' => (int)$row['id'], 'email' => $row['email'], 'name' => $row['name'], 'role' => $row['role']];
    set_session_user($user);

    // Merge guest cart into user cart
    merge_guest_cart($db, (int)$row['id']);

    success($user, 'Login successful.');
}

function logout(): void {
    clear_session_user();
    success(null, 'Logged out.');
}

function me(): void {
    $user = get_current_user();
    if (!$user) error('Not authenticated.', 401);
    success($user);
}

function forgot_password(PDO $db, array $body): void {
    $email = strtolower(trim($body['email'] ?? ''));
    if (!$email) error('Email required.');

    $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $row = $stmt->fetch();

    // Always return success to not leak user existence
    if ($row) {
        $token   = generate_token();
        $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));
        $db->prepare('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?')
           ->execute([$token, $expires, $row['id']]);

        // In production: send email with reset link
        // mail($email, 'Reset your password', BASE_URL . '/#/reset-password?token=' . $token);
    }

    success(null, 'If that email is registered, you will receive a reset link.');
}

function reset_password(PDO $db, array $body): void {
    $token    = trim($body['token'] ?? '');
    $password = $body['password'] ?? '';

    if (!$token || strlen($password) < 8) {
        error('Token and password (min 8 chars) are required.');
    }

    $stmt = $db->prepare(
        'SELECT id FROM users WHERE reset_token = ? AND reset_expires > NOW()'
    );
    $stmt->execute([$token]);
    $row = $stmt->fetch();

    if (!$row) error('Invalid or expired reset token.', 400);

    $hash = hash_password($password);
    $db->prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?')
       ->execute([$hash, $row['id']]);

    success(null, 'Password updated successfully.');
}

function merge_guest_cart(PDO $db, int $userId): void {
    $sessionId = $_SESSION[CART_SESSION] ?? null;
    if (!$sessionId) return;

    $stmt = $db->prepare('SELECT product_id, quantity FROM cart WHERE session_id = ?');
    $stmt->execute([$sessionId]);
    $items = $stmt->fetchAll();

    foreach ($items as $item) {
        $check = $db->prepare('SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?');
        $check->execute([$userId, $item['product_id']]);
        $existing = $check->fetch();

        if ($existing) {
            $db->prepare('UPDATE cart SET quantity = quantity + ? WHERE id = ?')
               ->execute([$item['quantity'], $existing['id']]);
        } else {
            $db->prepare('INSERT INTO cart (user_id, product_id, quantity) VALUES (?,?,?)')
               ->execute([$userId, $item['product_id'], $item['quantity']]);
        }
    }

    $db->prepare('DELETE FROM cart WHERE session_id = ?')->execute([$sessionId]);
    unset($_SESSION[CART_SESSION]);
}
