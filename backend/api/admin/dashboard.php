<?php
/**
 * Apos'Creed — Admin: Dashboard
 */

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/auth_helper.php';
require_once __DIR__ . '/../../includes/response.php';

require_admin();
$db = Database::getInstance();

// Revenue totals
$revenue = $db->query("SELECT COALESCE(SUM(total),0) FROM orders WHERE payment_status='paid'")->fetchColumn();
$today   = $db->query("SELECT COALESCE(SUM(total),0) FROM orders WHERE payment_status='paid' AND DATE(created_at)=CURDATE()")->fetchColumn();

// Order counts by status
$status_counts = $db->query(
    "SELECT status, COUNT(*) AS cnt FROM orders GROUP BY status"
)->fetchAll(PDO::FETCH_KEY_PAIR);

// Recent 10 orders
$recent = $db->query(
    "SELECT o.id, o.order_number, o.status, o.payment_status, o.total, o.created_at,
            COALESCE(u.name, o.ship_full_name) AS customer
     FROM orders o LEFT JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC LIMIT 10"
)->fetchAll();

// Product stats
$product_count   = $db->query("SELECT COUNT(*) FROM products WHERE is_active=1")->fetchColumn();
$low_stock       = $db->query("SELECT COUNT(*) FROM products WHERE stock <= 5 AND is_digital=0 AND is_active=1")->fetchColumn();
$customer_count  = $db->query("SELECT COUNT(*) FROM users WHERE role='customer'")->fetchColumn();

success([
    'revenue'         => (float)$revenue,
    'today_revenue'   => (float)$today,
    'order_counts'    => $status_counts,
    'total_orders'    => array_sum($status_counts),
    'recent_orders'   => $recent,
    'product_count'   => (int)$product_count,
    'low_stock_count' => (int)$low_stock,
    'customer_count'  => (int)$customer_count,
]);
