<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
$user_id = $userData->id;

// Fetch Downline Logic (Direct Referrals)
// First get the current user's hierarchical ID
$h_id_query = "SELECT id FROM hierarchical_users WHERE user_identity_id = ?";
$stmt_h = $db->prepare($h_id_query);
$stmt_h->execute([$user_id]);
$h_node = $stmt_h->fetch(PDO::FETCH_ASSOC);

$downline = [];
if ($h_node) {
       $current_h_id = $h_node['id'];

       // Fetch direct downline (sponsor tree)
       $query = "SELECT 
                u.id, 
                hu.name, 
                hu.referral_code as userId, 
                u.created_at as joinDate, 
                CASE WHEN u.status = 'active' THEN 'Active' ELSE 'Inactive' END as status,
                COALESCE(p.name, 'Member') as package,
                (SELECT name FROM hierarchical_users WHERE id = hu.sponsor_id) as directSponsor,
                hu.level,
                (hu.left_count > 0 OR hu.right_count > 0) as is_team_leader
              FROM hierarchical_users hu 
              JOIN users u ON u.id = hu.user_identity_id
              LEFT JOIN user_packages up ON u.id = up.user_identity_id AND up.status = 'active'
              LEFT JOIN packages p ON up.package_id = p.id
              WHERE hu.sponsor_id = ?";

       $stmt = $db->prepare($query);
       $stmt->execute([$current_h_id]);
       $downline = $stmt->fetchAll(PDO::FETCH_ASSOC);
}

echo json_encode(["success" => true, "data" => $downline]);
?>