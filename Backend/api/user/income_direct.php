<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../config/database.php';
require_once '../../utils/jwt_utils.php'; // Will be fixed in next step if broken, but sticking to pattern

// Use auth_middleware pattern if available, else manual
include_once '../../utils/auth_middleware.php';
handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
$user_id = $userData->id;

// Fetch Direct Income from earnings table
$query = "SELECT 
            e.id, 
            e.created_at as date, 
            e.amount, 
            e.status,
            COALESCE(u.name, 'System') as fromUser,
            COALESCE(u.referral_code, 'N/A') as fromUserId,
            u.selected_package as package
          FROM earnings e
          LEFT JOIN hierarchical_users u ON e.source_id = u.user_identity_id
          WHERE e.user_identity_id = :user_id AND e.type = 'direct_income'
          ORDER BY e.created_at DESC";

$stmt = $db->prepare($query);
$stmt->bindParam(":user_id", $user_id);
$stmt->execute();
$earnings = $stmt->fetchAll(PDO::FETCH_ASSOC);

$data = [];
foreach ($earnings as $row) {
    $data[] = [
        "id" => $row['id'],
        "date" => date("Y-m-d", strtotime($row['date'])),
        "fromUser" => $row['fromUser'],
        "package" => $row['package'] ?? 'N/A',
        "amount" => $row['amount'],
        "status" => ucfirst($row['status'])
    ];
}

echo json_encode(["success" => true, "data" => $data]);
?>