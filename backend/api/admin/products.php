<?php
/**
 * Apos'Creed — Admin: Products CRUD
 */

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/auth_helper.php';
require_once __DIR__ . '/../../includes/response.php';

require_admin();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$db     = Database::getInstance();
$body   = get_json_body();

match (true) {
    $method === 'GET'  && $action === 'list'   => admin_list_products($db),
    $method === 'GET'  && $action === 'single' => admin_single_product($db),
    $method === 'POST' && $action === 'create' => admin_create_product($db, $body),
    $method === 'POST' && $action === 'update' => admin_update_product($db, $body),
    $method === 'POST' && $action === 'delete' => admin_delete_product($db, $body),
    default => error('Unknown action.', 404),
};

function admin_list_products(PDO $db): void {
    $page     = max(1, (int)($_GET['page'] ?? 1));
    $per_page = 20;
    $offset   = ($page - 1) * $per_page;
    $search   = trim($_GET['search'] ?? '');

    $where  = [];
    $params = [];
    if ($search !== '') {
        $where[]  = 'p.name LIKE ?';
        $params[] = '%' . $search . '%';
    }
    $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $total = (int)$db->prepare("SELECT COUNT(*) FROM products p $whereSQL")->execute($params) ?
             $db->prepare("SELECT COUNT(*) FROM products p $whereSQL")->execute($params) : 0;
    $count_stmt = $db->prepare("SELECT COUNT(*) FROM products p $whereSQL");
    $count_stmt->execute($params);
    $total = (int)$count_stmt->fetchColumn();

    $stmt = $db->prepare(
        "SELECT p.id, p.name, p.slug, p.price, p.discount_percent, p.final_price,
                p.stock, p.is_active, p.is_featured, p.platform, p.cover_image,
                c.name AS category_name
         FROM products p JOIN categories c ON c.id = p.category_id
         $whereSQL
         ORDER BY p.created_at DESC
         LIMIT $per_page OFFSET $offset"
    );
    $stmt->execute($params);

    success([
        'products'   => $stmt->fetchAll(),
        'total'      => $total,
        'page'       => $page,
        'per_page'   => $per_page,
        'pages'      => (int)ceil($total / $per_page),
    ]);
}

function admin_single_product(PDO $db): void {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) error('id required.');
    $stmt = $db->prepare('SELECT * FROM products WHERE id = ?');
    $stmt->execute([$id]);
    $p = $stmt->fetch();
    if (!$p) error('Not found.', 404);
    success($p);
}

function admin_create_product(PDO $db, array $body): void {
    $required = ['name','category_id','price'];
    foreach ($required as $f) {
        if (!isset($body[$f]) || $body[$f] === '') error("Field '$f' is required.");
    }

    $slug = slugify($body['name']);
    // Ensure unique slug
    $check = $db->prepare('SELECT id FROM products WHERE slug = ?');
    $check->execute([$slug]);
    if ($check->fetch()) $slug .= '-' . substr(uniqid(), -4);

    $db->prepare(
        'INSERT INTO products (category_id,name,slug,short_description,description,price,discount_percent,
          platform,is_digital,stock,sku,cover_image,release_date,publisher,developer,age_rating,is_featured,is_active)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    )->execute([
        (int)$body['category_id'],
        trim($body['name']),
        $slug,
        $body['short_description'] ?? null,
        $body['description']       ?? null,
        (float)$body['price'],
        (int)($body['discount_percent'] ?? 0),
        $body['platform']     ?? 'All',
        (int)($body['is_digital'] ?? 0),
        (int)($body['stock']     ?? 0),
        $body['sku']          ?? null,
        $body['cover_image']  ?? null,
        $body['release_date'] ?? null,
        $body['publisher']    ?? null,
        $body['developer']    ?? null,
        $body['age_rating']   ?? null,
        (int)($body['is_featured'] ?? 0),
        (int)($body['is_active']   ?? 1),
    ]);

    success(['id' => (int)$db->lastInsertId()], 'Product created.', 201);
}

function admin_update_product(PDO $db, array $body): void {
    $id = (int)($body['id'] ?? 0);
    if (!$id) error('id required.');

    $allowed = ['category_id','name','short_description','description','price','discount_percent',
                'platform','is_digital','stock','sku','cover_image','release_date','publisher',
                'developer','age_rating','is_featured','is_active'];
    $sets = []; $params = [];
    foreach ($allowed as $col) {
        if (array_key_exists($col, $body)) {
            $sets[]   = "$col = ?";
            $params[] = $body[$col];
        }
    }
    if (!$sets) error('Nothing to update.');
    $params[] = $id;
    $db->prepare('UPDATE products SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($params);
    success(null, 'Product updated.');
}

function admin_delete_product(PDO $db, array $body): void {
    $id = (int)($body['id'] ?? 0);
    if (!$id) error('id required.');
    $db->prepare('UPDATE products SET is_active = 0 WHERE id = ?')->execute([$id]);
    success(null, 'Product deactivated.');
}

function slugify(string $text): string {
    $text = strtolower(trim($text));
    $text = preg_replace('/[^a-z0-9\-]/', '-', $text);
    return preg_replace('/-+/', '-', trim($text, '-'));
}
