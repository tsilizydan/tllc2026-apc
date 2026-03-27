<?php
/**
 * Apos'Creed — reviews.php
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth_helper.php';
require_once __DIR__ . '/../includes/response.php';

$action = $_GET['action'] ?? (get_json_body()['action'] ?? '');
$body   = get_json_body();
$db     = Database::getInstance();

match ($action) {
    'list' => list_reviews($db),
    'add'  => add_review($db, $body),
    default => error('Unknown action.', 404),
};

function list_reviews(PDO $db): void {
    $product_id = (int)($_GET['product_id'] ?? 0);
    if (!$product_id) error('product_id required.');
    $page     = max(1, (int)($_GET['page'] ?? 1));
    $per_page = 10;
    $offset   = ($page - 1) * $per_page;

    $total = (int)$db->prepare('SELECT COUNT(*) FROM reviews WHERE product_id = ? AND is_approved = 1')
                     ->execute([$product_id]) ? $db->query("SELECT FOUND_ROWS()")->fetchColumn() : 0;

    $count_stmt = $db->prepare('SELECT COUNT(*) FROM reviews WHERE product_id = ? AND is_approved = 1');
    $count_stmt->execute([$product_id]);
    $total = (int)$count_stmt->fetchColumn();

    $stmt = $db->prepare(
        'SELECT r.id, r.rating, r.title, r.body, r.is_verified, r.created_at,
                u.name AS user_name
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         WHERE r.product_id = ? AND r.is_approved = 1
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?'
    );
    $stmt->execute([$product_id, $per_page, $offset]);

    success([
        'reviews'    => $stmt->fetchAll(),
        'total'      => $total,
        'page'       => $page,
        'per_page'   => $per_page,
    ]);
}

function add_review(PDO $db, array $body): void {
    $user       = require_auth();
    $product_id = (int)($body['product_id'] ?? 0);
    $rating     = min(5, max(1, (int)($body['rating'] ?? 5)));
    $title      = trim($body['title'] ?? '');
    $review_body = trim($body['body'] ?? '');

    if (!$product_id) error('product_id required.');

    // Check duplicate
    $dup = $db->prepare('SELECT id FROM reviews WHERE product_id = ? AND user_id = ?');
    $dup->execute([$product_id, $user['id']]);
    if ($dup->fetch()) error('You have already reviewed this product.', 409);

    // Check verified purchase
    $verified = $db->prepare(
        'SELECT oi.id FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.user_id = ? AND oi.product_id = ? AND o.payment_status = "paid"
         LIMIT 1'
    );
    $verified->execute([$user['id'], $product_id]);
    $is_verified = $verified->fetch() ? 1 : 0;

    $db->prepare(
        'INSERT INTO reviews (product_id, user_id, rating, title, body, is_verified)
         VALUES (?,?,?,?,?,?)'
    )->execute([$product_id, $user['id'], $rating, $title, $review_body, $is_verified]);

    success(null, 'Review submitted.', 201);
}
