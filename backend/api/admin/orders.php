<?php
/**
 * Apos'Creed — Admin: Orders Management
 */

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/auth_helper.php';
require_once __DIR__ . '/../../includes/response.php';

require_admin();
$action = $_GET['action'] ?? '';
$db     = Database::getInstance();
$body   = get_json_body();

match ($action) {
    'list'          => admin_list_orders($db),
    'single'        => admin_single_order($db),
    'update_status' => admin_update_status($db, $body),
    default         => error('Unknown action.', 404),
};

function admin_list_orders(PDO $db): void {
    $page     = max(1, (int)($_GET['page'] ?? 1));
    $per_page = 20;
    $offset   = ($page - 1) * $per_page;
    $status   = $_GET['status'] ?? null;

    $where  = $status ? ['o.status = ?'] : [];
    $params = $status ? [$status] : [];
    $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $count_stmt = $db->prepare("SELECT COUNT(*) FROM orders o $whereSQL");
    $count_stmt->execute($params);
    $total = (int)$count_stmt->fetchColumn();

    $stmt = $db->prepare(
        "SELECT o.id, o.order_number, o.status, o.payment_status, o.payment_method,
                o.total, o.created_at, o.ship_full_name, o.ship_city,
                COALESCE(u.name, o.ship_full_name) AS customer
         FROM orders o LEFT JOIN users u ON u.id = o.user_id
         $whereSQL
         ORDER BY o.created_at DESC
         LIMIT $per_page OFFSET $offset"
    );
    $stmt->execute($params);
    success([
        'orders'   => $stmt->fetchAll(),
        'total'    => $total,
        'page'     => $page,
        'per_page' => $per_page,
        'pages'    => (int)ceil($total / $per_page),
    ]);
}

function admin_single_order(PDO $db): void {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) error('id required.');
    $stmt = $db->prepare('SELECT * FROM orders WHERE id = ?');
    $stmt->execute([$id]);
    $order = $stmt->fetch();
    if (!$order) error('Not found.', 404);
    $items = $db->prepare('SELECT * FROM order_items WHERE order_id = ?');
    $items->execute([$id]);
    $order['items'] = $items->fetchAll();
    success($order);
}

function admin_update_status(PDO $db, array $body): void {
    $id     = (int)($body['id'] ?? 0);
    $status = trim($body['status'] ?? '');
    $allowed = ['pending','paid','processing','shipped','delivered','cancelled','refunded'];
    if (!$id || !in_array($status, $allowed)) error('Invalid id or status.');
    $db->prepare('UPDATE orders SET status = ? WHERE id = ?')->execute([$status, $id]);
    success(null, 'Order status updated.');
}
