<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
$userId = $userData->id;

$data = json_decode(file_get_contents("php://input"));
$epinCode = strtoupper(trim($data->epinCode ?? ''));

if (!$epinCode) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "E-Pin code is required"]);
    exit;
}

try {
    $db->beginTransaction();

    // Check if E-Pin exists and is valid
    $query = "SELECT * FROM epins WHERE epin_code = :code";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':code', $epinCode);
    $stmt->execute();
    $epin = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$epin) {
        throw new Exception("Invalid E-Pin code");
    }

    if ($epin['status'] === 'used') {
        throw new Exception("This E-Pin has already been used");
    }

    if ($epin['status'] === 'expired') {
        throw new Exception("This E-Pin has expired");
    }

    // Check if allocated to this user
    if ($epin['allocated_to'] && $epin['allocated_to'] != $userId) {
        throw new Exception("This E-Pin is not allocated to you");
    }

    // Get current wallet balance
    $walletQuery = "SELECT shopping_balance FROM wallets WHERE user_identity_id = :user_id";
    $walletStmt = $db->prepare($walletQuery);
    $walletStmt->bindParam(':user_id', $userId);
    $walletStmt->execute();
    $wallet = $walletStmt->fetch(PDO::FETCH_ASSOC);

    $currentBalance = $wallet ? floatval($wallet['shopping_balance']) : 0;
    $newBalance = $currentBalance + floatval($epin['amount']);

    // Update or insert wallet
    if ($wallet) {
        $updateWallet = "UPDATE wallets SET shopping_balance = :balance WHERE user_identity_id = :user_id";
        $updateStmt = $db->prepare($updateWallet);
        $updateStmt->bindParam(':balance', $newBalance);
        $updateStmt->bindParam(':user_id', $userId);
        $updateStmt->execute();
    } else {
        $insertWallet = "INSERT INTO wallets (user_identity_id, shopping_balance) VALUES (:user_id, :balance)";
        $insertStmt = $db->prepare($insertWallet);
        $insertStmt->bindParam(':user_id', $userId);
        $insertStmt->bindParam(':balance', $newBalance);
        $insertStmt->execute();
    }

    // Mark E-Pin as used
    $updatePin = "UPDATE epins SET status = 'used', used_by = :user_id, used_at = NOW() WHERE id = :id";
    $updatePinStmt = $db->prepare($updatePin);
    $updatePinStmt->bindParam(':user_id', $userId);
    $updatePinStmt->bindParam(':id', $epin['id']);
    $updatePinStmt->execute();

    // Record transaction
    $description = "E-Pin redeemed: " . $epinCode . " (" . $epin['package'] . ")";
    $insertTxn = "INSERT INTO wallet_transactions 
                  (user_identity_id, transaction_type, wallet_type, amount, description, reference_id, balance_before, balance_after) 
                  VALUES (:user_id, 'credit', 'shopping', :amount, :description, :reference, :balance_before, :balance_after)";
    $txnStmt = $db->prepare($insertTxn);
    $txnStmt->bindParam(':user_id', $userId);
    $txnStmt->bindParam(':amount', $epin['amount']);
    $txnStmt->bindParam(':description', $description);
    $txnStmt->bindParam(':reference', $epinCode);
    $txnStmt->bindParam(':balance_before', $currentBalance);
    $txnStmt->bindParam(':balance_after', $newBalance);
    $txnStmt->execute();

    $db->commit();

    echo json_encode([
        "success" => true,
        "message" => "E-Pin redeemed successfully! ₹" . number_format($epin['amount'], 2) . " added to your shopping wallet",
        "data" => [
            "amount" => floatval($epin['amount']),
            "newBalance" => $newBalance,
            "package" => $epin['package']
        ]
    ]);

} catch (Exception $e) {
    $db->rollBack();
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>