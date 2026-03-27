<?php
/**
 * Apos'Creed — products.php
 * Actions: list | single | featured | related | search
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/response.php';

$action = $_GET['action'] ?? 'list';
$db     = Database::getInstance();

match ($action) {
    'list'     => list_products($db),
    'single'   => single_product($db),
    'featured' => featured_products($db),
    'related'  => related_products($db),
    'search'   => search_products($db),
    default    => error('Unknown action.', 404),
};

// ─────────────────────────────────────────
function list_products(PDO $db): void {
    $page       = max(1, (int)($_GET['page']       ?? 1));
    $per_page   = min(48, max(4, (int)($_GET['per_page'] ?? 12)));
    $category   = $_GET['category']   ?? null;
    $platform   = $_GET['platform']   ?? null;
    $min_price  = $_GET['min_price']  ?? null;
    $max_price  = $_GET['max_price']  ?? null;
    $sort       = $_GET['sort']       ?? 'newest';
    $search     = trim($_GET['search'] ?? '');

    $where  = ['p.is_active = 1'];
    $params = [];

    if ($category) {
        $where[]  = 'c.slug = ?';
        $params[] = $category;
    }
    if ($platform) {
        $where[]  = 'FIND_IN_SET(?, p.platform)';
        $params[] = $platform;
    }
    if ($min_price !== null) {
        $where[]  = 'p.final_price >= ?';
        $params[] = (float)$min_price;
    }
    if ($max_price !== null) {
        $where[]  = 'p.final_price <= ?';
        $params[] = (float)$max_price;
    }
    if ($search !== '') {
        $where[]  = '(p.name LIKE ? OR p.short_description LIKE ?)';
        $like     = '%' . $search . '%';
        $params[] = $like;
        $params[] = $like;
    }

    $order = match ($sort) {
        'price_asc'  => 'p.final_price ASC',
        'price_desc' => 'p.final_price DESC',
        'popular'    => 'p.views DESC',
        'discount'   => 'p.discount_percent DESC',
        default      => 'p.created_at DESC',
    };

    $whereSQL = 'WHERE ' . implode(' AND ', $where);
    $offset   = ($page - 1) * $per_page;

    // Total count
    $countStmt = $db->prepare(
        "SELECT COUNT(*) FROM products p
         JOIN categories c ON c.id = p.category_id
         $whereSQL"
    );
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    // Products
    $stmt = $db->prepare(
        "SELECT p.id, p.name, p.slug, p.short_description, p.cover_image,
                p.price, p.discount_percent, p.final_price, p.platform,
                p.is_digital, p.stock, p.release_date, p.is_featured,
                c.name AS category_name, c.slug AS category_slug,
                COALESCE(AVG(r.rating), 0) AS avg_rating,
                COUNT(r.id) AS review_count
         FROM products p
         JOIN categories c ON c.id = p.category_id
         LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = 1
         $whereSQL
         GROUP BY p.id
         ORDER BY $order
         LIMIT $per_page OFFSET $offset"
    );
    $stmt->execute($params);
    $products = $stmt->fetchAll();

    success([
        'products'   => format_product_list($products),
        'pagination' => [
            'total'    => $total,
            'page'     => $page,
            'per_page' => $per_page,
            'pages'    => (int)ceil($total / $per_page),
        ],
    ]);
}

function single_product(PDO $db): void {
    $slug = $_GET['slug'] ?? null;
    $id   = $_GET['id']   ?? null;
    if (!$slug && !$id) error('slug or id required.');

    $col  = $slug ? 'p.slug' : 'p.id';
    $val  = $slug ?? $id;

    $stmt = $db->prepare(
        "SELECT p.*, c.name AS category_name, c.slug AS category_slug,
                COALESCE(AVG(r.rating), 0) AS avg_rating,
                COUNT(r.id) AS review_count
         FROM products p
         JOIN categories c ON c.id = p.category_id
         LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = 1
         WHERE $col = ? AND p.is_active = 1
         GROUP BY p.id"
    );
    $stmt->execute([$val]);
    $product = $stmt->fetch();

    if (!$product) error('Product not found.', 404);

    // Increment views
    $db->prepare('UPDATE products SET views = views + 1 WHERE id = ?')->execute([$product['id']]);

    // Gallery images
    $imgs = $db->prepare('SELECT image_url, alt_text FROM product_images WHERE product_id = ? ORDER BY sort_order');
    $imgs->execute([$product['id']]);
    $product['gallery'] = $imgs->fetchAll();

    success($product);
}

function featured_products(PDO $db): void {
    $limit = min(20, max(4, (int)($_GET['limit'] ?? 8)));
    $stmt  = $db->prepare(
        "SELECT p.id, p.name, p.slug, p.short_description, p.cover_image,
                p.price, p.discount_percent, p.final_price, p.platform,
                p.is_digital, p.stock,
                c.name AS category_name, c.slug AS category_slug,
                COALESCE(AVG(r.rating), 0) AS avg_rating,
                COUNT(r.id) AS review_count
         FROM products p
         JOIN categories c ON c.id = p.category_id
         LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = 1
         WHERE p.is_featured = 1 AND p.is_active = 1
         GROUP BY p.id
         ORDER BY p.created_at DESC
         LIMIT ?"
    );
    $stmt->execute([$limit]);
    success(format_product_list($stmt->fetchAll()));
}

function related_products(PDO $db): void {
    $product_id  = (int)($_GET['product_id']  ?? 0);
    $category_id = (int)($_GET['category_id'] ?? 0);
    $limit       = min(8, max(2, (int)($_GET['limit'] ?? 4)));

    if (!$product_id || !$category_id) error('product_id and category_id required.');

    $stmt = $db->prepare(
        "SELECT p.id, p.name, p.slug, p.cover_image, p.price, p.discount_percent,
                p.final_price, p.platform, p.is_digital
         FROM products p
         WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
         ORDER BY RAND()
         LIMIT ?"
    );
    $stmt->execute([$category_id, $product_id, $limit]);
    success($stmt->fetchAll());
}

function search_products(PDO $db): void {
    $q     = trim($_GET['q'] ?? '');
    $limit = min(20, max(5, (int)($_GET['limit'] ?? 10)));
    if (strlen($q) < 2) { success([]); return; }

    $like = '%' . $q . '%';
    $stmt = $db->prepare(
        "SELECT p.id, p.name, p.slug, p.cover_image, p.final_price, p.platform
         FROM products p
         WHERE p.is_active = 1 AND (p.name LIKE ? OR p.short_description LIKE ?)
         ORDER BY p.views DESC
         LIMIT ?"
    );
    $stmt->execute([$like, $like, $limit]);
    success($stmt->fetchAll());
}

function format_product_list(array $rows): array {
    return array_map(function ($p) {
        $p['avg_rating']   = round((float)$p['avg_rating'], 1);
        $p['review_count'] = (int)$p['review_count'];
        $p['price']        = (float)$p['price'];
        $p['final_price']  = (float)$p['final_price'];
        return $p;
    }, $rows);
}
