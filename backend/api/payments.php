<?php
/**
 * Apos'Creed — payments.php
 * Actions: initiate | webhook | status
 * Supports: mvola | orange_money | airtel_money | cod
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth_helper.php';
require_once __DIR__ . '/../includes/response.php';

$action = $_GET['action'] ?? (get_json_body()['action'] ?? '');
$body   = get_json_body();
$db     = Database::getInstance();

match ($action) {
    'initiate' => initiate_payment($db, $body),
    'status'   => payment_status($db),
    'webhook'  => handle_webhook($db),
    default    => error('Unknown action.', 404),
};

// ─────────────────────────────────────────
function initiate_payment(PDO $db, array $body): void {
    $order_number = trim($body['order_number'] ?? '');
    $method       = trim($body['payment_method'] ?? '');

    if (!$order_number || !$method) error('order_number and payment_method required.');

    $stmt = $db->prepare('SELECT id, total, payment_status FROM orders WHERE order_number = ?');
    $stmt->execute([$order_number]);
    $order = $stmt->fetch();
    if (!$order) error('Order not found.', 404);
    if ($order['payment_status'] === 'paid') error('Order already paid.', 409);

    $result = match ($method) {
        'mvola'        => initiate_mvola($order, $body),
        'orange_money' => initiate_orange($order, $body),
        'airtel_money' => initiate_airtel($order, $body),
        'cod'          => initiate_cod($order, $db),
        default        => null,
    };

    if (!$result) error('Unsupported payment method.');

    success($result, 'Payment initiated.');
}

// Mvola (Telma Madagascar)
function initiate_mvola(array $order, array $body): array {
    // TODO: Replace with actual Mvola API credentials & endpoint
    $mvola_api = 'https://devapi.mvola.mg/mvola/mm/transactions/type/merchantpay/1.0.0/';
    $consumer_key    = 'YOUR_MVOLA_CONSUMER_KEY';
    $consumer_secret = 'YOUR_MVOLA_CONSUMER_SECRET';

    // Get access token first (client_credentials flow)
    // $token = mvola_get_token($consumer_key, $consumer_secret);

    return [
        'method'       => 'mvola',
        'order_number' => $order['order_number'] ?? '',
        'amount'       => $order['total'],
        'instructions' => 'Send ' . number_format($order['total']) . ' Ar to 034 XX XXX XX with reference: ' . ($order['id'] ?? ''),
        'status'       => 'pending',
        // 'payment_url'  => $redirect_url,  // when live API is connected
    ];
}

// Orange Money (Orange Madagascar)
function initiate_orange(array $order, array $body): array {
    return [
        'method'       => 'orange_money',
        'order_number' => $order['order_number'] ?? '',
        'amount'       => $order['total'],
        'instructions' => 'Dial #145# and send ' . number_format($order['total']) . ' Ar with reference: ' . ($order['id'] ?? ''),
        'status'       => 'pending',
    ];
}

// Airtel Money
function initiate_airtel(array $order, array $body): array {
    return [
        'method'       => 'airtel_money',
        'order_number' => $order['order_number'] ?? '',
        'amount'       => $order['total'],
        'instructions' => 'Use Airtel Money to send ' . number_format($order['total']) . ' Ar with reference: ' . ($order['id'] ?? ''),
        'status'       => 'pending',
    ];
}

// Cash on Delivery — mark as pending
function initiate_cod(array $order, PDO $db): array {
    $db->prepare('UPDATE orders SET payment_status = "unpaid", status = "pending" WHERE id = ?')
       ->execute([$order['id']]);
    return [
        'method'       => 'cod',
        'order_number' => $order['order_number'] ?? '',
        'amount'       => $order['total'],
        'instructions' => 'Pay cash upon delivery. Our team will contact you.',
        'status'       => 'pending',
    ];
}

// ─────────────────────────────────────────
function payment_status(PDO $db): void {
    $order_number = $_GET['order_number'] ?? '';
    if (!$order_number) error('order_number required.');

    $stmt = $db->prepare('SELECT order_number, status, payment_status FROM orders WHERE order_number = ?');
    $stmt->execute([$order_number]);
    $order = $stmt->fetch();
    if (!$order) error('Order not found.', 404);
    success($order);
}

// ─────────────────────────────────────────
// Webhook — called by payment gateway
function handle_webhook(PDO $db): void {
    $payload = get_json_body();
    $secret  = 'YOUR_WEBHOOK_SECRET';

    // Validate signature (example for Mvola)
    $received_sig = $_SERVER['HTTP_X_SIGNATURE'] ?? '';
    $expected_sig = hash_hmac('sha256', file_get_contents('php://input'), $secret);

    // Uncomment when live:
    // if (!hash_equals($expected_sig, $received_sig)) {
    //     http_response_code(401);
    //     echo json_encode(['error' => 'Invalid signature']);
    //     exit;
    // }

    $order_number  = $payload['order_number']  ?? ($payload['transactionReference'] ?? '');
    $payment_ref   = $payload['transactionId'] ?? ($payload['reference'] ?? '');
    $status        = strtolower($payload['status'] ?? 'success');

    if (!$order_number) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing order reference']);
        exit;
    }

    if ($status === 'success' || $status === 'completed') {
        $db->prepare(
            'UPDATE orders SET payment_status = "paid", payment_ref = ?, status = "paid" WHERE order_number = ?'
        )->execute([$payment_ref, $order_number]);
    } else {
        $db->prepare(
            'UPDATE orders SET payment_status = "failed" WHERE order_number = ?'
        )->execute([$order_number]);
    }

    http_response_code(200);
    echo json_encode(['received' => true]);
    exit;
}
