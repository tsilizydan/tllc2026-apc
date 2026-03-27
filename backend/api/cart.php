<?php
/**
 * Apos'Creed — cart.php
 * Actions: get | add | update | remove | clear
 * Guest cart stored in DB with session_id; merged into user cart on login.
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth_helper.php';
require_once __DIR__ . '/../includes/response.php';

$action = $_GET['action'] ?? (get_json_body()['action'] ?? '');
$body   = get_json_body();
$db     = Database::getInstance();

match ($action) {
    'get'    => get_cart($db),
    'add'    => add_to_cart($db, $body),
    'update' => update_cart($db, $body),
    'remove' => remove_from_cart($db, $body),
    'clear'  => clear_cart($db),
    default  => error('Unknown action.', 404),
};

// ─────────────────────────────────────────
function get_cart_identifier(): array {
    $user = get_current_user();
    if ($user) return ['user_id' => $user['id'], 'session_id' => null];

    if (empty($_SESSION[CART_SESSION])) {
        $_SESSION[CART_SESSION] = bin2hex(random_bytes(16));
    }
    return ['user_id' => null, 'session_id' => $_SESSION[CART_SESSION]];
}

function cart_where(array $ident): array {
    if ($ident['user_id']) {
        return ['user_id = ?', [$ident['user_id']]];
    }
    return ['session_id = ?', [$ident['session_id']]];
}

function get_cart(PDO $db): void {
    $ident = get_cart_identifier();
    [$where, $params] = cart_where($ident);

    $stmt = $db->prepare(
        "SELECT c.id, c.product_id, c.quantity,
                p.name, p.cover_image, p.price, p.discount_percent,
                p.final_price, p.platform, p.is_digital, p.stock
         FROM cart c
         JOIN products p ON p.id = c.product_id AND p.is_active = 1
         WHERE c.$where
         ORDER BY c.created_at ASC"
    );
    $stmt->execute($params);
    $items = $stmt->fetchAll();

    $subtotal = 0.0;
    foreach ($items as &$item) {
        $item['final_price'] = (float)$item['final_price'];
        $item['line_total']  = round($item['final_price'] * $item['quantity'], 2);
        $subtotal           += $item['line_total'];
    }

    success(['items' => $items, 'subtotal' => round($subtotal, 2), 'count' => count($items)]);
}

function add_to_cart(PDO $db, array $body): void {
    $product_id = (int)($body['product_id'] ?? 0);
    $quantity   = max(1, (int)($body['quantity'] ?? 1));

    if (!$product_id) error('product_id required.');

    // Check product exists & has stock
    $prod = $db->prepare('SELECT id, stock, is_digital FROM products WHERE id = ? AND is_active = 1');
    $prod->execute([$product_id]);
    $p = $prod->fetch();
    if (!$p) error('Product not found.', 404);
    if (!$p['is_digital'] && $p['stock'] < $quantity) error('Insufficient stock.');

    $ident = get_cart_identifier();
    [$where, $params] = cart_where($ident);

    // Check if already in cart
    $check = $db->prepare("SELECT id, quantity FROM cart WHERE $where AND product_id = ?");
    $check->execute([...$params, $product_id]);
    $existing = $check->fetch();

    if ($existing) {
        $newQty = $existing['quantity'] + $quantity;
        if (!$p['is_digital'] && $p['stock'] < $newQty) $newQty = $p['stock'];
        $db->prepare('UPDATE cart SET quantity = ? WHERE id = ?')->execute([$newQty, $existing['id']]);
    } else {
        $db->prepare(
            'INSERT INTO cart (user_id, session_id, product_id, quantity) VALUES (?,?,?,?)'
        )->execute([$ident['user_id'], $ident['session_id'], $product_id, $quantity]);
    }

    get_cart($db);
}

function update_cart(PDO $db, array $body): void {
    $cart_id  = (int)($body['cart_id']  ?? 0);
    $quantity = (int)($body['quantity'] ?? 0);

    if (!$cart_id) error('cart_id required.');

    if ($quantity <= 0) {
        $db->prepare('DELETE FROM cart WHERE id = ?')->execute([$cart_id]);
    } else {
        $db->prepare('UPDATE cart SET quantity = ? WHERE id = ?')->execute([$quantity, $cart_id]);
    }

    get_cart($db);
}

function remove_from_cart(PDO $db, array $body): void {
    $cart_id = (int)($body['cart_id'] ?? 0);
    if (!$cart_id) error('cart_id required.');
    $db->prepare('DELETE FROM cart WHERE id = ?')->execute([$cart_id]);
    get_cart($db);
}

function clear_cart(PDO $db): void {
    $ident = get_cart_identifier();
    [$where, $params] = cart_where($ident);
    $db->prepare("DELETE FROM cart WHERE $where")->execute($params);
    success(['items' => [], 'subtotal' => 0, 'count' => 0]);
}
