<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
$user_id = $userData->id;

// Fetch Used E-Pins
$query = "SELECT e.id, e.epin_code as pin, e.amount, e.status, e.used_at as usedDate, e.package, u.name as usedBy, u.referral_code as userId
          FROM epins e 
          LEFT JOIN hierarchical_users u ON u.user_identity_id = e.used_by
          WHERE e.allocated_to = :user_id AND e.status = 'used'";

$usedPins = [];
try {
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $user_id);
    $stmt->execute();
    $usedPins = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    $usedPins = [];
}

echo json_encode(["success" => true, "data" => $usedPins]);
?>