<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
$userId = $userData->id; // users.id

// Fetch wallet data specifically for User (not franchise)
$query = "SELECT balance, total_earned, total_withdrawn FROM wallets WHERE user_identity_id = ?";
$stmt = $db->prepare($query);
$stmt->bindParam(1, $userId);
$stmt->execute();
$wallet = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$wallet) {
    // If no wallet exists yet (rare if register logic is sound), return 0
    $wallet = ["balance" => 0, "total_earned" => 0, "total_withdrawn" => 0];
}

// Fetch transaction history (from earnings or withdrawals combined usually, for now just earnings)
$qEarn = "SELECT amount, source_type as type, description, created_at FROM earnings WHERE user_identity_id = ? ORDER BY created_at DESC LIMIT 10";
$sEarn = $db->prepare($qEarn);
$sEarn->bindParam(1, $userId);
$sEarn->execute();
$transactions = $sEarn->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(array(
    "success" => true,
    "balance" => $wallet['balance'],
    "total_earned" => $wallet['total_earned'],
    "total_withdrawn" => $wallet['total_withdrawn'],
    "transactions" => $transactions
));
?>