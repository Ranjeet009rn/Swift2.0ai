<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
$userId = $userData->id;

try {
    // Get wallet balance
    $query = "SELECT shopping_balance FROM wallets WHERE user_identity_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    $wallet = $stmt->fetch(PDO::FETCH_ASSOC);

    $balance = $wallet ? floatval($wallet['shopping_balance']) : 0.00;

    // Fetch transaction history
    $txnQuery = "SELECT 
                    id,
                    transaction_type,
                    wallet_type,
                    amount,
                    description,
                    reference_id,
                    balance_before,
                    balance_after,
                    created_at
                 FROM wallet_transactions 
                 WHERE user_identity_id = :user_id AND wallet_type = 'shopping'
                 ORDER BY created_at DESC
                 LIMIT 50";

    $txnStmt = $db->prepare($txnQuery);
    $txnStmt->bindParam(':user_id', $userId);
    $txnStmt->execute();
    $transactions = $txnStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "balance" => $balance,
        "transactions" => $transactions
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error fetching wallet data: " . $e->getMessage()
    ]);
}
?>