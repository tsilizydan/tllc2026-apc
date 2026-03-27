<?php
/**
 * Apos'Creed — Admin: Settings
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
    'get'    => get_settings($db),
    'update' => update_settings($db, $body),
    default  => error('Unknown action.', 404),
};

function get_settings(PDO $db): void {
    $stmt = $db->query('SELECT setting_key, setting_value FROM settings');
    $rows = $stmt->fetchAll();
    $map = [];
    foreach ($rows as $r) $map[$r['setting_key']] = $r['setting_value'];
    success($map);
}

function update_settings(PDO $db, array $body): void {
    if (!is_array($body)) error('Payload must be a key-value object.');
    $stmt = $db->prepare(
        'INSERT INTO settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
    );
    foreach ($body as $key => $value) {
        $stmt->execute([htmlspecialchars(strip_tags($key)), $value]);
    }
    success(null, 'Settings updated.');
}
