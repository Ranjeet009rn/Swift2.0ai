<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

// Validate Admin
$userData = validateAuth($db);
if ($userData->role !== 'admin') {
    http_response_code(403);
    echo json_encode(array("success" => false, "message" => "Access denied. Admin only."));
    exit();
}

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : die();

$query = "
    SELECT 
        u.id, 
        u.user_id as member_id, 
        u.email, 
        u.role, 
        u.status, 
        u.created_at,
        h.name, 
        h.username, 
        h.mobile, 
        h.referral_code, 
        h.date_of_birth,
        h.country,
        h.state,
        h.city,
        h.pin_code,
        h.full_address,
        h.pan_number,
        h.sponsor_id,
        h.upline_id,
        h.position,
        h.selected_package,
        h.nominee_name,
        h.nominee_relation,
        h.rank_achieved as `rank`,
        b.bank_name,
        b.account_holder as account_holder_name,
        b.account_number,
        b.ifsc_code,
        NULL as branch_name,
        NULL as account_type,
        w.balance as wallet_balance
    FROM users u
    LEFT JOIN hierarchical_users h ON u.id = h.user_identity_id
    LEFT JOIN bank_details b ON u.id = b.user_identity_id
    LEFT JOIN wallets w ON u.id = w.user_identity_id
    WHERE u.id = ?
";

try {
    $stmt = $db->prepare($query);
    $stmt->bindParam(1, $user_id);
    $stmt->execute();
    $userDetails = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($userDetails) {
        // Fetch Sponsor Name if sponsor_id exists
        if ($userDetails['sponsor_id']) {
            $sQuery = "SELECT name, username FROM hierarchical_users WHERE user_identity_id = ?";
            $sStmt = $db->prepare($sQuery);
            $sStmt->bindParam(1, $userDetails['sponsor_id']);
            $sStmt->execute();
            $fields = $sStmt->fetch(PDO::FETCH_ASSOC);
            $userDetails['sponsor_name'] = $fields['name'] ?? 'N/A';
            $userDetails['sponsor_username'] = $fields['username'] ?? 'N/A';
        }

        echo json_encode(array("success" => true, "data" => $userDetails));
    } else {
        echo json_encode(array("success" => false, "message" => "User not found."));
    }

} catch (PDOException $e) {
    echo json_encode(array("success" => false, "message" => "Database error: " . $e->getMessage()));
}
?>