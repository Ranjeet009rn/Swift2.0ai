<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/auth_middleware.php';

handleCors();

$database = new Database();
$db = $database->getConnection();

$userData = validateAuth($db);
$userId = $userData->id;

// Fetch notifications for the user
$query = "SELECT id, message, type, is_read, created_at 
          FROM notifications 
          WHERE user_identity_id = ? 
          ORDER BY created_at DESC 
          LIMIT 50";

$stmt = $db->prepare($query);
$stmt->bindParam(1, $userId);
$stmt->execute();
$notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(array(
    "success" => true,
    "notifications" => $notifications
));
?>