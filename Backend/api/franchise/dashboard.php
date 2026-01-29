<?php
include_once '../../config/database.php';
include_once '../../models/Franchise.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);

if ($userData->role !== 'franchise') {
    http_response_code(403);
    echo json_encode(array("success" => false, "message" => "Access denied."));
    exit();
}

// 1. Get Franchise Details (Stock Value, etc)
$franchise = new Franchise($db);
$details = $franchise->getDetails($userData->id);

if (!$details) {
    http_response_code(404);
    echo json_encode(array("success" => false, "message" => "Franchise details not found."));
    exit();
}

$stockValue = isset($details['stock_value']) ? (float) $details['stock_value'] : 0;

// 2. Get Wallet Balance
$queryWallet = "SELECT balance FROM wallets WHERE user_identity_id = ?";
$stmtWallet = $db->prepare($queryWallet);
$stmtWallet->bindParam(1, $userData->id);
$stmtWallet->execute();
$wallet = $stmtWallet->fetch(PDO::FETCH_ASSOC);
$walletBalance = $wallet ? (float) $wallet['balance'] : 0;

// 3. Get Recent Transfers (Transactions)
$queryTrans = "SELECT * FROM franchise_transactions WHERE franchise_user_id = ? ORDER BY created_at DESC LIMIT 5";
$stmtTrans = $db->prepare($queryTrans);
$stmtTrans->bindParam(1, $userData->id);
$stmtTrans->execute();
$transfers = $stmtTrans->fetchAll(PDO::FETCH_ASSOC);

$formattedTransfers = [];
foreach ($transfers as $t) {
    $formattedTransfers[] = [
        "created_at" => $t['created_at'],
        "recipient_name" => $t['recipient_name'],
        "recipient_id" => $t['recipient_user_id'] ?? 'N/A',
        "package" => $t['item_name'],
        "quantity" => $t['quantity'],
        "amount" => $t['amount']
    ];
}

// 4. Calculate Total Sales
$querySales = "SELECT SUM(amount) as total FROM franchise_transactions WHERE franchise_user_id = ? AND transaction_type = 'sale'";
$stmtSales = $db->prepare($querySales);
$stmtSales->bindParam(1, $userData->id);
$stmtSales->execute();
$sales = $stmtSales->fetch(PDO::FETCH_ASSOC);
$totalSales = $sales ? (float) $sales['total'] : 0;

// 5. Total Commission (from earnings)
$queryComm = "SELECT SUM(amount) as total FROM earnings WHERE user_identity_id = ? AND source_type LIKE '%franchise%'";
$stmtComm = $db->prepare($queryComm);
$stmtComm->bindParam(1, $userData->id);
$stmtComm->execute();
$comm = $stmtComm->fetch(PDO::FETCH_ASSOC);
$totalCommission = $comm ? (float) $comm['total'] : 0;

echo json_encode(array(
    "success" => true,
    "stock_value" => $stockValue,
    "wallet_balance" => $walletBalance,
    "franchise_code" => $details['franchise_code'],
    "franchise_type" => $details['franchise_type'],
    "total_sales" => $totalSales,
    "total_commission" => $totalCommission,
    "recent_transfers" => $formattedTransfers
));
?>