<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
$user_id = $userData->id;
// Fetch all ranks
$queryRanks = "SELECT * FROM ranks ORDER BY target_amount ASC";
$stmtRanks = $db->prepare($queryRanks);
$stmtRanks->execute();
$allRanks = $stmtRanks->fetchAll(PDO::FETCH_ASSOC);

// Fetch User Stats
// 1. Earnings
$queryWallet = "SELECT total_earned FROM wallets WHERE user_identity_id = ?";
$stmtWallet = $db->prepare($queryWallet);
$stmtWallet->bindParam(1, $user_id);
$stmtWallet->execute();
$wallet = $stmtWallet->fetch(PDO::FETCH_ASSOC);
$totalEarned = $wallet['total_earned'] ?? 0;

// 2. Team Size
$queryHier = "SELECT left_count + right_count as team_size FROM hierarchical_users WHERE user_identity_id = ?";
$stmtHier = $db->prepare($queryHier);
$stmtHier->bindParam(1, $user_id);
$stmtHier->execute();
$hier = $stmtHier->fetch(PDO::FETCH_ASSOC);
$teamSize = $hier['team_size'] ?? 0;

// 3. Package Value
$queryPkg = "SELECT SUM(p.price) as total_value 
             FROM user_packages up 
             JOIN packages p ON up.package_id = p.id 
             WHERE up.user_identity_id = ? AND up.status = 'active'";
$stmtPkg = $db->prepare($queryPkg);
$stmtPkg->bindParam(1, $user_id);
$stmtPkg->execute();
$pkg = $stmtPkg->fetch(PDO::FETCH_ASSOC);
$packageValue = $pkg['total_value'] ?? 0;

// Determine Current Rank
$currentRankName = "Member";
$nextRankName = "Silver";
$nextRankObj = null;

// Check which ranks are achieved
$ranksResponse = [];
foreach ($allRanks as $rank) {
    $isAchieved = (
        $totalEarned >= $rank['target_amount'] &&
        $teamSize >= $rank['min_team_size'] &&
        $packageValue >= $rank['min_package_value']
    );

    if ($isAchieved) {
        $currentRankName = $rank['name'];
    } elseif (!$nextRankObj) {
        $nextRankName = $rank['name'];
        $nextRankObj = $rank;
    }

    // Check if reward claimed (need table query for this, assume false for now or join later)
    // For simplicity, we just return the calculated state
    $ranksResponse[] = [
        "id" => $rank['id'],
        "name" => $rank['name'],
        "target_amount" => (float) $rank['target_amount'],
        "reward_amount" => (float) $rank['reward_amount'],
        "min_team_size" => (int) $rank['min_team_size'],
        "min_package_value" => (float) $rank['min_package_value'],
        "achieved" => $isAchieved,
        "reward_claimed" => false // To be implemented with user_rank_progress table
    ];
}

// Calculate Progress Percentages for Next Rank
$earningsPct = 0;
$teamPct = 0;
$pkgPct = 0;

if ($nextRankObj) {
    $earningsPct = ($totalEarned / $nextRankObj['target_amount']) * 100;
    $teamPct = ($teamSize / $nextRankObj['min_team_size']) * 100;
    $pkgPct = ($packageValue / $nextRankObj['min_package_value']) * 100;
} else {
    // Max rank achieved
    $earningsPct = 100;
    $teamPct = 100;
    $pkgPct = 100;
    $nextRankName = "Max Rank";
}

$userRank = [
    "current_rank" => $currentRankName,
    "next_rank" => $nextRankName,
    "user_stats" => [
        "total_earned" => (float) $totalEarned,
        "team_size" => (int) $teamSize,
        "total_package_value" => (float) $packageValue
    ],
    "progress" => [
        "earnings" => ["percentage" => min($earningsPct, 100)],
        "team_size" => ["percentage" => min($teamPct, 100)],
        "package_value" => ["percentage" => min($pkgPct, 100)]
    ]
];

echo json_encode([
    "success" => true,
    "ranks" => $ranksResponse,
    "user_rank" => $userRank
]);
?>