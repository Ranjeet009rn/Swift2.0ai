<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
$userId = $userData->id;

// Fetch Wallet from wallets table
$queryWallet = "SELECT balance, total_earned FROM wallets WHERE user_identity_id = ?";
$stmtWallet = $db->prepare($queryWallet);
$stmtWallet->bindParam(1, $userId);
$stmtWallet->execute();
$wallet = $stmtWallet->fetch(PDO::FETCH_ASSOC);

// Fetch Team Size and ID from hierarchical_users
$queryHier = "SELECT id, left_count, right_count FROM hierarchical_users WHERE user_identity_id = ?";
$stmtHier = $db->prepare($queryHier);
$stmtHier->bindParam(1, $userId);
$stmtHier->execute();
$hier = $stmtHier->fetch(PDO::FETCH_ASSOC);

$totalTeam = 0;
$userHId = 0;
if ($hier) {
  $totalTeam = ($hier['left_count'] + $hier['right_count']);
  $userHId = $hier['id'];
}

// Fetch Active Package
$queryPkg = "SELECT p.name AS package_name 
             FROM user_packages up 
             JOIN packages p ON up.package_id = p.id 
             WHERE up.user_identity_id = ? AND up.status = 'active' 
             ORDER BY up.amount DESC LIMIT 1";
$stmtPkg = $db->prepare($queryPkg);
$stmtPkg->bindParam(1, $userId);
$stmtPkg->execute();
$pkg = $stmtPkg->fetch(PDO::FETCH_ASSOC);
$activePackage = $pkg ? $pkg['package_name'] : "Inactive";

// Fetch Recent Earnings
$queryEarnings = "SELECT amount, source_type, created_at FROM earnings WHERE user_identity_id = ? ORDER BY created_at DESC LIMIT 10";
$stmtEarnings = $db->prepare($queryEarnings);
$stmtEarnings->bindParam(1, $userId);
$stmtEarnings->execute();
$recentEarnings = $stmtEarnings->fetchAll(PDO::FETCH_ASSOC);

// Fetch Recent Downline (Direct Referrals for now)
$recentDownline = [];
if ($userHId > 0) {
  $queryDownline = "SELECT name, level, 'Active' as status, created_at as activation_date,
                      (left_count > 0 OR right_count > 0) as is_team_leader
                      FROM hierarchical_users 
                      WHERE sponsor_id = ? 
                      ORDER BY id DESC LIMIT 5";
  $stmtDownline = $db->prepare($queryDownline);
  $stmtDownline->bindParam(1, $userHId);
  $stmtDownline->execute();
  $recentDownline = $stmtDownline->fetchAll(PDO::FETCH_ASSOC);
}

// Fetch Recent Withdrawals
$queryWithdrawals = "SELECT amount, status, 'Bank' as method FROM withdrawals WHERE user_identity_id = ? ORDER BY request_date DESC LIMIT 5";
$stmtWithdrawals = $db->prepare($queryWithdrawals);
$stmtWithdrawals->bindParam(1, $userId);
$stmtWithdrawals->execute();
$recentWithdrawals = $stmtWithdrawals->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(array(
  "success" => true,
  "wallet_balance" => $wallet['balance'] ?? 0,
  "total_earnings" => $wallet['total_earned'] ?? 0,
  "team_size" => $totalTeam,
  "active_package" => $activePackage,
  "recent_earnings" => $recentEarnings,
  "recent_downline" => $recentDownline,
  "recent_withdrawals" => $recentWithdrawals
));
?>