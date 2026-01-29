<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);

// Simple role check based on strict string equality from token
if ($userData->role !== 'admin') {
    http_response_code(403);
    echo json_encode(array("success" => false, "message" => "Access denied."));
    exit();
}

// Fetch Admin Stats
// 1. Total Users
$stmt = $db->query("SELECT COUNT(*) as count FROM hierarchical_users");
$totalUsers = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

// 2. Total Franchises
$stmt = $db->query("SELECT COUNT(*) as count FROM hierarchical_franchise");
$totalFranchises = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

// 3. Pending Withdrawals
$stmt = $db->query("SELECT COUNT(*) as count, SUM(amount) as total FROM withdrawals WHERE status = 'pending'");
$withdrawals = $stmt->fetch(PDO::FETCH_ASSOC);

// 4. Revenue (Total Package Sales)
$stmt = $db->query("SELECT SUM(amount) as total FROM user_packages WHERE status = 'active'");
$revenue = $stmt->fetch(PDO::FETCH_ASSOC);

// 5. Recent Registrations
$query = "SELECT 
            hu.name, 
            u.user_id, 
            COALESCE(p.name, 'N/A') as package_name, 
            COALESCE(up.status, 'inactive') as package_status, 
            u.created_at
          FROM users u
          JOIN hierarchical_users hu ON u.id = hu.user_identity_id
          LEFT JOIN user_packages up ON u.id = up.user_identity_id AND up.status = 'active'
          LEFT JOIN packages p ON up.package_id = p.id
          ORDER BY u.created_at DESC
          LIMIT 5";
$stmt = $db->query($query);
$recentRegistrations = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(array(
    "success" => true,
    "stats" => array(
        "total_users" => $totalUsers,
        "total_franchises" => $totalFranchises,
        "pending_withdrawals" => $withdrawals['count'],
        "pending_amount" => $withdrawals['total'] ?? 0,
        "total_revenue" => $revenue['total'] ?? 0,
        "recent_registrations" => $recentRegistrations
    )
));
?>