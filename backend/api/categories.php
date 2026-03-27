<?php
/**
 * Apos'Creed — categories.php
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/response.php';

$action = $_GET['action'] ?? 'list';
$db     = Database::getInstance();

match ($action) {
    'list'   => list_categories($db),
    'single' => single_category($db),
    default  => error('Unknown action.', 404),
};

function list_categories(PDO $db): void {
    $stmt = $db->prepare(
        'SELECT id, name, slug, description, image, sort_order
         FROM categories WHERE is_active = 1
         ORDER BY sort_order ASC'
    );
    $stmt->execute();
    success($stmt->fetchAll());
}

function single_category(PDO $db): void {
    $slug = $_GET['slug'] ?? null;
    if (!$slug) error('slug required.');
    $stmt = $db->prepare('SELECT * FROM categories WHERE slug = ? AND is_active = 1');
    $stmt->execute([$slug]);
    $cat = $stmt->fetch();
    if (!$cat) error('Category not found.', 404);
    success($cat);
}
