<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
$user_id = $userData->id;

// Fetch Activated Downline Members (Active = 1)
// Fetch Activated Downline Members (Direct Referrals)
// Join hierarchical_users to get structure, users to get details, user_packages for package info
$query = "SELECT 
            hu.user_identity_id as id, 
            hu.name, 
            hu.referral_code as userId, 
            hu.created_at as activationDate,
            COALESCE(p.name, 'N/A') as package,
            COALESCE(up.amount, 0) as amount,
            (SELECT name FROM hierarchical_users WHERE id = hu.sponsor_id) as sponsor,
            (hu.left_count > 0 OR hu.right_count > 0) as is_team_leader
          FROM hierarchical_users hu
          JOIN users u ON u.id = hu.user_identity_id
          LEFT JOIN user_packages up ON u.id = up.user_identity_id AND up.status = 'active'
          LEFT JOIN packages p ON up.package_id = p.id
          WHERE hu.sponsor_id = (SELECT id FROM hierarchical_users WHERE user_identity_id = ?) 
          AND u.status = 'active'";

$stmt = $db->prepare($query);
$stmt->bindParam(1, $user_id);
$stmt->execute();
$activeMembers = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(["success" => true, "data" => $activeMembers]);
?>