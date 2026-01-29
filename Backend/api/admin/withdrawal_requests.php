<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
if ($userData->role !== 'admin') {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Access denied"]);
    exit();
}

// Return empty array for now - you can implement withdrawals later
echo json_encode([
    "success" => true,
    "data" => []
]);
?>