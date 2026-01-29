<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
$user_id = $userData->id;

// Fetch Performance History
$query = "SELECT * FROM performance_history WHERE user_identity_id = ? ORDER BY id DESC";
$stmt = $db->prepare($query);
$stmt->bindParam(1, $user_id);
$stmt->execute();
$history = $stmt->fetchAll(PDO::FETCH_ASSOC);

$data = [];
foreach ($history as $row) {
    $data[] = [
        "id" => $row['id'],
        "month" => $row['month_year'],
        "personalBusiness" => (float) $row['personal_business'],
        "groupBusiness" => (float) $row['group_business'],
        "levelAchieved" => $row['level_achieved'],
        "bonus" => (float) $row['bonus_amount'],
        "status" => $row['status']
    ];
}

echo json_encode(["success" => true, "data" => $data]);
?>