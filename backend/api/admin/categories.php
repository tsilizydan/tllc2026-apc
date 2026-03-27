<?php
/**
 * Apos'Creed — Admin: Categories CRUD
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
    'list'   => list_cats($db),
    'create' => create_cat($db, $body),
    'update' => update_cat($db, $body),
    'delete' => delete_cat($db, $body),
    default  => error('Unknown action.', 404),
};

function list_cats(PDO $db): void {
    $stmt = $db->query('SELECT * FROM categories ORDER BY sort_order ASC');
    success($stmt->fetchAll());
}
function create_cat(PDO $db, array $body): void {
    if (empty($body['name'])) error('name required.');
    $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', trim($body['name'])));
    $db->prepare('INSERT INTO categories (name,slug,description,image,sort_order) VALUES (?,?,?,?,?)')->execute([
        $body['name'], $slug, $body['description'] ?? null, $body['image'] ?? null, (int)($body['sort_order'] ?? 0)
    ]);
    success(['id' => (int)$db->lastInsertId()], 'Category created.', 201);
}
function update_cat(PDO $db, array $body): void {
    $id = (int)($body['id'] ?? 0);
    if (!$id) error('id required.');
    $db->prepare('UPDATE categories SET name=?,description=?,image=?,sort_order=?,is_active=? WHERE id=?')
       ->execute([$body['name'] ?? '', $body['description'] ?? null, $body['image'] ?? null, (int)($body['sort_order'] ?? 0), (int)($body['is_active'] ?? 1), $id]);
    success(null, 'Updated.');
}
function delete_cat(PDO $db, array $body): void {
    $id = (int)($body['id'] ?? 0);
    if (!$id) error('id required.');
    $db->prepare('UPDATE categories SET is_active = 0 WHERE id = ?')->execute([$id]);
    success(null, 'Deactivated.');
}
