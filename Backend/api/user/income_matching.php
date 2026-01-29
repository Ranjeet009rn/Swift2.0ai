<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
$user_id = $userData->id;

// Fetch Matching Income
$query = "SELECT id, created_at, amount, status 
          FROM earnings 
          WHERE user_identity_id = :user_id AND type = 'matching_income' 
          ORDER BY created_at DESC";

$stmt = $db->prepare($query);
$stmt->bindParam(":user_id", $user_id);
$stmt->execute();
$earnings = $stmt->fetchAll(PDO::FETCH_ASSOC);

$data = [];
foreach ($earnings as $row) {
    $data[] = [
        "id" => $row['id'],
        "date" => date("Y-m-d", strtotime($row['created_at'])),
        "leftBusiness" => 0, // Placeholder
        "rightBusiness" => 0, // Placeholder
        "matchingAmount" => $row['amount'],
        "payout" => $row['amount'],
        "status" => ucfirst($row['status'])
    ];
}

echo json_encode(["success" => true, "data" => $data]);
?>