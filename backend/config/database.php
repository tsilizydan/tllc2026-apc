<?php
/**
 * Apos'Creed — Database Connection (PDO Singleton)
 */

class Database {
    private static ?PDO $instance = null;

    private static array $config = [
        'host'    => 'localhost',
        'dbname'  => 'tsilscpx_apc',
        'user'    => 'tsilscpx_chibi_admin',      // ← Change on deploy
        'pass'    => '9@UPN~I@O]Dw',  // ← Change on deploy
        'charset' => 'utf8mb4',
    ];

    public static function getInstance(): PDO {
        if (self::$instance === null) {
            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=%s',
                self::$config['host'],
                self::$config['dbname'],
                self::$config['charset']
            );

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            try {
                self::$instance = new PDO($dsn, self::$config['user'], self::$config['pass'], $options);
            } catch (PDOException $e) {
                http_response_code(500);
                header('Content-Type: application/json');
                echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
                exit;
            }
        }

        return self::$instance;
    }

    // Prevent instantiation / cloning
    private function __construct() {}
    private function __clone() {}
}
