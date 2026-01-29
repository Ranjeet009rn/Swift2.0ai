<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
$user_id = $userData->id;

// Fetch Unused E-Pins
$query = "SELECT e.id, e.epin_code as pin, e.amount, e.status, e.created_at as date, e.package 
          FROM epins e 
          WHERE e.allocated_to = :user_id AND e.status = 'unused'";

$epins = [];
try {
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $user_id);
    $stmt->execute();
    $epins = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    $epins = [];
}

echo json_encode(["success" => true, "data" => $epins]);
?>