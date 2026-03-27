<?php
/**
 * Apos'Creed — orders.php
 * Actions: create | list | single | track
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth_helper.php';
require_once __DIR__ . '/../includes/response.php';

$action = $_GET['action'] ?? (get_json_body()['action'] ?? '');
$body   = get_json_body();
$db     = Database::getInstance();

match ($action) {
    'create' => create_order($db, $body),
    'list'   => list_orders($db),
    'single' => single_order($db),
    'track'  => track_order($db),
    default  => error('Unknown action.', 404),
};

// ─────────────────────────────────────────
function generate_order_number(): string {
    return 'AC-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
}

function create_order(PDO $db, array $body): void {
    // Validate shipping info
    $required = ['full_name','phone','address','city','payment_method'];
    foreach ($required as $f) {
        if (empty($body[$f])) error("Field '$f' is required.");
    }

    $allowed_methods = ['mvola','orange_money','airtel_money','cod'];
    if (!in_array($body['payment_method'], $allowed_methods)) {
        error('Invalid payment method.');
    }

    // Resolve cart items
    $user        = get_current_user();
    $items_body  = $body['items'] ?? [];  // [{product_id, quantity}] for guest

    if ($user) {
        $stmt = $db->prepare(
            'SELECT c.quantity, p.id AS product_id, p.name, p.cover_image,
                    p.final_price, p.stock, p.is_digital, p.platform
             FROM cart c JOIN products p ON p.id = c.product_id AND p.is_active = 1
             WHERE c.user_id = ?'
        );
        $stmt->execute([$user['id']]);
        $cart_items = $stmt->fetchAll();
    } else {
        // Guest must pass items array
        if (empty($items_body)) error('Cart is empty.');
        $cart_items = [];
        foreach ($items_body as $it) {
            $pid = (int)($it['product_id'] ?? 0);
            $qty = max(1, (int)($it['quantity'] ?? 1));
            $s   = $db->prepare('SELECT id, name, cover_image, final_price, stock, is_digital, platform FROM products WHERE id = ? AND is_active = 1');
            $s->execute([$pid]);
            $p = $s->fetch();
            if (!$p) continue;
            $p['product_id'] = $p['id'];
            $p['quantity']   = $qty;
            $cart_items[]    = $p;
        }
    }

    if (empty($cart_items)) error('Cart is empty.', 400);

    // Calculate totals
    $subtotal = 0.0;
    foreach ($cart_items as $item) {
        $subtotal += (float)$item['final_price'] * (int)$item['quantity'];
    }

    // Get shipping cost from settings
    $setting = $db->prepare('SELECT setting_value FROM settings WHERE setting_key = ?');
    $setting->execute(['shipping_cost']);
    $shipping_cost = (float)($setting->fetchColumn() ?? 5000);

    $free_thresh_stmt = $db->prepare('SELECT setting_value FROM settings WHERE setting_key = ?');
    $free_thresh_stmt->execute(['free_shipping_threshold']);
    $free_thresh = (float)($free_thresh_stmt->fetchColumn() ?? 100000);

    if ($subtotal >= $free_thresh) $shipping_cost = 0.0;
    $total = $subtotal + $shipping_cost;

    // Create order
    $order_number = generate_order_number();
    $db->prepare(
        'INSERT INTO orders
          (order_number, user_id, guest_email, payment_method, subtotal, shipping_cost, total,
           ship_full_name, ship_phone, ship_address, ship_city, ship_region, ship_country, notes)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    )->execute([
        $order_number,
        $user['id'] ?? null,
        $body['email'] ?? null,
        $body['payment_method'],
        $subtotal,
        $shipping_cost,
        $total,
        $body['full_name'],
        $body['phone'],
        $body['address'],
        $body['city'],
        $body['region']  ?? null,
        $body['country'] ?? 'Madagascar',
        $body['notes']   ?? null,
    ]);

    $order_id = (int)$db->lastInsertId();

    // Insert order items
    foreach ($cart_items as $item) {
        $db->prepare(
            'INSERT INTO order_items (order_id, product_id, product_name, product_image, platform, unit_price, quantity, subtotal)
             VALUES (?,?,?,?,?,?,?,?)'
        )->execute([
            $order_id,
            $item['product_id'],
            $item['name'],
            $item['cover_image'] ?? null,
            $item['platform']    ?? null,
            (float)$item['final_price'],
            (int)$item['quantity'],
            round((float)$item['final_price'] * (int)$item['quantity'], 2),
        ]);
    }

    // Clear cart
    if ($user) {
        $db->prepare('DELETE FROM cart WHERE user_id = ?')->execute([$user['id']]);
    }

    success([
        'order_id'     => $order_id,
        'order_number' => $order_number,
        'total'        => $total,
        'payment_method' => $body['payment_method'],
    ], 'Order placed successfully.', 201);
}

function list_orders(PDO $db): void {
    $user = require_auth();
    $stmt = $db->prepare(
        'SELECT id, order_number, status, payment_method, payment_status, total, created_at
         FROM orders WHERE user_id = ?
         ORDER BY created_at DESC'
    );
    $stmt->execute([$user['id']]);
    success($stmt->fetchAll());
}

function single_order(PDO $db): void {
    $id     = (int)($_GET['id'] ?? 0);
    $number = $_GET['number'] ?? null;
    if (!$id && !$number) error('id or number required.');

    $col = $id ? 'id' : 'order_number';
    $val = $id ?: $number;

    $stmt = $db->prepare("SELECT * FROM orders WHERE $col = ?");
    $stmt->execute([$val]);
    $order = $stmt->fetch();
    if (!$order) error('Order not found.', 404);

    // Auth check — user can only see own orders unless admin
    $user = get_current_user();
    if (!$user || ($user['role'] !== 'admin' && $order['user_id'] !== $user['id'])) {
        error('Forbidden.', 403);
    }

    // Items
    $items = $db->prepare('SELECT * FROM order_items WHERE order_id = ?');
    $items->execute([$order['id']]);
    $order['items'] = $items->fetchAll();

    success($order);
}

function track_order(PDO $db): void {
    $number = $_GET['number'] ?? '';
    $email  = strtolower(trim($_GET['email'] ?? ''));
    if (!$number) error('order number required.');

    $stmt = $db->prepare(
        'SELECT id, order_number, status, payment_status, payment_method,
                total, ship_full_name, ship_city, created_at, updated_at
         FROM orders WHERE order_number = ?'
    );
    $stmt->execute([$number]);
    $order = $stmt->fetch();

    if (!$order) error('Order not found.', 404);

    // Allow guest tracking by email; logged-in users just need the order number
    $user = get_current_user();
    if (!$user) {
        if (!$email || $email !== strtolower($order['guest_email'] ?? '')) {
            error('Email does not match.', 403);
        }
    }

    success($order);
}
